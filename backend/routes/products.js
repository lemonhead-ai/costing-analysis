const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// GET all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST a new product
router.post('/', async (req, res) => {
  try {
    const productData = req.body;
    // Validate required fields
    const requiredFields = [
      'productName',
      'item',
      'materialCost',
      'weightPerUnit',
      'currentSellingPrice',
      'hourlyProduction',
      'calculations',
    ];
    for (const field of requiredFields) {
      if (!productData[field]) {
        return res.status(400).json({ message: `Missing required field: ${field}` });
      }
    }
    const product = new Product(productData);
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: 'Invalid data', error: err.message });
  }
});

// DELETE a product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;