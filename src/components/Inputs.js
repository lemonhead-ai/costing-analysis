import React, { useState } from 'react';

const Inputs = ({ addProduct }) => {
  const [formData, setFormData] = useState({
    productName: '',
    item: '',
    materialCost: '',
    masterBatchCost: '0',
    weightPerUnit: '',
    currentSellingPrice: '',
    hourlyProduction: '',
    unit: 'grams',
    overheadType: 'percentage',
    overheadPercentage: '25',
    machineCostPerHour: '500',
  });
  const [calculations, setCalculations] = useState([]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleUnitChange = (e) => {
    setFormData({ ...formData, unit: e.target.value });
  };

  const handleOverheadTypeChange = (e) => {
    setFormData({ ...formData, overheadType: e.target.value });
  };

  const calculateMetrics = (data) => {
    const materialCost = parseFloat(data.materialCost) || 0;
    const masterBatchCost = parseFloat(data.masterBatchCost) || 0;
    let weightPerUnit = parseFloat(data.weightPerUnit) || 1; // Avoid division by zero
    const currentSellingPrice = parseFloat(data.currentSellingPrice) || 0;
    const overheadPercentage = parseFloat(data.overheadPercentage) || 25;
    const machineCostPerHour = parseFloat(data.machineCostPerHour) || 500;
    const hourlyProduction = parseFloat(data.hourlyProduction) || 1; // Avoid division by zero

    // Convert weight to grams if unit is kilograms
    if (data.unit === 'kilograms') {
      weightPerUnit *= 1000;
    }

    // Material Price / KG
    const materialPricePerKg = materialCost / 25;

    // Total Material
    const totalMaterial = materialCost + masterBatchCost;

    // Minimum Production
    const minimumProduction = 25000 / weightPerUnit;

    // Cost per Item (Direct Cost)
    const costPerItem = totalMaterial / minimumProduction;

    // Overheads
    let overheads;
    if (data.overheadType === 'percentage') {
      overheads = costPerItem * (overheadPercentage / 100);
    } else {
      overheads = machineCostPerHour / hourlyProduction; // Machine cost per unit
    }

    // Profit Margin (10%)
    const profitMargin = (costPerItem + overheads) * 0.10;

    // Selling Price Exclusive
    const sellingPriceExclusive = costPerItem + overheads + profitMargin;

    // VAT (16%)
    const vat = sellingPriceExclusive * 0.16;

    // Proposed Selling Price Inclusive
    const proposedSellingPriceInclusive = sellingPriceExclusive + vat;

    // Current Margin
    const currentMargin = currentSellingPrice
      ? (currentSellingPrice - (costPerItem * 1.16)) / currentSellingPrice
      : 0;

    // Proposed Margin
    const proposedMargin = (proposedSellingPriceInclusive - (costPerItem * 1.16)) / proposedSellingPriceInclusive;

    // PCS from 1KG
    const pcsFrom1Kg = 1000 / weightPerUnit;

    // Value of Product from 1KG
    const valueOfProductFrom1Kg = currentSellingPrice * pcsFrom1Kg;

    // Profit Margin per KG
    const profitMarginPerKg = valueOfProductFrom1Kg - materialPricePerKg;

    return {
      productName: data.productName,
      item: data.item,
      totalMaterial: totalMaterial.toFixed(2),
      minimumProduction: minimumProduction.toFixed(2),
      costPerItem: costPerItem.toFixed(2),
      overheads: overheads.toFixed(2),
      profitMargin: profitMargin.toFixed(2),
      sellingPriceExclusive: sellingPriceExclusive.toFixed(2),
      vat: vat.toFixed(2),
      proposedSellingPriceInclusive: proposedSellingPriceInclusive.toFixed(2),
      currentMargin: (currentMargin * 100).toFixed(2),
      proposedMargin: (proposedMargin * 100).toFixed(2),
      pcsFrom1Kg: pcsFrom1Kg.toFixed(2),
      valueOfProductFrom1Kg: valueOfProductFrom1Kg.toFixed(2),
      profitMarginPerKg: profitMarginPerKg.toFixed(2),
    };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newProduct = {
      productName: formData.productName,
      item: formData.item,
      materialCost: parseFloat(formData.materialCost),
      masterBatchCost: parseFloat(formData.masterBatchCost),
      weightPerUnit: parseFloat(formData.weightPerUnit),
      currentSellingPrice: parseFloat(formData.currentSellingPrice),
      hourlyProduction: parseFloat(formData.hourlyProduction),
      unit: formData.unit,
      overheadType: formData.overheadType,
      overheadPercentage: parseFloat(formData.overheadPercentage),
      machineCostPerHour: parseFloat(formData.machineCostPerHour),
    };
    const calculatedMetrics = calculateMetrics(newProduct);
    setCalculations((prev) => [...prev, calculatedMetrics]);
    addProduct(newProduct);
    // Reset form
    setFormData({
      productName: '',
      item: '',
      materialCost: '',
      masterBatchCost: '0',
      weightPerUnit: '',
      currentSellingPrice: '',
      hourlyProduction: '',
      unit: 'grams',
      overheadType: 'percentage',
      overheadPercentage: '25',
      machineCostPerHour: '500',
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Inputs</h2>
      <form onSubmit={handleSubmit} className="bg-gray-800/50 backdrop-blur-md p-6 rounded-xl shadow-lg border border-gray-700/50">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="productName">
              Product Name
            </label>
            <input
              type="text"
              name="productName"
              id="productName"
              placeholder="e.g., BASINS"
              value={formData.productName}
              onChange={handleInputChange}
              className="w-full bg-white/20 backdrop-blur-md text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="item">
              Item
            </label>
            <input
              type="text"
              name="item"
              id="item"
              placeholder="e.g., GRADE 1"
              value={formData.item}
              onChange={handleInputChange}
              className="w-full bg-white/20 backdrop-blur-md text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="materialCost">
              Material Cost (KES per 25kg)
            </label>
            <input
              type="number"
              name="materialCost"
              id="materialCost"
              placeholder="e.g., 5300"
              value={formData.materialCost}
              onChange={handleInputChange}
              className="w-full bg-white/20 backdrop-blur-md text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="masterBatchCost">
              Master Batch Cost (KES)
            </label>
            <input
              type="number"
              name="masterBatchCost"
              id="masterBatchCost"
              placeholder="e.g., 100"
              value={formData.masterBatchCost}
              onChange={handleInputChange}
              className="w-full bg-white/20 backdrop-blur-md text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="weightPerUnit">
              Weight per Unit
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                name="weightPerUnit"
                id="weightPerUnit"
                placeholder="e.g., 215"
                value={formData.weightPerUnit}
                onChange={handleInputChange}
                className="w-full bg-white/20 backdrop-blur-md text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="0.001"
              />
              <select
                name="unit"
                value={formData.unit}
                onChange={handleUnitChange}
                className="bg-white/20 backdrop-blur-md text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="grams">Grams</option>
                <option value="kilograms">Kilograms</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="currentSellingPrice">
              Current Selling Price (KES)
            </label>
            <input
              type="number"
              name="currentSellingPrice"
              id="currentSellingPrice"
              placeholder="e.g., 65"
              value={formData.currentSellingPrice}
              onChange={handleInputChange}
              className="w-full bg-white/20 backdrop-blur-md text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="hourlyProduction">
              Hourly Production (units)
            </label>
            <input
              type="number"
              name="hourlyProduction"
              id="hourlyProduction"
              placeholder="e.g., 140"
              value={formData.hourlyProduction}
              onChange={handleInputChange}
              className="w-full bg-white/20 backdrop-blur-md text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              step="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="overheadType">
              Overhead Calculation
            </label>
            <div className="flex gap-2">
              <select
                name="overheadType"
                value={formData.overheadType}
                onChange={handleOverheadTypeChange}
                className="w-full bg-white/20 backdrop-blur-md text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="percentage">Percentage-Based</option>
                <option value="machine">Machine-Cost-Based</option>
              </select>
              {formData.overheadType === 'percentage' ? (
                <input
                  type="number"
                  name="overheadPercentage"
                  id="overheadPercentage"
                  placeholder="e.g., 25"
                  value={formData.overheadPercentage}
                  onChange={handleInputChange}
                  className="w-full bg-white/20 backdrop-blur-md text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="100"
                  step="0.1"
                />
              ) : (
                <input
                  type="number"
                  name="machineCostPerHour"
                  id="machineCostPerHour"
                  placeholder="e.g., 500"
                  value={formData.machineCostPerHour}
                  onChange={handleInputChange}
                  className="w-full bg-white/20 backdrop-blur-md text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.01"
                />
              )}
            </div>
          </div>
        </div>
        <div className="mt-6 flex gap-4">
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Calculate
          </button>
          <button
            type="button"
            onClick={() => setFormData({
              productName: '',
              item: '',
              materialCost: '',
              masterBatchCost: '0',
              weightPerUnit: '',
              currentSellingPrice: '',
              hourlyProduction: '',
              unit: 'grams',
              overheadType: 'percentage',
              overheadPercentage: '25',
              machineCostPerHour: '500',
            })}
            className="bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
          >
            Clear Form
          </button>
        </div>
      </form>

      {/* Display Calculated Results */}
      {calculations.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Calculated Results</h3>
          <div className="bg-gray-800/50 backdrop-blur-md p-6 rounded-xl shadow-lg border border-gray-700/50 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-700/50">
                  <th className="p-2">Product</th>
                  <th className="p-2">Item</th>
                  <th className="p-2">Total Material (KES)</th>
                  <th className="p-2">Min Production</th>
                  <th className="p-2">Cost per Item (KES)</th>
                  <th className="p-2">Overheads (KES)</th>
                  <th className="p-2">Profit Margin (KES)</th>
                  <th className="p-2">Proposed Price (KES)</th>
                  <th className="p-2">Current Margin (%)</th>
                  <th className="p-2">Proposed Margin (%)</th>
                  <th className="p-2">Profit Margin per KG (KES)</th>
                </tr>
              </thead>
              <tbody>
                {calculations.map((calc, index) => (
                  <tr key={index} className="border-t border-gray-600">
                    <td className="p-2">{calc.productName}</td>
                    <td className="p-2">{calc.item}</td>
                    <td className="p-2">{calc.totalMaterial}</td>
                    <td className="p-2">{calc.minimumProduction}</td>
                    <td className="p-2">{calc.costPerItem}</td>
                    <td className="p-2">{calc.overheads}</td>
                    <td className="p-2">{calc.profitMargin}</td>
                    <td className="p-2">{calc.proposedSellingPriceInclusive}</td>
                    <td className="p-2">{calc.currentMargin}</td>
                    <td className="p-2">{calc.proposedMargin}</td>
                    <td className="p-2">{calc.profitMarginPerKg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inputs;