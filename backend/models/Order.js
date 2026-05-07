// models/Order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, 
    amount: { type: Number, required: true }, 
    createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order4', orderSchema);
module.exports = Order;
