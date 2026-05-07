const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
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
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Product || mongoose.model('Product', ProductSchema);
