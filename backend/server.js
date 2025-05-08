const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const productRoutes = require('./routes/products');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/products', productRoutes);

// Import endpoint
app.post('/api/products/import', async (req, res) => {
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

      // Convert and validate numeric fields
      const weightPerUnit = product.unit === 'kilograms' ? parseFloat(product.weightPerUnit) * 1000 : parseFloat(product.weightPerUnit);
      if (isNaN(weightPerUnit) || weightPerUnit <= 0) {
        return res.status(400).json({ message: 'Weight per Unit must be greater than 0' });
      }
      const materialCost = parseFloat(product.materialCost);
      if (isNaN(materialCost) || materialCost <= 0) {
        return res.status(400).json({ message: 'Material Cost must be greater than 0' });
      }
      const masterBatchCost = parseFloat(product.masterBatchCost || 0);
      if (isNaN(masterBatchCost) || masterBatchCost < 0) {
        return res.status(400).json({ message: 'Master Batch Cost cannot be negative' });
      }
      const currentSellingPrice = parseFloat(product.currentSellingPrice);
      if (isNaN(currentSellingPrice) || currentSellingPrice <= 0) {
        return res.status(400).json({ message: 'Current Selling Price must be greater than 0' });
      }
      const hourlyProduction = parseFloat(product.hourlyProduction);
      if (isNaN(hourlyProduction) || hourlyProduction <= 0) {
        return res.status(400).json({ message: 'Hourly Production must be greater than 0' });
      }
      const overheadPercentage = product.overheadType === 'percentage' ? parseFloat(product.overheadPercentage || 0) : 0;
      if (isNaN(overheadPercentage) || (product.overheadType === 'percentage' && (overheadPercentage < 0 || overheadPercentage > 100))) {
        return res.status(400).json({ message: 'Overhead Percentage must be between 0 and 100' });
      }
      const machineCostPerHour = product.overheadType === 'machine' ? parseFloat(product.machineCostPerHour || 0) : 0;
      if (isNaN(machineCostPerHour) || (product.overheadType === 'machine' && machineCostPerHour <= 0)) {
        return res.status(400).json({ message: 'Machine Cost per Hour must be greater than 0' });
      }

      // Calculate calculations fields
      const materialPricePerKg = materialCost / 25;
      const totalMaterial = materialCost + masterBatchCost;
      const minimumProduction = 25000 / weightPerUnit;
      const costPerItem = totalMaterial / minimumProduction;

      let overheads;
      if (product.overheadType === 'percentage') {
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
        overheadType: product.overheadType,
        overheadPercentage,
        machineCostPerHour,
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

      const newProduct = new (require('./models/Product'))({ ...product, calculations });
      const savedProduct = await newProduct.save();
      savedProducts.push(savedProduct);
    }

    res.status(201).json({ message: 'Products imported successfully', data: savedProducts });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ message: 'Server error during import', error: error.message });
  }
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));