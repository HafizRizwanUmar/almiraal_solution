const connectDB = require('../lib/db');
const Cap = require('../models/Cap');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDB();
    const caps = await Cap.find({}).sort({ createdAt: -1 });
    res.status(200).json(caps);
  } catch (err) {
    console.error('Fetch caps error details:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
