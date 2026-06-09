import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  displayName: { 
    type: String, 
    required: true, 
    trim: true 
  },
  profilePicture: { 
    type: String, 
    default: '' 
  },
  coverPhoto: { 
    type: String, 
    default: '' 
  },
  bio: { 
    type: String, 
    default: '' 
  },
  website: { 
    type: String, 
    default: '' 
  },
  country: { 
    type: String, 
    default: '' 
  },
  city: { 
    type: String, 
    default: '' 
  },
  languages: [{ 
    type: String 
  }],
  travelInterests: [{ 
    type: String 
  }],
  favoriteDestinations: [{ 
    type: String 
  }],
  visitedCountries: [{ 
    type: String 
  }],
  visitedCities: [{ 
    type: String 
  }],
  roles: {
    type: [String],
    enum: ['User', 'Verified Traveler', 'Moderator', 'Admin', 'Super Admin'],
    default: ['User']
  },
  isVerified: { 
    type: Boolean, 
    default: false 
  },
  emailVerified: { 
    type: Boolean, 
    default: false 
  },
  verificationOtp: { 
    type: String 
  },
  otpExpires: { 
    type: Date 
  },
  refreshToken: { 
    type: String 
  },
  rememberMe: { 
    type: Boolean, 
    default: false 
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare Password helper
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcryptjs.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
