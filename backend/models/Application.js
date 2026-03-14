const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  recipient_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount_requested: {
    type: Number,
    required: true,
    min: 1
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'DISBURSED', 'ON_HOLD', 'REVERSED', 'WITHDRAWN'],
    default: 'PENDING'
  },
  verification_notes: {
    type: String,
    default: ''
  },
  verified_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  amount_disbursed: {
    type: Number,
    default: 0
  },
  disbursed_at: {
    type: Date,
    default: null
  },
  disbursed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  reversal_note: {
    type: String,
    default: null
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Application', applicationSchema);
