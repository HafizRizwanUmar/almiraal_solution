const mongoose = require('mongoose');

const CapSchema = new mongoose.Schema({
    material: { type: String, required: true },
    src: { type: String, required: true },
    color: { type: String, required: true },
    name: { type: String, required: true },
});

module.exports = mongoose.model('Cap', CapSchema);
