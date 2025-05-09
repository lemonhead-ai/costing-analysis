import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function Inputs({ addProduct, darkMode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const editingProduct = location.state && location.state.product;

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

  const [calculations, setCalculations] = useState(null);
  const [error, setError] = useState('');
  const [invalidFields, setInvalidFields] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        productName: editingProduct.productName || '',
        item: editingProduct.item || '',
        materialCost: editingProduct.materialCost?.toString() || '',
        masterBatchCost: editingProduct.masterBatchCost?.toString() || '0',
        weightPerUnit: editingProduct.weightPerUnit?.toString() || '',
        currentSellingPrice: editingProduct.currentSellingPrice?.toString() || '',
        hourlyProduction: editingProduct.hourlyProduction?.toString() || '',
        unit: editingProduct.unit || 'grams',
        overheadType: editingProduct.overheadType || 'percentage',
        overheadPercentage: editingProduct.overheadPercentage?.toString() || '25',
        machineCostPerHour: editingProduct.machineCostPerHour?.toString() || '500',
      });
      setIsEditMode(true);
      setCalculations(editingProduct.calculations || null);
    }
  }, [editingProduct]);

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

    const weightPerUnit =
      formData.unit === 'kilograms'
        ? parseFloat(formData.weightPerUnit) * 1000
        : parseFloat(formData.weightPerUnit);
    const newInvalidFields = [];
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

    try {
      const materialPricePerKg = parseFloat(formData.materialCost) / 25;
      const totalMaterial =
        parseFloat(formData.materialCost) + parseFloat(formData.masterBatchCost || 0);
      const minimumProduction = 25000 / weightPerUnit;
      const costPerItem = totalMaterial / minimumProduction;

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

      const productData = { ...formData, calculations: newCalculations };
      if (isEditMode && editingProduct && editingProduct._id) {
        const response = await fetch(`http://localhost:5000/api/products/${editingProduct._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData),
        });
        if (!response.ok) throw new Error('Failed to update product');
        setIsEditMode(false);
        navigate('/reports');
      } else {
        addProduct(productData);
        handleClearForm();
      }
    } catch (err) {
      setError('Calculation error. Please check your inputs.');
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    handleClearForm();
    navigate('/inputs', { replace: true, state: null });
  };

  const inputClasses = (fieldName) => `
    w-full px-4 py-2 rounded-lg border transition-colors duration-200
    ${darkMode 
      ? 'bg-gray-800 border-gray-700 text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20' 
      : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
    }
    ${invalidFields.includes(fieldName) 
      ? darkMode 
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
        : 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
      : ''
    }
  `;

  const selectClasses = `
    px-4 py-2 rounded-lg border transition-colors duration-200
    ${darkMode 
      ? 'bg-gray-800 border-gray-700 text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20' 
      : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
    }
  `;

  const buttonClasses = (isPrimary = true) => `
    px-6 py-2 rounded-lg font-medium transition-colors duration-200
    ${isPrimary
      ? darkMode
        ? 'bg-blue-600 hover:bg-blue-700 text-white'
        : 'bg-blue-500 hover:bg-blue-600 text-white'
      : darkMode
        ? 'bg-gray-700 hover:bg-gray-600 text-gray-100'
        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
    }
  `;

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
        {isEditMode ? 'Edit Product' : 'Add New Product'}
      </h1>

      {error && (
        <div className={`mb-6 p-4 rounded-lg ${
          darkMode 
            ? 'bg-red-900/50 text-red-200 border border-red-700' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className={`p-6 rounded-xl ${
        darkMode ? 'bg-gray-800/50' : 'bg-white'
      } shadow-lg`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`} htmlFor="productName">
              Product Name
            </label>
            <input
              type="text"
              name="productName"
              id="productName"
              placeholder="e.g., BASINS"
              value={formData.productName}
              onChange={handleInputChange}
              className={inputClasses('productName')}
              required
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`} htmlFor="item">
              Item
            </label>
            <input
              type="text"
              name="item"
              id="item"
              placeholder="e.g., GRADE 1"
              value={formData.item}
              onChange={handleInputChange}
              className={inputClasses('item')}
              required
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`} htmlFor="materialCost">
              Material Cost (KES per 25kg)
            </label>
            <input
              type="number"
              name="materialCost"
              id="materialCost"
              placeholder="e.g., 5300"
              value={formData.materialCost}
              onChange={handleInputChange}
              className={inputClasses('materialCost')}
              required
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`} htmlFor="masterBatchCost">
              Master Batch Cost (KES)
            </label>
            <input
              type="number"
              name="masterBatchCost"
              id="masterBatchCost"
              placeholder="e.g., 100"
              value={formData.masterBatchCost}
              onChange={handleInputChange}
              className={inputClasses('masterBatchCost')}
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`} htmlFor="weightPerUnit">
              Weight per Unit
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                name="weightPerUnit"
                id="weightPerUnit"
                placeholder={`e.g., ${formData.unit === 'grams' ? '215' : '0.215'}`}
                value={formData.weightPerUnit}
                onChange={handleInputChange}
                className={inputClasses('weightPerUnit')}
                required
                min="0"
                step="0.001"
              />
              <select
                name="unit"
                value={formData.unit}
                onChange={handleUnitChange}
                className={selectClasses}
              >
                <option value="grams">Grams</option>
                <option value="kilograms">Kilograms</option>
              </select>
            </div>
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`} htmlFor="currentSellingPrice">
              Current Selling Price (KES)
            </label>
            <input
              type="number"
              name="currentSellingPrice"
              id="currentSellingPrice"
              placeholder="e.g., 65"
              value={formData.currentSellingPrice}
              onChange={handleInputChange}
              className={inputClasses('currentSellingPrice')}
              required
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`} htmlFor="hourlyProduction">
              Hourly Production (units)
            </label>
            <input
              type="number"
              name="hourlyProduction"
              id="hourlyProduction"
              placeholder="e.g., 140"
              value={formData.hourlyProduction}
              onChange={handleInputChange}
              className={inputClasses('hourlyProduction')}
              required
              min="0"
              step="1"
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`} htmlFor="overheadType">
              Overhead Calculation
            </label>
            <div className="flex gap-2">
              <select
                name="overheadType"
                id="overheadType"
                value={formData.overheadType}
                onChange={handleOverheadTypeChange}
                className={selectClasses}
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
                  className={inputClasses('overheadPercentage')}
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
                  value={formData.machineCostPerHour}
                  onChange={handleInputChange}
                  className={inputClasses('machineCostPerHour')}
                  required
                  min="0"
                  step="0.01"
                />
              )}
            </div>
          </div>
        </div>
        <div className="mt-8 flex gap-4">
          <button
            type="submit"
            className={buttonClasses(true)}
          >
            {isEditMode ? 'Update Product' : 'Calculate'}
          </button>
          <button
            type="button"
            onClick={handleClearForm}
            className={buttonClasses(false)}
          >
            Clear Form
          </button>
          {isEditMode && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-6 py-2 rounded-lg font-medium transition-colors duration-200 bg-gray-500 hover:bg-gray-600 text-white"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      {calculations && (
        <div className={`mt-8 p-6 rounded-xl ${
          darkMode ? 'bg-gray-800/50' : 'bg-white'
        } shadow-lg`}>
          <h2 className={`text-xl font-semibold mb-6 ${
            darkMode ? 'text-gray-100' : 'text-gray-900'
          }`}>
            Calculations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`p-4 rounded-lg ${
              darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
            }`}>
              <p className={`text-sm font-medium mb-1 ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Cost per Item
              </p>
              <p className={`text-lg font-semibold ${
                darkMode ? 'text-gray-100' : 'text-gray-900'
              }`}>
                {calculations.costPerItem.toFixed(2)} KES
              </p>
            </div>
            <div className={`p-4 rounded-lg ${
              darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
            }`}>
              <p className={`text-sm font-medium mb-1 ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Overheads per Item
              </p>
              <p className={`text-lg font-semibold ${
                darkMode ? 'text-gray-100' : 'text-gray-900'
              }`}>
                {calculations.overheads.toFixed(2)} KES
              </p>
            </div>
            <div className={`p-4 rounded-lg ${
              darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
            }`}>
              <p className={`text-sm font-medium mb-1 ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Proposed Selling Price
              </p>
              <p className={`text-lg font-semibold ${
                darkMode ? 'text-gray-100' : 'text-gray-900'
              }`}>
                {calculations.proposedSellingPrice.toFixed(2)} KES
              </p>
            </div>
            <div className={`p-4 rounded-lg ${
              calculations.currentMargin < 0.2
                ? darkMode
                  ? 'bg-red-900/30'
                  : 'bg-red-50'
                : darkMode
                  ? 'bg-green-900/30'
                  : 'bg-green-50'
            }`}>
              <p className={`text-sm font-medium mb-1 ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Current Margin
              </p>
              <p className={`text-lg font-semibold ${
                calculations.currentMargin < 0.2
                  ? 'text-red-500'
                  : 'text-green-500'
              }`}>
                {(calculations.currentMargin * 100).toFixed(2)}%
              </p>
            </div>
            {calculations.suggestedSellingPrice && (
              <div className={`p-4 rounded-lg ${
                darkMode ? 'bg-yellow-900/30' : 'bg-yellow-50'
              }`}>
                <p className={`text-sm font-medium mb-1 ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Suggested Selling Price (20% Margin)
                </p>
                <p className="text-lg font-semibold text-yellow-600">
                  {calculations.suggestedSellingPrice.toFixed(2)} KES
                </p>
              </div>
            )}
            <div className={`p-4 rounded-lg ${
              darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
            }`}>
              <p className={`text-sm font-medium mb-1 ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Profit Margin per KG
              </p>
              <p className={`text-lg font-semibold ${
                darkMode ? 'text-gray-100' : 'text-gray-900'
              }`}>
                {calculations.profitMarginPerKg.toFixed(2)} KES
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inputs;