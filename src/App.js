import React, { useState } from 'react';

function App() {
  const [formData, setFormData] = useState({
    productName: '',
    item: '',
    materialCost: '',
    masterBatchCost: '0',
    weightPerUnit: '',
    currentSellingPrice: '',
    hourlyProduction: '',
    unit: 'grams', // Default unit
  });

  const [products, setProducts] = useState([]);
  const [calculations, setCalculations] = useState(null);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(''); // Clear error on input change
  };

  const handleUnitChange = (e) => {
    setFormData({ ...formData, unit: e.target.value });
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Convert weightPerUnit to grams if in kilograms
    const weightPerUnit =
      formData.unit === 'kilograms'
        ? parseFloat(formData.weightPerUnit) * 1000
        : parseFloat(formData.weightPerUnit);

    // Validate inputs
    if (!weightPerUnit || weightPerUnit <= 0) {
      setError('Weight per Unit must be greater than 0');
      return;
    }
    if (parseFloat(formData.materialCost) <= 0) {
      setError('Material Cost must be greater than 0');
      return;
    }
    if (parseFloat(formData.currentSellingPrice) <= 0) {
      setError('Current Selling Price must be greater than 0');
      return;
    }
    if (parseFloat(formData.hourlyProduction) <= 0) {
      setError('Hourly Production must be greater than 0');
      return;
    }

    // Calculations
    try {
      const materialPricePerKg = formData.materialCost / 25;
      const totalMaterial =
        parseFloat(formData.materialCost) + parseFloat(formData.masterBatchCost || 0);
      const minimumProduction = 25000 / weightPerUnit;
      const costPerItem = totalMaterial / minimumProduction;
      const overheads = costPerItem * 0.25;
      const profitMargin = (costPerItem + overheads) * 0.10;
      const sellingPriceExclusive = costPerItem + overheads + profitMargin;
      const vat = sellingPriceExclusive * 0.16;
      const proposedSellingPrice = sellingPriceExclusive + vat;
      const pcsFrom1Kg = 1000 / weightPerUnit;
      const valueOfProductFrom1Kg = formData.currentSellingPrice * pcsFrom1Kg;
      const currentMargin =
        (formData.currentSellingPrice - costPerItem * 1.16) / formData.currentSellingPrice;
      const profitMarginPerKg = valueOfProductFrom1Kg - materialPricePerKg;

      const newCalculations = {
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
      };

      setCalculations(newCalculations);
      setProducts([...products, { ...formData, calculations: newCalculations }]);
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
      });
    } catch (err) {
      setError('Calculation error. Please check your inputs.');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Costing Analysis System</h1>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 border border-red-700 rounded">
          {error}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            name="productName"
            placeholder="Product Name (e.g., BASINS)"
            value={formData.productName}
            onChange={handleInputChange}
            className="border p-2"
            required
          />
          <input
            type="text"
            name="item"
            placeholder="Item (e.g., GRADE 1)"
            value={formData.item}
            onChange={handleInputChange}
            className="border p-2"
            required
          />
          <input
            type="number"
            name="materialCost"
            placeholder="Material Cost (KES per 25kg)"
            value={formData.materialCost}
            onChange={handleInputChange}
            className="border p-2"
            required
          />
          <input
            type="number"
            name="masterBatchCost"
            placeholder="Master Batch Cost (KES)"
            value={formData.masterBatchCost}
            onChange={handleInputChange}
            className="border p-2"
          />
          <div className="flex gap-2">
            <input
              type="number"
              name="weightPerUnit"
              placeholder={`Weight per Unit (${formData.unit})`}
              value={formData.weightPerUnit}
              onChange={handleInputChange}
              className="border p-2 flex-1"
              required
            />
            <select
              name="unit"
              value={formData.unit}
              onChange={handleUnitChange}
              className="border p-2"
            >
              <option value="grams">Grams</option>
              <option value="kilograms">Kilograms</option>
            </select>
          </div>
          <input
            type="number"
            name="currentSellingPrice"
            placeholder="Current Selling Price (KES)"
            value={formData.currentSellingPrice}
            onChange={handleInputChange}
            className="border p-2"
            required
          />
          <input
            type="number"
            name="hourlyProduction"
            placeholder="Hourly Production (units)"
            value={formData.hourlyProduction}
            onChange={handleInputChange}
            className="border p-2"
            required
          />
        </div>
        <button type="submit" className="mt-4 bg-blue-500 text-white p-2 rounded">
          Calculate
        </button>
      </form>

      {/* Calculations Output */}
      {calculations && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold">Calculations</h2>
          <div className="grid grid-cols-2 gap-4">
            <p>Cost per Item: {calculations.costPerItem.toFixed(2)} KES</p>
            <p>Proposed Selling Price: {calculations.proposedSellingPrice.toFixed(2)} KES</p>
            <p
              className={calculations.currentMargin < 0.2 ? 'text-red-500' : 'text-green-500'}
            >
              Current Margin: {(calculations.currentMargin * 100).toFixed(2)}%
            </p>
            <p>Profit Margin per KG: {calculations.profitMarginPerKg.toFixed(2)} KES</p>
          </div>
        </div>
      )}

      {/* Products Table */}
      {products.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Products</h2>
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2">Product</th>
                <th className="p-2">Item</th>
                <th className="p-2">Current Margin</th>
                <th className="p-2">Proposed Selling Price</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => (
                <tr key={index} className="border-t">
                  <td className="p-2">{product.productName}</td>
                  <td className="p-2">{product.item}</td>
                  <td
                    className={
                      product.calculations.currentMargin < 0.2
                        ? 'p-2 text-red-500'
                        : 'p-2 text-green-500'
                    }
                  >
                    {(product.calculations.currentMargin * 100).toFixed(2)}%
                  </td>
                  <td className="p-2">
                    {product.calculations.proposedSellingPrice.toFixed(2)} KES
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;