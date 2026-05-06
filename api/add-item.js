const connectDB = require('../lib/db');
const Product = require('../models/Product');

export default async function handler(req, res) {
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
    
    // The frontend might send data in different structures. 
    // We'll try to map common names to our model.
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
    res.status(201).json({ message: 'Product added successfully', product: newProduct });
  } catch (err) {
    console.error('Add item error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}
