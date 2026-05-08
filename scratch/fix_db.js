const fs = require('fs');
const path = require('path');
if (fs.existsSync(path.join(__dirname, '../.env'))) {
  const envFile = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
  envFile.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) process.env[key.trim()] = value.join('=').trim();
  });
}
const connectDB = require('../lib/db');
const Product = require('../models/Product');
const Blog = require('../models/Blog');

async function run() {
  await connectDB();

  // 1. Fix missing or duplicate slugs
  const products = await Product.find({});
  let updatedCount = 0;
  for (const product of products) {
    if (!product.slug || product.slug === 'undefined' || product.slug === 'null') {
      const baseSlug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      product.slug = baseSlug + '-' + Math.random().toString(36).substring(2, 7);
      await product.save();
      updatedCount++;
    }
  }
  console.log(`Updated ${updatedCount} products with missing slugs.`);

  // 2. Add 3 useful blogs
  // Define source paths from the Antigravity output
  const sourceImages = [
    {
      src: 'C:\\Users\\abc\\.gemini\\antigravity\\brain\\22321b9e-f483-44b1-8fba-eab33e624bd2\\blog_perfume_trends_1778192978906.png',
      dest: 'blog_trends.png',
      title: 'Top Perfume Packaging Trends in 2026',
      content: '<p>The luxury packaging industry is seeing a shift towards minimalist, glass-heavy designs with subtle metallic accents. Consumers are gravitating towards packaging that feels both premium and timeless.</p>'
    },
    {
      src: 'C:\\Users\\abc\\.gemini\\antigravity\\brain\\22321b9e-f483-44b1-8fba-eab33e624bd2\\blog_sustainable_packaging_1778193019462.png',
      dest: 'blog_sustainable.png',
      title: 'Sustainable Packaging Solutions',
      content: '<p>Eco-friendly materials are no longer just a trend, they are an industry standard. We explore how sustainable glass and recyclable wood caps are revolutionizing cosmetic and perfume packaging.</p>'
    },
    {
      src: 'C:\\Users\\abc\\.gemini\\antigravity\\brain\\22321b9e-f483-44b1-8fba-eab33e624bd2\\blog_private_label_1778193064208.png',
      dest: 'blog_private_label.png',
      title: 'The Rise of Private Label Brands',
      content: '<p>Starting your own perfume brand has never been easier. Learn how our ready-to-brand blank bottles and custom decoration services can help launch your private label to success.</p>'
    }
  ];

  const uploadsDir = path.join(__dirname, '../frontend/public_html/uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  let blogsAdded = 0;
  for (const item of sourceImages) {
    if (fs.existsSync(item.src)) {
      const destPath = path.join(uploadsDir, item.dest);
      fs.copyFileSync(item.src, destPath);
      const imageUrl = `/uploads/${item.dest}`;

      // Insert blog if it doesn't exist
      const existing = await Blog.findOne({ title: item.title });
      if (!existing) {
        await Blog.create({
          title: item.title,
          content: item.content,
          image: imageUrl,
          author: 'Al Miraal Team'
        });
        blogsAdded++;
      }
    } else {
      console.log('Source image not found:', item.src);
    }
  }

  console.log(`Added ${blogsAdded} new blogs.`);
  process.exit(0);
}

run().catch(console.error);
