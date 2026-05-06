import { connectDB } from '../lib/db.js';
import Cap from '../models/Cap.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });

  try {
    await connectDB();
    const caps = await Cap.find({}).sort({ createdAt: -1 });
    res.status(200).json(caps);
  } catch (err) {
    console.error('Fetch caps error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}
