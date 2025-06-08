import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, TrendingUp, Package, UserCircle2, ListFilter, ShoppingBag, UserCircle } from 'lucide-react';

const PRODUCTS = [
  'Hangers grade 2',
  'Hangers virgin',
  'Basin virgin',
  'Basin grade 2',
  'Basin grade 3',
  'Plate virgin plain',
  'Plate virgin flowered',
  'Plate grade 2',
  'Plate grade 3',
  '18cm plate plain',
  '18cm plate flowered',
  'Pegs',
  'Mug virgin',
  'Mug grade 2',
  'Tambler 001',
  'Tambler 003',
  'Tembo basin virgin',
  'Tembo grade 3'
];

const SalesTracker = ({ darkMode }) => {
  const [salesData, setSalesData] = useState([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    product: '',
    quantity: '',
  });
  const [filterDate, setFilterDate] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [productStatsFilter, setProductStatsFilter] = useState('Today');
  const [customerFilterPeriod, setCustomerFilterPeriod] = useState('Today');
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000); // Update every second

    return () => {
      clearInterval(timer); // Clean up the interval on component unmount
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

  // Helper function to get dates based on filter
  const getDateRange = (filter) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let startDate = new Date();
    let endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    switch (filter) {
      case 'Today':
        startDate = today;
        break;
      case 'Yesterday':
        startDate.setDate(today.getDate() - 1);
        endDate.setDate(today.getDate() - 1);
        break;
      case 'Last Week':
        startDate.setDate(today.getDate() - today.getDay() - 6); // Monday of last week
        endDate.setDate(today.getDate() - today.getDay()); // Sunday of last week
        break;
      case 'This Week':
        startDate.setDate(today.getDate() - today.getDay()); // Start of current week (Sunday)
        endDate = new Date(); // Current date
        break;
      case 'Last Month':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'This Month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1); // Start of current month
        endDate = new Date(); // Current date
        break;
      case 'Last 6 Months':
        startDate = new Date(today.getFullYear(), today.getMonth() - 6, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0); // End of last month
        break;
      case 'Last Year':
        startDate = new Date(today.getFullYear() - 1, 0, 1);
        endDate = new Date(today.getFullYear() - 1, 11, 31);
        break;
      case 'This Year':
        startDate = new Date(today.getFullYear(), 0, 1); // Start of current year
        endDate = new Date(); // Current date
        break;
      case 'All Time':
        startDate = new Date(0); // Epoch start
        endDate = new Date(); // Current date
        break;
      case 'Custom Period':
        // This will be handled separately with state for custom start/end dates
        // For now, it will default to today
        startDate = today;
        endDate = today;
        break;
      default:
        startDate = today;
        endDate = today;
        break;
    }
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    return { startDate, endDate };
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.product || !formData.quantity) return;

    const newSale = {
      id: Date.now(),
      ...formData,
      quantity: parseInt(formData.quantity),
      date: formData.date 
    };

    setSalesData(prev => [...prev, newSale]);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      product: '',
      quantity: '',
    });
  };

  // Filter sales data for the main table (by custom date range)
  const tableFilteredSales = salesData.filter(sale => {
    const saleDate = new Date(sale.date);
    const startDate = new Date(filterDate.start);
    const endDate = new Date(filterDate.end);
    return saleDate >= startDate && saleDate <= endDate;
  });

  // Filter sales data based on selected product statistics filter
  const filteredSalesForStats = useMemo(() => {
    const { startDate, endDate } = getDateRange(productStatsFilter);
    return salesData.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= startDate && saleDate <= endDate;
    });
  }, [salesData, productStatsFilter]);

  // Sort sales data for the main table
  const sortedSales = [...tableFilteredSales].sort((a, b) => {
    if (sortConfig.key === 'date') {
      return sortConfig.direction === 'asc' 
        ? new Date(a.date) - new Date(b.date)
        : new Date(b.date) - new Date(a.date);
    }
    return sortConfig.direction === 'asc'
      ? a[sortConfig.key] - b[sortConfig.key]
      : b[sortConfig.key] - a[sortConfig.key];
  });

  // Calculate monthly sales for the Sales Trend Chart
  const salesTrendData = useMemo(() => {
    const monthlySales = salesData.reduce((acc, sale) => {
      const monthYear = new Date(sale.date).toLocaleString('default', { month: 'short', year: '2-digit' });
      acc[monthYear] = (acc[monthYear] || 0) + sale.quantity;
      return acc;
    }, {});

    // Create an array of all months in the range of salesData, or current year if no data
    const dates = salesData.map(sale => new Date(sale.date));
    let minDate = dates.length > 0 ? new Date(Math.min(...dates)) : new Date();
    let maxDate = dates.length > 0 ? new Date(Math.max(...dates)) : new Date();

    minDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1); // Start of month
    maxDate = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0); // End of month

    const trendData = [];
    let currentDate = new Date(minDate);
    while (currentDate <= maxDate) {
      const monthYear = currentDate.toLocaleString('default', { month: 'short', year: '2-digit' });
      trendData.push({
        month: monthYear,
        Sales: monthlySales[monthYear] || 0,
      });
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    return trendData;
  }, [salesData]);

  // Calculate product statistics for the RadialBarChart (top 3 products)
  const productStatistics = useMemo(() => {
    const { startDate, endDate } = getDateRange(productStatsFilter);
    
    // Filter sales for the current period
    const currentPeriodSales = salesData.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= startDate && saleDate <= endDate;
    });

    // Calculate total quantity for the current period
    const totalQuantityCurrentPeriod = currentPeriodSales.reduce((sum, sale) => sum + sale.quantity, 0);

    // Calculate product quantities for the current period
    const productQuantitiesCurrentPeriod = currentPeriodSales.reduce((acc, sale) => {
      acc[sale.product] = (acc[sale.product] || 0) + sale.quantity;
      return acc;
    }, {});

    // Get top 3 products for the current period
    const sortedProductsCurrentPeriod = Object.entries(productQuantitiesCurrentPeriod)
      .sort(([, qtyA], [, qtyB]) => qtyB - qtyA)
      .slice(0, 3);

    // Calculate previous period dates for percentage comparison
    const periodLength = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodLength);
    const previousEndDate = new Date(startDate.getTime() - 1); // End of the previous period

    // Filter sales for the previous period
    const previousPeriodSales = salesData.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= previousStartDate && saleDate <= previousEndDate;
    });

    // Calculate product quantities for the previous period
    const productQuantitiesPreviousPeriod = previousPeriodSales.reduce((acc, sale) => {
      acc[sale.product] = (acc[sale.product] || 0) + sale.quantity;
      return acc;
    }, {});

    // Prepare data for rendering
    const data = sortedProductsCurrentPeriod.map(([product, quantity], index) => {
      const previousQuantity = productQuantitiesPreviousPeriod[product] || 0;
      const percentageChange = previousQuantity === 0 
        ? (quantity > 0 ? 100 : 0) 
        : ((quantity - previousQuantity) / previousQuantity) * 100;

      let color = '';
      // Use colors similar to the image (blue, red, then another blue for product 1, 2, 3)
      if (index === 0) color = '#3B82F6'; // Blue
      else if (index === 1) color = '#EF4444'; // Red
      else if (index === 2) color = '#3B82F6'; // Blue (or another distinct color if preferred)

      return {
        name: product,
        value: quantity,
        fill: color, // This will be used for the list item color
        percentageChange: percentageChange.toFixed(1),
        // Arc calculation will be handled in JSX directly, not here.
        // outerRadius: `${80 - (index * 15)}%` // No longer needed for this SVG approach
      };
    });

    // Calculate overall percentage change for the total products sales (for the main number)
    const totalPreviousPeriodSales = previousPeriodSales.reduce((sum, sale) => sum + sale.quantity, 0);
    const overallPercentageChange = totalPreviousPeriodSales === 0 
      ? (totalQuantityCurrentPeriod > 0 ? 100 : 0)
      : ((totalQuantityCurrentPeriod - totalPreviousPeriodSales) / totalPreviousPeriodSales) * 100;

    return { 
      data, 
      totalQuantityCurrentPeriod, 
      overallPercentageChange: overallPercentageChange.toFixed(1)
    };
  }, [salesData, productStatsFilter]);

  // Placeholder for total sales value (e.g., average price per unit)
  const averageProductPrice = 12.5; // Example average price per unit
  const totalSalesValue = (filteredSalesForStats.reduce((sum, sale) => sum + sale.quantity, 0) * averageProductPrice).toFixed(3);

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-3xl font-semibold mb-6 text-gray-900 dark:text-white">Sales Report</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        {currentDateTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + ', ' + currentDateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column for Summary Cards and Sales Trend */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5 ">

          {/* All Time High Product Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-800 to-blue-800 text-white rounded-3xl shadow-2xl p-8 flex flex-col justify-between col-span-full md:col-span-1"
          >
            <div className="flex justify-between items-center mb-4">
              <div className="p-2 bg-white bg-opacity-20 rounded-full">
                <Package className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium bg-white bg-opacity-20 px-3 py-1 rounded-full">All Time</span>
            </div>
            <div>
              <p className="text-lg font-medium">All Time High</p>
              <p className="text-5xl font-bold mt-2">
                {(() => {
                  const productTotals = salesData.reduce((acc, sale) => {
                    acc[sale.product] = (acc[sale.product] || 0) + sale.quantity;
                    return acc;
                  }, {});
                  
                  const highestProduct = Object.entries(productTotals)
                    .reduce((max, [product, quantity]) => 
                      quantity > max.quantity ? { product, quantity } : max,
                      { product: '', quantity: 0 }
                    );
                  
                  return highestProduct.quantity;
                })()}
              </p>
              <p className="text-sm opacity-80 mt-1">
                {(() => {
                  const productTotals = salesData.reduce((acc, sale) => {
                    acc[sale.product] = (acc[sale.product] || 0) + sale.quantity;
                    return acc;
                  }, {});
                  
                  const highestProduct = Object.entries(productTotals)
                    .reduce((max, [product, quantity]) => 
                      quantity > max.quantity ? { product, quantity } : max,
                      { product: '', quantity: 0 }
                    );
                  
                  return highestProduct.product;
                })()}
              </p>
            </div>
          </motion.div>

          {/* Best Customer Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-blue-50 opacity-20 dark:bg-gray-700 rounded-3xl shadow-lg p-6 flex flex-col justify-between"
          >
            <div className="flex justify-between items-center mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <ShoppingBag className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="relative">
                <select
                  value={customerFilterPeriod}
                  onChange={(e) => setCustomerFilterPeriod(e.target.value)}
                  className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-md pl-3 pr-8 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="Today">Today</option>
                  <option value="This Week">This Week</option>
                  <option value="This Month">This Month</option>
                  <option value="This Year">This Year</option>
                  <option value="All Time">All Time</option>
                  <option value="Custom">Custom Period</option>
                </select>
                <ListFilter className="absolute right-2.5 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900 dark:text-white">Best Customer</p>
              <div className="flex items-center justify-between mt-2">
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {(() => {
                    const { startDate, endDate } = getDateRange(customerFilterPeriod);
                    const filteredSales = salesData.filter(sale => {
                      const saleDate = new Date(sale.date);
                      return saleDate >= startDate && saleDate <= endDate;
                    });
                    
                    const customerTotals = filteredSales.reduce((acc, sale) => {
                      acc[sale.customer] = (acc[sale.customer] || 0) + sale.quantity;
                      return acc;
                    }, {});
                    
                    const bestCustomer = Object.entries(customerTotals)
                      .reduce((max, [customer, quantity]) => 
                        quantity > max.quantity ? { customer, quantity } : max,
                        { customer: 'No Data', quantity: 0 }
                      );
                    
                    return bestCustomer.customer;
                  })()}
                </p>
                <p className="text-xl font-medium text-gray-900 dark:text-white">
                  {(() => {
                    const { startDate, endDate } = getDateRange(customerFilterPeriod);
                    const filteredSales = salesData.filter(sale => {
                      const saleDate = new Date(sale.date);
                      return saleDate >= startDate && saleDate <= endDate;
                    });
                    
                    const customerTotals = filteredSales.reduce((acc, sale) => {
                      acc[sale.customer] = (acc[sale.customer] || 0) + sale.quantity;
                      return acc;
                    }, {});
                    
                    const bestCustomer = Object.entries(customerTotals)
                      .reduce((max, [customer, quantity]) => 
                        quantity > max.quantity ? { customer, quantity } : max,
                        { customer: '', quantity: 0 }
                      );
                    
                    return bestCustomer.quantity;
                  })()} units
                </p>
              </div>
            </div>
          </motion.div>

          {/* New Customers & Monthly Orders Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-purple-50 dark:bg-gray-800 rounded-3xl shadow-lg p-6 flex flex-col justify-between"
          >
            <div className="flex justify-between items-center mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                <UserCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="relative">
                <select
                  value={productStatsFilter}
                  onChange={(e) => setProductStatsFilter(e.target.value)}
                  className="appearance-none bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-md pl-3 pr-8 py-1 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
                >
                  <option value="Today">Today</option>
                  <option value="Yesterday">Yesterday</option>
                  <option value="Last Week">Last Week</option>
                  <option value="Last Month">Last Month</option>
                  <option value="Last Year">Last Year</option>
                  <option value="All Time">All Time</option>
                </select>
                <ListFilter className="absolute right-2.5 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <p className="text-lg font-medium text-gray-500 dark:text-gray-400">New Customers</p>
              <div className="flex items-center justify-between mt-2">
                <p className="text-3xl font-semibold text-gray-900 dark:text-white">
                  {(() => {
                    const { startDate, endDate } = getDateRange(productStatsFilter);
                    const filteredSales = salesData.filter(sale => {
                      const saleDate = new Date(sale.date);
                      return saleDate >= startDate && saleDate <= endDate;
                    });
                    
                    // Get unique customers in the period
                    const customersInPeriod = new Set(filteredSales.map(sale => sale.customer));
                    
                    // Get all sales before the period
                    const previousSales = salesData.filter(sale => {
                      const saleDate = new Date(sale.date);
                      return saleDate < startDate;
                    });
                    
                    // Get customers who existed before the period
                    const existingCustomers = new Set(previousSales.map(sale => sale.customer));
                    
                    // Count new customers (those who weren't in existingCustomers)
                    return Array.from(customersInPeriod).filter(customer => !existingCustomers.has(customer)).length;
                  })()}
                </p>
                <p className="text-xl font-medium text-gray-900 dark:text-white">
                  {(() => {
                    const { startDate, endDate } = getDateRange(productStatsFilter);
                    return salesData.filter(sale => {
                      const saleDate = new Date(sale.date);
                      return saleDate >= startDate && saleDate <= endDate;
                    }).length;
                  })()} orders
                </p>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">New customers in selected period</p>
            </div>
          </motion.div>
          
          {/* Total Sold Products Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-gradient-to-br from-purple-800 to-purple-800 text-white rounded-3xl shadow-2xl p-8 flex flex-col justify-between"
          >
            <div className="flex justify-between items-center mb-4">
              <div className="p-2 bg-white bg-opacity-20 rounded-full">
                <Package className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium bg-white bg-opacity-20 px-3 py-1 rounded-full">
                {(() => {
                  const { startDate, endDate } = getDateRange(productStatsFilter);
                  
                  // Get current period sales
                  const currentPeriodSales = salesData.filter(sale => {
                    const saleDate = new Date(sale.date);
                    return saleDate >= startDate && saleDate <= endDate;
                  }).reduce((sum, sale) => sum + sale.quantity, 0);
                  
                  // Calculate previous period dates
                  const periodLength = endDate - startDate;
                  const previousStartDate = new Date(startDate.getTime() - periodLength);
                  const previousEndDate = new Date(startDate.getTime() - 1);
                  
                  // Get previous period sales
                  const previousPeriodSales = salesData.filter(sale => {
                    const saleDate = new Date(sale.date);
                    return saleDate >= previousStartDate && saleDate <= previousEndDate;
                  }).reduce((sum, sale) => sum + sale.quantity, 0);
                  
                  // Calculate percentage change
                  const percentageChange = previousPeriodSales === 0 
                    ? 100 
                    : ((currentPeriodSales - previousPeriodSales) / previousPeriodSales) * 100;
                  
                  return `${percentageChange >= 0 ? '+' : ''}${percentageChange.toFixed(1)}%`;
                })()}
              </span>
            </div>
            <div>
              <p className="text-lg font-medium">Total Sold Products</p>
              <p className="text-5xl font-bold mt-2">
                {(() => {
                  const { startDate, endDate } = getDateRange(productStatsFilter);
                  return salesData.filter(sale => {
                    const saleDate = new Date(sale.date);
                    return saleDate >= startDate && saleDate <= endDate;
                  }).reduce((sum, sale) => sum + sale.quantity, 0);
                })()}
              </p>
              <p className="text-sm opacity-80 mt-1">Products sold in selected period</p>
            </div>
          </motion.div>

          {/* Sales Trend Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 col-span-full"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Sales Trend</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Monthly Sales Quantity</p>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#E5E7EB"} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: darkMode ? "#9CA3AF" : "#4B5563" }}
                  />
                  <YAxis 
                    tick={{ fill: darkMode ? "#9CA3AF" : "#4B5563" }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: darkMode ? "#1F2937" : "#FFFFFF",
                      border: `1px solid ${darkMode ? "#374151" : "#E5E7EB"}`,
                      color: darkMode ? "#FFFFFF" : "#000000"
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="Sales" 
                    fill={darkMode ? "#10B981" : "#059669"}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Right Column for Product Statistics */}
        <div className="lg:col-span-1 grid grid-cols-1 gap-6">
          {/* Product Statistics Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 flex flex-col h-full"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Product Statistics</h3>
              <div className="relative">
                <select
                  value={productStatsFilter}
                  onChange={(e) => setProductStatsFilter(e.target.value)}
                  className="appearance-none bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-md pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="Today">Today</option>
                  <option value="Yesterday">Yesterday</option>
                  <option value="Last Week">Last Week</option>
                  <option value="This Week">This Week</option>
                  <option value="Last Month">Last Month</option>
                  <option value="This Month">This Month</option>
                  <option value="Last 6 Months">Last 6 Months</option>
                  <option value="Last Year">Last Year</option>
                  <option value="This Year">This Year</option>
                  <option value="All Time">All Time</option>
                  <option value="Custom Period">Custom Period</option>
                </select>
                <ListFilter className="absolute right-2.5 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Track your product sales</p>

            <div className="flex flex-col items-center justify-center flex-grow">
              <div className="relative w-48 h-48 flex items-center justify-center mb-4">
                <svg className="w-full h-full" viewBox="0 0 120 120">
                  {/* Background 3/4 circle for 100% total sales */}
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke={darkMode ? '#374151' : '#E5E7EB'} // Light gray for background
                    strokeWidth="10"
                    strokeDasharray="235.619 78.54" // 3/4 of 2 * PI * 50
                    strokeLinecap="round"
                    transform="rotate(-45 60 60)" // Rotate to start at the right position
                  />

                  {/* Top 3 Product Arcs */}
                  {productStatistics.data.map((entry, index) => {
                    // Calculate circumference for each circle (r values are 50, 35, 20)
                    // Arc starts from 135 degrees (relative to the background arc start) and goes clockwise
                    // Each arc represents percentage of total quantity current period, not total top 3
                    const radius = [50, 35, 20][index]; // Different radius for each circle
                    const circumference = 2 * Math.PI * radius;
                    
                    // Percentage of total quantity sold in the current period
                    const percentageOfTotal = productStatistics.totalQuantityCurrentPeriod > 0
                      ? (entry.value / productStatistics.totalQuantityCurrentPeriod)
                      : 0;

                    // For 3/4 circle, max dash is 235.619 (0.75 * circumference)
                    const dash = percentageOfTotal * (0.75 * circumference);
                    const gap = (0.75 * circumference) - dash;

                    return (
                      <circle
                        key={`arc-${index}`}
                        cx="60"
                        cy="60"
                        r={radius}
                        fill="none"
                        stroke={entry.fill}
                        strokeWidth={[10, 8, 6][index]} // Different stroke width for each circle
                        strokeDasharray={`${dash} ${gap}`}
                        strokeLinecap="round"
                        transform="rotate(-45 60 60)" // Same rotation as background
                      />
                    );
                  })}
                </svg>
                {/* Central text displaying total quantity of products sold in current period */}
                <div className="absolute flex flex-col items-center justify-center">
                  <p className="text-3xl font-semibold text-gray-900 dark:text-white">{productStatistics.totalQuantityCurrentPeriod.toLocaleString()}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Products Sales</p>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full mt-1 ${productStatistics.overallPercentageChange >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {`${productStatistics.overallPercentageChange >= 0 ? '+' : ''}${productStatistics.overallPercentageChange}%`}
                  </span>
                </div>
              </div>
              <div className="flex flex-col space-y-2 w-full px-4">
                {productStatistics.data.map((entry, index) => (
                  <div key={`item-${index}`} className="flex items-center justify-between text-sm text-gray-900 dark:text-gray-300">
                    <div className="flex items-center">
                      <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.fill }}></span>
                      {entry.name}
                    </div>
                    <span className="font-medium">
                      {entry.value.toLocaleString()} <span className={`text-xs ml-1 font-normal ${entry.percentageChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {`${entry.percentageChange >= 0 ? '+' : ''}${entry.percentageChange}%`}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Input Form */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                />
                <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Product
              </label>
              <div className="relative">
                <select
                  name="product"
                  value={formData.product}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select a product</option>
                  {PRODUCTS.map(product => (
                    <option key={product} value={product}>{product}</option>
                  ))}
                </select>
                <Package className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Quantity
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                />
                <TrendingUp className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
          <button
            type="submit"
            className="w-full md:w-auto px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200"
          >
            Add Sale
          </button>
        </form>
      </motion.div>

      {/* Date Range Filter for Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Filter Sales Records</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={filterDate.start}
                onChange={(e) => setFilterDate(prev => ({ ...prev, start: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
              />
              <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={filterDate.end}
                onChange={(e) => setFilterDate(prev => ({ ...prev, end: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
              />
              <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Sales Records</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                  onClick={() => setSortConfig({
                    key: 'date',
                    direction: sortConfig.key === 'date' && sortConfig.direction === 'asc' ? 'desc' : 'asc'
                  })}
                >
                  Date {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Product
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                  onClick={() => setSortConfig({
                    key: 'quantity',
                    direction: sortConfig.key === 'quantity' && sortConfig.direction === 'asc' ? 'desc' : 'asc'
                  })}
                >
                  Quantity {sortConfig.key === 'quantity' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedSales.map(sale => (
                <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {new Date(sale.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {sale.product}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {sale.quantity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesTracker;