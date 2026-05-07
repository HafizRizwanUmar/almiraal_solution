const mongoose = require('mongoose');
const fs = require('fs');

// Load .env
if (fs.existsSync('.env')) {
  fs.readFileSync('.env', 'utf8').split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length) process.env[key.trim()] = val.join('=').trim();
  });
}

const ProductSchema = new mongoose.Schema({
  name: String,
  category: String,
  image: String,
  hoverImage: String,
  filter: String,
  page: String
}, { strict: false });

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function fix() {
  await mongoose.connect(process.env.MONGO_URI);
  const products = await Product.find({});
  console.log(`Found ${products.length} products`);
  
  let fixed = 0;
  for (const p of products) {
    let changed = false;
    
    // Fix missing page field
    if (!p.page) {
      p.page = 'product';
      changed = true;
    }
    // Fix missing image
    if (!p.image || p.image === null) {
      p.image = 'https://via.placeholder.com/300?text=No+Image';
      changed = true;
    }
    // Fix missing hoverImage
    if (!p.hoverImage || p.hoverImage === 'null') {
      p.hoverImage = p.image;
      changed = true;
    }
    // Fix missing filter
    if (!p.filter || p.filter === 'null') {
      p.filter = 'all';
      changed = true;
    }
    
    if (changed) {
      await Product.updateOne({ _id: p._id }, { 
        $set: { 
          page: p.page, 
          image: p.image, 
          hoverImage: p.hoverImage, 
          filter: p.filter 
        } 
      });
      console.log(`Fixed: ${p.name} (page=${p.page}, image=${!!p.image})`);
      fixed++;
    }
  }
  
  console.log(`\nFixed ${fixed} products. Done.`);
  
  // Verify
  const after = await Product.find({ page: 'product' });
  console.log(`Products with page='product': ${after.length}`);
  
  process.exit(0);
}

fix().catch(e => { console.error(e); process.exit(1); });
