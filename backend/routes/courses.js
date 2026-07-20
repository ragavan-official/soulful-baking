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
    // Return only basic info like title, description, price, thumbnail, validityDays, and the number of videos
    const courses = await Course.find().select('title description price thumbnail videos validityDays instructor language');
    
    // Format response to hide video streaming details for non-purchased courses
    const formattedCourses = courses.map(course => {
      const courseObj = course.toObject();
      return {
        _id: courseObj._id,
        title: courseObj.title,
        description: courseObj.description,
        price: courseObj.price,
        thumbnail: courseObj.thumbnail,
        validityDays: courseObj.validityDays !== undefined ? courseObj.validityDays : 365,
        videoCount: courseObj.videos ? courseObj.videos.length : 0,
        instructor: courseObj.instructor || 'Jeyadra Vijayselvan',
        language: courseObj.language || 'English'
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
      
      const validityDays = course.validityDays !== undefined ? course.validityDays : 365;
      const expiresAt = purchase.expiresAt || new Date(purchase.purchasedAt.getTime() + validityDays * 24 * 60 * 60 * 1000);
      const isExpired = new Date() > expiresAt;

      return {
        _id: course._id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        purchasedAt: purchase.purchasedAt,
        expiresAt,
        isExpired,
        validityDays,
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
// @desc    Get course details. If purchased and not expired, returns videos with unlock state.
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if the user has purchased the course OR is an admin
    const isAdmin = req.user && req.user.role === 'admin';
    const purchase = await Purchase.findOne({ userId: req.user._id, courseId: course._id });
    const isPurchased = isAdmin || !!purchase;

    const courseObj = course.toObject();

    if (!isPurchased) {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      return res.json({
        ...courseObj,
        isPurchased: false,
        isExpired: false,
        recipePdf: courseObj.recipePdf ? 'locked' : '',
        hasRecipePdf: !!courseObj.recipePdf,
        videos: courseObj.videos.map(v => ({
          _id: v._id,
          title: v.title,
          unlockDay: v.unlockDay,
          durationDays: v.durationDays,
          isLocked: true
        }))
      });
    }

    // Check expiration
    const validityDays = course.validityDays !== undefined ? course.validityDays : 365;
    const expiresAt = purchase ? (purchase.expiresAt || new Date(purchase.purchasedAt.getTime() + validityDays * 24 * 60 * 60 * 1000)) : new Date('2099-12-31');
    const isExpired = !isAdmin && new Date() > expiresAt;

    if (isExpired) {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      return res.json({
        ...courseObj,
        isPurchased: false,
        isExpired: true,
        expiresAt,
        recipePdf: courseObj.recipePdf ? 'locked' : '',
        hasRecipePdf: !!courseObj.recipePdf,
        videos: courseObj.videos.map(v => ({
          _id: v._id,
          title: v.title,
          unlockDay: v.unlockDay,
          durationDays: v.durationDays,
          isLocked: true
        }))
      });
    }

    // User purchased the course and it is active! Compute available videos
    const purchasedAt = purchase ? purchase.purchasedAt : new Date();
    const now = new Date();
    
    // Calculate difference in days (Day 1 is the purchase day)
    const timeDiff = now.getTime() - purchasedAt.getTime();
    const daysSincePurchase = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1;

    // Build a dynamic base URL from the request so it works on localhost AND production.
    const backendBaseUrl = process.env.API_BASE_URL || `${req.protocol}://${req.get('host')}`;

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
      validityDays,
      instructor: courseObj.instructor || 'Jeyadra Vijayselvan',
      language: courseObj.language || 'English',
      isPurchased: true,
      isExpired: false,
      purchasedAt,
      expiresAt,
      daysSincePurchase,
      videos: processedVideos,
      recipePdf: courseObj.recipePdf || '',
      recipePdfUrl: courseObj.recipePdf ? `${backendBaseUrl}/api/media/${courseObj.recipePdf}` : '',
      hasRecipePdf: !!courseObj.recipePdf
    });

  } catch (error) {
    console.error('Error fetching course detail:', error);
    res.status(500).json({ message: 'Server error fetching course details' });
  }
});

// @route   POST /api/courses/:id/purchase
// @desc    Simulate purchasing a course (adds or renews a Purchase record)
router.post('/:id/purchase', async (req, res) => {
  try {
    const courseId = req.params.id;
    const userId = req.user._id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const validityDays = course.validityDays !== undefined ? course.validityDays : 365;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validityDays);

    let purchase = await Purchase.findOne({ userId, courseId });
    if (purchase) {
      // Check if it is already active
      const currentExpiresAt = purchase.expiresAt || new Date(purchase.purchasedAt.getTime() + validityDays * 24 * 60 * 60 * 1000);
      if (new Date() < currentExpiresAt) {
        return res.status(400).json({ message: 'You have already purchased this course and it is still active' });
      }

      // If expired, renew/reactivate the purchase record
      purchase.purchasedAt = new Date();
      purchase.expiresAt = expiresAt;
      purchase.status = 'completed';
      purchase.amount = course.price;
      await purchase.save();
      
      return res.status(200).json({
        message: 'Course access renewed successfully!',
        purchase
      });
    }

    const newPurchase = new Purchase({
      userId,
      courseId,
      expiresAt
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

    // 4. Record or renew purchase (idempotent)
    const validityDays = course.validityDays !== undefined ? course.validityDays : 365;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validityDays);

    let purchase = await Purchase.findOne({ userId: req.user._id, courseId });
    if (!purchase) {
      purchase = new Purchase({
        userId: req.user._id,
        courseId,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        amount: course.price,
        status: 'completed',
        expiresAt
      });
      await purchase.save();
      console.log(`[Razorpay] ✅ Purchase recorded — user: ${req.user._id}, course: ${courseId}, payment: ${razorpay_payment_id}`);
    } else {
      // If expired, renew it on verification
      const currentExpiresAt = purchase.expiresAt || new Date(purchase.purchasedAt.getTime() + validityDays * 24 * 60 * 60 * 1000);
      if (new Date() >= currentExpiresAt) {
        purchase.purchasedAt = new Date();
        purchase.expiresAt = expiresAt;
        purchase.razorpayOrderId = razorpay_order_id;
        purchase.razorpayPaymentId = razorpay_payment_id;
        purchase.amount = course.price;
        purchase.status = 'completed';
        await purchase.save();
        console.log(`[Razorpay] 🔄 Purchase renewed — user: ${req.user._id}, course: ${courseId}, payment: ${razorpay_payment_id}`);
      } else {
        console.log(`[Razorpay] Purchase already active for user: ${req.user._id}, course: ${courseId}`);
      }
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
