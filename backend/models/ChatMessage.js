const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  thread_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatThread',
    required: true
  },
  sender_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender_role: {
    type: String,
    enum: ['DONOR', 'RECIPIENT'],
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

chatMessageSchema.index({ thread_id: 1, createdAt: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);