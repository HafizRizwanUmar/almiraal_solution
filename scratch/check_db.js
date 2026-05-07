const mongoose = require('mongoose');
const path = require('path');
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
  createdAt: Date
}, { strict: false });

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function checkDB() {
  try {
    console.log('Connecting to:', process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);
    const count = await Product.countDocuments();
    console.log(`Total products in DB: ${count}`);
    
    const products = await Product.find().limit(5).sort({ createdAt: -1 });
    products.forEach(p => {
      console.log(`- ${p.name} (${p.category}) | Image: ${p.image ? 'Yes' : 'No'}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkDB();
