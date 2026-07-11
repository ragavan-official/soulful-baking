import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
const router = express.Router();
import Course from '../models/Course.js';
import Purchase from '../models/Purchase.js';
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

// ─── RAZORPAY PAYMENT GATEWAY ───────────────────────────────────────────────

// Validates that Razorpay keys are configured before creating an instance
const getRazorpayInstance = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('Razorpay API keys are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables.');
  }

  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

// @route   POST /api/courses/:id/razorpay-order
// @desc    Create a Razorpay order for a course purchase
router.post('/:id/razorpay-order', async (req, res) => {
  try {
    const courseId = req.params.id;

    // 1. Validate course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // 2. Check if already purchased
    const existingPurchase = await Purchase.findOne({ userId: req.user._id, courseId });
    if (existingPurchase) {
      return res.status(400).json({ message: 'You have already purchased this course' });
    }

    // 3. Validate price
    if (!course.price || course.price <= 0) {
      return res.status(400).json({ message: 'Invalid course price' });
    }

    // 4. Create Razorpay order
    const rzp = getRazorpayInstance();
    const amountInPaise = Math.round(course.price * 100);
    const receipt = `rcpt_${courseId.toString().slice(-6)}_${Date.now().toString().slice(-6)}`;

    console.log(`[Razorpay] Creating order — course: "${course.title}", amount: ₹${course.price} (${amountInPaise} paise)`);

    const order = await rzp.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt
    });

    console.log(`[Razorpay] Order created successfully — ID: ${order.id}`);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      courseTitle: course.title,
      price: course.price,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('[Razorpay] Order creation error:', error?.message || error);
    const msg = error?.message?.includes('keys are not configured')
      ? error.message
      : 'Failed to create payment order. Please try again.';
    res.status(500).json({ message: msg });
  }
});

// @route   POST /api/courses/:id/razorpay-verify
// @desc    Verify Razorpay payment signature and record the purchase
router.post('/:id/razorpay-verify', async (req, res) => {
  try {
    const courseId = req.params.id;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // 1. Validate all three fields are present
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing Razorpay payment details. Please try again.' });
    }

    // 2. Validate course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // 3. Verify HMAC-SHA256 signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      console.error('[Razorpay] RAZORPAY_KEY_SECRET not set — cannot verify signature');
      return res.status(500).json({ message: 'Payment configuration error. Contact support.' });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.error(`[Razorpay] Signature mismatch — order: ${razorpay_order_id}, payment: ${razorpay_payment_id}`);
      return res.status(400).json({ message: 'Payment verification failed. Signature mismatch.' });
    }

    // 4. Record purchase (idempotent — safe to call multiple times)
    let purchase = await Purchase.findOne({ userId: req.user._id, courseId });
    if (!purchase) {
      purchase = new Purchase({ userId: req.user._id, courseId });
      await purchase.save();
      console.log(`[Razorpay] ✅ Purchase recorded — user: ${req.user._id}, course: ${courseId}, payment: ${razorpay_payment_id}`);
    } else {
      console.log(`[Razorpay] Purchase already exists for user: ${req.user._id}, course: ${courseId}`);
    }

    res.json({
      success: true,
      message: 'Payment verified! Your course is now unlocked.',
      purchase
    });
  } catch (error) {
    console.error('[Razorpay] Verification error:', error?.message || error);
    res.status(500).json({ message: 'Server error during payment verification. Contact support.' });
  }
});

export default router;
