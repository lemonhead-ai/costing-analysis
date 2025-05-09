import React, { useState, useEffect, useRef } from 'react';
import { CiLight, CiDark, CiUser } from 'react-icons/ci';
import { motion, AnimatePresence } from 'framer-motion';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const TopNav = ({ darkMode, setDarkMode, onSearch, products }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    onSearch(product.productName);
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

    const tableRows = products.map((product) => [
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

  // Helper: Render overlay and results below the TopNav search box
  const renderSearchOverlay = () => (
    <>
      {/* Overlay below TopNav */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed left-0 right-0 top-20 bottom-0 bg-black/30 backdrop-blur-md z-[50]"
        onClick={() => setShowResults(false)}
      />
      {/* Results dropdown, aligned with the search box */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="absolute left-0 right-0 top-full mt-2 z-[101]"
        style={{ pointerEvents: 'auto' }}
      >
        <div className="bg-gray-800/95 rounded-2xl shadow-2xl max-h-[60vh] overflow-y-auto">
          <div className="p-2">
            {searchResults.length === 0 && (
              <div className="text-gray-400 text-center py-6">No results found.</div>
            )}
            {searchResults.map((product) => (
              <motion.button
                key={product._id}
                onClick={() => handleResultClick(product)}
                className="w-full text-left p-4 rounded-xl hover:bg-gray-700/50 transition-colors duration-200"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex flex-col">
                  <span className="text-white font-bold text-lg">{product.productName}</span>
                  <span className="text-gray-400 text-sm">{product.item}</span>
                  <div className="flex gap-4 mt-1 text-sm">
                    <span className="text-gray-400">
                      Cost: {product.calculations.costPerItem.toFixed(2)} KES
                    </span>
                    <span className={`${
                      product.calculations.currentMargin < 0.2
                        ? 'text-red-400'
                        : 'text-green-400'
                    }`}>
                      Margin: {(product.calculations.currentMargin * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </>
  );

  return (
    <>
      <div className="bg-gray-800 p-4 flex justify-between items-center border-b border-gray-700/50 shadow-md z-20 relative">
        <div className="flex items-center flex-1 gap-4">
          <h2 className="text-xl font-bold text-white whitespace-nowrap">Cost Analyser</h2>
          <div className="relative flex-1" ref={searchRef}>
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={handleSearch}
              className="bg-white/20 text-white p-2 pl-4 rounded-2xl w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            />
            <AnimatePresence>
              {showResults && renderSearchOverlay()}
            </AnimatePresence>
          </div>
        </div>
        <div className="flex items-center space-x-4 ml-4">
          <motion.button
            onClick={handleDownloadExcel}
            className="bg-green-600 text-white px-3 py-1 rounded-xl hover:bg-green-700 transition-colors duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            Export Excel
          </motion.button>
          <motion.button
            onClick={handleDownloadPDF}
            className="bg-blue-700 text-white px-3 py-1 rounded-xl hover:bg-purple-600 transition-colors duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            Export PDF
          </motion.button>
          <motion.button
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="text-white text-2xl hover:text-gray-300"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            {darkMode ? <CiLight /> : <CiDark />}
          </motion.button>
          <motion.div
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <CiUser className="h-9 w-6 text-white" />
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default TopNav;