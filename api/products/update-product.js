const connectDB = require('../../lib/db');
const Product = require('../../models/Product');
const { uploadBase64 } = require('../../lib/cloudinary');

/**
 * Save a base64 data URL to Cloudinary and return the secure URL.
 */
async function saveBase64Image(base64DataUrl) {
  if (!base64DataUrl || !base64DataUrl.startsWith('data:')) return null;
  try {
    const result = await uploadBase64(base64DataUrl, { folder: 'items' });
    return result.secure_url;
  } catch (e) {
    console.error('Failed to save base64 image to Cloudinary:', e);
    return null;
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'PUT') return res.status(405).json({ message: 'Method not allowed' });

  try {
    await connectDB();

    const id = req.query.id;
    if (!id) return res.status(400).json({ success: false, message: 'Product ID required' });

    let body = req.body || {};
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
            const { parseMultipart } = require('../../lib/multipart');
            const { fields } = parseMultipart(buffer, boundary);
            body = fields;
            console.log('Manually parsed multipart body');
          }
        } else {
          const rawBody = buffer.toString().trim();
          if (rawBody && (rawBody.startsWith('{') || rawBody.startsWith('['))) {
            body = JSON.parse(rawBody);
          }
        }
      } catch (parseErr) {
        console.error('Manual parse failed:', parseErr.message);
      }
    }
    console.log('Update product body fields:', Object.keys(body));

    // Build update object from form fields
    const updateData = {};

    if (body.name) updateData.name = body.name;
    if (body.category) updateData.category = body.category;
    if (body.filter) updateData.filter = body.filter;
    if (body.page) updateData.page = body.page;
    if (body.description) updateData.description = body.description;
    if (body.value) updateData.value = body.value;
    if (body.status) updateData.status = body.status;

    // Parse specifications
    if (body.specifications) {
      try {
        updateData.specifications = JSON.parse(body.specifications);
      } catch {
        updateData.specifications = body.specifications;
      }
    }

    // Handle image: `src` field is sent as base64 data URL OR as a saved path from binary upload
    const srcField = body.src || body.image;
    if (srcField && srcField !== 'null' && srcField !== 'undefined') {
      let imagePath = null;

      if (srcField.startsWith('data:')) {
        // Base64 data URL — save to file
        imagePath = await saveBase64Image(srcField);
        console.log('Saved base64 image:', imagePath);
      } else if (srcField.startsWith('/')) {
        // Already a path (uploaded binary file or existing path)
        imagePath = srcField;
      }

      if (imagePath) {
        updateData.image = imagePath;
        updateData.hoverImage = body.hoverImage || imagePath;
      }
    }

    const updated = await Product.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, lean: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: 'Product not found' });

    // Return product with mapped fields for the dashboard
    const mapped = {
      ...updated,
      _name: updated.name,
      src: updated.image || '',
      imageUrl: updated.image || '',
      hoverImageUrl: updated.hoverImage || updated.image || '',
      value: updated.filter || '',
      status: 'Active',
    };

    console.log('Product updated:', updated._id, updated.name);
    res.status(200).json({ success: true, product: mapped });
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
