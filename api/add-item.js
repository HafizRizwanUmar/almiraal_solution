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
    
    if (!req.body) {
      console.error('Request body is missing');
      return res.status(400).json({ message: 'Request body is required' });
    }

    const { 
      name, 
      productName, 
      category, 
      filter, 
      description, 
      brimfulCapacity, 
      capacity, 
      weight, 
      height, 
      width, 
      depth, 
      image, 
      hoverImage, 
      pdf 
    } = req.body;

    if (!name && !productName) {
      return res.status(400).json({ message: 'Product name is required' });
    }

    if (!category) {
      return res.status(400).json({ message: 'Category is required' });
    }

    const newProduct = new Product({
      name: name || productName,
      category,
      filter,
      description,
      specifications: {
        brimfulCapacity,
        capacity,
        weight,
        height,
        width,
        depth
      },
      image,
      hoverImage,
      pdf
    });

    await newProduct.save();
    console.log('Product added successfully:', newProduct._id);
    res.status(201).json({ message: 'Product added successfully', product: newProduct });
  } catch (err) {
    console.error('Add item error details:', err);
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message,
      details: err.errors // Include Mongoose validation errors if any
    });
  }
};
