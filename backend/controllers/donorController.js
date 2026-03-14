const Donation = require('../models/Donation');
const Transaction = require('../models/Transaction');
const Application = require('../models/Application');
const { v4: uuidv4 } = require('uuid');

// @desc    Get approved applications available for donor funding
// @route   GET /api/donor/approved-applications
// @access  Private/Donor
exports.getApprovedApplicationsForFunding = async (req, res) => {
  try {
    const applications = await Application.find({ status: 'APPROVED' })
      .populate('recipient_id', 'name email isFrozen')
      .sort({ updatedAt: -1 });

    const activeApplications = applications
      .filter(application => application.recipient_id && !application.recipient_id.isFrozen)
      .map(application => {
        const fundedAmount = application.amount_disbursed || 0;
        const remainingAmount = Math.max(application.amount_requested - fundedAmount, 0);

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
          remaining_amount: remainingAmount,
          approvedAt: application.updatedAt
        };
      })
      .filter(application => application.remaining_amount > 0);

    res.json({ applications: activeApplications });
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
    const { amount, message, application_id } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ msg: 'Please provide a valid amount' });
    }

    if (!application_id) {
      return res.status(400).json({ msg: 'Please select an approved application to fund' });
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

    const remainingAmount = Math.max(application.amount_requested - (application.amount_disbursed || 0), 0);
    if (remainingAmount <= 0) {
      return res.status(400).json({ msg: 'This application is already fully funded' });
    }

    if (amount > remainingAmount) {
      return res.status(400).json({ msg: `Maximum allowed amount for this application is $${remainingAmount}` });
    }

    // Create donation
    const donation = new Donation({
      donor_id: req.user.userId,
      recipient_id: application.recipient_id._id,
      application_id: application._id,
      amount,
      message: message || '',
      status: 'COMPLETED',
      receipt_id: `RCP-${uuidv4().substring(0, 8).toUpperCase()}`,
      completedAt: new Date()
    });

    await donation.save();

    // Create transaction record
    const transaction = new Transaction({
      transaction_id: `TXN-${uuidv4().substring(0, 8).toUpperCase()}`,
      from_user: req.user.userId,
      to_user: application.recipient_id._id,
      type: 'DONATION',
      amount,
      status: 'COMPLETED',
      reason: `Donation to ${application.recipient_id.name} for application ${application._id}`,
      related_donation: donation._id,
      related_application: application._id
    });

    await transaction.save();

    application.amount_disbursed = (application.amount_disbursed || 0) + amount;
    application.updatedAt = new Date();

    if (application.amount_disbursed >= application.amount_requested) {
      application.status = 'DISBURSED';
      application.disbursed_at = new Date();
      application.disbursed_by = null;
    }

    await application.save();

    res.json({
      msg: 'Donation recorded successfully',
      donation: {
        id: donation._id,
        amount,
        recipient: {
          id: application.recipient_id._id,
          name: application.recipient_id.name,
          email: application.recipient_id.email
        },
        application_id: application._id,
        receipt_id: donation.receipt_id,
        status: donation.status,
        date: donation.createdAt
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
    }).populate('recipient_id', 'name email');

    if (!donation) {
      return res.status(404).json({ msg: 'Receipt not found' });
    }

    res.json({
      receipt_id: donation.receipt_id,
      amount: donation.amount,
      date: donation.createdAt,
      message: donation.message,
      donor_id: donation.donor_id,
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
