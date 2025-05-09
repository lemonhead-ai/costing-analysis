const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
  },
  item: {
    type: String,
    required: true,
  },
  materialCost: {
    type: Number,
    required: true,
    min: 0,
  },
  masterBatchCost: {
    type: Number,
    default: 0,
    min: 0,
  },
  weightPerUnit: {
    type: Number,
    required: true,
    min: 0,
  },
  unit: {
    type: String,
    required: true,
    enum: ['grams', 'kilograms'],
  },
  currentSellingPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  hourlyProduction: {
    type: Number,
    required: true,
    min: 0,
  },
  overheadType: {
    type: String,
    required: true,
    enum: ['percentage', 'machine'],
  },
  overheadPercentage: {
    type: Number,
    min: 0,
    max: 100,
  },
  machineCostPerHour: {
    type: Number,
    min: 0,
  },
  calculations: {
    materialPricePerKg: Number,
    totalMaterial: Number,
    minimumProduction: Number,
    costPerItem: Number,
    overheads: Number,
    profitMargin: Number,
    sellingPriceExclusive: Number,
    vat: Number,
    proposedSellingPrice: Number,
    currentMargin: Number,
    pcsFrom1Kg: Number,
    valueOfProductFrom1Kg: Number,
    profitMarginPerKg: Number,
    suggestedSellingPrice: Number,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Product', productSchema);