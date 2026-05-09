const connectDB = require('../../lib/db');
const Product = require('../../models/Product');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });

  try {
    await connectDB();

    const { page = 1, limit = 20, searchName = '', searchCategory = '', sortByDate = 'desc' } = req.query || {};
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;

    // Build filter
    const filter = {};
    if (searchName) filter.name = { $regex: searchName, $options: 'i' };
    if (searchCategory) filter.category = { $regex: searchCategory, $options: 'i' };

    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limitNum);

    const products = await Product.find(filter)
      .sort({ createdAt: sortByDate === 'asc' ? 1 : -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    // Dashboard table expects: src (image), _name (name), category, value, status, _id
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
        id: p._id ? p._id.toString() : p.slug, // Make sure `id` is available
        _name: p.name,
        src: p.image || '',
        imageUrl: p.image || '',
        hoverImageUrl: p.hoverImage || p.image || '',
        value: p.filter || (p.specifications && typeof p.specifications === 'object' ? p.specifications.capacity : '') || '',
        status: 'Active',
      };
    });

    // Dashboard expects: res.data.data.products and res.data.data.pagination
    res.status(200).json({
      data: {
        products: mapped,
        pagination: {
          totalProducts,
          totalPages,
          currentPage: pageNum,
          limit: limitNum,
        }
      }
    });
  } catch (err) {
    console.error('Fetch products error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
