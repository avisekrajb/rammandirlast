const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: function() {
      // Only required for non-Google users
      return !this.googleId;
    },
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  password: {
    type: String,
    required: function() {
      // Only required for non-Google users
      return !this.googleId;
    },
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
  phone: {
    type: String,
    trim: true,
    default: '',
  },
  address: {
    type: String,
    trim: true,
    default: '',
  },
  profilePhoto: {
    type: String,
    default: null,
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true, // This is the key fix - allows multiple null values
    index: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'superadmin'],
    default: 'user',
  },
  active: {
    type: Boolean,
    default: true,
  },
  isGoogleUser: {
    type: Boolean,
    default: false,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamp on save
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Hash password before saving (only if password is modified and not a Google user)
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  if (this.googleId && !this.password) return next();
  if (this.password) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if email exists (static method)
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Check if Google user exists
userSchema.statics.findByGoogleId = function(googleId) {
  return this.findOne({ googleId });
};

// Create or update Google user
userSchema.statics.findOrCreateGoogleUser = async function(profile) {
  let user = await this.findOne({ googleId: profile.id });
  
  if (!user) {
    // Check if email already exists
    const existingUser = await this.findOne({ email: profile.emails[0].value });
    
    if (existingUser) {
      // Link Google account to existing user
      existingUser.googleId = profile.id;
      existingUser.isGoogleUser = true;
      if (!existingUser.profilePhoto) {
        existingUser.profilePhoto = profile.photos?.[0]?.value || null;
      }
      await existingUser.save();
      return existingUser;
    }
    
    // Create new Google user
    user = new this({
      googleId: profile.id,
      email: profile.emails[0].value,
      name: profile.displayName || profile.name?.givenName || 'Google User',
      isGoogleUser: true,
      profilePhoto: profile.photos?.[0]?.value || null,
      // Don't set password for Google users
    });
    
    await user.save();
  }
  
  return user;
};

// Handle duplicate key errors gracefully
userSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    // Duplicate key error
    const field = Object.keys(error.keyPattern)[0];
    next(new Error(`Duplicate ${field}. Please use a different ${field}.`));
  } else {
    next(error);
  }
});

module.exports = mongoose.model('User', userSchema);