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

    // Products page uses: imageUrl, hoverImageUrl, name, _id
    // Old Dashboard uses: src, _name, value, status
    const mapped = products.map(p => {
      let specStr = p.specifications;
      if (specStr === 'undefined' || specStr === 'null' || !specStr) {
        specStr = '[]';
      } else if (typeof specStr === 'object') {
        specStr = JSON.stringify(specStr);
      }
      
      return {
        ...p,
        specifications: specStr,
        imageUrl: p.image || '',
        hoverImageUrl: p.hoverImage || p.image || '',
        src: p.image || '',
        _name: p.name || '',
        value: p.filter || '',
        status: 'Active',
      };
    });

    res.status(200).json(mapped);
  } catch (err) {
    console.error('Fetch items error details:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
