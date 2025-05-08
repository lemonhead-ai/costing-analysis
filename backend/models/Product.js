const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  item: { type: String, required: true },
  materialCost: { type: Number, required: true, min: 0 },
  masterBatchCost: { type: Number, default: 0, min: 0 },
  weightPerUnit: { type: Number, required: true, min: 0 },
  unit: { type: String, enum: ['grams', 'kilograms'], default: 'grams' },
  currentSellingPrice: { type: Number, required: true, min: 0 },
  hourlyProduction: { type: Number, required: true, min: 0 },
  overheadType: { type: String, enum: ['percentage', 'machine'], default: 'percentage' },
  overheadPercentage: { type: Number, default: 25, min: 0, max: 100 },
  machineCostPerHour: { type: Number, default: 500, min: 0 },
  calculations: {
    materialPricePerKg: { type: Number },
    totalMaterial: { type: Number },
    minimumProduction: { type: Number },
    costPerItem: { type: Number },
    overheads: { type: Number },
    overheadType: { type: String },
    overheadPercentage: { type: Number },
    machineCostPerHour: { type: Number },
    profitMargin: { type: Number },
    sellingPriceExclusive: { type: Number },
    vat: { type: Number },
    proposedSellingPrice: { type: Number },
    currentMargin: { type: Number },
    pcsFrom1Kg: { type: Number },
    valueOfProductFrom1Kg: { type: Number },
    profitMarginPerKg: { type: Number },
    suggestedSellingPrice: { type: Number, default: null },
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Product', productSchema);