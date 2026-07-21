import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { encrypt, decrypt } from '../services/cryptoService.js';

const UserSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true,
    index: true
  },
  password: { 
    type: String, 
    required: function() { return !this.googleId; }
  },
  googleId: {
    type: String,
    sparse: true
  },
  notificationPreference: {
    type: String,
    enum: ['Email', 'Push', 'SMS', 'WhatsApp', 'Both', 'None'],
    default: 'Email'
  },
  pushSubscriptions: [
    {
      endpoint: { type: String, required: true },
      keys: {
        p256dh: { type: String, required: true },
        auth: { type: String, required: true }
      }
    }
  ],
  phoneNumber: {
    type: String,
    default: '',
    trim: true,
    get: decrypt,
    set: encrypt
  },
  timezone: {
    type: String,
    default: 'UTC',
    trim: true
  },
  accessibilityLargeText: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['Patient', 'Caregiver', 'Doctor', 'Pharmacist'],
    default: 'Patient'
  },
  resetPasswordToken: {
    type: String,
    sparse: true
  },
  resetPasswordExpires: {
    type: Date
  },
  passwordHistory: [
    {
      passwordHash: { type: String, required: true },
      changedAt: { type: Date, default: Date.now }
    }
  ],
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  toJSON: { getters: true },
  toObject: { getters: true }
});

UserSchema.pre('save', async function (next) {
  if (!this.password || !this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    this.password = hashedPassword;

    // Track in password history
    if (!this.passwordHistory) {
      this.passwordHistory = [];
    }
    this.passwordHistory.push({
      passwordHash: hashedPassword,
      changedAt: new Date()
    });

    next();
  } catch (error) {
    next(error);
  }
});

UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.isPasswordInRecentHistory = async function (newPassword, days = 7) {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const recentHistory = this.passwordHistory ? this.passwordHistory.filter(h => h.changedAt >= cutoffDate) : [];

  // 1. Check against current password
  if (this.password) {
    const isSameAsCurrent = await bcrypt.compare(newPassword, this.password);
    if (isSameAsCurrent) return true;
  }

  // 2. Check against recent password history
  for (const entry of recentHistory) {
    const isMatch = await bcrypt.compare(newPassword, entry.passwordHash);
    if (isMatch) return true;
  }

  return false;
};

const User = mongoose.model('User', UserSchema);
export default User;
