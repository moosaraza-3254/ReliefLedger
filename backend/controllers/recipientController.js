const fs = require('fs/promises');
const path = require('path');
const Application = require('../models/Application');
const Document = require('../models/Document');
const Transaction = require('../models/Transaction');
const { v4: uuidv4 } = require('uuid');

const buildDocumentFilter = (userId, documentType, applicationId) => ({
  user_id: userId,
  document_type: documentType,
  application_id: applicationId || null
});

const removeStoredFile = async (filePath) => {
  if (!filePath) {
    return;
  }

  const resolvedPath = path.isAbsolute(filePath)
    ? filePath
    : path.join(__dirname, '..', filePath);

  try {
    await fs.unlink(resolvedPath);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error(`Failed to remove file ${resolvedPath}:`, err.message);
    }
  }
};

// @desc    Submit relief application
// @route   POST /api/recipient/apply
// @access  Private/Recipient
exports.submitApplication = async (req, res) => {
  try {
    const { amount_requested, reason } = req.body;
    const requiredDocumentTypes = ['ID_PROOF', 'ADDRESS_PROOF', 'INCOME_PROOF'];

    const uploadedDocuments = await Document.find({
      user_id: req.user.userId,
      document_type: { $in: requiredDocumentTypes }
    }).select('document_type');

    const uploadedTypes = new Set(uploadedDocuments.map(doc => doc.document_type));
    const missingTypes = requiredDocumentTypes.filter(type => !uploadedTypes.has(type));

    if (missingTypes.length > 0) {
      return res.status(400).json({
        msg: `Please upload all required documents before applying. Missing: ${missingTypes.join(', ')}`,
        missingDocuments: missingTypes
      });
    }

    if (!amount_requested || amount_requested <= 0) {
      return res.status(400).json({ msg: 'Please provide a valid amount' });
    }

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({ msg: 'Please provide a detailed reason (min 10 characters)' });
    }

    const application = new Application({
      recipient_id: req.user.userId,
      amount_requested,
      reason,
      status: 'PENDING'
    });

    await application.save();

    res.json({
      msg: 'Application submitted successfully',
      application: {
        id: application._id,
        amount_requested,
        reason,
        status: application.status,
        createdAt: application.createdAt
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Upload document
// @route   POST /api/recipient/upload-document
// @access  Private/Recipient
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    const { document_type, application_id } = req.body;

    if (!document_type) {
      return res.status(400).json({ msg: 'Document type is required' });
    }

    const allowedTypes = ['ID_PROOF', 'ADDRESS_PROOF', 'INCOME_PROOF', 'MEDICAL_CERTIFICATE', 'OTHER'];
    if (!allowedTypes.includes(document_type)) {
      return res.status(400).json({ msg: 'Invalid document type' });
    }

    // If application_id is provided, verify it belongs to the user
    if (application_id) {
      const application = await Application.findOne({
        _id: application_id,
        recipient_id: req.user.userId
      });
      if (!application) {
        return res.status(404).json({ msg: 'Application not found or does not belong to you' });
      }
    }

    const existingDocuments = await Document.find(
      buildDocumentFilter(req.user.userId, document_type, application_id)
    );

    const document = new Document({
      user_id: req.user.userId,
      application_id: application_id || null,
      document_type,
      file_name: req.file.filename,
      file_path: req.file.path,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      verification_status: 'PENDING'
    });

    await document.save();

    if (existingDocuments.length > 0) {
      await Promise.all(existingDocuments.map(existingDoc => removeStoredFile(existingDoc.file_path)));
      await Document.deleteMany({
        _id: { $in: existingDocuments.map(existingDoc => existingDoc._id) }
      });
    }

    res.json({
      msg: 'Document uploaded successfully',
      document: {
        id: document._id,
        document_type,
        file_name: req.file.filename,
        file_size: req.file.size,
        verification_status: document.verification_status,
        uploadedAt: document.createdAt
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Delete my uploaded document
// @route   DELETE /api/recipient/documents/:documentId
// @access  Private/Recipient
exports.deleteDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.documentId,
      user_id: req.user.userId
    });

    if (!document) {
      return res.status(404).json({ msg: 'Document not found' });
    }

    const matchingDocuments = await Document.find(
      buildDocumentFilter(req.user.userId, document.document_type, document.application_id)
    );

    await Promise.all(matchingDocuments.map(existingDoc => removeStoredFile(existingDoc.file_path)));
    await Document.deleteMany({
      _id: { $in: matchingDocuments.map(existingDoc => existingDoc._id) }
    });

    res.json({
      msg: 'Document removed successfully',
      removedCount: matchingDocuments.length
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get my applications
// @route   GET /api/recipient/applications
// @access  Private/Recipient
exports.getApplications = async (req, res) => {
  try {
    const applications = await Application.find({
      recipient_id: req.user.userId,
      status: { $ne: 'WITHDRAWN' }
    })
      .sort({ createdAt: -1 });

    const applicationsWithDetails = await Promise.all(
      applications.map(async (app) => {
        const documents = await Document.find({ application_id: app._id });
        return {
          id: app._id,
          amount_requested: app.amount_requested,
          amount_disbursed: app.amount_disbursed,
          reason: app.reason,
          status: app.status,
          createdAt: app.createdAt,
          updatedAt: app.updatedAt,
          documents: documents.map(d => ({
            id: d._id,
            type: d.document_type,
            status: d.verification_status
          }))
        };
      })
    );

    res.json({
      applications: applicationsWithDetails
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Withdraw my application
// @route   DELETE /api/recipient/application/:applicationId
// @access  Private/Recipient
exports.withdrawApplication = async (req, res) => {
  try {
    const application = await Application.findOne({
      _id: req.params.applicationId,
      recipient_id: req.user.userId
    });

    if (!application) {
      return res.status(404).json({ msg: 'Application not found' });
    }

    if (application.status !== 'PENDING') {
      return res.status(400).json({ msg: 'Only pending applications can be withdrawn' });
    }

    application.status = 'WITHDRAWN';
    application.updatedAt = new Date();
    await application.save();

    res.json({
      msg: 'Application withdrawn successfully',
      application: {
        id: application._id,
        status: application.status
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get my documents
// @route   GET /api/recipient/documents
// @access  Private/Recipient
exports.getDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ user_id: req.user.userId })
      .sort({ createdAt: -1 });

    res.json({
      documents: documents.map(d => ({
        id: d._id,
        type: d.document_type,
        fileName: d.file_name,
        size: d.file_size,
        status: d.verification_status,
        uploadedAt: d.createdAt,
        rejectionReason: d.rejection_reason
      }))
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get wallet balance
// @route   GET /api/recipient/wallet
// @access  Private/Recipient
exports.getWallet = async (req, res) => {
  try {
    // Get all disbursed applications (funds actually sent to wallet)
    const disburgedApps = await Application.find({
      recipient_id: req.user.userId,
      status: 'DISBURSED'
    });

    const balance = disburgedApps.reduce((sum, app) => sum + app.amount_disbursed, 0);
    const total = disburgedApps.reduce((sum, app) => sum + app.amount_disbursed, 0);

    // Get pending applications (approved but not yet disbursed)
    const pendingApps = await Application.find({
      recipient_id: req.user.userId,
      status: 'APPROVED'
    });

    const pending = pendingApps.reduce((sum, app) => sum + app.amount_requested, 0);

    res.json({
      balance,
      pending,
      total,
      currency: 'USD'
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get verification status
// @route   GET /api/recipient/verification-status
// @access  Private/Recipient
exports.getVerificationStatus = async (req, res) => {
  try {
    const user = await require('../models/User').findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Get all documents uploaded by this user
    const documents = await Document.find({ user_id: req.user.userId });
    const pendingDocs = documents.filter(d => d.verification_status === 'PENDING').length;
    const verifiedDocs = documents.filter(d => d.verification_status === 'VERIFIED').length;
    const rejectedDocs = documents.filter(d => d.verification_status === 'REJECTED').length;

    res.json({
      isVerified: user.isVerified,
      documents: {
        total: documents.length,
        pending: pendingDocs,
        verified: verifiedDocs,
        rejected: rejectedDocs
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
