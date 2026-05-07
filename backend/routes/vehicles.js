const express = require('express');
const Vehicle = require('../models/Vehicle');

const router = express.Router();

// Add Vehicle
router.post('/add-vehicle', async (req, res) => {
    const { make, model, year, type, location, price, description,crfCoins, imageUrl } = req.body;
    

    try {
        const vehicle = new Vehicle({ make, model, year, crfCoins, location, price, description, imageUrl });
        await vehicle.save();
        res.status(201).json({ message: 'Vehicle added successfully' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get All Vehicles
router.get('/get-vehicle', async (req, res) => {
    const { location } = req.query; 
    console.log(req.query)
    try {  
        const query = location ? { location: new RegExp(location, 'i') } : {}; 
        const vehicles = await Vehicle.find(query);
        res.json(vehicles);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


module.exports = router;
