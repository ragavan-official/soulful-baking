import express from 'express';
const router = express.Router();
import Course from '../models/Course.js';
import Purchase from '../models/Purchase.js';
import { authenticateToken, requireAdminOrEmployee } from '../middleware/auth.js';

// Apply authentication and admin checks to all admin course endpoints
router.use(authenticateToken);
router.use(requireAdminOrEmployee);

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
    const { title, description, price, thumbnail, videos, validityDays, recipePdf, instructor, language } = req.body;

    if (!title || price === undefined) {
      return res.status(400).json({ message: 'Title and price are required' });
    }

    const newCourse = new Course({
      title,
      description,
      price,
      thumbnail,
      videos: videos || [],
      validityDays: validityDays !== undefined ? Number(validityDays) : 365,
      recipePdf: recipePdf || '',
      instructor: instructor || 'Jeyadra Vijayselvan',
      language: language || 'English'
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
    const { title, description, price, thumbnail, videos, validityDays, recipePdf, instructor, language } = req.body;

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
        validityDays: validityDays !== undefined ? Number(validityDays) : 365,
        recipePdf: recipePdf !== undefined ? recipePdf : '',
        instructor: instructor || 'Jeyadra Vijayselvan',
        language: language || 'English'
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

// @route   DELETE /api/admin/purchases/by-month/:year/:month
// @desc    Delete all course purchases for a specific month (1-indexed month)
router.delete('/purchases/by-month/:year/:month', async (req, res) => {
  try {
    const year = parseInt(req.params.year, 10);
    const month = parseInt(req.params.month, 10);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return res.status(400).json({ message: 'Invalid year or month parameter.' });
    }

    // Define UTC start and end dates for the selected month
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 1));

    console.log(`Deleting purchases from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    const result = await Purchase.deleteMany({
      purchasedAt: {
        $gte: startDate,
        $lt: endDate
      }
    });

    res.json({
      message: `Successfully deleted ${result.deletedCount} logs for ${year}-${month.toString().padStart(2, '0')}`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting monthly purchases:', error);
    res.status(500).json({ message: 'Server error deleting monthly logs.' });
  }
});

export default router;
