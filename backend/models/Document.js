const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  application_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    default: null
  },
  document_type: {
    type: String,
    enum: ['ID_PROOF', 'ADDRESS_PROOF', 'INCOME_PROOF', 'MEDICAL_CERTIFICATE', 'OTHER'],
    required: true
  },
  file_name: {
    type: String,
    required: true
  },
  file_path: {
    type: String,
    required: true
  },
  file_size: {
    type: Number,
    required: true
  },
  mime_type: {
    type: String,
    required: true
  },
  verification_status: {
    type: String,
    enum: ['PENDING', 'VERIFIED', 'REJECTED'],
    default: 'PENDING'
  },
  verified_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  rejection_reason: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Document', documentSchema);
