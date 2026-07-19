import express from 'express';
const router = express.Router();
import Course from '../models/Course.js';
import Purchase from '../models/Purchase.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import ExtensionRequest from '../models/ExtensionRequest.js';

// Apply authentication and admin checks to all admin course endpoints
router.use(authenticateToken);
router.use(requireAdmin);

// @route   GET /api/admin/courses
// @desc    Retrieve all courses with full details
router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.json(courses);
  } catch (error) {
    console.error('Error fetching admin courses:', error);
    res.status(500).json({ message: 'Server error fetching courses' });
  }
});

// @route   POST /api/admin/courses
// @desc    Create a new course
router.post('/courses', async (req, res) => {
  try {
    const { title, description, price, thumbnail, videos, validityDays } = req.body;

    if (!title || price === undefined) {
      return res.status(400).json({ message: 'Title and price are required' });
    }

    const newCourse = new Course({
      title,
      description,
      price,
      thumbnail,
      videos: videos || [],
      validityDays: validityDays !== undefined ? Number(validityDays) : 365
    });

    await newCourse.save();
    res.status(201).json(newCourse);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ message: 'Server error creating course' });
  }
});

// @route   PUT /api/admin/courses/:id
// @desc    Update course details and associated videos
router.put('/courses/:id', async (req, res) => {
  try {
    const { title, description, price, thumbnail, videos, validityDays } = req.body;

    if (!title || price === undefined) {
      return res.status(400).json({ message: 'Title and price are required' });
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      { 
        title, 
        description, 
        price, 
        thumbnail, 
        videos: videos || [],
        validityDays: validityDays !== undefined ? Number(validityDays) : 365
      },
      { new: true, runValidators: true }
    );

    if (!updatedCourse) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json(updatedCourse);
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ message: 'Server error updating course' });
  }
});

// @route   DELETE /api/admin/courses/:id
// @desc    Delete a course
router.delete('/courses/:id', async (req, res) => {
  try {
    const deletedCourse = await Course.findByIdAndDelete(req.params.id);
    if (!deletedCourse) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ message: 'Server error deleting course' });
  }
});



// @route   GET /api/admin/purchases
// @desc    Retrieve all course purchases
router.get('/purchases', async (req, res) => {
  try {
    const purchases = await Purchase.find()
      .populate('userId', 'name email avatar')
      .populate('courseId', 'title price')
      .sort({ purchasedAt: -1 });
    
    res.json(purchases);
  } catch (error) {
    console.error('Error fetching sales purchases:', error);
    res.status(500).json({ message: 'Server error fetching sales' });
  }
});

// @route   GET /api/admin/extension-requests
// @desc    Retrieve all course extension requests
router.get('/extension-requests', async (req, res) => {
  try {
    const requests = await ExtensionRequest.find()
      .populate('userId', 'name email avatar')
      .populate('courseId', 'title price')
      .sort({ createdAt: -1 });
    
    res.json(requests);
  } catch (error) {
    console.error('Error fetching extension requests:', error);
    res.status(500).json({ message: 'Server error fetching extension requests' });
  }
});

// @route   POST /api/admin/extension-requests/:requestId/resolve
// @desc    Accept or reject a course extension request
router.post('/extension-requests/:requestId/resolve', async (req, res) => {
  try {
    const { action } = req.body; // 'accept' or 'reject'
    const { requestId } = req.params;

    if (!action || !['accept', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Must be accept or reject.' });
    }

    const extRequest = await ExtensionRequest.findById(requestId);
    if (!extRequest) {
      return res.status(404).json({ message: 'Extension request not found' });
    }

    if (extRequest.status !== 'pending') {
      return res.status(400).json({ message: `Request is already resolved: status = ${extRequest.status}` });
    }

    if (action === 'accept') {
      // Find corresponding purchase
      const purchase = await Purchase.findById(extRequest.purchaseId);
      if (!purchase) {
        return res.status(404).json({ message: 'Associated purchase record not found.' });
      }

      // Find validityDays of course
      const course = await Course.findById(extRequest.courseId);
      const validityDays = course && course.validityDays !== undefined ? course.validityDays : 365;

      // Calculate current expiration date
      const currentExpiresAt = purchase.expiresAt || new Date(purchase.purchasedAt.getTime() + validityDays * 24 * 60 * 60 * 1000);
      
      let newExpiresAt;
      if (new Date() > currentExpiresAt) {
        // Already expired: Extend requestedDays from NOW
        newExpiresAt = new Date(Date.now() + extRequest.requestedDays * 24 * 60 * 60 * 1000);
      } else {
        // Not expired yet: Add requestedDays to the existing expiration date
        newExpiresAt = new Date(currentExpiresAt.getTime() + extRequest.requestedDays * 24 * 60 * 60 * 1000);
      }

      purchase.expiresAt = newExpiresAt;
      await purchase.save();

      extRequest.status = 'accepted';
      extRequest.resolvedAt = new Date();
      await extRequest.save();

      console.log(`Approved extension request for user ${extRequest.userId}. New expiration: ${newExpiresAt}`);
      res.json({ message: 'Extension request approved successfully. Purchase extended.', request: extRequest });
    } else {
      // Reject request
      extRequest.status = 'rejected';
      extRequest.resolvedAt = new Date();
      await extRequest.save();

      console.log(`Rejected extension request for user ${extRequest.userId}`);
      res.json({ message: 'Extension request rejected successfully.', request: extRequest });
    }
  } catch (error) {
    console.error('Error resolving extension request:', error);
    res.status(500).json({ message: 'Server error resolving extension request.' });
  }
});

export default router;
