const mongoose = require('mongoose');
const fs = require('fs');

// Load .env
if (fs.existsSync('.env')) {
  fs.readFileSync('.env', 'utf8').split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length) process.env[key.trim()] = val.join('=').trim();
  });
}

const ProductSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

// Map category -> available local images (relative paths served by frontend)
const categoryImages = {
  'PerfumeBottles': [
    '/perfumepackging/Group1b.png',
    '/bottle/1.png',
    '/bottle/2.png',
    '/bottle/3.png',
  ],
  'SerumBottles': [
    '/SerumBottles/serum-bottle-1.png',
    '/SerumBottles/serum-bottle-2.png',
    '/SerumBottles/serum-bottle-3.png',
    '/SerumBottles/serum-bottle-4.png',
  ],
  'CreamJars': [
    '/CreamJars/cream-jars-1.png',
    '/CreamJars/cream-jars-2.png',
    '/CreamJars/cream-jars-3.png',
    '/CreamJars/cream-jars-4.png',
  ],
  'DiffuserBottles': [
    '/DiffuserBottles/diffuserbottles-1.png',
    '/DiffuserBottles/diffuserbottles-2.png',
    '/DiffuserBottles/diffuserbottles-3.png',
    '/DiffuserBottles/diffuserbottles-4.png',
  ],
  'Caps': [
    '/PerfumeCaps/perfumecaps-1.png',
    '/PerfumeCaps/perfumecaps-2.png',
    '/PerfumeCaps/perfumecaps-3.png',
  ],
  'Pumps': [
    '/PumpsandCollars/pumpsandcollars-1.png',
    '/PumpsandCollars/pumpsandcollars-2.png',
  ],
};

let imageCounters = {};

function getNextImage(category) {
  const imgs = categoryImages[category] || ['/perfumepackging/Group1b.png'];
  if (!imageCounters[category]) imageCounters[category] = 0;
  const img = imgs[imageCounters[category] % imgs.length];
  imageCounters[category]++;
  return img;
}

async function fix() {
  await mongoose.connect(process.env.MONGO_URI);
  const products = await Product.find({});
  console.log(`Found ${products.length} products`);
  
  let fixed = 0;
  for (const p of products) {
    const isPlaceholder = !p.image || 
      p.image.includes('placeholder') || 
      p.image.includes('via.placeholder');
    
    if (isPlaceholder) {
      const img = getNextImage(p.category);
      await Product.updateOne({ _id: p._id }, { 
        $set: { 
          image: img,
          hoverImage: img,
        } 
      });
      console.log(`Updated ${p.name} (${p.category}) -> ${img}`);
      fixed++;
    } else {
      console.log(`Skipped ${p.name} - already has image: ${p.image}`);
    }
  }
  
  console.log(`\nFixed images for ${fixed} products.`);
  process.exit(0);
}

fix().catch(e => { console.error(e); process.exit(1); });
