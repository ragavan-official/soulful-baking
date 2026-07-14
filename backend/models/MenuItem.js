import mongoose from 'mongoose';

const flavourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  }
});

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  price: {
    type: Number,
    required: false,
    min: 0,
    default: 0
  },
  flavours: [flavourSchema],
  image: {
    type: String,  // R2 key (e.g. "photo/uuid.jpg") or legacy full URL
    default: ''
  },
  category: {
    type: String,
    trim: true,
    default: 'Specials'
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('MenuItem', menuItemSchema);
