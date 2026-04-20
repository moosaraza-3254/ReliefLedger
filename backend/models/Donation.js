const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  application_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    default: null
  },
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  message: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['PENDING', 'PENDING_RECIPIENT_CONFIRMATION', 'COMPLETED', 'DISPUTED', 'FAILED'],
    default: 'PENDING'
  },
  payment_method: {
    type: String,
    enum: ['JAZZCASH', 'EASYPAISA', 'BANK'],
    default: null
  },
  recipient_account_title: {
    type: String,
    default: ''
  },
  recipient_account_number: {
    type: String,
    default: ''
  },
  payment_reference: {
    type: String,
    default: ''
  },
  proof_image_path: {
    type: String,
    default: ''
  },
  proof_submitted_at: {
    type: Date,
    default: null
  },
  recipient_confirmed_at: {
    type: Date,
    default: null
  },
  dispute_reason: {
    type: String,
    default: ''
  },
  dispute_raised_at: {
    type: Date,
    default: null
  },
  admin_resolution_note: {
    type: String,
    default: ''
  },
  receipt_id: {
    type: String,
    unique: true,
    sparse: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model('Donation', donationSchema);
