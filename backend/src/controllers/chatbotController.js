const ChatMessage = require('../models/ChatMessage');

// @desc    Get all chat messages for the logged-in user
// @route   GET /api/chatbot/messages
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    const messages = await ChatMessage.find({ user: req.user._id })
      .sort({ createdAt: 1 })
      .limit(200);

    res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error('Get chat messages error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Save a single chat message
// @route   POST /api/chatbot/messages
// @access  Private
exports.saveMessage = async (req, res) => {
  try {
    const { sender, text, language } = req.body;

    if (!sender || !['user', 'bot'].includes(sender)) {
      return res.status(400).json({ success: false, message: 'Invalid sender' });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Message text is required' });
    }

    const message = await ChatMessage.create({
      user: req.user._id,
      sender,
      text: text.trim(),
      language: language || 'en',
    });

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error('Save chat message error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Clear all chat messages for the logged-in user
// @route   DELETE /api/chatbot/messages
// @access  Private
exports.clearMessages = async (req, res) => {
  try {
    const result = await ChatMessage.deleteMany({ user: req.user._id });

    res.json({
      success: true,
      message: `${result.deletedCount} messages cleared`,
    });
  } catch (error) {
    console.error('Clear chat messages error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};