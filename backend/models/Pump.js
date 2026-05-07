const mongoose = require('mongoose');

const PumpSchema = new mongoose.Schema({
    shape: { type: String, required: true },
    src: { type: String, required: true },
});

module.exports = mongoose.model('Pump', PumpSchema);
