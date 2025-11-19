import React, { useState, useEffect } from 'react';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import { HiOutlineDownload } from 'react-icons/hi';

function Reports({ products, darkMode }) {
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [marginFilter, setMarginFilter] = useState('all');
  const [sortKey, setSortKey] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

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

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleMarginFilterChange = (e) => {
    setMarginFilter(e.target.value);
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
      const calc = recalcMetrics(product);
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
        costPerItem: calc.costPerItem.toFixed(2),
        overheads: calc.overheads.toFixed(2),
        proposedSellingPrice: calc.proposedSellingPrice.toFixed(2),
        currentMargin: (calc.currentMargin * 100).toFixed(2),
        suggestedSellingPrice: calc.suggestedSellingPrice
          ? calc.suggestedSellingPrice.toFixed(2)
          : '',
        profitMarginPerKg: calc.profitMarginPerKg.toFixed(2),
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

    const tableRows = filteredProducts.map((product) => {
      const calc = recalcMetrics(product);
      return [
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
        calc.costPerItem.toFixed(2),
        calc.overheads.toFixed(2),
        calc.proposedSellingPrice.toFixed(2),
        (calc.currentMargin * 100).toFixed(2),
        calc.suggestedSellingPrice
          ? calc.suggestedSellingPrice.toFixed(2)
          : '-',
        calc.profitMarginPerKg.toFixed(2),
      ];
    });

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
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { range: 1, defval: null });

      const validData = jsonData.filter(row =>
        row && Object.keys(row).length > 0 && Object.values(row).some(val => val !== null && val !== '')
      );

      if (validData.length === 0) {
        throw new Error('No valid data found in the Excel file');
      }

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

      // Warn about unmapped headers
      const unmappedHeaders = actualHeaders.filter(h => !headerMap[h]);
      if (unmappedHeaders.length > 0) {
        alert('Warning: The following columns are not recognized and will be ignored: ' + unmappedHeaders.join(', '));
      }


      // Pre-validate and clean data
      const requiredFields = ['productName', 'item', 'materialCost', 'weightPerUnit', 'currentSellingPrice', 'hourlyProduction'];
      const importData = [];
      const skippedRows = [];
      validData.forEach((product, idx) => {
        const cleanedProduct = {};
        Object.keys(product).forEach(key => {
          const normalizedKey = key.toLowerCase().replace(/\s+/g, '').replace(/\(.*?\)/g, '').replace(/[^a-zA-Z0-9]/g, '');
          const mappedKey = headerMap[normalizedKey] || normalizedKey;
          cleanedProduct[mappedKey] = product[key];
        });
        if (!cleanedProduct.unit) {
          cleanedProduct.unit = 'grams';
        }
        if (!cleanedProduct.overheadType) {
          cleanedProduct.overheadType = 'percentage';
          cleanedProduct.overheadPercentage = cleanedProduct.overheadPercentage || 25;
        }
        if (!cleanedProduct.masterBatchCost) {
          cleanedProduct.masterBatchCost = 0;
        }
        // Pre-validate required fields and types
        let missing = [];
        requiredFields.forEach(f => {
          if (!cleanedProduct[f] || cleanedProduct[f] === '' || cleanedProduct[f] === null) missing.push(f);
        });
        if (parseFloat(cleanedProduct.weightPerUnit) <= 0) missing.push('weightPerUnit');
        if (parseFloat(cleanedProduct.materialCost) <= 0) missing.push('materialCost');
        if (parseFloat(cleanedProduct.currentSellingPrice) <= 0) missing.push('currentSellingPrice');
        if (parseFloat(cleanedProduct.hourlyProduction) <= 0) missing.push('hourlyProduction');
        if (missing.length > 0) {
          skippedRows.push({ row: idx + 2, reason: 'Missing or invalid: ' + missing.join(', ') });
        } else {
          importData.push(cleanedProduct);
        }
      });

      if (importData.length === 0) {
        setError('No valid rows to import. Skipped rows: ' + skippedRows.map(r => `Row ${r.row} (${r.reason})`).join('; '));
        return;
      }

      const response = await fetch('http://localhost:5000/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(importData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        setError(`Import failed: ${errorText}`);
        return;
      }

      let summary = `Products imported successfully: ${importData.length}`;
      if (skippedRows.length > 0) {
        summary += `. Skipped rows: ` + skippedRows.map(r => `Row ${r.row} (${r.reason})`).join('; ');
      }
      setError(summary);
      setSelectedFile(null);
      document.getElementById('fileInput').value = '';
    } catch (err) {
      setError(`Import failed: ${err.message}`);
    }
  };

  const handleEdit = (product) => {
    navigate('/inputs', { state: { product } });
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete product');
      setFilteredProducts(filteredProducts.filter((p) => p._id !== productId));
    } catch (err) {
      setError('Failed to delete product');
    }
  };

  // Helper function to recalculate metrics for a single product (same as Inputs.js)
  const recalcMetrics = (product) => {
    const materialCost = parseFloat(product.materialCost) || 0;
    const masterBatchCost = parseFloat(product.masterBatchCost) || 0;
    const weightPerUnit = parseFloat(product.weightPerUnit) || 1;
    const currentSellingPrice = parseFloat(product.currentSellingPrice) || 0;
    const overheadPercentage = parseFloat(product.overheadPercentage) || 25;
    const materialPricePerKg = materialCost / 25;
    const totalMaterial = materialCost + masterBatchCost;
    const minimumProduction = 25000 / weightPerUnit;
    const costPerItem = totalMaterial / minimumProduction;
    const overheadRate = overheadPercentage / 100;
    const overheads = costPerItem * overheadRate;
    const profitMargin = (costPerItem + overheads) * 0.10;
    const sellingPriceExclusive = costPerItem + overheads + profitMargin;
    const vat = sellingPriceExclusive * 0.16;
    const proposedSellingPrice = sellingPriceExclusive + vat;
    const pcsFrom1Kg = 1000 / weightPerUnit;
    const valueOfProductFrom1Kg = currentSellingPrice * pcsFrom1Kg;
    const currentMargin = (currentSellingPrice - costPerItem * 1.16) / (currentSellingPrice || 1);
    const profitMarginPerKg = valueOfProductFrom1Kg - materialPricePerKg;
    let suggestedSellingPrice = null;
    if (currentMargin < 0.2) {
      suggestedSellingPrice = (costPerItem * 1.16) / 0.8;
    }
    return {
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
  };

  const inputClasses = `
    w-full px-4 py-2 rounded-xl border transition-colors duration-200
    ${darkMode
      ? 'bg-gray-900 border-gray-800 text-gray-100 focus:border-green-500 focus:ring-2 focus:ring-green-200'
      : 'bg-white border-gray-200 text-gray-900 focus:border-green-600 focus:ring-2 focus:ring-green-100'
    }
  `;

  const selectClasses = `
    px-4 py-2 rounded-xl border transition-colors duration-200
    ${darkMode
      ? 'bg-gray-900 border-gray-800 text-gray-100 focus:border-green-500 focus:ring-2 focus:ring-green-200'
      : 'bg-white border-gray-200 text-gray-900 focus:border-green-600 focus:ring-2 focus:ring-green-100'
    }
  `;

  const buttonClasses = (isPrimary = true) => `
    flex items-center gap-2 px-5 py-2 rounded-full font-semibold transition-colors duration-200 shadow-sm
    ${isPrimary
      ? darkMode
        ? 'bg-green-600 hover:bg-green-700 text-white'
        : 'bg-green-600 hover:bg-green-700 text-white'
      : darkMode
        ? 'bg-gray-800 hover:bg-gray-700 text-gray-100'
        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
    }
  `;

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
        Product Reports
      </h1>

      {error && (
        <div className={`mb-6 p-4 rounded-xl border ${darkMode
            ? 'bg-red-900 text-red-200 border-red-700'
            : 'bg-red-100 text-red-700 border-red-300'
          }`}>
          {error}
        </div>
      )}

      <div className={`p-4 md:p-6 rounded-xl ${darkMode ? 'bg-gray-900' : 'bg-white'
        } shadow-lg mb-6 border ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="flex flex-col gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by Product Name or Item..."
              value={searchTerm}
              onChange={handleSearchChange}
              className={inputClasses}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <select
                value={marginFilter}
                onChange={handleMarginFilterChange}
                className={selectClasses}
              >
                <option value="all">All Margins</option>
                <option value="below20">Current Margin &lt; 20%</option>
                <option value="above20">Current Margin ≥ 20%</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                type="file"
                id="fileInput"
                accept=".xlsx, .xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label
                htmlFor="fileInput"
                className={`${buttonClasses(false)} cursor-pointer text-sm md:text-base`}
              >
                Choose File
              </label>
              {selectedFile && (
                <button
                  onClick={handleFileUpload}
                  className={`${buttonClasses(true)} text-sm md:text-base`}
                >
                  Import
                </button>
              )}
              <button
                onClick={handleDownloadReport}
                className={`${buttonClasses(true)} text-sm md:text-base`}
              >
                <HiOutlineDownload className="text-base md:text-lg" /> Excel
              </button>
              <button
                onClick={handleDownloadPDF}
                className={`${buttonClasses(true)} text-sm md:text-base`}
              >
                <HiOutlineDownload className="text-base md:text-lg" /> PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-900' : 'bg-white'
          } shadow-lg text-center border ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            No products match your search or filter criteria.
          </p>
        </div>
      ) : (
        <div className={`overflow-x-auto rounded-xl ${darkMode ? 'bg-gray-900' : 'bg-white'
          } shadow-lg border ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <table className="w-full">
            <thead>
              <tr className={`${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                }`}>
                <th
                  className={`p-4 text-left font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'
                    } cursor-pointer hover:bg-opacity-75 transition-colors duration-200`}
                  onClick={() => handleSort('productName')}
                >
                  Product {sortKey === 'productName' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className={`p-4 text-left font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'
                    } cursor-pointer hover:bg-opacity-75 transition-colors duration-200`}
                  onClick={() => handleSort('item')}
                >
                  Item {sortKey === 'item' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className={`p-4 text-left font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'
                    } cursor-pointer hover:bg-opacity-75 transition-colors duration-200`}
                  onClick={() => handleSort('materialCost')}
                >
                  Material Cost {sortKey === 'materialCost' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className={`p-4 text-left font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'
                    } cursor-pointer hover:bg-opacity-75 transition-colors duration-200`}
                  onClick={() => handleSort('weightPerUnit')}
                >
                  Weight per Unit {sortKey === 'weightPerUnit' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className={`p-4 text-left font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'
                    } cursor-pointer hover:bg-opacity-75 transition-colors duration-200`}
                  onClick={() => handleSort('calculations.costPerItem')}
                >
                  Cost per Item {sortKey === 'calculations.costPerItem' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className={`p-4 text-left font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'
                    } cursor-pointer hover:bg-opacity-75 transition-colors duration-200`}
                  onClick={() => handleSort('calculations.overheads')}
                >
                  Overheads per Item {sortKey === 'calculations.overheads' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className={`p-4 text-left font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'
                    } cursor-pointer hover:bg-opacity-75 transition-colors duration-200`}
                  onClick={() => handleSort('calculations.currentMargin')}
                >
                  Current Margin {sortKey === 'calculations.currentMargin' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className={`p-4 text-left font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'
                    } cursor-pointer hover:bg-opacity-75 transition-colors duration-200`}
                  onClick={() => handleSort('calculations.proposedSellingPrice')}
                >
                  Proposed Selling Price {sortKey === 'calculations.proposedSellingPrice' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className={`p-4 text-left font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'
                    } cursor-pointer hover:bg-opacity-75 transition-colors duration-200`}
                  onClick={() => handleSort('calculations.suggestedSellingPrice')}
                >
                  Suggested Selling Price {sortKey === 'calculations.suggestedSellingPrice' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className={`p-4 text-left font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'
                    } cursor-pointer hover:bg-opacity-75 transition-colors duration-200`}
                  onClick={() => handleSort('calculations.profitMarginPerKg')}
                >
                  Profit Margin per KG {sortKey === 'calculations.profitMarginPerKg' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-4 text-left font-medium text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const calc = recalcMetrics(product);
                return (
                  <tr key={product._id} className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                    <td className={`p-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{product.productName}</td>
                    <td className={`p-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{product.item}</td>
                    <td className={`p-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{parseFloat(product.materialCost).toFixed(2)} KES</td>
                    <td className={`p-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{parseFloat(product.weightPerUnit).toFixed(3)} {product.unit}</td>
                    <td className={`p-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{calc.costPerItem.toFixed(2)} KES</td>
                    <td className={`p-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{calc.overheads.toFixed(2)} KES</td>
                    <td className={`p-4 ${calc.currentMargin < 0.2 ? 'text-red-500' : 'text-green-500'}`}>{(calc.currentMargin * 100).toFixed(2)}%</td>
                    <td className={`p-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{calc.proposedSellingPrice.toFixed(2)} KES</td>
                    <td className={`p-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{calc.suggestedSellingPrice ? calc.suggestedSellingPrice.toFixed(2) + ' KES' : '-'}</td>
                    <td className={`p-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{calc.profitMarginPerKg.toFixed(2)} KES</td>
                    <td className="p-4 flex gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Reports;