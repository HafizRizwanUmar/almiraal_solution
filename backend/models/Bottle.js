const mongoose = require('mongoose');

const BottleSchema = new mongoose.Schema({
    status: { type: String, required: true },
    src: { type: String, required: true },
    shape: { type: String, required: true },
    size: { type: String, required: true },
    
});

module.exports = mongoose.model('Bottle', BottleSchema);
