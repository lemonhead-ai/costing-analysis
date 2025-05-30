import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CiDollar, CiCalculator1, CiShoppingTag, CiWarning } from 'react-icons/ci';
import { SlCalender } from "react-icons/sl";
import { HiOutlineChartBar } from "react-icons/hi2";
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const Dashboard = ({ products, darkMode }) => {
  const [viewMode, setViewMode] = useState('summary'); // 'summary' or 'detailed'
  const [showLowMarginDetails, setShowLowMarginDetails] = useState(false);

  // If no products, return default message
  if (!products || products.length === 0) {
    return (
      <div>
        <h2 className="text-3xl font-semibold mb-6">Dashboard</h2>
        <p className="text-gray-400">No products available. Add products in the Inputs section to see metrics.</p>
      </div>
    );
  }

  // Helper function to calculate metrics for a single product
  const calculateMetrics = (product) => {
    const materialCost = parseFloat(product.materialCost) || 0;
    const masterBatchCost = parseFloat(product.masterBatchCost) || 0;
    const weightPerUnit = parseFloat(product.weightPerUnit) || 1; // Avoid division by zero
    const currentSellingPrice = parseFloat(product.currentSellingPrice) || 0;

    // Material Price / KG
    const materialPricePerKg = materialCost / 25;

    // Total Material
    const totalMaterial = materialCost + masterBatchCost;

    // Minimum Production
    const minimumProduction = 25000 / weightPerUnit;

    // Cost per Item (Direct Cost)
    const costPerItem = totalMaterial / minimumProduction;

    // Overheads (25% default)
    const overheads = costPerItem * 0.25;

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
      totalMaterial,
      minimumProduction,
      costPerItem,
      overheads,
      profitMargin,
      vat,
      sellingPriceExclusive,
      proposedSellingPriceInclusive,
      currentMargin,
      proposedMargin,
      profitMarginPerKg,
      productName: product.productName,
      item: product.item,
    };
  };

  // Calculate metrics for all products
  const productMetrics = products.map(calculateMetrics);

  // Calculate aggregated metrics
  const aggregatedMetrics = productMetrics.reduce((acc, metrics) => {
    return {
      totalMaterial: acc.totalMaterial + metrics.totalMaterial,
      minimumProduction: acc.minimumProduction + metrics.minimumProduction,
      costPerItem: acc.costPerItem + metrics.costPerItem,
      overheads: acc.overheads + metrics.overheads,
      profitMargin: acc.profitMargin + metrics.profitMargin,
      vat: acc.vat + metrics.vat,
      sellingPriceExclusive: acc.sellingPriceExclusive + metrics.sellingPriceExclusive,
      proposedSellingPriceInclusive: acc.proposedSellingPriceInclusive + metrics.proposedSellingPriceInclusive,
      currentMargin: acc.currentMargin + (metrics.currentMargin || 0),
      profitMarginPerKg: acc.profitMarginPerKg + metrics.profitMarginPerKg,
      count: acc.count + 1,
    };
  }, {
    totalMaterial: 0,
    minimumProduction: 0,
    costPerItem: 0,
    overheads: 0,
    profitMargin: 0,
    vat: 0,
    sellingPriceExclusive: 0,
    proposedSellingPriceInclusive: 0,
    currentMargin: 0,
    profitMarginPerKg: 0,
    count: 0,
  });

  // Calculate averages
  const metrics = {
    totalMaterialCost: aggregatedMetrics.totalMaterial,
    minProduction: Math.round(aggregatedMetrics.minimumProduction / aggregatedMetrics.count),
    avgSellingPrice: (aggregatedMetrics.proposedSellingPriceInclusive / aggregatedMetrics.count).toFixed(2),
    marginAlerts: productMetrics.filter(m => m.currentMargin < 0.1).length, // Alert if margin < 10%
    lastDownload: new Date().toISOString().split('T')[0],
    avgProfitMarginPerKg: (aggregatedMetrics.profitMarginPerKg / aggregatedMetrics.count).toFixed(2),
    avgCostPerItem: aggregatedMetrics.costPerItem / aggregatedMetrics.count,
    avgOverheads: aggregatedMetrics.overheads / aggregatedMetrics.count,
    avgProfitMargin: aggregatedMetrics.profitMargin / aggregatedMetrics.count,
    avgVat: aggregatedMetrics.vat / aggregatedMetrics.count,
  };

  // Data for Bar Chart (Profit Margin per KG)
  const barChartData = {
    labels: productMetrics.map(m => `${m.productName} (${m.item})`),
    datasets: [
      {
        label: 'Profit Margin per KG (KES)',
        data: productMetrics.map(m => m.profitMarginPerKg.toFixed(2)),
        backgroundColor: 'rgba(74, 222, 128, 0.7)', // Green with opacity
        borderColor: 'rgba(74, 222, 128, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Data for Pie Chart (Cost Breakdown)
  const pieChartData = {
    labels: ['Direct Cost', 'Overheads', 'Profit Margin', 'VAT'],
    datasets: [
      {
        data: [
          metrics.avgCostPerItem.toFixed(2),
          metrics.avgOverheads.toFixed(2),
          metrics.avgProfitMargin.toFixed(2),
          metrics.avgVat.toFixed(2),
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)', // Blue
          'rgba(234, 179, 8, 0.7)', // Yellow
          'rgba(74, 222, 128, 0.7)', // Green
          'rgba(239, 68, 68, 0.7)', // Red
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(234, 179, 8, 1)',
          'rgba(74, 222, 128, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#fff' },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
      },
    },
    scales: {
      x: { ticks: { color: '#fff' } },
      y: { ticks: { color: '#fff' }, beginAtZero: true },
    },
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#fff' },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
      },
    },
  };

  const cardBg = darkMode ? 'bg-gray-900' : 'bg-white';
  const cardBorder = darkMode ? 'border-gray-800' : 'border-gray-200';
  const cardText = darkMode ? 'text-gray-100' : 'text-gray-900';
  const cardSubText = darkMode ? 'text-gray-300' : 'text-gray-700';

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Dashboard</h2>
        <motion.button
          onClick={() => setViewMode(viewMode === 'summary' ? 'detailed' : 'summary')}
          className="bg-green-600 text-white px-5 py-2 rounded-full font-semibold shadow-sm hover:bg-green-700 transition-colors duration-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {viewMode === 'summary' ? 'Show Detailed View' : 'Show Summary View'}
        </motion.button>
      </div>

      {viewMode === 'summary' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.div
            className={`relative ${cardBg} p-6 rounded-xl shadow-lg border ${cardBorder} flex flex-col items-center justify-center h-72 group`}
            whileHover={{ scale: 1.02, boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)' }}
            transition={{ duration: 0.3 }}
          >
            <CiDollar className="h-10 w-10 text-green-600 mb-4" />
            <h3 className={`text-lg font-medium ${cardSubText}`}>Total Material Cost</h3>
            <p className={`text-3xl font-bold ${cardText}`}>{metrics.totalMaterialCost.toFixed(2)} KES</p>
            <div className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${cardBg} p-2 rounded-lg text-sm ${cardSubText} border ${cardBorder}`}>
              Sum of material costs across all products
            </div>
          </motion.div>
          <motion.div
            className={`relative ${cardBg} p-6 rounded-xl shadow-lg border ${cardBorder} flex flex-col items-center justify-center h-72 group`}
            whileHover={{ scale: 1.02, boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)' }}
            transition={{ duration: 0.3 }}
          >
            <CiCalculator1 className="h-10 w-10 text-green-600 mb-4" />
            <h3 className={`text-lg font-medium ${cardSubText}`}>Minimum Production</h3>
            <p className={`text-3xl font-bold ${cardText}`}>{metrics.minProduction}</p>
            <div className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${cardBg} p-2 rounded-lg text-sm ${cardSubText} border ${cardBorder}`}>
              Average units producible from 25kg of material
            </div>
          </motion.div>
          <motion.div
            className={`relative ${cardBg} p-6 rounded-xl shadow-lg border ${cardBorder} flex flex-col items-center justify-center h-72 group`}
            whileHover={{ scale: 1.02, boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)' }}
            transition={{ duration: 0.3 }}
          >
            <CiShoppingTag className="h-10 w-10 text-green-600 mb-4" />
            <h3 className={`text-lg font-medium ${cardSubText}`}>Average Selling Price</h3>
            <p className={`text-3xl font-bold ${cardText}`}>{metrics.avgSellingPrice} KES</p>
            <div className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${cardBg} p-2 rounded-lg text-sm ${cardSubText} border ${cardBorder}`}>
              Average proposed selling price (incl. VAT)
            </div>
          </motion.div>
          <motion.div
            className={`relative ${metrics.marginAlerts > 0 ? (darkMode ? 'bg-red-900' : 'bg-red-100') : cardBg} p-6 rounded-xl shadow-lg border ${cardBorder} flex flex-col items-center justify-center h-72 group cursor-pointer`}
            whileHover={{ scale: 1.02, boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)' }}
            transition={{ duration: 0.3 }}
            onClick={() => setShowLowMarginDetails(!showLowMarginDetails)}
          >
            <CiWarning className={`h-10 w-10 ${metrics.marginAlerts > 0 ? 'text-red-600' : 'text-green-600'} mb-4`} />
            <h3 className={`text-lg font-medium ${metrics.marginAlerts > 0 ? 'text-red-600' : cardSubText}`}>Margin Alerts</h3>
            <p className={`text-3xl font-bold ${metrics.marginAlerts > 0 ? 'text-red-600' : cardText}`}>{metrics.marginAlerts}</p>
            <div className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${cardBg} p-2 rounded-lg text-sm ${cardSubText} border ${cardBorder}`}>
              Products with margin below 10% (click to view)
            </div>
          </motion.div>
          <motion.div
            className={`relative ${cardBg} p-6 rounded-xl shadow-lg border ${cardBorder} flex flex-col items-center justify-center h-72 group`}
            whileHover={{ scale: 1.02, boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)' }}
            transition={{ duration: 0.3 }}
          >
            <SlCalender className="h-10 w-10 text-green-600 mb-4" />
            <h3 className={`text-lg font-medium ${cardSubText}`}>Last Downloaded Report</h3>
            <p className={`text-3xl font-bold ${cardText}`}>{metrics.lastDownload}</p>
            <div className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${cardBg} p-2 rounded-lg text-sm ${cardSubText} border ${cardBorder}`}>
              Date of the last report download
            </div>
          </motion.div>
          <motion.div
            className={`relative ${darkMode ? 'bg-green-900' : 'bg-green-100'} p-6 rounded-xl shadow-lg border ${darkMode ? 'border-green-800' : 'border-green-200'} flex flex-col items-center justify-center h-72 group`}
            whileHover={{ scale: 1.02, boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)' }}
            transition={{ duration: 0.3 }}
          >
            <HiOutlineChartBar className="h-10 w-10 text-green-600 mb-4" />
            <h3 className={`text-lg font-medium ${darkMode ? 'text-green-200' : 'text-green-700'}`}>Avg Profit Margin per KG</h3>
            <p className={`text-3xl font-bold ${darkMode ? 'text-green-200' : 'text-green-700'}`}>{metrics.avgProfitMarginPerKg} KES</p>
            <div className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${cardBg} p-2 rounded-lg text-sm ${cardSubText} border ${cardBorder}`}>
              Average profit margin per kilogram of material
            </div>
          </motion.div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`${cardBg} p-6 rounded-xl shadow-lg border ${cardBorder}`}>
            <h3 className={`text-lg font-medium ${cardSubText} mb-4`}>Profit Margin per KG by Product</h3>
            <div className="h-96">
              <Bar data={barChartData} options={chartOptions} />
            </div>
          </div>
          <div className={`${cardBg} p-6 rounded-xl shadow-lg border ${cardBorder}`}>
            <h3 className={`text-lg font-medium ${cardSubText} mb-4`}>Average Cost Breakdown</h3>
            <div className="h-96 flex justify-center">
              <Pie data={pieChartData} options={pieChartOptions} />
            </div>
          </div>
        </div>
      )}

      {/* Low Margin Details Modal */}
      {showLowMarginDetails && metrics.marginAlerts > 0 && (
        <motion.div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className={`${cardBg} p-6 rounded-xl shadow-lg border ${cardBorder} max-w-lg w-full`}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
          >
            <h3 className={`text-lg font-medium ${cardSubText} mb-4`}>Low Margin Products</h3>
            <div className="max-h-60 overflow-y-auto">
              {productMetrics
                .filter(m => m.currentMargin < 0.1)
                .map((m, index) => (
                  <div key={index} className={`p-2 border-b ${cardBorder} ${cardText}`}>
                    {m.productName} ({m.item}): {(m.currentMargin * 100).toFixed(2)}%
                  </div>
                ))}
            </div>
            <motion.button
              onClick={() => setShowLowMarginDetails(false)}
              className="mt-4 bg-red-600 text-white px-5 py-2 rounded-full font-semibold shadow-sm hover:bg-red-700 transition-colors duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Close
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;