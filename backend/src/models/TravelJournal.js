import mongoose from 'mongoose';

const travelJournalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    required: true
  },
  coverImage: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  timeline: [{
    day: {
      type: Number,
      required: true
    },
    date: {
      type: Date
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    photos: [{
      type: String // GridFS ID
    }],
    videos: [{
      type: String // GridFS ID
    }],
    locations: [{
      name: { type: String },
      coordinates: {
        type: [Number] // [longitude, latitude]
      }
    }],
    expenses: [{
      category: { type: String },
      amount: { type: Number },
      currency: { type: String, default: 'USD' }
    }]
  }],
  isPublic: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

travelJournalSchema.index({ slug: 1 });
travelJournalSchema.index({ user: 1 });

export default mongoose.model('TravelJournal', travelJournalSchema);
