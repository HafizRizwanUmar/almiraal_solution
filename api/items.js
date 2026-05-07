const connectDB = require('../lib/db');
const Product = require('../models/Product');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDB();
    const { category } = req.query || {};
    const filter = {};
    if (category) filter.category = category;

    const products = await Product.find(filter).sort({ createdAt: -1 }).lean();

    // Map DB fields to what the frontend expects:
    // Products page uses: imageUrl, hoverImageUrl, name, _id
    const mapped = products.map(p => ({
      ...p,
      imageUrl: p.image || '',
      hoverImageUrl: p.hoverImage || p.image || '',
    }));

    res.status(200).json(mapped);
  } catch (err) {
    console.error('Fetch items error details:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
