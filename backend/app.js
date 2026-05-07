const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors'); // Import CORS
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/product');
const vehicleRoutes = require('./routes/vehicles');
const placeOrder = require('./routes/placeorder');
const cloudinary=require("cloudinary")
const fileupload=require("express-fileupload")

dotenv.config();

const app = express();
app.use(express.json());




// Enable CORS
app.use(cors({
    origin: '*', // Allows all origins; replace '*' with specific domains if needed
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'] // Allowed headers
}));



app.use(fileupload({
    useTempFiles: true,
    tempFileDir: "/tmp/"
}))


          
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET, 
});


// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error(err));



// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/order', placeOrder);


// Define Item schema and model
const ItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    filter: { type: String, required: true },
    description: { type: String, default: '' },
    pdfUrl: { type: String, required: true },
    page: { type: String, default: '' },
    specifications: { type: String, required: true },
    imageUrl: { type: String, required: true },
    hoverImageUrl: { type: String, required: true },
});

const ItemModel = mongoose.model('Item', ItemSchema);








// Routes

// Add a new item
app.post('/add-item', async (req, res) => {
    try {
        const { name, category, filter, description, page, specifications } = req.body;

        // Validate required fields
        if (!name || !category || !filter || !specifications) {
            return res.status(400).json({ message: 'Missing required fields: name, category, filter, specifications' });
        }

        // Validate file uploads
        if (!req.files || !req.files.image || !req.files.hoverImage || !req.files.pdf) {
            return res.status(400).json({ message: 'All files (image, hoverImage, pdf) are required' });
        }

        // Upload files to Cloudinary
        const imageResult = await cloudinary.uploader.upload(req.files.image.tempFilePath, { folder: "items" });
        const hoverImageResult = await cloudinary.uploader.upload(req.files.hoverImage.tempFilePath, { folder: "items" });
        const pdfResult = await cloudinary.uploader.upload(req.files.pdf.tempFilePath, { resource_type: 'raw', folder: "items" });

        // Create a new item document
        const newItem = new ItemModel({
            name,
            category,
            filter,
            description,
            pdfUrl: pdfResult.secure_url,
            page,
            specifications,
            imageUrl: imageResult.secure_url,
            hoverImageUrl: hoverImageResult.secure_url,
        });

        // Save to database
        await newItem.save();
        res.status(201).json({ message: 'Item added successfully', data: newItem });
    } catch (err) {
        console.error("Error adding item:", err);
        res.status(500).json({ message: 'Server error' });
    }
});



// Get all items
app.get("/items", async (req, res) => {
    try {
        const { category, filter } = req.query;
        let query = {};
        if (category) query.category = category;
        if (filter) query.filter = filter;

        const items = await ItemModel.find(query);
        res.status(200).json(items);
    } catch (error) {
        console.error("Error fetching items:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Get a single item by ID
app.get('/items/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const item = await ItemModel.findById(id);

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        res.status(200).json(item);
    } catch (err) {
        console.error("Error fetching item:", err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete an item
app.delete('/items/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedItem = await ItemModel.findByIdAndDelete(id);

        if (!deletedItem) {
            return res.status(404).json({ message: 'Item not found' });
        }

        res.status(200).json({ message: 'Item deleted successfully' });
    } catch (err) {
        console.error("Error deleting item:", err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update an item
app.put('/items/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, filter, description, page, specifications } = req.body;

        const updateData = { name, category, filter, description, page, specifications };

        if (req.files) {
            if (req.files.image) {
                const imageResult = await cloudinary.uploader.upload(req.files.image.tempFilePath, { folder: "items" });
                updateData.imageUrl = imageResult.secure_url;
            }
            if (req.files.hoverImage) {
                const hoverImageResult = await cloudinary.uploader.upload(req.files.hoverImage.tempFilePath, { folder: "items" });
                updateData.hoverImageUrl = hoverImageResult.secure_url;
            }
            if (req.files.pdf) {
                const pdfResult = await cloudinary.uploader.upload(req.files.pdf.tempFilePath, { resource_type: 'raw', folder: "items" });
                updateData.pdfUrl = pdfResult.secure_url;
            }
        }

        const updatedItem = await ItemModel.findByIdAndUpdate(id, updateData, { new: true });

        if (!updatedItem) {
            return res.status(404).json({ message: 'Item not found' });
        }

        res.status(200).json({ message: 'Item updated successfully', data: updatedItem });
    } catch (err) {
        console.error("Error updating item:", err);
        res.status(500).json({ message: 'Server error' });
    }
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
