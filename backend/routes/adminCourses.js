import express from 'express';
const router = express.Router();
import Course from '../models/Course.js';
import Purchase from '../models/Purchase.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

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
    const { title, description, price, thumbnail, videos } = req.body;

    if (!title || price === undefined) {
      return res.status(400).json({ message: 'Title and price are required' });
    }

    const newCourse = new Course({
      title,
      description,
      price,
      thumbnail,
      videos: videos || []
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
    const { title, description, price, thumbnail, videos } = req.body;

    if (!title || price === undefined) {
      return res.status(400).json({ message: 'Title and price are required' });
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      { title, description, price, thumbnail, videos: videos || [] },
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

export default router;
