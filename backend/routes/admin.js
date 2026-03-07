const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorizeRole = require('../middleware/authorizeRole');
const checkFrozen = require('../middleware/checkFrozen');
const {
  getAllUsers,
  getSystemStats,
  getPendingDocuments,
  getPendingApplications,
  getApprovedApplications,
  verifyDocument,
  reviewApplication,
  disburseFunds,
  getTransactionLedger,
  flagTransaction
} = require('../controllers/adminController');

// @route   GET api/admin/users
// @desc    Get all users with stats
// @access  Private/Admin
router.get('/users', auth, authorizeRole('ADMIN'), getAllUsers);

// @route   GET api/admin/stats
// @desc    Get system statistics
// @access  Private/Admin
router.get('/stats', auth, authorizeRole('ADMIN'), getSystemStats);

// @route   GET api/admin/documents
// @desc    Get pending documents for verification
// @access  Private/Admin
router.get('/documents', auth, authorizeRole('ADMIN'), getPendingDocuments);

// @route   GET api/admin/applications
// @desc    Get pending applications for review
// @access  Private/Admin
router.get('/applications', auth, authorizeRole('ADMIN'), getPendingApplications);

// @route   GET api/admin/applications/approved
// @desc    Get approved applications for disbursement
// @access  Private/Admin
router.get('/applications/approved', auth, authorizeRole('ADMIN'), getApprovedApplications);


// @route   PUT api/admin/document/:id/verify
// @desc    Verify/reject document
// @access  Private/Admin
router.put('/document/:id/verify', auth, authorizeRole('ADMIN'), verifyDocument);

// @route   PUT api/admin/application/:id/review
// @desc    Review and approve/reject application
// @access  Private/Admin
router.put('/application/:id/review', auth, authorizeRole('ADMIN'), reviewApplication);

// @route   PUT api/admin/application/:id/disburse
// @desc    Disburse funds to approved application
// @access  Private/Admin
router.put('/application/:id/disburse', auth, authorizeRole('ADMIN'), checkFrozen, disburseFunds);

// @route   GET api/admin/ledger
// @desc    Get transaction ledger
// @access  Private/Admin
router.get('/ledger', auth, authorizeRole('ADMIN'), getTransactionLedger);

// @route   PUT api/admin/transaction/:id/flag
// @desc    Flag suspicious transaction
// @access  Private/Admin
router.put('/transaction/:id/flag', auth, authorizeRole('ADMIN'), flagTransaction);

module.exports = router;
