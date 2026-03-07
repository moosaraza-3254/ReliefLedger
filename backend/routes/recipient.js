const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorizeRole = require('../middleware/authorizeRole');
const checkFrozen = require('../middleware/checkFrozen');
const upload = require('../middleware/upload');
const {
  submitApplication,
  uploadDocument,
  getApplications,
  getDocuments,
  getWallet,
  getVerificationStatus
} = require('../controllers/recipientController');

// @route   POST api/recipient/apply
// @desc    Submit relief application
// @access  Private/Recipient
router.post('/apply', auth, authorizeRole('RECIPIENT'), checkFrozen, submitApplication);

// @route   POST api/recipient/upload-document
// @desc    Upload document
// @access  Private/Recipient
router.post('/upload-document', auth, authorizeRole('RECIPIENT'), upload.single('document'), uploadDocument);

// @route   GET api/recipient/applications
// @desc    Get my applications
// @access  Private/Recipient
router.get('/applications', auth, authorizeRole('RECIPIENT'), getApplications);

// @route   GET api/recipient/documents
// @desc    Get my documents
// @access  Private/Recipient
router.get('/documents', auth, authorizeRole('RECIPIENT'), getDocuments);

// @route   GET api/recipient/wallet
// @desc    Get wallet balance
// @access  Private/Recipient
router.get('/wallet', auth, authorizeRole('RECIPIENT'), getWallet);

// @route   GET api/recipient/verification-status
// @desc    Get verification status
// @access  Private/Recipient
router.get('/verification-status', auth, authorizeRole('RECIPIENT'), getVerificationStatus);

module.exports = router;
