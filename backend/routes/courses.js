import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
const router = express.Router();
import Course from '../models/Course.js';
import Purchase from '../models/Purchase.js';
import PhoneOtp from '../models/PhoneOtp.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

// Apply authenticateToken to all user-facing course routes
router.use(authenticateToken);

// @route   GET /api/courses
// @desc    Get all available courses for the catalog (without leaking private video data)
router.get('/', async (req, res) => {
  try {
    // Return only basic info like title, description, price, thumbnail, and the number of videos
    const courses = await Course.find().select('title description price thumbnail videos');
    
    // Format response to hide video streaming details for non-purchased courses
    const formattedCourses = courses.map(course => {
      const courseObj = course.toObject();
      return {
        _id: courseObj._id,
        title: courseObj.title,
        description: courseObj.description,
        price: courseObj.price,
        thumbnail: courseObj.thumbnail,
        videoCount: courseObj.videos ? courseObj.videos.length : 0
      };
    });

    // Prevent browsers/CDNs from caching course data (admin may update at any time)
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.json(formattedCourses);
  } catch (error) {
    console.error('Error fetching catalog courses:', error);
    res.status(500).json({ message: 'Server error fetching course catalog' });
  }
});

// @route   GET /api/courses/my-learning
// @desc    Get all courses purchased by the authenticated user
router.get('/my-learning', async (req, res) => {
  try {
    const purchases = await Purchase.find({ userId: req.user._id })
      .populate('courseId')
      .sort({ purchasedAt: -1 });

    const formattedPurchasedCourses = purchases.map(purchase => {
      if (!purchase.courseId) return null;
      const course = purchase.courseId.toObject();
      return {
        _id: course._id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        purchasedAt: purchase.purchasedAt,
        videoCount: course.videos ? course.videos.length : 0
      };
    }).filter(item => item !== null);

    res.json(formattedPurchasedCourses);
  } catch (error) {
    console.error('Error fetching purchased courses:', error);
    res.status(500).json({ message: 'Server error fetching my-learning courses' });
  }
});

// @route   GET /api/courses/:id
// @desc    Get course details. If purchased, returns videos with unlock state calculated.
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if the user has purchased the course
    const purchase = await Purchase.findOne({ userId: req.user._id, courseId: course._id });
    const isPurchased = !!purchase;

    const courseObj = course.toObject();

    if (!isPurchased) {
      // If not purchased, do not expose video MongoDB GridFS file IDs or stream URLs
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      return res.json({
        ...courseObj,
        isPurchased: false,
        videos: courseObj.videos.map(v => ({
          _id: v._id,
          title: v.title,
          unlockDay: v.unlockDay,
          durationDays: v.durationDays,
          isLocked: true
        }))
      });
    }

    // User purchased the course! Compute available / locked / expired videos
    const purchasedAt = purchase.purchasedAt;
    const now = new Date();
    
    // Calculate difference in days (Day 1 is the purchase day)
    const timeDiff = now.getTime() - purchasedAt.getTime();
    const daysSincePurchase = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1;

    // Use env-defined backend URL or fallback to the deployed Render URL
    const backendBaseUrl = process.env.API_BASE_URL || 'https://soulful-baking-backend.onrender.com';

    const processedVideos = courseObj.videos.map(v => {
      return {
        _id: v._id,
        title: v.title,
        status: 'available',
        videoFileId: v.videoFileId,
        videoUrl: `${backendBaseUrl}/api/media/${v.videoFileId}`
      };
    });

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.json({
      _id: courseObj._id,
      title: courseObj.title,
      description: courseObj.description,
      thumbnail: courseObj.thumbnail,
      price: courseObj.price,
      isPurchased: true,
      purchasedAt,
      daysSincePurchase,
      videos: processedVideos
    });

  } catch (error) {
    console.error('Error fetching course detail:', error);
    res.status(500).json({ message: 'Server error fetching course details' });
  }
});

// @route   POST /api/courses/:id/purchase
// @desc    Simulate purchasing a course (adds a Purchase record)
router.post('/:id/purchase', async (req, res) => {
  try {
    const courseId = req.params.id;
    const userId = req.user._id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if already purchased
    const existingPurchase = await Purchase.findOne({ userId, courseId });
    if (existingPurchase) {
      return res.status(400).json({ message: 'Course already purchased' });
    }

    const newPurchase = new Purchase({
      userId,
      courseId
    });

    await newPurchase.save();

    res.status(201).json({
      message: 'Course purchased successfully!',
      purchase: newPurchase
    });
  } catch (error) {
    console.error('Error executing course purchase:', error);
    res.status(500).json({ message: 'Server error registering course purchase' });
  }
});

// Lazy initializer for Razorpay
const getRazorpayInstance = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
};

// @route   POST /api/courses/:id/razorpay-order
// @desc    Create a new Razorpay order for purchasing a course
router.post('/:id/razorpay-order', async (req, res) => {
  try {
    const courseId = req.params.id;
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user already purchased
    const existingPurchase = await Purchase.findOne({ userId: req.user._id, courseId });
    if (existingPurchase) {
      return res.status(400).json({ message: 'Course already purchased' });
    }

    const rzp = getRazorpayInstance();
    const options = {
      amount: Math.round(course.price * 100), // in paise
      currency: 'INR',
      receipt: `rcpt_${courseId.toString().slice(-8)}_${Date.now()}`
    };

    console.log(`Creating Razorpay order for course: ${course.title}, amount=${options.amount} paise`);
    const order = await rzp.orders.create(options);
    console.log(`Razorpay order created successfully: ${order.id}`);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      courseTitle: course.title,
      price: course.price
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ message: 'Error creating Razorpay order. Please try again.' });
  }
});

// @route   POST /api/courses/:id/razorpay-verify
// @desc    Verify Razorpay payment signature and record purchase
router.post('/:id/razorpay-verify', async (req, res) => {
  try {
    const courseId = req.params.id;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment signature details' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Verify cryptographic signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.error('Razorpay signature validation failed');
      return res.status(400).json({ message: 'Invalid payment signature verification failed' });
    }

    // Check if already purchased (idempotency check)
    let purchase = await Purchase.findOne({ userId: req.user._id, courseId });
    if (!purchase) {
      purchase = new Purchase({
        userId: req.user._id,
        courseId
      });
      await purchase.save();
      console.log(`Purchase recorded for user ${req.user._id} on course ${courseId}`);
    }

    res.json({
      success: true,
      message: 'Payment verified and course unlocked successfully!',
      purchase
    });
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    res.status(500).json({ message: 'Server error during payment verification' });
  }
});

// @route   POST /api/courses/:id/send-payment-otp
// @desc    Send OTP to user's phone for payment verification via SMS
router.post('/:id/send-payment-otp', async (req, res) => {
  try {
    const courseId = req.params.id;
    const { phone } = req.body;

    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit Indian mobile number' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if already purchased
    const existingPurchase = await Purchase.findOne({ userId: req.user._id, courseId });
    if (existingPurchase) {
      return res.status(400).json({ message: 'You have already purchased this course' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in DB (upsert)
    await PhoneOtp.findOneAndUpdate(
      { userId: req.user._id, courseId },
      { phone, otp, verified: false, createdAt: new Date() },
      { upsert: true, new: true }
    );

    // Save phone to user profile if not already saved
    await User.findByIdAndUpdate(req.user._id, { phone }, { new: true });

    console.log(`[Payment OTP] Generated OTP for ${phone} (user: ${req.user._id}): ${otp}`);

    // Send SMS via Fast2SMS
    const fast2smsKey = process.env.FAST2SMS_API_KEY;
    if (!fast2smsKey) {
      console.error('[Payment OTP] FAST2SMS_API_KEY not set in environment');
      // In dev: log OTP to console and return success so testing works
      return res.status(200).json({
        message: `OTP generated. Check backend logs. (Dev mode: ${otp})`,
        devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined
      });
    }

    try {
      const smsResponse = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': fast2smsKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: otp,
          numbers: phone
        })
      });

      const smsData = await smsResponse.json();
      console.log('[Payment OTP] Fast2SMS response:', smsData);

      if (!smsData.return) {
        console.error('[Payment OTP] Fast2SMS error:', smsData);
        return res.status(200).json({
          message: 'OTP generated but SMS delivery failed. Check backend logs.',
          devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined
        });
      }

      res.status(200).json({ message: `OTP sent to +91 ${phone}` });
    } catch (smsError) {
      console.error('[Payment OTP] SMS send error:', smsError);
      res.status(200).json({
        message: 'OTP generated. SMS service error — check backend logs.',
        devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined
      });
    }

  } catch (error) {
    console.error('Error sending payment OTP:', error);
    res.status(500).json({ message: 'Server error sending OTP' });
  }
});

// @route   POST /api/courses/:id/verify-payment-otp
// @desc    Verify the phone OTP before opening Razorpay
router.post('/:id/verify-payment-otp', async (req, res) => {
  try {
    const courseId = req.params.id;
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ message: 'OTP is required' });
    }

    const otpRecord = await PhoneOtp.findOne({ userId: req.user._id, courseId, verified: false });
    if (!otpRecord) {
      return res.status(400).json({ message: 'No OTP request found. Please request a new OTP.' });
    }

    if (otpRecord.otp !== otp.toString()) {
      return res.status(400).json({ message: 'Invalid OTP. Please check and try again.' });
    }

    // Mark as verified
    otpRecord.verified = true;
    await otpRecord.save();

    // Return a short-lived payment token (signed JWT valid for 10 mins)
    const paymentToken = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'payment_token_secret')
      .update(`${req.user._id}:${courseId}:${Date.now()}`)
      .digest('hex');

    res.status(200).json({
      success: true,
      message: 'Phone verified successfully! Proceed to payment.',
      paymentToken
    });
  } catch (error) {
    console.error('Error verifying payment OTP:', error);
    res.status(500).json({ message: 'Server error verifying OTP' });
  }
});

export default router;
