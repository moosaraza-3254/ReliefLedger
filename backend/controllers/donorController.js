const fs = require('fs/promises');
const Donation = require('../models/Donation');
const Transaction = require('../models/Transaction');
const Application = require('../models/Application');
const PDFDocument = require('pdfkit');
const { v4: uuidv4 } = require('uuid');

const PAYMENT_PROOF_MIMES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
]);

const maskAccountNumber = (value = '') => {
  if (!value) return '';
  const visible = value.slice(-4);
  return `${'*'.repeat(Math.max(value.length - 4, 0))}${visible}`;
};

const getReservedAmountForApplication = async (applicationId) => {
  const pendingDonations = await Donation.find({
    application_id: applicationId,
    status: { $in: ['PENDING', 'PENDING_RECIPIENT_CONFIRMATION'] }
  }).select('amount');

  return pendingDonations.reduce((sum, donation) => sum + donation.amount, 0);
};

const completeDonationAndApplication = async (donationDoc) => {
  const application = await Application.findById(donationDoc.application_id);
  if (!application) {
    throw new Error('Application not found during confirmation');
  }

  donationDoc.status = 'COMPLETED';
  donationDoc.completedAt = new Date();
  donationDoc.recipient_confirmed_at = new Date();
  await donationDoc.save();

  const existingTransaction = await Transaction.findOne({ related_donation: donationDoc._id });
  if (existingTransaction) {
    existingTransaction.status = 'COMPLETED';
    await existingTransaction.save();
  } else {
    const transaction = new Transaction({
      transaction_id: `TXN-${uuidv4().substring(0, 8).toUpperCase()}`,
      from_user: donationDoc.donor_id,
      to_user: donationDoc.recipient_id,
      type: 'DONATION',
      amount: donationDoc.amount,
      status: 'COMPLETED',
      reason: `Donation to recipient for application ${application._id}`,
      related_donation: donationDoc._id,
      related_application: application._id
    });
    await transaction.save();
  }

  application.amount_disbursed = (application.amount_disbursed || 0) + donationDoc.amount;
  application.updatedAt = new Date();
  if (application.amount_disbursed >= application.amount_requested) {
    application.status = 'DISBURSED';
    application.disbursed_at = new Date();
    application.disbursed_by = null;
  }
  await application.save();
};

const formatReceiptContent = (donation) => {
  const lines = [
    'ReliefLedger Donation Receipt',
    '============================',
    `Receipt ID: ${donation.receipt_id}`,
    `Date: ${new Date(donation.createdAt).toLocaleString()}`,
    `Status: ${donation.status}`,
    `Amount: $${donation.amount.toFixed(2)}`,
    '',
    `Donor: ${donation.donor_id?.name || 'N/A'} (${donation.donor_id?.email || 'N/A'})`,
    `Recipient: ${donation.recipient_id?.name || 'N/A'} (${donation.recipient_id?.email || 'N/A'})`,
    `Payment Method: ${donation.payment_method || 'N/A'}`,
    `Recipient Account: ${donation.recipient_account_title || 'N/A'} (${maskAccountNumber(donation.recipient_account_number) || 'N/A'})`,
    `Payment Reference: ${donation.payment_reference || 'N/A'}`,
    `Proof Submitted At: ${donation.proof_submitted_at ? new Date(donation.proof_submitted_at).toLocaleString() : 'N/A'}`,
    `Recipient Confirmed At: ${donation.recipient_confirmed_at ? new Date(donation.recipient_confirmed_at).toLocaleString() : 'Pending'}`,
    '',
    `Message: ${donation.message || 'No message'}`
  ];

  return `${lines.join('\n')}\n`;
};

// @desc    Get approved applications available for donor funding
// @route   GET /api/donor/approved-applications
// @access  Private/Donor
exports.getApprovedApplicationsForFunding = async (req, res) => {
  try {
    const applications = await Application.find({ status: 'APPROVED' })
      .populate('recipient_id', 'name email isFrozen')
      .sort({ updatedAt: -1 });

    const activeApplications = await Promise.all(applications
      .filter(application => application.recipient_id && !application.recipient_id.isFrozen)
      .map(async (application) => {
        const fundedAmount = application.amount_disbursed || 0;
        const reservedAmount = await getReservedAmountForApplication(application._id);
        const remainingAmount = Math.max(application.amount_requested - fundedAmount - reservedAmount, 0);

        return {
          id: application._id,
          recipient: {
            id: application.recipient_id._id,
            name: application.recipient_id.name,
            email: application.recipient_id.email
          },
          reason: application.reason,
          amount_requested: application.amount_requested,
          funded_amount: fundedAmount,
          reserved_amount: reservedAmount,
          remaining_amount: remainingAmount,
          payment_details: {
            method: application.payment_method,
            account_title: application.account_title,
            account_number: maskAccountNumber(application.account_number),
            instructions: application.payment_instructions || ''
          },
          approvedAt: application.updatedAt
        };
      })
    );

    res.json({ applications: activeApplications.filter(application => application.remaining_amount > 0) });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Make a donation
// @route   POST /api/donor/donate
// @access  Private/Donor
exports.makeDonation = async (req, res) => {
  try {
    const { amount, message, application_id, payment_reference } = req.body;
    const parsedAmount = parseFloat(amount);

    if (!parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ msg: 'Please provide a valid amount' });
    }

    if (!application_id) {
      return res.status(400).json({ msg: 'Please select an approved application to fund' });
    }
    if (!payment_reference || !payment_reference.trim()) {
      return res.status(400).json({ msg: 'Payment reference is required' });
    }
    if (!req.file) {
      return res.status(400).json({ msg: 'Payment proof image is required' });
    }

    if (!PAYMENT_PROOF_MIMES.has(req.file.mimetype)) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkErr) {
        if (unlinkErr.code !== 'ENOENT') {
          console.error(unlinkErr.message);
        }
      }
      return res.status(400).json({
        msg: 'Payment proof must be a PDF or an image (JPG, PNG, or WEBP).'
      });
    }

    const application = await Application.findById(application_id).populate('recipient_id', 'name email isFrozen');
    if (!application || !application.recipient_id) {
      return res.status(404).json({ msg: 'Application not found' });
    }

    if (application.status !== 'APPROVED') {
      return res.status(400).json({ msg: 'This application is no longer open for donor funding' });
    }

    if (application.recipient_id.isFrozen) {
      return res.status(400).json({ msg: 'Recipient account is frozen. Funding is not allowed.' });
    }

    const reservedAmount = await getReservedAmountForApplication(application._id);
    const remainingAmount = Math.max(application.amount_requested - (application.amount_disbursed || 0) - reservedAmount, 0);
    if (remainingAmount <= 0) {
      return res.status(400).json({ msg: 'This application is already fully funded' });
    }

    if (parsedAmount > remainingAmount) {
      return res.status(400).json({ msg: `Maximum allowed amount for this application is $${remainingAmount}` });
    }

    const donation = new Donation({
      donor_id: req.user.userId,
      recipient_id: application.recipient_id._id,
      application_id: application._id,
      amount: parsedAmount,
      message: message || '',
      status: 'PENDING_RECIPIENT_CONFIRMATION',
      payment_method: application.payment_method,
      recipient_account_title: application.account_title,
      recipient_account_number: application.account_number,
      payment_reference: payment_reference.trim(),
      proof_image_path: req.file.path,
      proof_submitted_at: new Date(),
      receipt_id: `RCP-${uuidv4().substring(0, 8).toUpperCase()}`,
      completedAt: null
    });
    await donation.save();

    const pendingTransaction = new Transaction({
      transaction_id: `TXN-${uuidv4().substring(0, 8).toUpperCase()}`,
      from_user: req.user.userId,
      to_user: application.recipient_id._id,
      type: 'DONATION',
      amount: parsedAmount,
      status: 'PENDING',
      reason: `Donation proof submitted for application ${application._id}`,
      related_donation: donation._id,
      related_application: application._id
    });
    await pendingTransaction.save();

    res.json({
      msg: 'Donation proof submitted. Waiting for recipient confirmation.',
      donation: {
        id: donation._id,
        amount: parsedAmount,
        recipient: {
          id: application.recipient_id._id,
          name: application.recipient_id.name,
          email: application.recipient_id.email
        },
        application_id: application._id,
        receipt_id: donation.receipt_id,
        status: donation.status,
        date: donation.createdAt,
        payment_reference: donation.payment_reference,
        payment_method: donation.payment_method
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get donation history
// @route   GET /api/donor/history
// @access  Private/Donor
exports.getDonationHistory = async (req, res) => {
  try {
    const donations = await Donation.find({ donor_id: req.user.userId })
      .populate('recipient_id', 'name email')
      .populate('application_id', 'amount_requested')
      .sort({ createdAt: -1 });

    const totalDonated = donations.reduce((sum, d) => sum + (d.status === 'COMPLETED' ? d.amount : 0), 0);
    const donationCount = donations.filter(d => d.status === 'COMPLETED').length;

    res.json({
      totalDonated,
      donationCount,
      donations: donations.map(d => ({
        id: d._id,
        amount: d.amount,
        date: d.createdAt,
        status: d.status,
        receipt_id: d.receipt_id,
        message: d.message,
        payment_reference: d.payment_reference,
        payment_method: d.payment_method,
        recipient: d.recipient_id ? {
          id: d.recipient_id._id,
          name: d.recipient_id.name,
          email: d.recipient_id.email
        } : null,
        application_id: d.application_id ? d.application_id._id : null
      }))
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Download receipt
// @route   GET /api/donor/receipt/:receipt_id
// @access  Private/Donor
exports.getReceipt = async (req, res) => {
  try {
    const donation = await Donation.findOne({
      receipt_id: req.params.receipt_id,
      donor_id: req.user.userId
    })
      .populate('recipient_id', 'name email')
      .populate('donor_id', 'name email');

    if (!donation) {
      return res.status(404).json({ msg: 'Receipt not found' });
    }

    res.json({
      receipt_id: donation.receipt_id,
      amount: donation.amount,
      date: donation.createdAt,
      message: donation.message,
      payment_reference: donation.payment_reference,
      payment_method: donation.payment_method,
      recipient_account_title: donation.recipient_account_title,
      recipient_account_number: maskAccountNumber(donation.recipient_account_number),
      proof_submitted_at: donation.proof_submitted_at,
      recipient_confirmed_at: donation.recipient_confirmed_at,
      dispute_reason: donation.dispute_reason,
      donor: donation.donor_id ? {
        id: donation.donor_id._id,
        name: donation.donor_id.name,
        email: donation.donor_id.email
      } : null,
      recipient: donation.recipient_id ? {
        id: donation.recipient_id._id,
        name: donation.recipient_id.name,
        email: donation.recipient_id.email
      } : null,
      status: donation.status,
      downloadUrl: `/api/donor/receipt/download/${donation.receipt_id}`
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Download donation receipt as text file
// @route   GET /api/donor/receipt/download/:receipt_id
// @access  Private/Donor
exports.downloadReceipt = async (req, res) => {
  try {
    const donation = await Donation.findOne({
      receipt_id: req.params.receipt_id,
      donor_id: req.user.userId
    })
      .populate('recipient_id', 'name email')
      .populate('donor_id', 'name email');

    if (!donation) {
      return res.status(404).json({ msg: 'Receipt not found' });
    }

    const doc = new PDFDocument();

    // Headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${donation.receipt_id}.pdf"`
    );

    doc.pipe(res);

    // Content
    doc.fontSize(18).text('Donation Receipt', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text(`Receipt ID: ${donation.receipt_id}`);
    doc.text(`Amount: ${donation.amount}`);
    doc.text(`Date: ${new Date(donation.createdAt).toLocaleString()}`);
    doc.text(`Status: ${donation.status}`);
    doc.text(`Payment Method: ${donation.payment_method || 'N/A'}`);
    doc.text(`Recipient Account: ${donation.recipient_account_title || 'N/A'} (${maskAccountNumber(donation.recipient_account_number) || 'N/A'})`);
    doc.text(`Payment Reference: ${donation.payment_reference || 'N/A'}`);
    doc.moveDown();

    doc.text(`Donor: ${donation.donor_id?.name}`);
    doc.text(`Email: ${donation.donor_id?.email}`);
    doc.moveDown();

    doc.text(`Recipient: ${donation.recipient_id?.name}`);
    doc.text(`Email: ${donation.recipient_id?.email}`);
    doc.moveDown();

    if (donation.message) {
      doc.text(`Message: ${donation.message}`);
    }

    doc.end();

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Complete a donation after recipient confirms
// @route   PUT /api/donor/donation/:id/complete-confirmation
// @access  Private/Donor (internal use)
exports.completeDonationAfterRecipientConfirmation = async (donationId) => {
  const donation = await Donation.findById(donationId);
  if (!donation) {
    throw new Error('Donation not found');
  }
  await completeDonationAndApplication(donation);
};