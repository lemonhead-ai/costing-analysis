import React, { useState, useEffect } from 'react';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

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
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [calculations, setCalculations] = useState(null);
  const [error, setError] = useState('');
  const [invalidFields, setInvalidFields] = useState([]);
  const [sortKey, setSortKey] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [marginFilter, setMarginFilter] = useState('all');
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    let filtered = [...products];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.productName.toLowerCase().includes(lowerSearch) ||
          product.item.toLowerCase().includes(lowerSearch)
      );
    }

    if (marginFilter !== 'all') {
      if (marginFilter === 'below20') {
        filtered = filtered.filter((product) => product.calculations.currentMargin < 0.2);
      } else if (marginFilter === 'above20') {
        filtered = filtered.filter((product) => product.calculations.currentMargin >= 0.2);
      }
    }

    if (sortKey) {
      filtered.sort((a, b) => {
        let valueA, valueB;
        const isNested = sortKey.includes('.');
        if (isNested) {
          const [parent, child] = sortKey.split('.');
          valueA = a[parent][child];
          valueB = b[parent][child];
        } else {
          valueA = a[sortKey];
          valueB = b[sortKey];
        }

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
        if (numericFields.includes(sortKey)) {
          valueA = parseFloat(valueA) || (sortKey === 'calculations.suggestedSellingPrice' ? Infinity : 0);
          valueB = parseFloat(valueB) || (sortKey === 'calculations.suggestedSellingPrice' ? Infinity : 0);
        } else {
          valueA = valueA ? valueA.toString().toLowerCase() : '';
          valueB = valueB ? valueB.toString().toLowerCase() : '';
        }

        if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
        if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, marginFilter, sortKey, sortDirection]);

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

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleMarginFilterChange = (e) => {
    setMarginFilter(e.target.value);
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
    setEditingProduct(null);
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
      let response;
      if (editingProduct) {
        response = await fetch(`http://localhost:5000/api/products/${editingProduct._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData),
        });
      } else {
        response = await fetch('http://localhost:5000/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData),
        });
      }

      if (!response.ok) {
        throw new Error('Failed to save product');
      }

      await fetchProducts();
      handleClearForm();
    } catch (err) {
      setError('Calculation or server error. Please check your inputs.');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!id) {
      console.error('Product ID is undefined');
      setError('Invalid product ID');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/products/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete product');
      }
      await fetchProducts();
      setError(''); // Clear any previous error
    } catch (err) {
      console.error('Delete error:', err.message);
      setError(`Failed to delete product: ${err.message}`);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setFormData({
      productName: product.productName,
      item: product.item,
      materialCost: product.materialCost,
      masterBatchCost: product.masterBatchCost,
      weightPerUnit: product.weightPerUnit,
      currentSellingPrice: product.currentSellingPrice,
      hourlyProduction: product.hourlyProduction,
      unit: product.unit,
      overheadType: product.overheadType,
      overheadPercentage: product.overheadPercentage,
      machineCostPerHour: product.machineCostPerHour,
    });
    setCalculations(product.calculations);
  };

  const handleSort = (key) => {
    setSortKey(key);
    setSortDirection(sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc');
  };

  const handleDownloadReport = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Costing Analysis');

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

    filteredProducts.forEach((product) => {
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

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' },
    };

    ['materialCost', 'masterBatchCost', 'currentSellingPrice', 'machineCostPerHour', 'costPerItem', 'overheads', 'proposedSellingPrice', 'suggestedSellingPrice', 'profitMarginPerKg'].forEach((key) => {
      const col = worksheet.getColumn(key);
      col.numFmt = '"KES" #,##0.00';
    });
    worksheet.getColumn('currentMargin').numFmt = '0.00%';
    worksheet.getColumn('overheadPercentage').numFmt = '0.00%';

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, 'Costing_Analysis_Report.xlsx');
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text('Plastify Costing Analysis Report', 14, 20);

    const tableColumns = [
      'Product Name',
      'Item',
      'Material Cost (KES)',
      'Master Batch Cost (KES)',
      'Weight per Unit',
      'Unit',
      'Current Selling Price (KES)',
      'Hourly Production (units)',
      'Overhead Type',
      'Overhead Percentage (%)',
      'Machine Cost per Hour (KES)',
      'Cost per Item (KES)',
      'Overheads per Item (KES)',
      'Proposed Selling Price (KES)',
      'Current Margin (%)',
      'Suggested Selling Price (KES)',
      'Profit Margin per KG (KES)',
    ];

    const tableRows = filteredProducts.map((product) => [
      product.productName,
      product.item,
      parseFloat(product.materialCost).toFixed(2),
      parseFloat(product.masterBatchCost).toFixed(2),
      parseFloat(product.weightPerUnit).toFixed(3),
      product.unit,
      parseFloat(product.currentSellingPrice).toFixed(2),
      parseFloat(product.hourlyProduction),
      product.overheadType,
      parseFloat(product.overheadPercentage).toFixed(2),
      parseFloat(product.machineCostPerHour).toFixed(2),
      product.calculations.costPerItem.toFixed(2),
      product.calculations.overheads.toFixed(2),
      product.calculations.proposedSellingPrice.toFixed(2),
      (product.calculations.currentMargin * 100).toFixed(2),
      product.calculations.suggestedSellingPrice
        ? product.calculations.suggestedSellingPrice.toFixed(2)
        : '-',
      product.calculations.profitMarginPerKg.toFixed(2),
    ]);

    autoTable(doc, {
      head: [tableColumns],
      body: tableRows,
      startY: 30,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
      theme: 'grid',
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 15 },
        2: { cellWidth: 15 },
        3: { cellWidth: 15 },
        4: { cellWidth: 15 },
        5: { cellWidth: 10 },
        6: { cellWidth: 15 },
        7: { cellWidth: 15 },
        8: { cellWidth: 15 },
        9: { cellWidth: 15 },
        10: { cellWidth: 15 },
        11: { cellWidth: 15 },
        12: { cellWidth: 15 },
        13: { cellWidth: 15 },
        14: { cellWidth: 15 },
        15: { cellWidth: 15 },
        16: { cellWidth: 15 },
      },
      margin: { top: 30 },
      didDrawPage: (data) => {
        doc.setFontSize(10);
        doc.text(
          `Page ${doc.internal.getNumberOfPages()}`,
          doc.internal.pageSize.width - 20,
          doc.internal.pageSize.height - 10,
          { align: 'right' }
        );
      },
    });

    doc.save('Costing_Analysis_Report.pdf');
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setError('Please select a file');
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
    setError('');
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setError('No file selected for import');
      return;
    }

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      // Start parsing from row 2 (0-based index) to skip the title row
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { range: 1, defval: null });

      // Filter out empty rows
      const validData = jsonData.filter(row =>
        row && Object.keys(row).length > 0 && Object.values(row).some(val => val !== null && val !== '')
      );

      if (validData.length === 0) {
        throw new Error('No valid data found in the Excel file');
      }

      // Debug: Log the first row to check headers
      console.log('Parsed Headers:', Object.keys(validData[0]));
      console.log('First Data Row:', validData[0]);

      // Expected column headers (case-insensitive)
      const expectedHeaders = [
        'productName',
        'item',
        'materialCost',
        'masterBatchCost',
        'weightPerUnit',
        'unit',
        'currentSellingPrice',
        'hourlyProduction',
        'overheadType',
        'overheadPercentage',
        'machineCostPerHour',
      ];

      // Normalize headers: remove spaces, extra words, and convert to lowercase
      const headerMap = {
        'products': 'productName',
        'item': 'item',
        'materialcostkgs': 'materialCost',
        'materialcost': 'materialCost',
        'masterbatch': 'masterBatchCost',
        'weightperunitproduced': 'weightPerUnit',
        'weightperunit': 'weightPerUnit',
        'currentsellingprice': 'currentSellingPrice',
        'hourlyproduction': 'hourlyProduction',
      };

      const actualHeaders = Object.keys(validData[0] || {}).map(h => 
        h.toLowerCase().replace(/\s+/g, '').replace(/\(.*?\)/g, '').replace(/[^a-zA-Z0-9]/g, '')
      );

      // Debug: Log normalized headers
      console.log('Normalized Headers:', actualHeaders);

      // Map actual headers to expected headers
      const mappedHeaders = actualHeaders.map(h => headerMap[h] || h);

      const missingHeaders = expectedHeaders.filter((header, index) => {
        const found = mappedHeaders.includes(header);
        if (!found && ['unit', 'overheadType', 'overheadPercentage', 'machineCostPerHour'].includes(header)) {
          return false; // These will be defaulted
        }
        return !found;
      });

      if (missingHeaders.length > 0) {
        throw new Error(
          `Missing required columns: ${missingHeaders.join(', ')}. Expected columns: ${expectedHeaders.join(', ')}.`
        );
      }

      // Prepare data for import
      const importData = validData.map(product => {
        const cleanedProduct = {};
        Object.keys(product).forEach(key => {
          const normalizedKey = key.toLowerCase().replace(/\s+/g, '').replace(/\(.*?\)/g, '').replace(/[^a-zA-Z0-9]/g, '');
          const mappedKey = headerMap[normalizedKey] || normalizedKey;
          cleanedProduct[mappedKey] = product[key];
        });

        // Default missing fields
        if (!cleanedProduct.unit) {
          cleanedProduct.unit = 'grams'; // Infer from "GMS" in sub-row
        }
        if (!cleanedProduct.overheadType) {
          cleanedProduct.overheadType = 'percentage';
          cleanedProduct.overheadPercentage = cleanedProduct.overheadPercentage || 25;
        }
        if (!cleanedProduct.masterBatchCost) {
          cleanedProduct.masterBatchCost = 0;
        }

        // Remove calculated fields that the backend will recompute
        delete cleanedProduct.totalMaterial;
        delete cleanedProduct.minimumProduction;
        delete cleanedProduct.costPerItemDirectCost;
        delete cleanedProduct.overheadsAvg;
        delete cleanedProduct.profitMargin;
        delete cleanedProduct.sellingPriceExclusive;
        delete cleanedProduct.vat;
        delete cleanedProduct.proposedSellingPriceInclusive;
        delete cleanedProduct.currentMargin;
        delete cleanedProduct.proposedMargin;
        delete cleanedProduct.totalWeightOfUnitsProduced;
        delete cleanedProduct.profitMarginPerKg;
        delete cleanedProduct.pcsFrom1Kg;
        delete cleanedProduct.materialPriceKg;
        delete cleanedProduct.valueOfProductFrom1Kg;

        return cleanedProduct;
      });

      const response = await fetch('http://localhost:5000/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(importData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to import: ${errorText || 'Server error'}`);
      }

      await fetchProducts();
      setError('Products imported successfully');
      setSelectedFile(null);
      document.getElementById('fileInput').value = ''; // Reset file input
    } catch (err) {
      console.error('Import error:', err.message);
      setError(`Import failed: ${err.message}`);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">Costing Analysis System</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-700 rounded">
          {error}
        </div>
      )}

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
            {editingProduct ? 'Save Changes' : 'Calculate'}
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

      {products.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Products</h2>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by Product Name or Item..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full border p-2 rounded"
                title="Search products by name or item"
              />
            </div>
            <div className="flex-1">
              <select
                value={marginFilter}
                onChange={handleMarginFilterChange}
                className="w-full border p-2 rounded"
                title="Filter products by current margin"
              >
                <option value="all">All Margins</option>
                <option value="below20">Current Margin &lt; 20%</option>
                <option value="above20">Current Margin ≥ 20%</option>
              </select>
            </div>
            <div className="flex gap-2">
              <input
                type="file"
                id="fileInput"
                accept=".xlsx, .xls"
                onChange={handleFileSelect}
                className="border p-2 rounded"
                title="Select an Excel file to import products"
              />
              {selectedFile && (
                <button
                  onClick={handleFileUpload}
                  className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                >
                  Import
                </button>
              )}
              <button
                onClick={handleDownloadReport}
                className="bg-green-500 text-white p-2 rounded hover:bg-green-600"
              >
                Download Excel Report
              </button>
              <button
                onClick={handleDownloadPDF}
                className="bg-purple-500 text-white p-2 rounded hover:bg-purple-600"
              >
                Download PDF Report
              </button>
            </div>
          </div>
          {filteredProducts.length === 0 ? (
            <p className="text-gray-500">No products match your search or filter criteria.</p>
          ) : (
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
                  {filteredProducts.map((product) => (
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
                          onClick={() => handleEditProduct(product)}
                          className="bg-yellow-500 text-white p-1 mr-2 rounded hover:bg-yellow-600"
                          title="Edit this product"
                        >
                          Edit
                        </button>
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
          )}
        </div>
      )}
    </div>
  );
}

export default App;