const mongoose = require('mongoose');
const fs = require('fs');

// Load .env
if (fs.existsSync('.env')) {
  const envFile = fs.readFileSync('.env', 'utf8');
  envFile.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) process.env[key.trim()] = value.join('=').trim();
  });
}

const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({
  name: String,
  category: String,
  image: String,
  description: String,
  createdAt: { type: Date, default: Date.now }
}, { strict: false }));

const sampleProducts = [
  { name: 'Luxury Glass Perfume Bottle', category: 'PerfumeBottles', image: 'https://via.placeholder.com/300?text=Perfume+Bottle', description: 'Elegant glass bottle for premium fragrances.' },
  { name: 'Frosted Cream Jar', category: 'Cream Jars', image: 'https://via.placeholder.com/300?text=Cream+Jar', description: 'Perfect for luxury skin creams.' },
  { name: 'Gold Serum Bottle', category: 'Serum Bottles', image: 'https://via.placeholder.com/300?text=Serum+Bottle', description: 'High-end dropper bottle for serums.' },
  { name: 'Classic Reed Diffuser', category: 'Diffusers', image: 'https://via.placeholder.com/300?text=Diffuser', description: 'Stylish home fragrance diffuser.' }
];

async function resetAndSeed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    
    await Product.deleteMany({});
    console.log('Cleared existing products.');
    
    await Product.insertMany(sampleProducts);
    console.log('Added 4 high-quality sample products.');
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

resetAndSeed();
