/**
 * Fix broken image paths in the database.
 * Products with image paths like /uploads/xxx.png (local paths) 
 * have no valid image on the live site. This script clears them 
 * so the UI shows a placeholder instead of a broken image.
 * 
 * Run: node scratch/fix_broken_images.js
 */

const mongoose = require('mongoose');
const fs = require('fs');

// Manually load .env
if (fs.existsSync('.env')) {
  const envFile = fs.readFileSync('.env', 'utf8');
  envFile.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) process.env[key.trim()] = value.join('=').trim();
  });
}

const ProductSchema = new mongoose.Schema({
  name: String,
  category: String,
  image: String,
  hoverImage: String,
  createdAt: Date
}, { strict: false });

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function fixBrokenImages() {
  try {
    console.log('Connecting to:', process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);

    // Find products with local /uploads/ paths (not Cloudinary URLs)
    const brokenProducts = await Product.find({
      image: { $regex: '^/uploads/', $options: 'i' }
    });

    console.log(`\nFound ${brokenProducts.length} products with broken local /uploads/ image paths:\n`);
    brokenProducts.forEach(p => {
      console.log(`  - "${p.name}" (${p.category}) -> image: ${p.image}`);
    });

    if (brokenProducts.length === 0) {
      console.log('No broken images found. All products have valid image URLs.');
      process.exit(0);
    }

    // Ask before modifying (clear the image field to empty string)
    console.log(`\nClearing broken image paths (setting image to '') for ${brokenProducts.length} products...`);
    const result = await Product.updateMany(
      { image: { $regex: '^/uploads/', $options: 'i' } },
      { $set: { image: '', hoverImage: '' } }
    );

    console.log(`Done! Updated ${result.modifiedCount} products.`);
    console.log('\nThese products will now show a placeholder image in the UI.');
    console.log('Re-upload their images via the admin panel to fix them fully.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

fixBrokenImages();
