const Application = require('../models/Application');
const ChatThread = require('../models/ChatThread');
const ChatMessage = require('../models/ChatMessage');
const { getIO } = require('../socket');

const serializeThread = (thread) => ({
  id: thread._id,
  donor: thread.donor_id ? {
    id: thread.donor_id._id,
    name: thread.donor_id.name,
    email: thread.donor_id.email
  } : null,
  recipient: thread.recipient_id ? {
    id: thread.recipient_id._id,
    name: thread.recipient_id.name,
    email: thread.recipient_id.email
  } : null,
  application_id: thread.application_id,
  initiated_by_donor: thread.initiated_by_donor,
  last_message_at: thread.last_message_at,
  createdAt: thread.createdAt
});

const getSenderRoleFromThread = (message, thread) => {
  if (!message?.sender_id || !thread) {
    return message?.sender_role || 'RECIPIENT';
  }

  const senderId = String(message.sender_id._id || message.sender_id);
  if (String(thread.donor_id?._id || thread.donor_id) === senderId) {
    return 'DONOR';
  }
  if (String(thread.recipient_id?._id || thread.recipient_id) === senderId) {
    return 'RECIPIENT';
  }

  return message.sender_role || 'RECIPIENT';
};

const serializeMessage = (message, thread = null) => {
  const resolvedRole = getSenderRoleFromThread(message, thread);
  return {
    id: message._id,
    thread_id: message.thread_id,
    sender: message.sender_id ? {
      id: message.sender_id._id,
      name: message.sender_id.name,
      email: message.sender_id.email,
      role: resolvedRole
    } : {
      id: null,
      name: 'Unknown',
      email: '',
      role: resolvedRole
    },
    text: message.text,
    createdAt: message.createdAt
  };
};

const getAuthorizedThread = async (threadId, userId, role) => {
  const thread = await ChatThread.findById(threadId)
    .populate('donor_id', 'name email')
    .populate('recipient_id', 'name email');

  if (!thread) {
    return null;
  }

  const isDonor = String(thread.donor_id?._id) === String(userId);
  const isRecipient = String(thread.recipient_id?._id) === String(userId);

  if (!isDonor && !isRecipient) {
    return null;
  }

  if (role === 'RECIPIENT' && !thread.initiated_by_donor) {
    return null;
  }

  return thread;
};

// @desc    Donor starts (or opens) a chat with approved recipient
// @route   POST /api/donor/chats/start
// @access  Private/Donor
exports.startDonorChat = async (req, res) => {
  try {
    const { application_id } = req.body;
    if (!application_id) {
      return res.status(400).json({ msg: 'application_id is required' });
    }

    const application = await Application.findById(application_id)
      .populate('recipient_id', 'name email isFrozen');

    if (!application || !application.recipient_id) {
      return res.status(404).json({ msg: 'Approved recipient application not found' });
    }

    if (application.status !== 'APPROVED') {
      return res.status(400).json({ msg: 'Chat can only be initiated for approved applications' });
    }

    if (application.recipient_id.isFrozen) {
      return res.status(400).json({ msg: 'Recipient account is frozen' });
    }

    let thread = await ChatThread.findOne({
      donor_id: req.user.userId,
      recipient_id: application.recipient_id._id
    })
      .populate('donor_id', 'name email')
      .populate('recipient_id', 'name email');

    let isNewThread = false;
    if (!thread) {
      thread = new ChatThread({
        donor_id: req.user.userId,
        recipient_id: application.recipient_id._id,
        application_id: application._id,
        initiated_by_donor: true,
        last_message_at: new Date()
      });

      await thread.save();
      isNewThread = true;

      thread = await ChatThread.findById(thread._id)
        .populate('donor_id', 'name email')
        .populate('recipient_id', 'name email');
    }

    if (isNewThread) {
      const io = getIO();
      if (io) {
        io.to(`user:${thread.recipient_id._id}`).emit('chat:thread-created', {
          thread: serializeThread(thread)
        });
      }
    }

    return res.json({
      msg: isNewThread ? 'Chat started successfully' : 'Chat opened successfully',
      thread: serializeThread(thread)
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server error');
  }
};

// @desc    Donor list chats
// @route   GET /api/donor/chats
// @access  Private/Donor
exports.getDonorChats = async (req, res) => {
  try {
    const threads = await ChatThread.find({ donor_id: req.user.userId })
      .populate('donor_id', 'name email')
      .populate('recipient_id', 'name email')
      .sort({ last_message_at: -1, createdAt: -1 });

    return res.json({ chats: threads.map(serializeThread) });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server error');
  }
};

// @desc    Recipient list chats initiated by donors
// @route   GET /api/recipient/chats
// @access  Private/Recipient
exports.getRecipientChats = async (req, res) => {
  try {
    const threads = await ChatThread.find({
      recipient_id: req.user.userId,
      initiated_by_donor: true
    })
      .populate('donor_id', 'name email')
      .populate('recipient_id', 'name email')
      .sort({ last_message_at: -1, createdAt: -1 });

    return res.json({ chats: threads.map(serializeThread) });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server error');
  }
};

// @desc    Get chat messages
// @route   GET /api/donor/chats/:threadId/messages or /api/recipient/chats/:threadId/messages
// @access  Private/Donor|Recipient
exports.getChatMessages = async (req, res) => {
  try {
    const { threadId } = req.params;
    const thread = await getAuthorizedThread(threadId, req.user.userId, req.user.role);
    if (!thread) {
      return res.status(404).json({ msg: 'Chat not found' });
    }

    const messages = await ChatMessage.find({ thread_id: thread._id })
      .populate('sender_id', 'name email')
      .sort({ createdAt: 1 });

    return res.json({
      thread: serializeThread(thread),
      messages: messages.map(message => serializeMessage(message, thread))
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server error');
  }
};

// @desc    Send chat message
// @route   POST /api/donor/chats/:threadId/messages or /api/recipient/chats/:threadId/messages
// @access  Private/Donor|Recipient
exports.sendChatMessage = async (req, res) => {
  try {
    const { threadId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ msg: 'Message text is required' });
    }

    const thread = await getAuthorizedThread(threadId, req.user.userId, req.user.role);
    if (!thread) {
      return res.status(404).json({ msg: 'Chat not found' });
    }

    const senderRole = String(thread.donor_id?._id || thread.donor_id) === String(req.user.userId)
      ? 'DONOR'
      : 'RECIPIENT';

    const message = new ChatMessage({
      thread_id: thread._id,
      sender_id: req.user.userId,
      sender_role: senderRole,
      text: text.trim()
    });
    await message.save();

    thread.last_message_at = new Date();
    await thread.save();

    const populatedMessage = await ChatMessage.findById(message._id)
      .populate('sender_id', 'name email');

    const serializedMessage = serializeMessage(populatedMessage, thread);

    const io = getIO();
    if (io) {
      io.to(`user:${thread.donor_id._id}`).emit('chat:new-message', {
        threadId: String(thread._id),
        message: serializedMessage
      });
      io.to(`user:${thread.recipient_id._id}`).emit('chat:new-message', {
        threadId: String(thread._id),
        message: serializedMessage
      });
    }

    return res.json({ message: serializedMessage });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server error');
  }
};