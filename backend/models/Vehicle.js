const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema({
    make: { type: String, required: true }, 
    model: { type: String, required: true }, 
    year: { type: Number, required: true }, 
    location: { type: String, required: true },
    crfCoins: { type: Number, required: true },
    price: { type: Number, required: true }, 
    description: { type: String }, 
    imageUrl: { type: String }, 
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', VehicleSchema);
