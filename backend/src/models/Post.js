import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'story', 'reels', 'journal'],
    default: 'text'
  },
  mediaUrls: [{
    type: String // GridFS file IDs/endpoints
  }],
  location: {
    name: { type: String, default: '' },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: undefined
    }
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  journal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TravelJournal'
  },
  likesCount: {
    type: Number,
    default: 0
  },
  commentsCount: {
    type: Number,
    default: 0
  },
  sharesCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'moderated'],
    default: 'active'
  },
  expiresAt: {
    type: Date // Used to expire stories after 24 hours
  }
}, {
  timestamps: true
});

// Index location coordinates for geo-queries and general search optimization
postSchema.index({ 'location.coordinates': '2dsphere' });
postSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Post', postSchema);
