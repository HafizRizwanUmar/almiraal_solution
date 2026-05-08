const connectDB = require('../../lib/db');
const Product = require('../../models/Product');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'DELETE') return res.status(405).json({ message: 'Method not allowed' });

  try {
    await connectDB();
    const id = req.query.id;
    if (!id) return res.status(400).json({ success: false, message: 'Product ID required' });

    let deleted = null;
    const mongoose = require('mongoose');
    
    // First try by _id
    if (mongoose.Types.ObjectId.isValid(id)) {
      deleted = await Product.findByIdAndDelete(id);
    }
    
    // Fallback: try by custom string 'id' or 'slug' if it exists
    if (!deleted) {
      deleted = await Product.findOneAndDelete({ $or: [{ id: id }, { slug: id }] });
    }

    if (!deleted) return res.status(404).json({ success: false, message: 'Product not found' });

    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
