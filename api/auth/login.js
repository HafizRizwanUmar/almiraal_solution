import jwt from 'jsonwebtoken';
import { connectDB } from '../../lib/db.js';
import User from '../../models/User.js';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  console.log('Login attempt received');

  try {
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is missing');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    await connectDB();
    
    const { email, password } = req.body || {};
    console.log('Attempting login for:', email);

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      console.log('Invalid password for:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('Login successful for:', email);

    res.status(200).json({
      token,
      user: { id: user._id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error('Login error details:', err);
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
    });
  }
}
