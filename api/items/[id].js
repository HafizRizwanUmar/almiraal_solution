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

    // Get id from URL: /items/:id
    const id = req.query.id || (req.url && req.url.split('/').pop().split('?')[0]);

    if (!id) return res.status(400).json({ message: 'Product ID required' });

    let product;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(id).lean();
    } else {
      // It's a slug, e.g., "luxury-glass-perfume-bottle"
      // Convert slug back to search regex by replacing hyphens with wildcard matches
      const searchRegex = id.replace(/-/g, '.*');
      product = await Product.findOne({ name: { $regex: new RegExp(searchRegex, 'i') } }).lean();
    }

    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Map fields to what the frontend product detail page expects
    const mapped = {
      ...product,
      imageUrl: product.image || '',
      hoverImageUrl: product.hoverImage || product.image || '',
      pdfUrl: product.pdf || '',
      // specifications should be an array
      specifications: (() => {
        if (Array.isArray(product.specifications)) return product.specifications;
        if (typeof product.specifications === 'string') {
          try { return JSON.parse(product.specifications); } catch { return []; }
        }
        // Convert object format to array format
        if (product.specifications && typeof product.specifications === 'object') {
          return Object.entries(product.specifications)
            .filter(([, v]) => v)
            .map(([k, v]) => ({ name: k, value: v }));
        }
        return [];
      })(),
    };

    res.status(200).json(mapped);
  } catch (err) {
    console.error('Fetch product detail error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
