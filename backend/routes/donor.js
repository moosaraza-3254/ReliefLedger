const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorizeRole = require('../middleware/authorizeRole');
const checkFrozen = require('../middleware/checkFrozen');
const upload = require('../middleware/upload');
const {
  makeDonation,
  getDonationHistory,
  getReceipt,
  downloadReceipt,
  getApprovedApplicationsForFunding
} = require('../controllers/donorController');
const {
  startDonorChat,
  getDonorChats,
  getChatMessages,
  sendChatMessage
} = require('../controllers/chatController');

// @route   GET api/donor/approved-applications
// @desc    Get approved applications available for funding
// @access  Private/Donor
router.get('/approved-applications', auth, authorizeRole('DONOR'), getApprovedApplicationsForFunding);

// @route   POST api/donor/donate
// @desc    Make a donation
// @access  Private/Donor
router.post('/donate', auth, authorizeRole('DONOR'), checkFrozen, upload.single('proof_image'), makeDonation);

// @route   GET api/donor/history
// @desc    Get donation history
// @access  Private/Donor
router.get('/history', auth, authorizeRole('DONOR'), getDonationHistory);

// @route   GET api/donor/receipt/:receipt_id
// @desc    Download receipt
// @access  Private/Donor
router.get('/receipt/:receipt_id', auth, authorizeRole('DONOR'), getReceipt);
router.get('/receipt/download/:receipt_id', auth, authorizeRole('DONOR'), downloadReceipt);

// @route   GET api/donor/chats
// @desc    List donor chat threads
// @access  Private (thread participant)
router.get('/chats', auth, getDonorChats);

// @route   POST api/donor/chats/start
// @desc    Start chat with approved recipient
// @access  Private/Donor
router.post('/chats/start', auth, authorizeRole('DONOR'), checkFrozen, startDonorChat);

// @route   GET api/donor/chats/:threadId/messages
// @desc    Get messages from a donor chat thread
// @access  Private (thread participant)
router.get('/chats/:threadId/messages', auth, getChatMessages);

// @route   POST api/donor/chats/:threadId/messages
// @desc    Send message in donor chat thread
// @access  Private (thread participant)
router.post('/chats/:threadId/messages', auth, checkFrozen, sendChatMessage);

module.exports = router;
