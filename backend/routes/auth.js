import express from 'express';
const router = express.Router();
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import Otp from '../models/Otp.js';
import { authenticateToken } from '../middleware/auth.js';

let googleClient;
const getGoogleClient = () => {
  if (!googleClient) {
    googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }
  return googleClient;
};

const JWT_SECRET = process.env.JWT_SECRET || 'soulful_baking_super_secret_key_12345';

// Helper to generate token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// @route   POST /api/auth/send-otp
// @desc    Send OTP to user's email
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase();
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in DB (update existing or create new)
    await Otp.findOneAndUpdate(
      { email: normalizedEmail },
      { otp, createdAt: new Date() },
      { upsert: true, new: true }
    );

    console.log(`[OTP Verification] Generated OTP for ${normalizedEmail}: ${otp}`);

    // Send email via Resend API
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('[OTP Verification] RESEND_API_KEY is not defined in environment variables');
      return res.status(500).json({ message: 'Email service configuration error' });
    }

    try {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Soulful Baking <onboarding@resend.dev>',
          to: normalizedEmail,
          subject: 'Verification Code - Soulful Baking',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
              <h2 style="color: #e5a93c; text-align: center;">Soulful Baking</h2>
              <p>Hello,</p>
              <p>Thank you for registering at Soulful Baking. To complete your signup, please use the following One-Time Password (OTP):</p>
              <div style="background-color: #f9f9f9; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #333; margin: 20px 0; border-radius: 4px; border: 1px solid #e5a93c;">
                ${otp}
              </div>
              <p>This code will expire in 5 minutes. If you did not request this, you can safely ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 12px; color: #888; text-align: center;">&copy; Soulful Baking. Premium baking experiences.</p>
            </div>
          `
        })
      });

      const resendData = await resendResponse.json();
      
      if (!resendResponse.ok) {
        console.error('[OTP Verification] Resend API error details:', resendData);
        return res.status(200).json({ 
          message: 'Verification OTP generated. Check the backend console logs if Resend limits apply.',
          sandboxWarning: true
        });
      }

      res.status(200).json({ message: 'Verification OTP sent to your email.' });
    } catch (emailError) {
      console.error('[OTP Verification] Failed to send email via Resend:', emailError);
      res.status(200).json({ 
        message: 'Verification OTP generated. Check backend console logs for the code.',
        sandboxWarning: true
      });
    }

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'Server error sending OTP' });
  }
});

// @route   POST /api/auth/register
// @desc    Register a new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, otp } = req.body;

    if (!name || !email || !password || !otp) {
      return res.status(400).json({ message: 'Please enter all required fields including OTP' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = email.toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Verify OTP
    const otpRecord = await Otp.findOne({ email: normalizedEmail });
    if (!otpRecord || otpRecord.otp !== otp) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Delete OTP after verification
    await Otp.deleteOne({ email: normalizedEmail });

    // Role assignment: Check if it's the fixed admin email
    const role = normalizedEmail === 'query@soulfulbaking.in' ? 'admin' : 'user';

    const newUser = new User({
      name,
      email: normalizedEmail,
      password,
      role
    });

    await newUser.save();

    const token = generateToken(newUser);
    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        avatar: newUser.avatar
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Log in a user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter all required fields' });
    }

    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // If it's the fixed admin, check if password in DB matches or reset it to ensure 123456 works
    if (normalizedEmail === 'query@soulfulbaking.in') {
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }
    } else {
      // Local login comparison
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   POST /api/auth/google
// @desc    Authenticate with Google OAuth ID Token
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Google credential token is required' });
    }

    const ticket = await getGoogleClient().verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;
    const normalizedEmail = email.toLowerCase();

    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      // Link Google Account if it isn't linked yet
      let isModified = false;
      if (!user.googleId) {
        user.googleId = googleId;
        isModified = true;
      }
      if (picture && !user.avatar) {
        user.avatar = picture;
        isModified = true;
      }
      // Force admin role if it is the fixed admin email
      if (normalizedEmail === 'query@soulfulbaking.in' && user.role !== 'admin') {
        user.role = 'admin';
        isModified = true;
      }
      if (isModified) {
        await user.save();
      }
    } else {
      // Create user
      user = new User({
        email: normalizedEmail,
        name: name,
        avatar: picture || '',
        googleId,
        role: normalizedEmail === 'query@soulfulbaking.in' ? 'admin' : 'user'
      });
      await user.save();
    }

    const jwtToken = generateToken(user);
    res.json({
      token: jwtToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(400).json({ message: 'Google authentication failed' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user details
router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// @route   POST /api/auth/forgot-password
// @desc    Send OTP to user's email for password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase();
    
    // Check if user exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (!existingUser) {
      return res.status(404).json({ message: 'User with this email does not exist' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in DB (update existing or create new)
    await Otp.findOneAndUpdate(
      { email: normalizedEmail },
      { otp, createdAt: new Date() },
      { upsert: true, new: true }
    );

    console.log(`[Password Reset] Generated OTP for ${normalizedEmail}: ${otp}`);

    // Send email via Resend API
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('[Password Reset] RESEND_API_KEY is not defined in environment variables');
      return res.status(500).json({ message: 'Email service configuration error' });
    }

    try {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Soulful Baking <onboarding@resend.dev>',
          to: normalizedEmail,
          subject: 'Reset Your Password - Soulful Baking',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
              <h2 style="color: #e5a93c; text-align: center;">Soulful Baking</h2>
              <p>Hello,</p>
              <p>We received a request to reset your password. To proceed, please use the following One-Time Password (OTP):</p>
              <div style="background-color: #f9f9f9; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #333; margin: 20px 0; border-radius: 4px; border: 1px solid #e5a93c;">
                ${otp}
              </div>
              <p>This code will expire in 5 minutes. If you did not request this, you can safely ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 12px; color: #888; text-align: center;">&copy; Soulful Baking. Premium baking experiences.</p>
            </div>
          `
        })
      });

      const resendData = await resendResponse.json();
      
      if (!resendResponse.ok) {
        console.error('[Password Reset] Resend API error details:', resendData);
        return res.status(200).json({ 
          message: 'Reset OTP generated. Check the backend console logs if Resend limits apply.',
          sandboxWarning: true
        });
      }

      res.status(200).json({ message: 'Reset OTP sent to your email.' });
    } catch (emailError) {
      console.error('[Password Reset] Failed to send email via Resend:', emailError);
      res.status(200).json({ 
        message: 'Reset OTP generated. Check backend console logs for the code.',
        sandboxWarning: true
      });
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error requesting OTP' });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Verify OTP and reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Please enter all required fields including OTP and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = email.toLowerCase();

    // Verify OTP
    const otpRecord = await Otp.findOne({ email: normalizedEmail });
    if (!otpRecord || otpRecord.otp !== otp) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Delete OTP after verification
    await Otp.deleteOne({ email: normalizedEmail });

    // Update user password
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Server error resetting password' });
  }
});

export default router;
