import React, { useState, useEffect, useRef } from 'react';
import { CiLight, CiDark, CiUser } from 'react-icons/ci';
import { LuSettings } from 'react-icons/lu';
import { GrPersonalComputer } from 'react-icons/gr';
import { motion, AnimatePresence } from 'framer-motion';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { HiOutlineDownload } from 'react-icons/hi';

const TopNav = ({ darkMode, setDarkMode, onSearch, products }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const searchRef = useRef(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mode, setMode] = useState(() => localStorage.getItem('themeMode') || 'system'); // 'system', 'light', 'dark'
  const [searchBarFocused, setSearchBarFocused] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false); // For download overlay
  const downloadRef = useRef(null);
  const settingsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // System theme detection
  useEffect(() => {
    if (mode === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      setDarkMode(mq.matches);
      const handler = (e) => setDarkMode(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } else {
      setDarkMode(mode === 'dark');
    }
    localStorage.setItem('themeMode', mode);
  }, [mode, setDarkMode]);

  // Click-away handler for overlays
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        downloadRef.current &&
        !downloadRef.current.contains(event.target) &&
        settingsRef.current &&
        !settingsRef.current.contains(event.target)
      ) {
        setDownloadOpen(false);
        setSettingsOpen(false);
      } else if (
        downloadRef.current &&
        !downloadRef.current.contains(event.target)
        && downloadOpen
      ) {
        setDownloadOpen(false);
      } else if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target)
        && settingsOpen
      ) {
        setSettingsOpen(false);
      }
    }
    if (downloadOpen || settingsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [downloadOpen, settingsOpen]);

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term.trim()) {
      const results = products.filter(
        (product) =>
          product.productName.toLowerCase().includes(term.toLowerCase()) ||
          product.item.toLowerCase().includes(term.toLowerCase())
      );
      setSearchResults(results);
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const handleResultClick = (product) => {
    setSearchTerm('');
    setShowResults(false);
    setSelectedProduct(product);
    if (onSearch) onSearch(product.productName);
  };

  const recalcMetrics = (product) => {
    const materialCost = parseFloat(product.materialCost) || 0;
    const masterBatchCost = parseFloat(product.masterBatchCost) || 0;
    let weightPerUnit = parseFloat(product.weightPerUnit) || 1;
    const currentSellingPrice = parseFloat(product.currentSellingPrice) || 0;
    const overheadPercentage = parseFloat(product.overheadPercentage) || 25;
    // Handle unit conversion
    if (product.unit === 'kilograms') {
      weightPerUnit *= 1000;
    }
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
    const currentMargin = currentSellingPrice
      ? (currentSellingPrice - (costPerItem * 1.16)) / currentSellingPrice
      : 0;
    const profitMarginPerKg = valueOfProductFrom1Kg - materialPricePerKg;
    let suggestedSellingPrice = null;
    if (currentMargin < 0.2) {
      suggestedSellingPrice = (costPerItem * 1.16) / 0.8;
    }
    return {
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
      suggestedSellingPrice,
    };
  };

  const handleDownloadExcel = async () => {
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

    products.forEach((product) => {
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
    saveAs(blob, 'Costing Report.xlsx');
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text('Costing Analysis Report', 14, 20);

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

    const tableRows = products.map((product) => {
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

    doc.save('Costing Report.pdf');
  };

  // Helper: Render overlay and results below the TopNav search box
  const renderSearchOverlay = () => (
    <>
      {/* Overlay below TopNav */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed left-0 right-0 top-20 bottom-0 bg-black/10 backdrop-blur-md z-[50]"
        onClick={() => setShowResults(false)}
      />
      {/* Results dropdown, aligned with the search box */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="absolute left-0 right-0 top-full mt-2 z-[101] dark:bg-gray-900/70 backdrop-filter backdrop-blur-30"
        style={{ pointerEvents: 'auto' }}
      >
        <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-lg border max-h-[60vh] overflow-y-auto`}> 
          <div className="p-2">
            {searchResults.length === 0 && (
              <div className="text-gray-400 text-center py-6">No results found.</div>
            )}
            {searchResults.map((product) => {
              const calc = recalcMetrics(product);
              return (
                <motion.button
                  key={product._id}
                  onClick={() => handleResultClick(product)}
                  className={`w-full text-left p-4 rounded-lg transition-colors duration-200 ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex flex-col">
                    <span className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>{product.productName}</span>
                    <span className="text-gray-400 text-sm">{product.item}</span>
                    <div className="flex gap-4 mt-1 text-sm">
                      <span className="text-gray-400">
                        Cost: {calc.costPerItem.toFixed(2)} KES
                      </span>
                      <span className={`${
                        calc.currentMargin < 0.2
                          ? 'text-red-500'
                          : 'text-green-600'
                      }`}>
                        Margin: {(calc.currentMargin * 100).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </>
  );

  // Product details card below TopNav
  const renderProductDetails = () => {
    if (!selectedProduct) return null;
    const calc = recalcMetrics(selectedProduct);
    return (
      <div className={`max-w-2xl mx-auto mt-6 mb-2 p-6 rounded-xl shadow-lg border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedProduct.productName} <span className="text-base font-normal text-gray-400">({selectedProduct.item})</span></h3>
          <button
            onClick={() => {
              setSelectedProduct(null);
              if (onSearch) onSearch('');
            }}
            className="ml-4 px-4 py-2 rounded-full bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors duration-200"
          >
            Dismiss
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="mb-2 text-sm text-gray-400">Material Cost</div>
            <div className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{parseFloat(selectedProduct.materialCost).toFixed(2)} KES</div>
          </div>
          <div>
            <div className="mb-2 text-sm text-gray-400">Master Batch Cost</div>
            <div className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{parseFloat(selectedProduct.masterBatchCost).toFixed(2)} KES</div>
          </div>
          <div>
            <div className="mb-2 text-sm text-gray-400">Weight per Unit</div>
            <div className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{parseFloat(selectedProduct.weightPerUnit).toFixed(3)} {selectedProduct.unit}</div>
          </div>
          <div>
            <div className="mb-2 text-sm text-gray-400">Current Selling Price</div>
            <div className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{parseFloat(selectedProduct.currentSellingPrice).toFixed(2)} KES</div>
          </div>
          <div>
            <div className="mb-2 text-sm text-gray-400">Overhead (%)</div>
            <div className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{parseFloat(selectedProduct.overheadPercentage).toFixed(2)}%</div>
          </div>
          <div>
            <div className="mb-2 text-sm text-gray-400">Hourly Production</div>
            <div className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{parseFloat(selectedProduct.hourlyProduction).toFixed(2)}</div>
          </div>
        </div>
        <hr className={`my-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="mb-2 text-sm text-gray-400">Cost per Item</div>
            <div className={`text-lg font-semibold ${darkMode ? 'text-green-400' : 'text-green-700'}`}>{calc.costPerItem.toFixed(2)} KES</div>
          </div>
          <div>
            <div className="mb-2 text-sm text-gray-400">Overheads per Item</div>
            <div className={`text-lg font-semibold ${darkMode ? 'text-green-400' : 'text-green-700'}`}>{calc.overheads.toFixed(2)} KES</div>
          </div>
          <div>
            <div className="mb-2 text-sm text-gray-400">Profit Margin</div>
            <div className={`text-lg font-semibold ${darkMode ? 'text-green-400' : 'text-green-700'}`}>{calc.profitMargin.toFixed(2)} KES</div>
          </div>
          <div>
            <div className="mb-2 text-sm text-gray-400">Proposed Selling Price</div>
            <div className={`text-lg font-semibold ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>{calc.proposedSellingPrice.toFixed(2)} KES</div>
          </div>
          <div>
            <div className="mb-2 text-sm text-gray-400">Current Margin</div>
            <div className={`text-lg font-semibold ${calc.currentMargin < 0.2 ? 'text-red-500' : 'text-green-600'}`}>{(calc.currentMargin * 100).toFixed(2)}%</div>
          </div>
          <div>
            <div className="mb-2 text-sm text-gray-400">Suggested Selling Price</div>
            <div className={`text-lg font-semibold ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>{calc.suggestedSellingPrice ? calc.suggestedSellingPrice.toFixed(2) + ' KES' : '-'}</div>
          </div>
          <div>
            <div className="mb-2 text-sm text-gray-400">Profit Margin per KG</div>
            <div className={`text-lg font-semibold ${darkMode ? 'text-green-400' : 'text-green-700'}`}>{calc.profitMarginPerKg.toFixed(2)} KES</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <motion.div
        className={`w-full px-8 py-3 flex items-center z-20 relative bg-transparent border-none shadow-none backdrop-blur-md`}
        initial={false}
      >
        {/* Left section - Costify title */}
        <motion.div
          className="flex-shrink-0"
          animate={searchBarFocused ? { 
            x: -30,
            scale: 0.8 
          } : { 
            x: 0,
            scale: 1,
            backdropFilter: 'blur(50px)'
          }}
          transition={{ 
            type: 'spring', 
            stiffness: 300, 
            damping: 10,
            mass: 0.8
          }}
        >
          <h2 className={`text-2xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Costify
          </h2>
        </motion.div>

        {/* Center section - Search bar */}
        <div className="flex-1 flex justify-center px-8">
          <div className="relative w-full max-w-md" ref={searchRef}>
            <motion.input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={handleSearch}
              onFocus={() => setSearchBarFocused(true)}
              onBlur={() => setTimeout(() => setSearchBarFocused(false), 400)}
              className={`w-full px-5 py-2 rounded-full border focus:outline-none text-base font-medium ${
                darkMode
                  ? 'bg-gray-800 border-gray-700 text-gray-100 focus:border-green-500'
                  : 'bg-white border-gray-300 text-gray-900 focus:border-green-600'
              }`}
              animate={searchBarFocused ? { 
                width: '140%',
                x: '-14.3%' // This centers the expanded input
              } : { 
                width: '100%',
                x: '0%'
              }}
              transition={{ 
                type: 'spring', 
                stiffness: 300, 
                damping: 10,
                mass: 0.8
              }}
            />
            <AnimatePresence>
              {showResults && renderSearchOverlay()}
            </AnimatePresence>
          </div>
        </div>

        {/* Right section - Icons */}
        <motion.div
          className="flex items-center space-x-4 flex-shrink-0"
          animate={searchBarFocused ? { 
            x: 30,
            scale: 0.8 
          } : { 
            x: 0,
            scale: 1,
            backdropFilter: 'blur(50px)'
          }}
          transition={{ 
            type: 'spring', 
            stiffness: 300, 
            damping: 10,
            mass: 0.8
          }}
        >
          <div className="relative" ref={downloadRef}>
            {/* Download Button and Overlay */}
            <motion.button
              onClick={() => { setDownloadOpen((v) => !v); setSettingsOpen(false); }}
              className={`px-4 py-2 rounded-full font-semibold shadow-sm transition-colors duration-200 flex items-center gap-2 ${darkMode ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
              title="Download"
            >
              <HiOutlineDownload className="text-lg" />
            </motion.button>
            {downloadOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className={`absolute right-0 mt-2 w-44 rounded-xl shadow-lg z-50 p-2 flex flex-col gap-2 ${darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'}`}
              >
                <button
                  className="flex items-center w-full px-3 py-2 rounded-lg text-left gap-2 transition-colors duration-150 bg-green-600 text-white font-bold hover:bg-green-700"
                  onClick={() => { setDownloadOpen(false); handleDownloadExcel(); }}
                >
                  <HiOutlineDownload className="text-lg" />
                  <span>Excel</span>
                </button>
                <button
                  className="flex items-center w-full px-3 py-2 rounded-lg text-left gap-2 transition-colors duration-150 bg-blue-600 text-white font-bold hover:bg-blue-700"
                  onClick={() => { setDownloadOpen(false); handleDownloadPDF(); }}
                >
                  <HiOutlineDownload className="text-lg" />
                  <span>PDF</span>
                </button>
              </motion.div>
            )}
          </div>
          <div className="relative" ref={settingsRef}>
            {/* Settings Button and Overlay */}
            <motion.button
              onClick={() => { setSettingsOpen((v) => !v); setDownloadOpen(false); }}
              title="Settings"
              className={`text-2xl rounded-full p-2 transition-colors duration-200 ${darkMode ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'}`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <LuSettings />
            </motion.button>
            {settingsOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className={`absolute right-0 mt-2 w-44 rounded-xl shadow-lg z-50 p-2 flex flex-col gap-2 ${darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'}`}
              >
                <button
                  className={`flex items-center w-full px-3 py-2 rounded-lg text-left gap-2 transition-colors duration-150
                    ${mode === 'system'
                      ? darkMode
                        ? 'bg-green-700/70 text-white font-bold'
                        : 'bg-green-200 text-green-900 font-bold'
                      : darkMode
                        ? 'hover:bg-gray-700 hover:text-white'
                        : 'hover:bg-gray-200 hover:text-green-900'}
                  `}
                  onClick={() => { setMode('system'); setSettingsOpen(false); }}
                >
                  <GrPersonalComputer className="text-lg" />
                  <span>System</span>
                </button>
                <button
                  className={`flex items-center w-full px-3 py-2 rounded-lg text-left gap-2 transition-colors duration-150
                    ${mode === 'light'
                      ? darkMode
                        ? 'bg-green-700/70 text-white font-bold'
                        : 'bg-green-200 text-green-900 font-bold'
                      : darkMode
                        ? 'hover:bg-gray-700 hover:text-white'
                        : 'hover:bg-gray-200 hover:text-green-900'}
                  `}
                  onClick={() => { setMode('light'); setSettingsOpen(false); }}
                >
                  <CiLight className="text-lg" />
                  <span>Light</span>
                </button>
                <button
                  className={`flex items-center w-full px-3 py-2 rounded-lg text-left gap-2 transition-colors duration-150
                    ${mode === 'dark'
                      ? darkMode
                        ? 'bg-green-700/70 text-white font-bold'
                        : 'bg-green-200 text-green-900 font-bold'
                      : darkMode
                        ? 'hover:bg-gray-700 hover:text-white'
                        : 'hover:bg-gray-200 hover:text-green-900'}
                  `}
                  onClick={() => { setMode('dark'); setSettingsOpen(false); }}
                >
                  <CiDark className="text-lg" />
                  <span>Dark</span>
                </button>
              </motion.div>
            )}
          </div>
          <motion.div
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className={`rounded-full p-2 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}
          >
            <CiUser className={`h-8 w-8 ${darkMode ? 'text-white' : 'text-gray-700'}`} />
          </motion.div>
        </motion.div>
      </motion.div>
      {renderProductDetails()}
    </>
  );
};

export default TopNav;