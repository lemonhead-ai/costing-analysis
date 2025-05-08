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

  const handleSubmit = (e) => {
    e.preventDefault();
    const newProduct = {
      productName: formData.productName,
      item: formData.item,
      materialCost: parseFloat(formData.materialCost),
      weightPerUnit: parseFloat(formData.weightPerUnit),
      unit: formData.unit,
    };
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
    </div>
  );
};

export default Inputs;