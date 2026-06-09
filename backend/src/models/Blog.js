import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
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
  content: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coverImage: {
    type: String,
    default: ''
  },
  categories: [{
    type: String
  }],
  tags: [{
    type: String
  }],
  isFeatured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

blogSchema.index({ slug: 1 });
blogSchema.index({ author: 1 });

export default mongoose.model('Blog', blogSchema);
