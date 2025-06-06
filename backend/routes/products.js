const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Shared calculation function
const calculateProductMetrics = (product) => {
  const {
    materialCost,
    masterBatchCost = 0,
    weightPerUnit,
    unit,
    currentSellingPrice,
    hourlyProduction,
    overheadType,
    overheadPercentage = overheadType === 'percentage' ? 25 : 0,
    machineCostPerHour = overheadType === 'machine' ? 500 : 0,
  } = product;

  const weightInGrams = unit === 'kilograms' ? weightPerUnit * 1000 : weightPerUnit;
  const materialPricePerKg = materialCost / 25;
  const totalMaterial = materialCost + masterBatchCost;
  const minimumProduction = 25000 / weightInGrams;
  const costPerItem = totalMaterial / minimumProduction;

  let overheads;
  if (overheadType === 'percentage') {
    const overheadRate = overheadPercentage / 100;
    overheads = costPerItem * overheadRate;
  } else {
    overheads = machineCostPerHour / hourlyProduction;
  }

  const profitMargin = (costPerItem + overheads) * 0.10;
  const sellingPriceExclusive = costPerItem + overheads + profitMargin;
  const vat = sellingPriceExclusive * 0.16;
  const proposedSellingPrice = sellingPriceExclusive + vat;
  const pcsFrom1Kg = 1000 / weightInGrams;
  const valueOfProductFrom1Kg = currentSellingPrice * pcsFrom1Kg;
  const currentMargin = (currentSellingPrice - costPerItem * 1.16) / currentSellingPrice;
  const profitMarginPerKg = valueOfProductFrom1Kg - materialPricePerKg;

  let suggestedSellingPrice = null;
  if (currentMargin < 0.2) {
    suggestedSellingPrice = (costPerItem * 1.16) / 0.8;
  }

  return {
    materialPricePerKg,
    totalMaterial,
    minimumProduction,
    costPerItem,
    overheads,
    profitMargin,
    sellingPriceExclusive,
    vat,
    proposedSellingPrice,
    currentMargin,
    pcsFrom1Kg,
    valueOfProductFrom1Kg,
    profitMarginPerKg,
    suggestedSellingPrice,
  };
};

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get one product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create one product
router.post('/', async (req, res) => {
  try {
    const {
      productName,
      item,
      materialCost,
      masterBatchCost,
      weightPerUnit,
      unit,
      currentSellingPrice,
      hourlyProduction,
      overheadType,
      overheadPercentage,
      machineCostPerHour,
    } = req.body;

    // Validate required fields
    if (!productName || !item || !materialCost || !weightPerUnit || !currentSellingPrice || !hourlyProduction || !overheadType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const calculations = calculateProductMetrics({
      materialCost,
      masterBatchCost,
      weightPerUnit,
      unit,
      currentSellingPrice,
      hourlyProduction,
      overheadType,
      overheadPercentage,
      machineCostPerHour,
    });

    const product = new Product({
      productName,
      item,
      materialCost,
      masterBatchCost: masterBatchCost || 0,
      weightPerUnit,
      unit,
      currentSellingPrice,
      hourlyProduction,
      overheadType,
      overheadPercentage: overheadType === 'percentage' ? overheadPercentage : null,
      machineCostPerHour: overheadType === 'machine' ? machineCostPerHour : null,
      calculations,
    });

    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update one product
router.put('/:id', async (req, res) => {
  try {
    const {
      productName,
      item,
      materialCost,
      masterBatchCost,
      weightPerUnit,
      unit,
      currentSellingPrice,
      hourlyProduction,
      overheadType,
      overheadPercentage,
      machineCostPerHour,
    } = req.body;

    // Validate required fields
    if (!productName || !item || !materialCost || !weightPerUnit || !currentSellingPrice || !hourlyProduction || !overheadType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const calculations = calculateProductMetrics({
      materialCost,
      masterBatchCost,
      weightPerUnit,
      unit,
      currentSellingPrice,
      hourlyProduction,
      overheadType,
      overheadPercentage,
      machineCostPerHour,
    });

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        productName,
        item,
        materialCost,
        masterBatchCost: masterBatchCost || 0,
        weightPerUnit,
        unit,
        currentSellingPrice,
        hourlyProduction,
        overheadType,
        overheadPercentage: overheadType === 'percentage' ? overheadPercentage : null,
        machineCostPerHour: overheadType === 'machine' ? machineCostPerHour : null,
        calculations,
      },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(updatedProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete one product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Import multiple products
router.post('/import', async (req, res) => {
  try {
    const products = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: 'Invalid data: Expected an array of products' });
    }

    const savedProducts = [];
    for (const product of products) {
      // Validate required fields
      const requiredFields = ['productName', 'item', 'materialCost', 'weightPerUnit', 'currentSellingPrice', 'hourlyProduction', 'overheadType', 'unit'];
      const missingFields = requiredFields.filter(field => !product[field]);
      if (missingFields.length > 0) {
        return res.status(400).json({ message: `Missing required fields: ${missingFields.join(', ')}` });
      }

      const calculations = calculateProductMetrics(product);
      const newProduct = new Product({ ...product, calculations });
      const savedProduct = await newProduct.save();
      savedProducts.push(savedProduct);
    }

    res.status(201).json({ message: 'Products imported successfully', data: savedProducts });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ message: 'Server error during import', error: error.message });
  }
});

// Recalculate all products
router.post('/recalculate-all', async (req, res) => {
  try {
    const products = await Product.find();
    let updatedCount = 0;
    
    for (const product of products) {
      const calculations = calculateProductMetrics(product);
      await Product.findByIdAndUpdate(product._id, { calculations });
      updatedCount++;
    }

    res.json({ message: `Successfully recalculated ${updatedCount} products` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;