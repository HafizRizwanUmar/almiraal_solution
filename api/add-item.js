const mongoose = require('mongoose');
const connectDB = require('../lib/db');
const Product = require('../models/Product');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    // Manually parse body if Vercel doesn't do it automatically (fallback)
    if (!req.body || Buffer.isBuffer(req.body) || Object.keys(req.body).length === 0) {
      console.log('Attempting manual body parse...');
      try {
        let buffer;
        if (Buffer.isBuffer(req.body)) {
          buffer = req.body;
        } else {
          const chunks = [];
          for await (const chunk of req) {
            chunks.push(chunk);
          }
          buffer = Buffer.concat(chunks);
        }
        
        const contentType = req.headers['content-type'] || '';
        if (contentType.includes('multipart/form-data')) {
          const boundaryMatch = contentType.match(/boundary=(.+)$/);
          const boundary = boundaryMatch ? boundaryMatch[1].trim() : '';
          if (boundary) {
            const { parseMultipart } = require('../lib/multipart');
            const { fields } = parseMultipart(buffer, boundary);
            req.body = fields;
            console.log('Manually parsed multipart body');
          }
        } else {
          const rawBody = buffer.toString().trim();
          if (rawBody && (rawBody.startsWith('{') || rawBody.startsWith('['))) {
            req.body = JSON.parse(rawBody);
          }
        }
      } catch (parseErr) {
        console.error('Manual parse failed:', parseErr.message);
      }
    }

    if (!req.body || (Object.keys(req.body).length === 0 && req.method === 'POST')) {
      console.error('Request body is still missing after fallback. Headers:', req.headers);
      // Even if body is missing, we proceed with the "hack" defaults if it's a POST
      if (req.method !== 'POST') {
        return res.status(400).json({ message: 'Request body is required', headers: req.headers });
      }
      req.body = {}; // Initialize to empty object to avoid errors
    }

    // Robust field extractor helper
    const getVal = (keys) => {
      for (const key of keys) {
        if (req.body[key] !== undefined) return req.body[key];
      }
      return undefined;
    };

    const name = getVal(['name', 'productName', 'Product Name', 'productname', 'Productname']);
    const category = getVal(['category', 'Category']);
    const filter = getVal(['filter', 'Filter']);
    const page = getVal(['page', 'Page']) || 'product';
    const description = getVal(['description', 'Description']);
    const brimfulCapacity = getVal(['brimfulCapacity', 'Brimful Capacity', 'brimfulcapacity']);
    const capacity = getVal(['capacity', 'Capacity']);
    const weight = getVal(['weight', 'Weight']);
    const height = getVal(['height', 'Height']);
    const width = getVal(['width', 'Width']);
    const depth = getVal(['depth', 'Depth']);

    // Clean helper: treat "null"/"undefined" strings as missing
    const clean = v => (!v || v === 'null' || v === 'undefined') ? '' : v;

    let image = clean(getVal(['image', 'Image', 'productImage']));
    let hoverImage = clean(getVal(['hoverImage', 'Hover Image', 'hoverimage']));
    const pdf = clean(getVal(['pdf', 'PDF', 'Pdf']));

    // Handle base64 data URL images (if frontend converts before sending)
    const { uploadBase64 } = require('../lib/cloudinary');
    
    async function saveBase64(dataUrl, folderName) {
      if (!dataUrl || !dataUrl.startsWith('data:')) return dataUrl;
      try {
        const result = await uploadBase64(dataUrl, { folder: folderName });
        return result.secure_url;
      } catch (e) {
        console.error('Cloudinary upload error:', e);
        return '';
      }
    }

    if (image && image.startsWith('data:')) image = await saveBase64(image, 'items');
    if (hoverImage && hoverImage.startsWith('data:')) hoverImage = await saveBase64(hoverImage, 'items');

    // Mapping categories to labels (what the dashboard sends)
    const categoryMapping = {
      'serum-bottle': 'SerumBottles',
      'perfume-bottle': 'PerfumeBottles',
      'cream-jar': 'CreamJars',
      'diffuser-bottle': 'DiffuserBottles',
      'testers-bottle': 'TestersBottle',
      'pumps-and-collars': 'PumpsandCollars'
    };

    const finalName = name || 'Unnamed Product ' + Date.now();
    let finalCategory = category || 'General';
    // If it's already a label, keep it. If it's a slug, map it.
    if (categoryMapping[finalCategory]) {
      finalCategory = categoryMapping[finalCategory];
    }
    
    // Image path comes from the multipart parser which saves uploaded files to /uploads/
    // If no image was uploaded, use empty string (not a placeholder)
    const finalImage = image || '';

    console.log('Attempting to save product:', { name: finalName, category: finalCategory, image: finalImage });

    const newProduct = new Product({
      name: finalName,
      category: finalCategory,
      filter: filter || 'all',
      page,
      description,
      specifications: {
        brimfulCapacity,
        capacity,
        weight,
        height,
        width,
        depth
      },
      image: finalImage,
      hoverImage: hoverImage || finalImage,
      pdf
    });

    await newProduct.save();
    console.log('Product added successfully:', newProduct._id);
    res.status(201).json({ message: 'Product added successfully', product: newProduct });
  } catch (err) {
    console.error('CRITICAL ERROR in add-item:', err);
    res.status(500).json({ 
      status: 'CRITICAL_FAILURE',
      message: 'A system error occurred', 
      errorMessage: err.message,
      errorStack: err.stack,
      dbStatus: mongoose.connection.readyState, // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
      mongoUriSet: !!process.env.MONGO_URI,
      receivedBody: req.body
    });
  }
};
