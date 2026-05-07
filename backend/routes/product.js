const express = require('express');
require('dotenv').config(); // Load environment variables
const nodemailer = require('nodemailer');
const Product = require('../models/Product');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const Bottle = require('../models/Bottle');
const Cap = require('../models/Cap');
const Pump = require('../models/Pump');
const Counter = require('../models/Counter');
const { default: mongoose } = require('mongoose');

// -------------------------------- BOTTLE ROUTES -------------------------------- //

// Get bottles, optionally filtering by fields

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Your email from the .env file
      pass: process.env.EMAIL_PASS, // Your email app password from the .env file
    },
    tls: {
        rejectUnauthorized: false, // Allow self-signed certificates
      },
  });



router.post('/send-mail', async (req, res) => {
    const { name, email, message ,phone,cap,bottle,pump} = req.body;
  
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'All fields are required!' });
    }
  
    const mailOptions = {
      from: email, // Sender's email
      to: process.env.RECEIVER_EMAIL, // Your email to receive the message
      subject: `Contact Form Submission from ${name}`,
      text: `You have a new message from ${name} (${email}):\n\n${message}`,
      html:`
<p><strong>Name:</strong> ${name}</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Phone:</strong> ${phone}</p>
<p><strong>Message:</strong></p>
<p>${message ? message : ""}</p>
${cap ? `
  <p><strong>Selected Cap:</strong> ${cap}</p>
  <p><strong>Selected Pump:</strong> ${pump}</p>
  <p><strong>Selected Bottle:</strong> ${bottle}</p>
` : ""}
`

    };
  
    try {
      await transporter.sendMail(mailOptions);
      res.status(200).json({ success: 'Message sent successfully!' });
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ error: 'Failed to send message!' });
    }
  });


  router.post('/send-mail-connect', async (req, res) => {
    const { name, email } = req.body;
  
    if (!name || !email ) {
      return res.status(400).json({ error: 'All fields are required!' });
    }
  
    const mailOptions = {
      from: email, // Sender's email
      to: process.env.RECEIVER_EMAIL, // Your email to receive the message
      subject: `Contact Form Submission from ${name}`,
      text: `You have a new message from ${name} (${email})`,
      html:`
<p><strong>Name:</strong> ${name}</p>
<p><strong>Email:</strong> ${email}</p>
`

    };
  
    try {
      await transporter.sendMail(mailOptions);
      res.status(200).json({ success: 'Message sent successfully!' });
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ error: 'Failed to send message!' });
    }
  });
  
router.get('/get-bottle', async (req, res) => {
    try {
        const { category, method, size, shape } = req.query;
        
        // Create an object to hold query conditions
        const query = {};
        
        // Only add to query object if the field is provided
        if (category) query.category = category;
        if (method) query.method = method;
        if (size) query.size = size;
        if (shape) query.shape = shape;

        const products = await Bottle.find(query);
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// -------------------------------- PUMP ROUTES -------------------------------- //

// Get pumps, optionally filtering by fields
router.get('/get-pump', async (req, res) => {
    try {
        const { shape, type } = req.query;

        // Create an object to hold query conditions
        const query = {};

        // Only add to query object if the field is provided
        if (shape) query.shape = shape;
        if (type) query.type = type;

        const pumps = await Pump.find(query);
        res.json(pumps);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// -------------------------------- CAP ROUTES -------------------------------- //

// Get caps, optionally filtering by fields
router.get('/get-cap', async (req, res) => {
    try {
        const { material, color, name } = req.query;

        // Create an object to hold query conditions
        const query = {};

        // Only add to query object if the field is provided
        if (material) query.material = material;
        if (color) query.color = color;
        if (name) query.name = name;

        const caps = await Cap.find(query);
        res.json(caps);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// -------------------------------- ADDITIONAL ROUTES -------------------------------- //

// Add a new bottle
router.post('/add-bottle', async (req, res) => {
    try {
        console.log(req.body)
        const {  src, method, size, shape,category,status } = req.body;
        const imageUrl = await cloudinary.uploader.upload(src, {
            folder: 'Bottle'
        });

        console.log(imageUrl)

        const bottle = await Bottle.create({
            status:method,
            size:size,
            shape,
            src: imageUrl.url,
        });

        console.log(bottle)

        res.status(200).json({ success: true, message: "Bottle added successfully" });
    } catch (err) {
        console.log(err)
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

// Add a new pump
router.post('/add-pump', async (req, res) => {
    try {
        const { type, src } = req.body;
        console.log(req.body)
        const imageUrl = await cloudinary.uploader.upload(src, { folder: 'Pump' });

        console.log(imageUrl)

        const pump = await Pump.create({
            shape:type,
            src: imageUrl.url
        });

        res.status(200).json({ success: true, pump, message: "Pump added successfully" });
    } catch (err) {
        console.log(err)
        res.status(500).json({ success: false, message: err.message });
    }
});

// Add a new cap
router.post('/add-cap', async (req, res) => {
    try {
        console.log(req.body)
        const { material, src, color, name } = req.body;
        const imageUrl = await cloudinary.uploader.upload(src, { folder: 'Cap' });

        const cap = await Cap.create({
            material,
            src: imageUrl.url,
            color,
            name
        });

        res.status(200).json({ success: true, message: "Cap added successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});



router.post('/add-product', async (req, res) => {
    try {
        const { src, value, category, status, method, shape, type, material, color, name, _name,page } = req.body;

        if (!src || !value || !category || !status) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: 'src', 'value', 'category', 'status'",
            });
        }

        // Count the total number of products in the database
        const totalProducts = await Product.countDocuments(); // Count all existing products

        // Generate the new product ID based on the total number of products
        const newIdNumber = totalProducts + 101; // Start from AMGB-00101, increment for each new product
        const newId = `AMGB-${newIdNumber.toString().padStart(5, '0')}`; // Format as AMGB-00101, AMGB-00102, etc.

        // Upload image to Cloudinary
        const imageUrl = await cloudinary.uploader.upload(src, {
            folder: 'Product',
        });

        // Create a new product with the generated ID
        const product = await Product.create({
            id: newId,
            category,
            value: Number(value),
            status,
            src: imageUrl.url,
            method: method || null,
            shape: shape || null,
            type: type || null,
            material: material || null,
            color: color || null,
            name: name || null,
            _name: _name || null,
            page: page || null
        });

        res.status(200).json({
            success: true,
            message: "Product added successfully",
            product,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "An error occurred while adding the product",
            error: err.message,
        });
    }
});






router.put('/update-product/:id', async (req, res) => {
    try {
        const productId = req.params.id; // Extract the product ID from URL params

        // Validate `productId` as a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID",
            });
        }

        const { src, value, category, status, method, shape, type, material, color, name ,id,_name,page} = req.body;

        // Find the product by ID
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: `Product with ID ${productId} not found`,
            });
        }
console.log(product,id)
        // If `src` is provided and valid, upload the new image to Cloudinary
        let imageUrl = product.src; // Default to the current product image
        if (src && typeof src === 'string' && src.trim()) {
            const uploadedImage = await cloudinary.uploader.upload(src, {
                folder: 'Product',
            });
            imageUrl = uploadedImage.url;
        }

        // Update the product fields if provided in the request
        product.value = value !== undefined && !isNaN(Number(value)) ? Number(value) : product.value;
        product.category = category || product.category;
        product.status = status || product.status;
        product.method = method || product.method;
        product.shape = shape || product.shape;
        product.page = page || product.page;
        product.type = type || product.type;
        product.material = material || product.material;
        product.color = color || product.color;
        product.name = name || product.name;
        product.src = imageUrl;
        product.id=id
        product._name=_name

        // Save the updated product
        await product.save();

        // Respond with success
        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            product,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "An error occurred while updating the product",
            error: err.message,
        });
    }
});


// router.put('/update-product/:id', async (req, res) => {
//     try {
//         const { id } = req.params; // Get product ID from URL params
//         const updateFields = req.body; // Fields to update

//         // Check if the product exists
//         const existingProduct = await Product.findOne({ id });
//         if (!existingProduct) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Product not found",
//             });
//         }

//         // Handle image update if 'src' is provided
//         if (updateFields.src) {
//             const imageUrl = await cloudinary.uploader.upload(updateFields.src, {
//                 folder: 'Product',
//             });
//             updateFields.src = imageUrl.url; // Replace src with the Cloudinary URL
//         }

//         // Update the product with new fields
//         const updatedProduct = await Product.findOneAndUpdate(
//             { id }, // Find product by ID
//             { $set: updateFields }, // Update fields
//             { new: true } // Return the updated document
//         );

//         res.status(200).json({
//             success: true,
//             message: "Product updated successfully",
//             product: updatedProduct,
//         });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({
//             success: false,
//             message: "An error occurred while updating the product",
//             error: err.message,
//         });
//     }
// });

router.delete("/product/:id",async(req,res)=>{
    try{
        const { id } = req.params; 

        let data=await Product.findByIdAndDelete(id)
        
        res.status(200).json({
            success: true,
            message: "Product deleted successfully",
        });


    }catch(err){
        console.log(err)
        res.status(500).json({
            success: false,
            message: "An error occurred while updating the product",
            error: err.message,
        });

    }
})


router.get('/get-product', async (req, res) => {
    try {
        // Destructure query parameters for pagination, search, and sorting
        const { page = 1, limit = 10, searchName = '', searchCategory = '', sortByDate = 'desc' } = req.query;

        // Calculate the skip value based on the page number and limit
        console.log(searchCategory)
        const skip = (page - 1) * limit;

        // Build the search filter
        const searchFilter = {
            ...(searchName && { _name: { $regex: searchName, $options: 'i' } }), // Case-insensitive search
            ...(searchCategory && { category: { $regex: searchCategory, $options: 'i' } }), // Case-insensitive search
        };
        // why

        // Set the sort order based on the query parameter or default to descending
        const sortOrder = sortByDate === 'asc' ? 1 : -1;

        // Find products with the filters, pagination, and sorting
        const products = await Product.find(searchFilter)
            .sort({ createdAt: sortOrder }) // Always sort by 'createdAt', defaulting to descending
            .skip(skip)  // Skip items based on pagination
            .limit(parseInt(limit));  // Limit the number of items per page

        // Get the total count of products that match the search filter
        const totalProducts = await Product.countDocuments(searchFilter);

        // Calculate total pages for pagination
        const totalPages = Math.ceil(totalProducts / limit);

        res.status(200).json({
            success: true,
            message: "Products fetched successfully",
            data: {
                products,
                pagination: {
                    totalProducts,
                    totalPages,
                    currentPage: parseInt(page),
                    limit: parseInt(limit),
                },
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "An error occurred while fetching products",
            error: err.message,
        });
    }
});




// -------------------------------- PRODUCT ROUTES -------------------------------- //

// Get products, optionally filtering by fields
// -------------------------------- PRODUCT ROUTES -------------------------------- //

// Get products, optionally filtering by fields
// router.get('/get-product', async (req, res) => {
//     try {
//         const { category, status, value } = req.query;

//         // Create an object to hold query conditions
//         const query = {};

//         // Only add to query object if the field is provided
//         if (category) query.category = category;
//         if (status) query.status = status;

//         // Filtering by value
//         if (value) query.value = Number(value); // Equal to value

//         const products = await Product.find(query);
//         res.json(products);
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// });


module.exports = router;
