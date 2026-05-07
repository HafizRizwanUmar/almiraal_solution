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
  filter: String
}, { strict: false });

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

const categoryMapping = {
  'serum-bottle': 'SerumBottles',
  'perfume-bottle': 'PerfumeBottles',
  'cream-jar': 'CreamJars',
  'diffuser-bottle': 'DiffuserBottles',
  'testers-bottle': 'TestersBottle',
  'pumps-and-collars': 'PumpsandCollars',
  'Serum Bottles': 'SerumBottles',
  'Perfume Bottles': 'PerfumeBottles',
  'Cream Jars': 'CreamJars',
  'Diffusers': 'DiffuserBottles'
};

async function fixProducts() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    
    const products = await Product.find({});
    console.log(`Found ${products.length} products to check.`);
    
    for (const p of products) {
      let updated = false;
      
      // Fix category
      if (categoryMapping[p.category]) {
        console.log(`Updating category for ${p.name}: ${p.category} -> ${categoryMapping[p.category]}`);
        p.category = categoryMapping[p.category];
        updated = true;
      }
      
      // Fix missing image
      if (!p.image) {
        console.log(`Adding default image for ${p.name}`);
        p.image = 'https://via.placeholder.com/300?text=No+Image';
        updated = true;
      }
      
      if (!p.hoverImage) {
        p.hoverImage = p.image;
        updated = true;
      }

      if (!p.filter) {
        p.filter = 'all';
        updated = true;
      }
      
      if (updated) {
        await p.save();
      }
    }
    
    console.log('Finished fixing products.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixProducts();
