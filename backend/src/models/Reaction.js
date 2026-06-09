import mongoose from 'mongoose';

const reactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    default: null
  },
  comment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  type: {
    type: String,
    enum: ['Like', 'Love', 'Haha', 'Wow', 'Sad', 'Angry'],
    default: 'Like'
  }
}, {
  timestamps: true
});

// Ensure a user can only react once per post or comment
reactionSchema.index({ user: 1, post: 1 }, { unique: true, partialFilterExpression: { post: { $exists: true, $ne: null } } });
reactionSchema.index({ user: 1, comment: 1 }, { unique: true, partialFilterExpression: { comment: { $exists: true, $ne: null } } });

export default mongoose.model('Reaction', reactionSchema);
