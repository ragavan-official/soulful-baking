import express from 'express';
import GalleryItem from '../models/GalleryItem.js';
import { authenticateToken, requireAdminOrEmployee } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/gallery
// @desc    Get all gallery items (public)
router.get('/', async (req, res) => {
  try {
    const items = await GalleryItem.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    console.error('Error fetching gallery items:', error);
    res.status(500).json({ message: 'Server error fetching gallery items' });
  }
});

// @route   POST /api/gallery
// @desc    Create a gallery item (admin/employee)
router.post('/', authenticateToken, requireAdminOrEmployee, async (req, res) => {
  try {
    const { title, tag, image } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    if (!image) {
      return res.status(400).json({ message: 'Image is required' });
    }

    const newItem = new GalleryItem({
      title,
      tag: tag || 'Custom Work',
      image
    });

    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating gallery item:', error);
    res.status(500).json({ message: 'Server error creating gallery item' });
  }
});

// @route   PUT /api/gallery/:id
// @desc    Update a gallery item (admin/employee)
router.put('/:id', authenticateToken, requireAdminOrEmployee, async (req, res) => {
  try {
    const { title, tag, image } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    if (!image) {
      return res.status(400).json({ message: 'Image is required' });
    }

    const updated = await GalleryItem.findByIdAndUpdate(
      req.params.id,
      {
        title,
        tag: tag || 'Custom Work',
        image
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Gallery item not found' });
    }

    res.json(updated);
  } catch (error) {
    console.error('Error updating gallery item:', error);
    res.status(500).json({ message: 'Server error updating gallery item' });
  }
});

// @route   DELETE /api/gallery/:id
// @desc    Delete a gallery item (admin/employee)
router.delete('/:id', authenticateToken, requireAdminOrEmployee, async (req, res) => {
  try {
    const deleted = await GalleryItem.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Gallery item not found' });
    }
    res.json({ message: 'Gallery item deleted successfully' });
  } catch (error) {
    console.error('Error deleting gallery item:', error);
    res.status(500).json({ message: 'Server error deleting gallery item' });
  }
});

export default router;
