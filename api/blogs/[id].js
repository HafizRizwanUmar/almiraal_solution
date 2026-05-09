const connectDB = require('../../lib/db');
const Blog = require('../../models/Blog');
const mongoose = require('mongoose');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDB();
    
    // Get id from URL: /api/blogs/:id
    req.query = req.query || {};
    if (!req.query.id) {
      req.query.id = req.url && req.url.split('/').pop().split('?')[0];
    }
    
    const id = req.query.id;
    if (!id) return res.status(400).json({ message: 'Blog ID/Slug required' });

    if (req.method === 'GET') {
      let blog = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        blog = await Blog.findById(id).lean();
      }
      if (!blog) {
        blog = await Blog.findOne({ slug: id }).lean();
      }
      if (!blog) {
        return res.status(404).json({ message: 'Blog not found' });
      }
      return res.status(200).json({
        ...blog,
        slug: blog.slug || blog._id.toString(),
        imageUrl: blog.image || ''
      });
    }

    if (req.method === 'DELETE') {
      let deleted = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        deleted = await Blog.findByIdAndDelete(id);
      }
      if (!deleted) {
        deleted = await Blog.findOneAndDelete({ slug: id });
      }
      if (!deleted) return res.status(404).json({ success: false, message: 'Blog not found' });
      return res.status(200).json({ success: true, message: 'Blog deleted successfully' });
    }

    if (req.method === 'PUT') {
      let body = req.body || {};
      
      // Handle manual multipart parsing for Vercel Serverless
      if (!req.body || Buffer.isBuffer(req.body) || Object.keys(req.body).length === 0) {
        let buffer;
        if (Buffer.isBuffer(req.body)) {
          buffer = req.body;
        } else {
          const chunks = [];
          for await (const chunk of req) { chunks.push(chunk); }
          buffer = Buffer.concat(chunks);
        }
        
        const contentType = req.headers['content-type'] || '';
        if (contentType.includes('multipart/form-data')) {
          const boundaryMatch = contentType.match(/boundary=(.+)$/);
          const boundary = boundaryMatch ? boundaryMatch[1].trim() : '';
          if (boundary) {
            const { parseMultipart } = require('../../lib/multipart');
            const { fields, files } = parseMultipart(buffer, boundary);
            body = fields || {};
            if (files && files.image && files.image.data.length > 0) {
              body.image = `data:${files.image.contentType};base64,${files.image.data.toString('base64')}`;
            }
          }
        } else {
          const raw = buffer.toString().trim();
          if (raw && (raw.startsWith('{') || raw.startsWith('['))) body = JSON.parse(raw);
        }
      }

      let blogToUpdate = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        blogToUpdate = await Blog.findById(id);
      }
      if (!blogToUpdate) {
        blogToUpdate = await Blog.findOne({ slug: id });
      }
      if (!blogToUpdate) return res.status(404).json({ success: false, message: 'Blog not found' });

      if (body.title) blogToUpdate.title = body.title;
      if (body.content) blogToUpdate.content = body.content;
      if (body.author) blogToUpdate.author = body.author;
      if (body.metaTitle) blogToUpdate.metaTitle = body.metaTitle;
      if (body.metaDescription) blogToUpdate.metaDescription = body.metaDescription;

      if (body.image && body.image.startsWith('data:')) {
        const { uploadBase64 } = require('../../lib/cloudinary');
        const uploadResult = await uploadBase64(body.image, { folder: 'blogs' });
        blogToUpdate.image = uploadResult.secure_url;
      } else if (body.image && body.image.startsWith('/')) {
        blogToUpdate.image = body.image;
      }

      if (body.title) {
        blogToUpdate.slug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      }

      await blogToUpdate.save();

      return res.status(200).json({ success: true, blog: { ...blogToUpdate.toObject(), slug: blogToUpdate.slug || blogToUpdate._id.toString(), imageUrl: blogToUpdate.image || '' } });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (err) {
    console.error('Blog action error details:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
