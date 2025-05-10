const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

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

    // Convert weight to grams if unit is kilograms
    const weightInGrams = unit === 'kilograms' ? weightPerUnit * 1000 : weightPerUnit;

    // Calculate all metrics
    const materialPricePerKg = materialCost / 25;
    const totalMaterial = materialCost + (masterBatchCost || 0);
    const minimumProduction = 25000 / weightInGrams;
    const costPerItem = totalMaterial / minimumProduction;

    let overheads;
    if (overheadType === 'percentage') {
      const overheadRate = (overheadPercentage || 25) / 100;
      overheads = costPerItem * overheadRate;
    } else {
      overheads = (machineCostPerHour || 500) / hourlyProduction;
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

    const calculations = {
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
      overheadPercentage: overheadType === 'percentage' ? (overheadPercentage || 25) : null,
      machineCostPerHour: overheadType === 'machine' ? (machineCostPerHour || 500) : null,
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

    // Convert weight to grams if unit is kilograms
    const weightInGrams = unit === 'kilograms' ? weightPerUnit * 1000 : weightPerUnit;

    // Calculate all metrics
    const materialPricePerKg = materialCost / 25;
    const totalMaterial = materialCost + (masterBatchCost || 0);
    const minimumProduction = 25000 / weightInGrams;
    const costPerItem = totalMaterial / minimumProduction;

    let overheads;
    if (overheadType === 'percentage') {
      const overheadRate = (overheadPercentage || 25) / 100;
      overheads = costPerItem * overheadRate;
    } else {
      overheads = (machineCostPerHour || 500) / hourlyProduction;
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

    const calculations = {
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
        overheadPercentage: overheadType === 'percentage' ? (overheadPercentage || 25) : null,
        machineCostPerHour: overheadType === 'machine' ? (machineCostPerHour || 500) : null,
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

// ADMIN: Recalculate calculations for all products
router.post('/recalculate-all', async (req, res) => {
  try {
    const products = await Product.find();
    let updatedCount = 0;
    for (const product of products) {
      // Use the same calculation logic as in POST/PUT
      const materialCost = product.materialCost;
      const masterBatchCost = product.masterBatchCost || 0;
      const weightPerUnit = product.unit === 'kilograms' ? product.weightPerUnit * 1000 : product.weightPerUnit;
      const currentSellingPrice = product.currentSellingPrice;
      const hourlyProduction = product.hourlyProduction;
      const overheadType = product.overheadType;
      const overheadPercentage = overheadType === 'percentage' ? (product.overheadPercentage || 25) : 0;
      const machineCostPerHour = overheadType === 'machine' ? (product.machineCostPerHour || 500) : 0;

      const materialPricePerKg = materialCost / 25;
      const totalMaterial = materialCost + masterBatchCost;
      const minimumProduction = 25000 / weightPerUnit;
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
      const pcsFrom1Kg = 1000 / weightPerUnit;
      const valueOfProductFrom1Kg = currentSellingPrice * pcsFrom1Kg;
      const currentMargin = (currentSellingPrice - costPerItem * 1.16) / currentSellingPrice;
      const profitMarginPerKg = valueOfProductFrom1Kg - materialPricePerKg;

      let suggestedSellingPrice = null;
      if (currentMargin < 0.2) {
        suggestedSellingPrice = (costPerItem * 1.16) / 0.8;
      }

      const calculations = {
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

      product.calculations = calculations;
      await product.save();
      updatedCount++;
    }
    res.json({ message: `Recalculated calculations for ${updatedCount} products.` });
  } catch (err) {
    res.status(500).json({ message: 'Failed to recalculate products', error: err.message });
  }
});

module.exports = router;