const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transaction_id: {
    type: String,
    unique: true,
    required: true
  },
  from_user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  to_user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: ['DONATION', 'DISBURSEMENT', 'REFUND', 'REVERSAL'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'FLAGGED', 'DISBURSED'],
    default: 'PENDING'
  },
  reason: {
    type: String,
    default: ''
  },
  related_donation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donation',
    default: null
  },
  related_application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    default: null
  },
  flag_reason: {
    type: String,
    default: null
  },
  flagged: {
    type: Boolean,
    default: false
  },
  flaggedAt: {
    type: Date,
    default: null
  },
  flaggedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  flaggedReason: {
    type: String,
    default: null
  },
  originalTransactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);
