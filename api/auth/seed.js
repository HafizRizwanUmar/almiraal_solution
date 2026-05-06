import { connectDB } from '../../lib/db.js';
import User from '../../models/User.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  console.log('Seed request received');

  const { secret } = req.query;
  if (!process.env.SEED_SECRET) {
    console.error('SEED_SECRET is not configured');
    return res.status(500).json({ message: 'Server configuration error' });
  }

  if (secret !== process.env.SEED_SECRET) {
    console.log('Seed forbidden: Invalid secret');
    return res.status(403).json({ message: 'Forbidden' });
  }

  try {
    await connectDB();

    const existing = await User.findOne({ role: 'admin' });
    if (existing) {
      console.log('Admin already exists:', existing.email);
      return res.status(200).json({ message: 'Admin already exists', email: existing.email });
    }

    const { email, password } = req.body || {};
    const admin = await User.create({
      email: email || 'admin@almiraal.com',
      password: password || 'Admin@123',
      name: 'Admin',
      role: 'admin',
    });

    console.log('Admin created successfully:', admin.email);
    res.status(201).json({ message: 'Admin created', email: admin.email });
  } catch (err) {
    console.error('Seed error details:', err);
    res.status(500).json({ message: err.message });
  }
}
