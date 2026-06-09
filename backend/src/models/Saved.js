import mongoose from 'mongoose';

const savedSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  item: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  itemType: {
    type: String,
    enum: ['Post', 'TravelJournal', 'Blog'],
    required: true
  }
}, {
  timestamps: true
});

// Unique index so a user cannot save the same item twice
savedSchema.index({ user: 1, item: 1 }, { unique: true });

export default mongoose.model('Saved', savedSchema);
