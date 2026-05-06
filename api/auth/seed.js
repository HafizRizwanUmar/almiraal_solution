import { connectDB } from '../../lib/db.js';
import User from '../../models/User.js';

// One-time seed: creates an admin user if none exists
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Protect with a secret key so random people can't call this
  const { secret } = req.query;
  if (secret !== process.env.SEED_SECRET) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  try {
    await connectDB();

    const existing = await User.findOne({ role: 'admin' });
    if (existing) {
      return res.status(200).json({ message: 'Admin already exists', email: existing.email });
    }

    const admin = await User.create({
      email: req.body?.email || 'admin@almiraal.com',
      password: req.body?.password || 'Admin@123',
      name: 'Admin',
      role: 'admin',
    });

    res.status(201).json({ message: 'Admin created', email: admin.email });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
