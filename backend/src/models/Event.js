import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    default: ''
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    name: { type: String, required: true },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  date: {
    type: Date,
    required: true
  },
  rsvp: {
    going: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    interested: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  coverImage: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

eventSchema.index({ slug: 1 });
eventSchema.index({ 'location.coordinates': '2dsphere' });

export default mongoose.model('Event', eventSchema);
