import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null if it's a group chat message
  },
  groupChat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null // null if it's a 1-to-1 message
  },
  content: {
    type: String,
    trim: true,
    default: ''
  },
  mediaUrl: {
    type: String,
    default: ''
  },
  seenBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

messageSchema.index({ recipient: 1, sender: 1, createdAt: 1 });
messageSchema.index({ groupChat: 1, createdAt: 1 });

export default mongoose.model('Message', messageSchema);
