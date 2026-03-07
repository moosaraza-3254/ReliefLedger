const Donation = require('../models/Donation');
const Transaction = require('../models/Transaction');
const { v4: uuidv4 } = require('uuid');

// @desc    Make a donation
// @route   POST /api/donor/donate
// @access  Private/Donor
exports.makeDonation = async (req, res) => {
  try {
    const { amount, message } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ msg: 'Please provide a valid amount' });
    }

    // Create donation
    const donation = new Donation({
      donor_id: req.user.userId,
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
      to_user: null, // To relief fund
      type: 'DONATION',
      amount,
      status: 'COMPLETED',
      reason: 'Donation to relief fund',
      related_donation: donation._id
    });

    await transaction.save();

    res.json({
      msg: 'Donation recorded successfully',
      donation: {
        id: donation._id,
        amount,
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
        message: d.message
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
    });

    if (!donation) {
      return res.status(404).json({ msg: 'Receipt not found' });
    }

    res.json({
      receipt_id: donation.receipt_id,
      amount: donation.amount,
      date: donation.createdAt,
      message: donation.message,
      donor_id: donation.donor_id,
      status: donation.status,
      downloadUrl: `/api/donor/receipt/download/${donation.receipt_id}`
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
