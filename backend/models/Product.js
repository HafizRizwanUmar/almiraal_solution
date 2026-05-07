const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    category: { type: String, required: true },
    src: { type: String, required: true }, 
    status: { type: String, required: true ,default:101}, 
    value: { type: Number, required: true }, 
    id:{type:String,required:true},
    method: { type: String, default: null }, 
    shape: { type: String, default: null }, 
    type: { type: String, default: null }, 
    material: { type: String, default: null }, 
    color: { type: String, default: null }, 
    name: { type: String, default: null }, 
    _name: { type: String, required: true }, 
    page:{type:String},

    createdAt: { type: Date, default: Date.now }, 
});

module.exports = mongoose.model('Product', ProductSchema);
