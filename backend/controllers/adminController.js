const User = require('../models/User');
const Application = require('../models/Application');
const Document = require('../models/Document');
const Transaction = require('../models/Transaction');
const Donation = require('../models/Donation');
const AuditLog = require('../models/AuditLog');
const mongoose = require('mongoose');

// @desc    Get all users with stats
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        let stats = { role: user.role, status: user.isFrozen ? 'FROZEN' : 'ACTIVE' };

        if (user.role === 'DONOR') {
          const donations = await Donation.find({ donor_id: user._id, status: 'COMPLETED' });
          stats.totalDonated = donations.reduce((sum, d) => sum + d.amount, 0);
          stats.donationCount = donations.length;
        } else if (user.role === 'RECIPIENT') {
          const applications = await Application.find({ recipient_id: user._id });
          stats.applications = applications.length;
          stats.approved = applications.filter(a => a.status === 'APPROVED').length;
          stats.pending = applications.filter(a => a.status === 'PENDING').length;
        }

        return {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isFrozen: user.isFrozen,
          createdAt: user.createdAt,
          ...stats
        };
      })
    );

    res.json({ users: usersWithStats });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get system statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getSystemStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const admins = await User.countDocuments({ role: 'ADMIN' });
    const donors = await User.countDocuments({ role: 'DONOR' });
    const recipients = await User.countDocuments({ role: 'RECIPIENT' });
    const frozenUsers = await User.countDocuments({ isFrozen: true });

    const completedDonations = await Donation.find({ status: 'COMPLETED' });
    const totalDonated = completedDonations.reduce((sum, d) => sum + d.amount, 0);

    const allApplications = await Application.find();
    const approvedApps = allApplications.filter(a => a.status === 'APPROVED');
    const totalDisbursed = approvedApps.reduce((sum, a) => sum + a.amount_disbursed, 0);

    const pendingApps = await Application.countDocuments({ status: 'PENDING' });
    const onHoldApps = await Application.countDocuments({ status: 'ON_HOLD' });
    const flaggedTransactions = await Transaction.countDocuments({ status: 'FLAGGED' });

    res.json({
      users: { total: totalUsers, admins, donors, recipients, frozen: frozenUsers },
      donations: { total: totalDonated, count: completedDonations.length },
      applications: {
        total: allApplications.length,
        approved: approvedApps.length,
        pending: pendingApps,
        onHold: onHoldApps,
        disbursed: totalDisbursed
      },
      alerts: { flaggedTransactions }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get all documents for verification
// @route   GET /api/admin/documents
// @access  Private/Admin
exports.getPendingDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ verification_status: 'PENDING' })
      .populate('user_id', 'name email')
      .populate('application_id', 'amount_requested reason')
      .sort({ createdAt: -1 });

    res.json({
      documents: documents.map(d => ({
        id: d._id,
        user: { id: d.user_id._id, name: d.user_id.name, email: d.user_id.email },
        type: d.document_type,
        fileName: d.file_name,
        size: d.file_size,
        uploadedAt: d.createdAt,
        application: d.application_id ? {
          id: d.application_id._id,
          amount: d.application_id.amount_requested,
          reason: d.application_id.reason
        } : null
      }))
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Verify document
// @route   PUT /api/admin/document/:id/verify
// @access  Private/Admin
exports.verifyDocument = async (req, res) => {
  try {
    const { approved, rejection_reason } = req.body;

    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ msg: 'Document not found' });
    }

    document.verification_status = approved ? 'VERIFIED' : 'REJECTED';
    document.verified_by = req.user.userId;
    if (!approved) document.rejection_reason = rejection_reason;

    await document.save();

    // Update user.isVerified = true when document is approved
    if (approved) {
      await User.findByIdAndUpdate(
        document.user_id,
        { isVerified: true },
        { new: true }
      );
    }

    res.json({
      msg: `Document ${approved ? 'verified' : 'rejected'} successfully`,
      document: {
        id: document._id,
        status: document.verification_status
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get all pending applications
// @route   GET /api/admin/applications
// @access  Private/Admin
exports.getPendingApplications = async (req, res) => {
  try {
    const applications = await Application.find({ status: { $in: ['PENDING', 'WITHDRAWN'] } })
      .populate('recipient_id', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      applications: applications.map(a => ({
        id: a._id,
        recipient: { id: a.recipient_id._id, name: a.recipient_id.name, email: a.recipient_id.email },
        amount_requested: a.amount_requested,
        reason: a.reason,
        status: a.status,
        submittedAt: a.createdAt
      }))
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get all approved applications (ready for disbursement)
// @route   GET /api/admin/applications/approved
// @access  Private/Admin
exports.getApprovedApplications = async (req, res) => {
  try {
    const applications = await Application.find({ status: 'APPROVED' })
      .populate('recipient_id', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      applications: applications.map(a => ({
        id: a._id,
        recipient: { id: a.recipient_id._id, name: a.recipient_id.name, email: a.recipient_id.email },
        amount_requested: a.amount_requested,
        reason: a.reason,
        status: a.status,
        approvedAt: a.updatedAt
      }))
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};



// @desc    Review and approve/reject application
// @route   PUT /api/admin/application/:id/review
// @access  Private/Admin
exports.reviewApplication = async (req, res) => {
  try {
    const { approved, verification_notes } = req.body;

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ msg: 'Application not found' });
    }

    application.status = approved ? 'APPROVED' : 'REJECTED';
    application.verified_by = req.user.userId;
    application.verification_notes = verification_notes || '';

    // Don't set amount_disbursed here - that's for actual disbursement
    // amount_disbursed should only be set when funds are actually transferred

    await application.save();

    res.json({
      msg: `Application ${approved ? 'approved' : 'rejected'}`,
      application: {
        id: application._id,
        status: application.status,
        amount_requested: application.amount_requested
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Disburse funds to approved application
// @route   PUT /api/admin/application/:id/disburse
// @access  Private/Admin
exports.disburseFunds = async (req, res) => {
  try {
    const { amount_to_disburse } = req.body;

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ msg: 'Application not found' });
    }

    if (application.status === 'ON_HOLD') {
      return res.status(400).json({ msg: 'Application is ON_HOLD due to a flagged transaction. Disbursement is not allowed.' });
    }

    if (application.status !== 'APPROVED') {
      return res.status(400).json({ msg: 'Application must be approved before disbursement' });
    }

    // Check if the recipient is frozen
    const recipient = await User.findById(application.recipient_id);
    if (recipient && recipient.isFrozen) {
      return res.status(403).json({ msg: 'Recipient account is frozen. Disbursement is not allowed.' });
    }

    // Check if there's enough funds in the relief fund
    const completedDonations = await Donation.find({ status: 'COMPLETED' });
    const totalDonated = completedDonations.reduce((sum, d) => sum + d.amount, 0);

    const disbursedApps = await Application.find({ status: 'DISBURSED' });
    const totalDisbursed = disbursedApps.reduce((sum, a) => sum + a.amount_disbursed, 0);

    const availableFunds = totalDonated - totalDisbursed;

    if (availableFunds < amount_to_disburse) {
      return res.status(400).json({
        msg: `Insufficient funds. Available: $${availableFunds}, Requested: $${amount_to_disburse}`
      });
    }

    // Update application status and disburse funds
    application.status = 'DISBURSED';
    application.amount_disbursed = amount_to_disburse;
    application.disbursed_at = new Date();
    application.disbursed_by = req.user.userId;

    await application.save();

    // Create transaction record
    const transaction = new Transaction({
      transaction_id: `TXN_${Date.now()}_${application._id}`,
      from_user: null, // From relief fund
      to_user: application.recipient_id,
      type: 'DISBURSEMENT',
      amount: amount_to_disburse,
      status: 'COMPLETED',
      reason: `Relief fund disbursement for application ${application._id}`,
      related_application: application._id
    });

    await transaction.save();

    res.json({
      msg: `Funds disbursed successfully`,
      application: {
        id: application._id,
        status: application.status,
        amount_disbursed: application.amount_disbursed
      },
      transaction: {
        id: transaction._id,
        transaction_id: transaction.transaction_id
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get transaction ledger
// @route   GET /api/admin/ledger
// @access  Private/Admin
exports.getTransactionLedger = async (req, res) => {
  try {
    const { status, limit = 50, skip = 0 } = req.query;

    let query = {};
    if (status) query.status = status;

    const transactions = await Transaction.find(query)
      .populate('from_user', 'name email role')
      .populate('to_user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Transaction.countDocuments(query);

    res.json({
      transactions: transactions.map(t => ({
        id: t._id,
        transaction_id: t.transaction_id,
        from: t.from_user ? { id: t.from_user._id, name: t.from_user.name } : 'Relief Fund',
        to: t.to_user ? { id: t.to_user._id, name: t.to_user.name } : 'Relief Fund',
        type: t.type,
        amount: t.amount,
        status: t.status,
        flagged: t.flagged || t.status === 'FLAGGED',
        flagReason: t.flaggedReason || t.flag_reason,
        flaggedAt: t.flaggedAt,
        createdAt: t.createdAt
      })),
      pagination: { total, limit: parseInt(limit), skip: parseInt(skip) }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Flag suspicious transaction (with full enforcement and reversal)
// @route   PUT /api/admin/transaction/:id/flag
// @access  Private/Admin
exports.flagTransaction = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { reason } = req.body;
    const adminId = req.user.userId;

    // ── 1. Find and validate the transaction ──
    const transaction = await Transaction.findById(req.params.id).session(session);
    if (!transaction) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ msg: 'Transaction not found' });
    }

    if (transaction.status === 'FLAGGED' || transaction.flagged) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ msg: 'Transaction is already flagged' });
    }

    // Capture the original status before flagging (needed for reversal logic)
    const originalStatus = transaction.status;
    const isPostCompletion = (originalStatus === 'COMPLETED' || originalStatus === 'DISBURSED');

    // ── 2. Mark the transaction as flagged ──
    transaction.status = 'FLAGGED';
    transaction.flagged = true;
    transaction.flaggedAt = new Date();
    transaction.flaggedBy = adminId;
    transaction.flaggedReason = reason;
    transaction.flag_reason = reason; // keep legacy field in sync
    await transaction.save({ session });

    // ── 3. Freeze the involved users ──
    const usersToFreeze = [];
    if (transaction.from_user) usersToFreeze.push(transaction.from_user);
    if (transaction.to_user) usersToFreeze.push(transaction.to_user);

    if (usersToFreeze.length > 0) {
      await User.updateMany(
        { _id: { $in: usersToFreeze } },
        { $set: { isFrozen: true, frozenAt: new Date() } },
        { session }
      );
    }

    // ── 4. Block related pending actions ──
    // Put ON_HOLD any APPROVED applications belonging to the involved users
    const recipientIds = [];
    if (transaction.to_user) recipientIds.push(transaction.to_user);
    if (transaction.from_user) recipientIds.push(transaction.from_user);

    let onHoldCount = 0;
    if (recipientIds.length > 0) {
      const onHoldResult = await Application.updateMany(
        {
          recipient_id: { $in: recipientIds },
          status: { $in: ['APPROVED', 'PENDING'] }
        },
        { $set: { status: 'ON_HOLD', updatedAt: new Date() } },
        { session }
      );
      onHoldCount = onHoldResult.modifiedCount || 0;
    }

    // ── 5. Create audit log entry for TRANSACTION_FLAGGED ──
    const flagAuditLog = new AuditLog({
      action: 'TRANSACTION_FLAGGED',
      targetId: transaction._id,
      performedBy: adminId,
      reason: reason,
      metadata: {
        transaction_id: transaction.transaction_id,
        originalStatus: originalStatus,
        frozenUsers: usersToFreeze,
        applicationsOnHold: onHoldCount
      }
    });
    await flagAuditLog.save({ session });

    // ── 6. Post-completion reversal flow ──
    let reversalDetails = null;

    if (isPostCompletion) {
      // 6a. Reverse wallet balance for the recipient
      const recipientId = transaction.to_user;
      let walletDiscrepancy = false;
      let previousBalance = null;

      if (recipientId) {
        // The wallet balance is computed from DISBURSED applications,
        // so we need to find the application linked to this transaction
        // and reverse it. We also track any direct wallet-like adjustments.

        // Find the linked application
        let linkedApplication = null;

        if (transaction.related_application) {
          linkedApplication = await Application.findById(transaction.related_application).session(session);
        }

        // If no direct link, search by recipient + amount for DISBURSED applications
        if (!linkedApplication && recipientId) {
          linkedApplication = await Application.findOne({
            recipient_id: recipientId,
            status: 'DISBURSED',
            amount_disbursed: transaction.amount
          }).session(session).sort({ disbursed_at: -1 });
        }

        if (linkedApplication && linkedApplication.status === 'DISBURSED') {
          // Check the effective wallet balance (sum of all disbursed amounts for this recipient)
          const allDisbursedApps = await Application.find({
            recipient_id: recipientId,
            status: 'DISBURSED'
          }).session(session);

          previousBalance = allDisbursedApps.reduce((sum, app) => sum + app.amount_disbursed, 0);
          const newBalance = previousBalance - transaction.amount;

          if (newBalance < 0) {
            walletDiscrepancy = true;
            // Log the discrepancy
            const discrepancyLog = new AuditLog({
              action: 'WALLET_REVERSAL_DISCREPANCY',
              targetId: transaction._id,
              performedBy: adminId,
              reason: `Wallet balance would go negative. Previous balance: $${previousBalance}, Reversal amount: $${transaction.amount}. Balance clamped to $0.`,
              amount: transaction.amount,
              affectedUserId: recipientId,
              metadata: {
                previousBalance: previousBalance,
                reversalAmount: transaction.amount,
                resultingBalance: 0
              }
            });
            await discrepancyLog.save({ session });
          }

          // 6b. Mark the application as REVERSED
          linkedApplication.status = 'REVERSED';
          linkedApplication.reversal_note = 'Reversed due to flagged transaction';
          linkedApplication.updatedAt = new Date();
          await linkedApplication.save({ session });
        }

        // Log wallet reversal in audit
        const walletAuditLog = new AuditLog({
          action: 'WALLET_REVERSAL',
          targetId: transaction._id,
          performedBy: adminId,
          reason: `Wallet reversal of $${transaction.amount} for flagged transaction`,
          amount: transaction.amount,
          affectedUserId: recipientId,
          metadata: {
            previousBalance: previousBalance,
            reversalAmount: transaction.amount,
            discrepancy: walletDiscrepancy
          }
        });
        await walletAuditLog.save({ session });
      }

      // 6c. Create a reversal transaction record
      const reversalTransaction = new Transaction({
        transaction_id: `TXN_REV_${Date.now()}_${transaction._id}`,
        from_user: transaction.to_user,  // reverse direction
        to_user: transaction.from_user,
        type: 'REVERSAL',
        amount: transaction.amount,
        status: 'COMPLETED',
        reason: `Reversal of flagged transaction ${transaction.transaction_id}`,
        originalTransactionId: transaction._id,
        related_application: transaction.related_application
      });
      await reversalTransaction.save({ session });

      // 6d. Audit log for TRANSACTION_REVERSED
      const reversalAuditLog = new AuditLog({
        action: 'TRANSACTION_REVERSED',
        targetId: reversalTransaction._id,
        originalTransactionId: transaction._id,
        performedBy: adminId,
        reason: reason,
        amount: transaction.amount,
        affectedUserId: transaction.to_user,
        metadata: {
          originalTransactionId: transaction._id,
          original_transaction_id: transaction.transaction_id,
          reversalTransactionId: reversalTransaction._id,
          reversal_transaction_id: reversalTransaction.transaction_id
        }
      });
      await reversalAuditLog.save({ session });

      reversalDetails = {
        reversed: true,
        reversalTransactionId: reversalTransaction._id,
        reversal_transaction_id: reversalTransaction.transaction_id,
        amount: transaction.amount,
        walletDiscrepancy: walletDiscrepancy
      };
    }

    // ── Commit the transaction ──
    await session.commitTransaction();
    session.endSession();

    // Build response
    const response = {
      msg: isPostCompletion
        ? 'Transaction flagged and reversed successfully'
        : 'Transaction flagged successfully',
      transaction: {
        id: transaction._id,
        transaction_id: transaction.transaction_id,
        status: transaction.status,
        flagged: transaction.flagged,
        flaggedAt: transaction.flaggedAt,
        flaggedBy: transaction.flaggedBy,
        flagReason: transaction.flaggedReason
      },
      frozenUsers: usersToFreeze,
      applicationsOnHold: onHoldCount
    };

    if (reversalDetails) {
      response.reversal = reversalDetails;
    }

    res.json(response);

  } catch (err) {
    // Roll back on any error
    await session.abortTransaction();
    session.endSession();
    console.error('flagTransaction error:', err.message);
    res.status(500).json({
      msg: 'Failed to flag transaction. All changes have been rolled back.',
      error: err.message
    });
  }
};
