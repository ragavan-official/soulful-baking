import express from 'express';
import MenuItem from '../models/MenuItem.js';
import { authenticateToken, requireAdminOrEmployee } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/menu
// @desc    Get all menu items (public)
router.get('/', async (req, res) => {
  try {
    const items = await MenuItem.find().sort({ createdAt: 1 });
    res.json(items);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ message: 'Server error fetching menu items' });
  }
});

// @route   POST /api/menu
// @route   POST /api/menu
// @desc    Create a new menu item (admin only)
router.post('/', authenticateToken, requireAdminOrEmployee, async (req, res) => {
  try {
    const { name, description, price, image, category, isAvailable, flavours, bases } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }
    if ((price === undefined || price === null || price === '') && (!flavours || flavours.length === 0) && (!bases || bases.length === 0)) {
      return res.status(400).json({ message: 'Price, flavours, or bases are required' });
    }

    const newItem = new MenuItem({
      name,
      description: description || '',
      price: price !== undefined && price !== null && price !== '' ? parseFloat(price) : 0,
      flavours: flavours || [],
      bases: bases || [],
      image: image || '',
      category: category || 'Specials',
      isAvailable: isAvailable !== undefined ? isAvailable : true
    });

    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({ message: 'Server error creating menu item' });
  }
});

// @route   PUT /api/menu/:id
// @desc    Update a menu item (admin only)
router.put('/:id', authenticateToken, requireAdminOrEmployee, async (req, res) => {
  try {
    const { name, description, price, image, category, isAvailable, flavours, bases } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }
    if ((price === undefined || price === null || price === '') && (!flavours || flavours.length === 0) && (!bases || bases.length === 0)) {
      return res.status(400).json({ message: 'Price, flavours, or bases are required' });
    }

    const updated = await MenuItem.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description: description || '',
        price: price !== undefined && price !== null && price !== '' ? parseFloat(price) : 0,
        flavours: flavours || [],
        bases: bases || [],
        image: image || '',
        category: category || 'Specials',
        isAvailable: isAvailable !== undefined ? isAvailable : true
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.json(updated);
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ message: 'Server error updating menu item' });
  }
});

// @route   DELETE /api/menu/:id
// @desc    Delete a menu item (admin only)
router.delete('/:id', authenticateToken, requireAdminOrEmployee, async (req, res) => {
  try {
    const deleted = await MenuItem.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ message: 'Server error deleting menu item' });
  }
});

export default router;
