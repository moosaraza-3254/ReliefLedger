const mongoose = require('mongoose');

const chatThreadSchema = new mongoose.Schema({
  donor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  application_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    default: null
  },
  initiated_by_donor: {
    type: Boolean,
    default: true
  },
  last_message_at: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

chatThreadSchema.index({ donor_id: 1, recipient_id: 1 }, { unique: true });
chatThreadSchema.index({ donor_id: 1, last_message_at: -1 });
chatThreadSchema.index({ recipient_id: 1, last_message_at: -1 });

module.exports = mongoose.model('ChatThread', chatThreadSchema);