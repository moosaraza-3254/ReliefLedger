const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorizeRole = require('../middleware/authorizeRole');
const checkFrozen = require('../middleware/checkFrozen');
const { makeDonation, getDonationHistory, getReceipt } = require('../controllers/donorController');

// @route   POST api/donor/donate
// @desc    Make a donation
// @access  Private/Donor
router.post('/donate', auth, authorizeRole('DONOR'), checkFrozen, makeDonation);

// @route   GET api/donor/history
// @desc    Get donation history
// @access  Private/Donor
router.get('/history', auth, authorizeRole('DONOR'), getDonationHistory);

// @route   GET api/donor/receipt/:receipt_id
// @desc    Download receipt
// @access  Private/Donor
router.get('/receipt/:receipt_id', auth, authorizeRole('DONOR'), getReceipt);

module.exports = router;
