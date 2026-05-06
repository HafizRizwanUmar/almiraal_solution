import mongoose from 'mongoose';

const capSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  image: { type: String },
}, { timestamps: true });

export default mongoose.models.Cap || mongoose.model('Cap', capSchema);
