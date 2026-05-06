const connectDB = require('../../lib/db');
const User = require('../../models/User');
const Product = require('../../models/Product');
const Blog = require('../../models/Blog');
const Cap = require('../../models/Cap');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  console.log('Seed request received');

  const { secret } = req.query;
  if (!process.env.SEED_SECRET) {
    console.error('SEED_SECRET is not configured');
    return res.status(500).json({ message: 'Server configuration error' });
  }

  if (secret !== process.env.SEED_SECRET) {
    console.log('Seed forbidden: Invalid secret');
    return res.status(403).json({ message: 'Forbidden' });
  }

  try {
    await connectDB();

    // 1. Seed Admin
    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      const { email, password } = req.body || {};
      admin = await User.create({
        email: email || 'admin@almiraal.com',
        password: password || 'Admin@123',
        name: 'Admin',
        role: 'admin',
      });
      console.log('Admin created');
    }

    // 2. Seed Sample Product if none exist
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      await Product.create({
        name: 'Sample Product',
        description: 'First sample product from backend',
        price: 99.99,
        category: 'Sample',
        images: ['https://via.placeholder.com/150'],
        stock: 10
      });
      console.log('Sample product created');
    }

    // 3. Seed Sample Blog if none exist
    const blogCount = await Blog.countDocuments();
    if (blogCount === 0) {
      await Blog.create({
        title: 'Welcome to Almiraal',
        content: 'This is your first blog post from the new backend.',
        author: 'Admin',
        image: 'https://via.placeholder.com/300'
      });
      console.log('Sample blog created');
    }

    // 4. Seed Sample Cap if none exist
    const capCount = await Cap.countDocuments();
    if (capCount === 0) {
      await Cap.create({
        name: 'Sample Cap',
        description: 'First sample cap from backend',
        image: 'https://via.placeholder.com/150'
      });
      console.log('Sample cap created');
    }

    res.status(201).json({ 
      message: 'Database seeded successfully', 
      admin: admin.email,
      products: productCount === 0 ? 1 : productCount,
      blogs: blogCount === 0 ? 1 : blogCount,
      caps: capCount === 0 ? 1 : capCount
    });
  } catch (err) {
    console.error('Seed error details:', err);
    res.status(500).json({ message: err.message });
  }
};
