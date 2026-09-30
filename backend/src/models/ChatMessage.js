const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  sender: {
    type: String,
    enum: ['user', 'bot'],
    required: true,
  },
  text: {
    type: String,
    required: true,
    trim: true,
  },
  language: {
    type: String,
    default: 'en',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema);