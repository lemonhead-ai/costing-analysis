import React, { useState, useEffect } from 'react';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

function App() {
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

  const [products, setProducts] = useState([]);
  const [calculations, setCalculations] = useState(null);
  const [error, setError] = useState('');
  const [invalidFields, setInvalidFields] = useState([]);
  const [sortKey, setSortKey] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products');
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      setError('Failed to fetch products');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setInvalidFields(invalidFields.filter((field) => field !== name));
    setError('');
  };

  const handleUnitChange = (e) => {
    setFormData({ ...formData, unit: e.target.value });
    setError('');
  };

  const handleOverheadTypeChange = (e) => {
    setFormData({ ...formData, overheadType: e.target.value });
    setError('');
  };

  const handleClearForm = () => {
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
    setError('');
    setInvalidFields([]);
    setCalculations(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInvalidFields([]);

    // Validate inputs
    const newInvalidFields = [];
    const weightPerUnit =
      formData.unit === 'kilograms'
        ? parseFloat(formData.weightPerUnit) * 1000
        : parseFloat(formData.weightPerUnit);
    if (!formData.productName) newInvalidFields.push('productName');
    if (!formData.item) newInvalidFields.push('item');
    if (!weightPerUnit || weightPerUnit <= 0) {
      setError('Weight per Unit must be greater than 0');
      newInvalidFields.push('weightPerUnit');
    }
    if (!formData.materialCost || parseFloat(formData.materialCost) <= 0) {
      setError('Material Cost must be greater than 0');
      newInvalidFields.push('materialCost');
    }
    if (parseFloat(formData.masterBatchCost) < 0) {
      setError('Master Batch Cost cannot be negative');
      newInvalidFields.push('masterBatchCost');
    }
    if (!formData.currentSellingPrice || parseFloat(formData.currentSellingPrice) <= 0) {
      setError('Current Selling Price must be greater than 0');
      newInvalidFields.push('currentSellingPrice');
    }
    if (!formData.hourlyProduction || parseFloat(formData.hourlyProduction) <= 0) {
      setError('Hourly Production must be greater than 0');
      newInvalidFields.push('hourlyProduction');
    }
    if (
      formData.overheadType === 'percentage' &&
      (!formData.overheadPercentage ||
        parseFloat(formData.overheadPercentage) < 0 ||
        parseFloat(formData.overheadPercentage) > 100)
    ) {
      setError('Overhead Percentage must be between 0 and 100');
      newInvalidFields.push('overheadPercentage');
    }
    if (
      formData.overheadType === 'machine' &&
      (!formData.machineCostPerHour || parseFloat(formData.machineCostPerHour) <= 0)
    ) {
      setError('Machine Cost per Hour must be greater than 0');
      newInvalidFields.push('machineCostPerHour');
    }

    if (newInvalidFields.length > 0) {
      setInvalidFields(newInvalidFields);
      return;
    }

    // Calculations
    try {
      const materialPricePerKg = parseFloat(formData.materialCost) / 25;
      const totalMaterial =
        parseFloat(formData.materialCost) + parseFloat(formData.masterBatchCost || 0);
      const minimumProduction = 25000 / weightPerUnit;
      const costPerItem = totalMaterial / minimumProduction;

      // Calculate overheads
      let overheads;
      if (formData.overheadType === 'percentage') {
        const overheadRate = parseFloat(formData.overheadPercentage) / 100;
        overheads = costPerItem * overheadRate;
      } else {
        overheads = parseFloat(formData.machineCostPerHour) / parseFloat(formData.hourlyProduction);
      }

      const profitMargin = (costPerItem + overheads) * 0.10;
      const sellingPriceExclusive = costPerItem + overheads + profitMargin;
      const vat = sellingPriceExclusive * 0.16;
      const proposedSellingPrice = sellingPriceExclusive + vat;
      const pcsFrom1Kg = 1000 / weightPerUnit;
      const valueOfProductFrom1Kg = parseFloat(formData.currentSellingPrice) * pcsFrom1Kg;
      const currentMargin =
        (parseFloat(formData.currentSellingPrice) - costPerItem * 1.16) /
        parseFloat(formData.currentSellingPrice);
      const profitMarginPerKg = valueOfProductFrom1Kg - materialPricePerKg;

      // Suggest selling price for 20% margin if currentMargin < 20%
      let suggestedSellingPrice = null;
      if (currentMargin < 0.2) {
        suggestedSellingPrice = (costPerItem * 1.16) / 0.8;
      }

      const newCalculations = {
        materialPricePerKg,
        totalMaterial,
        minimumProduction,
        costPerItem,
        overheads,
        overheadType: formData.overheadType,
        overheadPercentage: formData.overheadPercentage,
        machineCostPerHour: formData.machineCostPerHour,
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

      setCalculations(newCalculations);

      // Save to backend
      const productData = { ...formData, calculations: newCalculations };
      const response = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        throw new Error('Failed to save product');
      }

      // Refresh products
      await fetchProducts();

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
    } catch (err) {
      setError('Calculation or server error. Please check your inputs.');
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/products/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete product');
      }
      await fetchProducts();
    } catch (err) {
      setError('Failed to delete product');
    }
  };

  const handleSort = (key) => {
    const isNested = key.includes('.');
    const newDirection = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortKey(key);
    setSortDirection(newDirection);

    const sortedProducts = [...products].sort((a, b) => {
      let valueA, valueB;

      if (isNested) {
        const [parent, child] = key.split('.');
        valueA = a[parent][child];
        valueB = b[parent][child];
      } else {
        valueA = a[key];
        valueB = b[key];
      }

      // Convert to numbers for numeric fields
      const numericFields = [
        'materialCost',
        'weightPerUnit',
        'calculations.costPerItem',
        'calculations.overheads',
        'calculations.currentMargin',
        'calculations.proposedSellingPrice',
        'calculations.suggestedSellingPrice',
        'calculations.profitMarginPerKg',
      ];
      if (numericFields.includes(key)) {
        valueA = parseFloat(valueA) || (key === 'calculations.suggestedSellingPrice' ? Infinity : 0);
        valueB = parseFloat(valueB) || (key === 'calculations.suggestedSellingPrice' ? Infinity : 0);
      } else {
        valueA = valueA ? valueA.toString().toLowerCase() : '';
        valueB = valueB ? valueB.toString().toLowerCase() : '';
      }

      if (valueA < valueB) return newDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return newDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setProducts(sortedProducts);
  };

  const handleDownloadReport = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Costing Analysis');

    // Define columns
    worksheet.columns = [
      { header: 'Product Name', key: 'productName', width: 20 },
      { header: 'Item', key: 'item', width: 15 },
      { header: 'Material Cost (KES)', key: 'materialCost', width: 15 },
      { header: 'Master Batch Cost (KES)', key: 'masterBatchCost', width: 20 },
      { header: 'Weight per Unit', key: 'weightPerUnit', width: 15 },
      { header: 'Unit', key: 'unit', width: 10 },
      { header: 'Current Selling Price (KES)', key: 'currentSellingPrice', width: 20 },
      { header: 'Hourly Production (units)', key: 'hourlyProduction', width: 20 },
      { header: 'Overhead Type', key: 'overheadType', width: 15 },
      { header: 'Overhead Percentage (%)', key: 'overheadPercentage', width: 20 },
      { header: 'Machine Cost per Hour (KES)', key: 'machineCostPerHour', width: 20 },
      { header: 'Cost per Item (KES)', key: 'costPerItem', width: 15 },
      { header: 'Overheads per Item (KES)', key: 'overheads', width: 20 },
      { header: 'Proposed Selling Price (KES)', key: 'proposedSellingPrice', width: 20 },
      { header: 'Current Margin (%)', key: 'currentMargin', width: 15 },
      { header: 'Suggested Selling Price (KES)', key: 'suggestedSellingPrice', width: 20 },
      { header: 'Profit Margin per KG (KES)', key: 'profitMarginPerKg', width: 20 },
    ];

    // Add rows
    products.forEach((product) => {
      worksheet.addRow({
        productName: product.productName,
        item: product.item,
        materialCost: parseFloat(product.materialCost),
        masterBatchCost: parseFloat(product.masterBatchCost),
        weightPerUnit: parseFloat(product.weightPerUnit),
        unit: product.unit,
        currentSellingPrice: parseFloat(product.currentSellingPrice),
        hourlyProduction: parseFloat(product.hourlyProduction),
        overheadType: product.overheadType,
        overheadPercentage: parseFloat(product.overheadPercentage),
        machineCostPerHour: parseFloat(product.machineCostPerHour),
        costPerItem: product.calculations.costPerItem.toFixed(2),
        overheads: product.calculations.overheads.toFixed(2),
        proposedSellingPrice: product.calculations.proposedSellingPrice.toFixed(2),
        currentMargin: (product.calculations.currentMargin * 100).toFixed(2),
        suggestedSellingPrice: product.calculations.suggestedSellingPrice
          ? product.calculations.suggestedSellingPrice.toFixed(2)
          : '',
        profitMarginPerKg: product.calculations.profitMarginPerKg.toFixed(2),
      });
    });

    // Style headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' },
    };

    // Format columns
    ['materialCost', 'masterBatchCost', 'currentSellingPrice', 'machineCostPerHour', 'costPerItem', 'overheads', 'proposedSellingPrice', 'suggestedSellingPrice', 'profitMarginPerKg'].forEach((key) => {
      const col = worksheet.getColumn(key);
      col.numFmt = '"KES" #,##0.00';
    });
    worksheet.getColumn('currentMargin').numFmt = '0.00%';
    worksheet.getColumn('overheadPercentage').numFmt = '0.00%';

    // Generate and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, 'Costing_Analysis_Report.xlsx');
  };

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">Costing Analysis System</h1>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-700 rounded">
          {error}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="mb-8 bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="productName">
              Product Name
            </label>
            <input
              type="text"
              name="productName"
              id="productName"
              placeholder="e.g., BASINS"
              title="Enter the product category (e.g., BASINS)"
              value={formData.productName}
              onChange={handleInputChange}
              className={`w-full border p-2 rounded ${invalidFields.includes('productName') ? 'border-red-500' : 'border-gray-300'}`}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="item">
              Item
            </label>
            <input
              type="text"
              name="item"
              id="item"
              placeholder="e.g., GRADE 1"
              title="Enter the item grade or type (e.g., GRADE 1)"
              value={formData.item}
              onChange={handleInputChange}
              className={`w-full border p-2 rounded ${invalidFields.includes('item') ? 'border-red-500' : 'border-gray-300'}`}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="materialCost">
              Material Cost (KES per 25kg)
            </label>
            <input
              type="number"
              name="materialCost"
              id="materialCost"
              placeholder="e.g., 5300"
              title="Cost of raw material for 25kg (KES)"
              value={formData.materialCost}
              onChange={handleInputChange}
              className={`w-full border p-2 rounded ${invalidFields.includes('materialCost') ? 'border-red-500' : 'border-gray-300'}`}
              required
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="masterBatchCost">
              Master Batch Cost (KES)
            </label>
            <input
              type="number"
              name="masterBatchCost"
              id="masterBatchCost"
              placeholder="e.g., 100"
              title="Cost of master batch additive (KES, optional)"
              value={formData.masterBatchCost}
              onChange={handleInputChange}
              className={`w-full border p-2 rounded ${invalidFields.includes('masterBatchCost') ? 'border-red-500' : 'border-gray-300'}`}
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="weightPerUnit">
              Weight per Unit
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                name="weightPerUnit"
                id="weightPerUnit"
                placeholder={`e.g., ${formData.unit === 'grams' ? '215' : '0.215'}`}
                title={`Weight of one unit in ${formData.unit}`}
                value={formData.weightPerUnit}
                onChange={handleInputChange}
                className={`w-full border p-2 rounded ${invalidFields.includes('weightPerUnit') ? 'border-red-500' : 'border-gray-300'}`}
                required
                min="0"
                step="0.001"
              />
              <select
                name="unit"
                value={formData.unit}
                onChange={handleUnitChange}
                className="border p-2 rounded"
                title="Select unit for weight"
              >
                <option value="grams">Grams</option>
                <option value="kilograms">Kilograms</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="currentSellingPrice">
              Current Selling Price (KES)
            </label>
            <input
              type="number"
              name="currentSellingPrice"
              id="currentSellingPrice"
              placeholder="e.g., 65"
              title="Current market selling price per unit (KES)"
              value={formData.currentSellingPrice}
              onChange={handleInputChange}
              className={`w-full border p-2 rounded ${invalidFields.includes('currentSellingPrice') ? 'border-red-500' : 'border-gray-300'}`}
              required
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="hourlyProduction">
              Hourly Production (units)
            </label>
            <input
              type="number"
              name="hourlyProduction"
              id="hourlyProduction"
              placeholder="e.g., 140"
              title="Number of units produced per hour"
              value={formData.hourlyProduction}
              onChange={handleInputChange}
              className={`w-full border p-2 rounded ${invalidFields.includes('hourlyProduction') ? 'border-red-500' : 'border-gray-300'}`}
              required
              min="0"
              step="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="overheadType">
              Overhead Calculation
            </label>
            <div className="flex gap-2">
              <select
                name="overheadType"
                id="overheadType"
                value={formData.overheadType}
                onChange={handleOverheadTypeChange}
                className="w-full border p-2 rounded"
                title="Choose how to calculate overheads"
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
                  title="Percentage of cost per item for overheads"
                  value={formData.overheadPercentage}
                  onChange={handleInputChange}
                  className={`w-full border p-2 rounded ${invalidFields.includes('overheadPercentage') ? 'border-red-500' : 'border-gray-300'}`}
                  required
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
                  title="Machine operating cost per hour (KES)"
                  value={formData.machineCostPerHour}
                  onChange={handleInputChange}
                  className={`w-full border p-2 rounded ${invalidFields.includes('machineCostPerHour') ? 'border-red-500' : 'border-gray-300'}`}
                  required
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
            onClick={handleClearForm}
            className="bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
          >
            Clear Form
          </button>
        </div>
      </form>

      {/* Calculations Output */}
      {calculations && (
        <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Calculations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <p>Cost per Item: {calculations.costPerItem.toFixed(2)} KES</p>
            <p>Overheads per Item: {calculations.overheads.toFixed(2)} KES</p>
            <p>Proposed Selling Price: {calculations.proposedSellingPrice.toFixed(2)} KES</p>
            <p
              className={calculations.currentMargin < 0.2 ? 'text-red-500' : 'text-green-500'}
            >
              Current Margin: {(calculations.currentMargin * 100).toFixed(2)}%
            </p>
            {calculations.suggestedSellingPrice && (
              <p className="text-yellow-600">
                Suggested Selling Price (20% Margin): {calculations.suggestedSellingPrice.toFixed(2)} KES
              </p>
            )}
            <p>Profit Margin per KG: {calculations.profitMarginPerKg.toFixed(2)} KES</p>
          </div>
        </div>
      )}

      {/* Products Table */}
      {products.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Products</h2>
          <button
            onClick={handleDownloadReport}
            className="mb-4 bg-green-500 text-white p-2 rounded hover:bg-green-600"
          >
            Download Report
          </button>
          <div className="overflow-x-auto">
            <table className="w-full border text-sm">
              <thead>
                <tr className="bg-gray-200">
                  <th
                    className="p-2 cursor-pointer hover:bg-gray-300"
                    onClick={() => handleSort('productName')}
                  >
                    Product {sortKey === 'productName' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="p-2 cursor-pointer hover:bg-gray-300"
                    onClick={() => handleSort('item')}
                  >
                    Item {sortKey === 'item' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="p-2 cursor-pointer hover:bg-gray-300"
                    onClick={() => handleSort('materialCost')}
                  >
                    Material Cost {sortKey === 'materialCost' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="p-2 cursor-pointer hover:bg-gray-300"
                    onClick={() => handleSort('weightPerUnit')}
                  >
                    Weight per Unit {sortKey === 'weightPerUnit' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="p-2 cursor-pointer hover:bg-gray-300"
                    onClick={() => handleSort('calculations.costPerItem')}
                  >
                    Cost per Item {sortKey === 'calculations.costPerItem' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="p-2 cursor-pointer hover:bg-gray-300"
                    onClick={() => handleSort('calculations.overheads')}
                  >
                    Overheads per Item {sortKey === 'calculations.overheads' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="p-2 cursor-pointer hover:bg-gray-300"
                    onClick={() => handleSort('calculations.currentMargin')}
                  >
                    Current Margin {sortKey === 'calculations.currentMargin' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="p-2 cursor-pointer hover:bg-gray-300"
                    onClick={() => handleSort('calculations.proposedSellingPrice')}
                  >
                    Proposed Selling Price {sortKey === 'calculations.proposedSellingPrice' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="p-2 cursor-pointer hover:bg-gray-300"
                    onClick={() => handleSort('calculations.suggestedSellingPrice')}
                  >
                    Suggested Selling Price {sortKey === 'calculations.suggestedSellingPrice' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="p-2 cursor-pointer hover:bg-gray-300"
                    onClick={() => handleSort('calculations.profitMarginPerKg')}
                  >
                    Profit Margin per KG {sortKey === 'calculations.profitMarginPerKg' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id} className="border-t">
                    <td className="p-2">{product.productName}</td>
                    <td className="p-2">{product.item}</td>
                    <td className="p-2">{parseFloat(product.materialCost).toFixed(2)} KES</td>
                    <td className="p-2">{parseFloat(product.weightPerUnit).toFixed(3)} {product.unit}</td>
                    <td className="p-2">{product.calculations.costPerItem.toFixed(2)} KES</td>
                    <td className="p-2">{product.calculations.overheads.toFixed(2)} KES</td>
                    <td
                      className={
                        product.calculations.currentMargin < 0.2
                          ? 'p-2 text-red-500'
                          : 'p-2 text-green-500'
                      }
                    >
                      {(product.calculations.currentMargin * 100).toFixed(2)}%
                    </td>
                    <td className="p-2">{product.calculations.proposedSellingPrice.toFixed(2)} KES</td>
                    <td className="p-2">
                      {product.calculations.suggestedSellingPrice
                        ? product.calculations.suggestedSellingPrice.toFixed(2) + ' KES'
                        : '-'}
                    </td>
                    <td className="p-2">{product.calculations.profitMarginPerKg.toFixed(2)} KES</td>
                    <td className="p-2">
                      <button
                        onClick={() => handleDeleteProduct(product._id)}
                        className="bg-red-500 text-white p-1 rounded hover:bg-red-600"
                        title="Delete this product"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;