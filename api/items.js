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
    const products = await Product.find({}).sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (err) {
    console.error('Fetch items error details:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
