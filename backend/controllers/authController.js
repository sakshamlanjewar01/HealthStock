import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import User from '../models/User.js';
import Medicine from '../models/Medicine.js';
import { sendMail } from '../services/emailService.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper to generate JWT
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('CRITICAL CONFIGURATION ERROR: process.env.JWT_SECRET is not configured.');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Helper to send token inside an HTTP-only cookie
const sendTokenCookie = (res, statusCode, user) => {
  const token = generateToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        notificationPreference: user.notificationPreference,
        accessibilityLargeText: user.accessibilityLargeText,
        phoneNumber: user.phoneNumber,
        timezone: user.timezone
      }
    });
};

const seedDefaultMedicines = async (userId) => {
  try {
    const today = new Date();
    const defaultMeds = [
      {
        userId,
        name: 'Albuterol',
        totalQuantity: 30,
        currentQuantity: 24,
        unit: 'Tablets',
        dosesPerDay: 1,
        timeOfDay: 'Morning',
        dosageStrength: '90mcg',
        foodAssociation: 'None',
        specialInstructions: 'Inhale 1-2 puffs as needed',
        reminderTime: '09:00 AM',
        startDate: today,
        prescribedDoctor: 'Adams',
        purpose: 'Asthma',
        refillThreshold: 5,
        rxNumber: 'RX678901',
        pillShape: 'Tablet',
        pillColor: 'Blue',
        refillsRemaining: 2,
        pharmacyPhone: '7058208487'
      },
      {
        userId,
        name: 'Levothyroxine',
        totalQuantity: 90,
        currentQuantity: 85,
        unit: 'Tablets',
        dosesPerDay: 1,
        timeOfDay: 'Morning',
        dosageStrength: '50mcg',
        foodAssociation: 'Empty Stomach',
        specialInstructions: 'Take on empty stomach 1 hr before breakfast',
        reminderTime: '06:30 AM',
        startDate: today,
        prescribedDoctor: 'Green',
        purpose: 'Thyroid',
        refillThreshold: 15,
        rxNumber: 'RX789012',
        pillShape: 'Tablet',
        pillColor: 'White',
        refillsRemaining: 2,
        pharmacyPhone: '7058208487'
      },
      {
        userId,
        name: 'Sertraline',
        totalQuantity: 30,
        currentQuantity: 28,
        unit: 'Tablets',
        dosesPerDay: 1,
        timeOfDay: 'Morning',
        dosageStrength: '50mg',
        foodAssociation: 'With Food',
        specialInstructions: 'Take in the morning',
        reminderTime: '08:00 AM',
        startDate: today,
        prescribedDoctor: 'Taylor',
        purpose: 'Anxiety',
        refillThreshold: 5,
        rxNumber: 'RX890123',
        pillShape: 'Tablet',
        pillColor: 'Blue',
        refillsRemaining: 1,
        pharmacyPhone: '7058208487'
      },
      {
        userId,
        name: 'paracetamol',
        totalQuantity: 20,
        currentQuantity: 17,
        unit: 'Tablets',
        dosesPerDay: 2,
        timeOfDay: 'Morning, Evening',
        dosageStrength: '100 mg',
        foodAssociation: 'After Food',
        specialInstructions: 'Take after eating',
        reminderTime: '08:00 AM',
        startDate: today,
        prescribedDoctor: 'Unassigned',
        purpose: 'Pain relief',
        refillThreshold: 5,
        rxNumber: 'N/A',
        pillShape: 'Tablet',
        pillColor: 'White',
        refillsRemaining: 0,
        pharmacyPhone: '7058208487'
      },
      {
        userId,
        name: 'Vitamin D3',
        totalQuantity: 60,
        currentQuantity: 30,
        unit: 'Capsules',
        dosesPerDay: 1,
        timeOfDay: 'Morning',
        dosageStrength: '2000 IU',
        foodAssociation: 'With Food',
        specialInstructions: 'Take daily with meal',
        reminderTime: '08:00 AM',
        startDate: today,
        prescribedDoctor: 'Smith',
        purpose: 'Supplement',
        refillThreshold: 10,
        rxNumber: 'RX012345',
        pillShape: 'Capsule',
        pillColor: 'Yellow',
        refillsRemaining: 0,
        pharmacyPhone: '7058208487'
      }
    ];

    await Medicine.insertMany(defaultMeds);
    console.log(`Successfully seeded default medicines for user ${userId}`);
  } catch (error) {
    console.error('Error seeding default medicines:', error);
  }
};

// @desc    Register a new user/patient
// @route   POST /api/auth/signup
export const signup = async (req, res, next) => {
  const { name, email, password, role } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const err = new Error('Account with this email already exists.');
      err.statusCode = 400;
      return next(err);
    }

    // Sanitize user role during public registration to prevent privilege escalation
    const allowedPublicRoles = ['Patient', 'Caregiver'];
    const safeRole = allowedPublicRoles.includes(role) ? role : 'Patient';

    const user = await User.create({ 
      name, 
      email, 
      password,
      role: safeRole 
    });
    
    // Seeding disabled to allow clean state for real-time data tracking.
    // await seedDefaultMedicines(user._id);
    
    sendTokenCookie(res, 201, user);
  } catch (error) {
    next(error);
  }
};

// @desc    Log in user/patient
// @route   POST /api/auth/login
export const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      const err = new Error('Invalid credentials: user not found.');
      err.statusCode = 401;
      return next(err);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const err = new Error('Invalid credentials: password incorrect.');
      err.statusCode = 401;
      return next(err);
    }

    sendTokenCookie(res, 200, user);
  } catch (error) {
    next(error);
  }
};

// @desc    Clear active session / Log out user
// @route   POST /api/auth/logout
export const logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/'
  });
  
  res.status(200).json({ success: true, message: 'Session logged out.' });
};

// @desc    Retrieve logged-in user profile
// @route   GET /api/auth/me
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      const err = new Error('User not found.');
      err.statusCode = 404;
      return next(err);
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Log in or register with Google
// @route   POST /api/auth/google-login
export const googleLogin = async (req, res, next) => {
  const { email, name, googleId, token } = req.body;

  try {
    let finalEmail = email;
    let finalName = name;
    let finalGoogleId = googleId;

    if (token) {
      if (!process.env.GOOGLE_CLIENT_ID) {
        const err = new Error('GOOGLE_CLIENT_ID is not configured in environment variables.');
        err.statusCode = 500;
        return next(err);
      }
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: token,
          audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        finalEmail = payload.email;
        finalName = payload.name;
        finalGoogleId = payload.sub;
      } catch (err) {
        const error = new Error('Google token verification failed: ' + err.message);
        error.statusCode = 401;
        return next(error);
      }
    } else {
      if (process.env.NODE_ENV === 'production') {
        const err = new Error('Token verification is required in production.');
        err.statusCode = 400;
        return next(err);
      }
    }

    if (!finalEmail) {
      const err = new Error('Email is required for Google Sign-In.');
      err.statusCode = 400;
      return next(err);
    }

    let user = await User.findOne({ email: finalEmail });
    if (!user) {
      user = await User.create({
        name: finalName || 'Google User',
        email: finalEmail,
        googleId: finalGoogleId || `google_${Math.random().toString(36).substring(2, 11)}`
      });
    } else if (!user.googleId && finalGoogleId) {
      user.googleId = finalGoogleId;
      await user.save();
    }

    sendTokenCookie(res, 200, user);
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile preferences
// @route   PUT /api/auth/profile
export const updateProfile = async (req, res, next) => {
  const { notificationPreference, accessibilityLargeText, phoneNumber, timezone } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      const err = new Error('User not found.');
      err.statusCode = 404;
      return next(err);
    }

    if (notificationPreference !== undefined) user.notificationPreference = notificationPreference;
    if (accessibilityLargeText !== undefined) user.accessibilityLargeText = accessibilityLargeText;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber.trim();
    if (timezone !== undefined) user.timezone = timezone.trim();

    await user.save();

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        notificationPreference: user.notificationPreference,
        accessibilityLargeText: user.accessibilityLargeText,
        phoneNumber: user.phoneNumber,
        timezone: user.timezone
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request password reset token
// @route   POST /api/auth/forgot-password
export const forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  try {
    if (!email) {
      const err = new Error('Please provide an email address.');
      err.statusCode = 400;
      return next(err);
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // To prevent user enumeration, return success even if email is not found
      return res.status(200).json({
        success: true,
        message: 'If an account exists with that email, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set token and expire time (1 hour)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save({ validateBeforeSave: false });

    // Determine the Client URL dynamically based on headers or default environment variables
    const origin = req.headers.origin || process.env.CLIENT_URL || 'http://localhost:3000';
    const resetUrl = `${origin}/?token=${resetToken}`;

    const message = `You are receiving this email because you (or someone else) have requested the reset of a password.
Please click on the following link, or paste this into your browser to complete the process:

${resetUrl}

If you did not request this, please ignore this email and your password will remain unchanged.
`;

    try {
      await sendMail({
        to: user.email,
        subject: 'Healthstock Password Reset Request',
        text: message,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #0F2F57;">Password Reset Request</h2>
            <p>You requested a password reset for your Healthstock account.</p>
            <p>Please click the button below to reset your password. This link is valid for 1 hour:</p>
            <div style="margin: 24px 0;">
              <a href="${resetUrl}" style="background-color: #4571A1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
            </div>
            <p style="color: #64748b; font-size: 12px;">If you did not request this, please ignore this email.</p>
          </div>
        `
      });

      res.status(200).json({
        success: true,
        message: 'If an account exists with that email, a password reset link has been sent.'
      });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });

      const error = new Error('Email could not be sent. Please try again later.');
      error.statusCode = 500;
      return next(error);
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
export const resetPassword = async (req, res, next) => {
  const { token, password } = req.body;

  try {
    if (!token || !password) {
      const err = new Error('Token and password are required.');
      err.statusCode = 400;
      return next(err);
    }

    // Hash sent token and compare to stored token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      const err = new Error('Invalid or expired password reset token.');
      err.statusCode = 400;
      return next(err);
    }

    // Check if the proposed password is in recent history (last 7 days)
    const isHistoryMatch = await user.isPasswordInRecentHistory(password, 7);
    if (isHistoryMatch) {
      const err = new Error('You cannot reuse your current password or any password used in the last 7 days.');
      err.statusCode = 400;
      return next(err);
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now log in.'
    });
  } catch (error) {
    next(error);
  }
};

