const connectDB = require('../lib/db');
const Blog = require('../models/Blog');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDB();
    
    if (req.method === 'POST') {
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
            const { parseMultipart } = require('../lib/multipart');
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

      let imageUrl = null;
      if (body.image && body.image.startsWith('data:')) {
        const { uploadBase64 } = require('../lib/cloudinary');
        const uploadResult = await uploadBase64(body.image, { folder: 'blogs' });
        imageUrl = uploadResult.secure_url;
      } else if (body.image && body.image.startsWith('/')) {
        imageUrl = body.image;
      }

      // Generate a simple slug
      const slug = body.title ? body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : '';
      
      const newBlog = await Blog.create({
        title: body.title,
        content: body.content,
        author: body.author || 'Admin',
        slug: slug,
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription,
        image: imageUrl
      });

      return res.status(201).json({ success: true, blog: { ...newBlog.toObject(), slug: newBlog.slug || newBlog._id.toString(), imageUrl: newBlog.image || '' } });
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const blogs = await Blog.find({}).sort({ createdAt: -1 }).lean();
    
    // Map fields for frontend
    const mappedBlogs = blogs.map(blog => ({
      ...blog,
      slug: blog.slug || blog._id.toString(),
      imageUrl: blog.image || ''
    }));
    
    res.status(200).json(mappedBlogs);
  } catch (err) {
    console.error('Fetch blogs error details:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
