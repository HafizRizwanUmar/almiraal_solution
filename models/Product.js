const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  category: { type: String, required: true },
  filter: { type: String },
  page: { type: String, default: 'product' },
  description: { type: String },
  specifications: {
    brimfulCapacity: { type: String },
    capacity: { type: String },
    weight: { type: String },
    height: { type: String },
    width: { type: String },
    depth: { type: String }
  },
  image: { type: String },
  hoverImage: { type: String },
  pdf: { type: String },
  
  // Dashboard fields
  src: { type: String },
  _name: { type: String },
  status: { type: String, default: 'Active' },
  value: { type: Number, default: 0 },
  id: { type: String },
  method: { type: String, default: null },
  shape: { type: String, default: null },
  type: { type: String, default: null },
  material: { type: String, default: null },
  color: { type: String, default: null },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Product || mongoose.model('Product', ProductSchema);
