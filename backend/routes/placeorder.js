const express = require('express');
const User = require('../models/User'); // Adjust the path according to your project structure
const Order = require('../models/Order'); // The Order model you created
const router = express.Router();

router.post('/place-order', async (req, res) => {
    const { userId, productId, amount } = req.body;

    try {
        // Find the user and check if they have enough CRF coins
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.walletBalance < amount) {
            return res.status(400).json({ message: 'Insufficient CRF coins' });
        }

        // Deduct the amount from the user's wallet balance
        user.walletBalance -= amount;
        await user.save();

        // Create the order
        const order = new Order({ userId, productId, amount });
        await order.save();

        res.status(201).json({ message: 'Order placed successfully', order });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
