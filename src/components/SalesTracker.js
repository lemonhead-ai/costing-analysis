import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Package, ListFilter, UserCircle, Users } from 'lucide-react';

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
    customer: '',
  });
  const [filterDate, setFilterDate] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [productStatsFilter, setProductStatsFilter] = useState('Today');
  const [customerFilterPeriod, setCustomerFilterPeriod] = useState('Today');
  const [newCustomerFilterPeriod, setNewCustomerFilterPeriod] = useState('Today');
  const [totalSoldFilterPeriod, setTotalSoldFilterPeriod] = useState('Today');
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [salesTrendFilterPeriod, setSalesTrendFilterPeriod] = useState('This Year');
  const [displayMode, setDisplayMode] = useState('Graph');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [activeCustomPeriodDropdown, setActiveCustomPeriodDropdown] = useState(null);
  const [showAddSaleModal, setShowAddSaleModal] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000); // Update every second

    return () => {
      clearInterval(timer); // Clean up the interval on component unmount
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

  // Add useEffect to handle custom period selection for all dropdowns
  useEffect(() => {
    const handleCustomPeriod = (period, setFilter) => {
      if (period === 'Custom Period') {
        setShowCustomDatePicker(true);
      } else {
        setShowCustomDatePicker(false);
        const { startDate, endDate } = getDateRange(period);
        setFilterDate({
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        });
      }
    };

    if (activeCustomPeriodDropdown === 'salesTrend') {
      handleCustomPeriod(salesTrendFilterPeriod, setSalesTrendFilterPeriod);
    } else if (activeCustomPeriodDropdown === 'productStats') {
      handleCustomPeriod(productStatsFilter, setProductStatsFilter);
    } else if (activeCustomPeriodDropdown === 'customer') {
      handleCustomPeriod(customerFilterPeriod, setCustomerFilterPeriod);
    } else if (activeCustomPeriodDropdown === 'newCustomer') {
      handleCustomPeriod(newCustomerFilterPeriod, setNewCustomerFilterPeriod);
    } else if (activeCustomPeriodDropdown === 'totalSold') {
      handleCustomPeriod(totalSoldFilterPeriod, setTotalSoldFilterPeriod);
    }
  }, [salesTrendFilterPeriod, productStatsFilter, customerFilterPeriod, newCustomerFilterPeriod, totalSoldFilterPeriod, activeCustomPeriodDropdown]);

  // Helper function for SVG arc path generation
  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  const describeArc = (x, y, radius, startAngle, endAngle) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    const d = [
      'M', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(' ');
    return d;
  };

  // Modify getDateRange to handle custom period
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
      case 'Custom Period':
        // Use the values from filterDate state
        startDate = new Date(filterDate.start);
        endDate = new Date(filterDate.end);
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
      date: formData.date,
      customer: formData.customer || 'Guest',
    };

    setSalesData(prev => [...prev, newSale]);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      product: '',
      quantity: '',
      customer: '',
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
  }, [salesData, sortConfig]);

  // Calculate monthly sales for the Sales Trend Chart
  const salesTrendData = useMemo(() => {
    const monthlyData = salesData.reduce((acc, sale) => {
      const monthYear = new Date(sale.date).toLocaleString('default', { month: 'short', year: '2-digit' });
      
      if (!acc[monthYear]) {
        acc[monthYear] = {
          totalSales: 0,
          productQuantities: {},
          customerQuantities: {},
          customerOrders: {} // To track orders for each customer
        };
      }
      
      acc[monthYear].totalSales += sale.quantity;
      acc[monthYear].productQuantities[sale.product] = (acc[monthYear].productQuantities[sale.product] || 0) + sale.quantity;
      acc[monthYear].customerQuantities[sale.customer] = (acc[monthYear].customerQuantities[sale.customer] || 0) + sale.quantity;
      acc[monthYear].customerOrders[sale.customer] = (acc[monthYear].customerOrders[sale.customer] || 0) + 1;

      return acc;
    }, {});

    // Calculate top product and best customer for each month
    Object.keys(monthlyData).forEach(monthYear => {
      const month = monthlyData[monthYear];
      
      // Top Product
      let topProduct = null;
      let maxProductQuantity = 0;
      for (const product in month.productQuantities) {
        if (month.productQuantities[product] > maxProductQuantity) {
          maxProductQuantity = month.productQuantities[product];
          topProduct = product;
        }
      }
      month.topProduct = topProduct;
      month.topProductQuantity = maxProductQuantity;

      // Best Customer by product quantity
      let bestCustomer = null;
      let maxCustomerQuantity = 0;
      for (const customer in month.customerQuantities) {
        if (month.customerQuantities[customer] > maxCustomerQuantity) {
          maxCustomerQuantity = month.customerQuantities[customer];
          bestCustomer = customer;
        }
      }
      month.bestCustomer = bestCustomer;
      month.bestCustomerQuantity = maxCustomerQuantity;
    });

    const trendData = [];
    const today = new Date();
    let currentYear = today.getFullYear();

    if (salesTrendFilterPeriod === 'Last Year') {
        currentYear = today.getFullYear() - 1;
    }

    let startMonth = 0; // January
    let endMonth = 11; // December

    if (salesTrendFilterPeriod !== 'This Year' && salesTrendFilterPeriod !== 'Last Year') {
      const datesInPeriod = salesData.map(sale => new Date(sale.date));
      if (datesInPeriod.length > 0) {
        const minDateInPeriod = new Date(Math.min(...datesInPeriod));
        const maxDateInPeriod = new Date(Math.max(...datesInPeriod));
        startMonth = minDateInPeriod.getMonth();
        endMonth = maxDateInPeriod.getMonth();
      } else {
        startMonth = today.getMonth();
        endMonth = today.getMonth();
      }
    }

    for (let i = startMonth; i <= endMonth; i++) {
        const monthDate = new Date(currentYear, i, 1);
        const monthYear = monthDate.toLocaleString('default', { month: 'short', year: '2-digit' });

        const dataForMonth = monthlyData[monthYear] || {
          totalSales: 0,
          topProduct: null,
          topProductQuantity: 0,
          bestCustomer: null,
          bestCustomerQuantity: 0,
          customerOrders: {}
        };

        trendData.push({
          month: monthYear,
          Sales: dataForMonth.totalSales,
          topProduct: dataForMonth.topProduct,
          topProductQuantity: dataForMonth.topProductQuantity,
          bestCustomer: dataForMonth.bestCustomer,
          bestCustomerQuantity: dataForMonth.bestCustomerQuantity,
          bestCustomerOrders: dataForMonth.customerOrders[dataForMonth.bestCustomer] || 0,
        });
    }

    return trendData;
  }, [salesData, salesTrendFilterPeriod]); // Depend on salesData and salesTrendFilterPeriod

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

  // Helper function to handle dropdown changes
  const handleDropdownChange = (value, type) => {
    setActiveCustomPeriodDropdown(type);
    switch (type) {
      case 'salesTrend':
        setSalesTrendFilterPeriod(value);
        break;
      case 'productStats':
        setProductStatsFilter(value);
        break;
      case 'customer':
        setCustomerFilterPeriod(value);
        break;
      case 'newCustomer':
        setNewCustomerFilterPeriod(value);
        break;
      case 'totalSold':
        setTotalSoldFilterPeriod(value);
        break;
      default:
        break;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">Sales Report</h2>
          <p className="text-gray-500 dark:text-gray-400">
            {currentDateTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + ', ' + currentDateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
          </p>
        </div>
        <button
          onClick={() => setShowAddSaleModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200 flex items-center space-x-2"
        >
          <Package className="h-5 w-5" />
          <span>Add Sale</span>
        </button>
      </div>
      
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
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="relative">
                <select
                  value={customerFilterPeriod}
                  onChange={(e) => handleDropdownChange(e.target.value, 'customer')}
                  className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-md pl-3 pr-8 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="Today">Today</option>
                  <option value="Yesterday">Yesterday</option>
                  <option value="This Week">This Week</option>
                  <option value="Last Week">Last Week</option>
                  <option value="This Month">This Month</option>
                  <option value="Last Month">Last Month</option>
                  <option value="Last 6 Months">Last 6 Months</option>
                  <option value="This Year">This Year</option>
                  <option value="Last Year">Last Year</option>
                  <option value="All Time">All Time</option>
                  <option value="Custom Period">Custom Period</option>
                </select>
                <ListFilter className="absolute right-2.5 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            {activeCustomPeriodDropdown === 'customer' && customerFilterPeriod === 'Custom Period' && (
              <div className="flex items-center space-x-2 mt-2">
                <input
                  type="date"
                  value={filterDate.start}
                  onChange={(e) => setFilterDate(prev => ({ ...prev, start: e.target.value }))}
                  className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={filterDate.end}
                  onChange={(e) => setFilterDate(prev => ({ ...prev, end: e.target.value }))}
                  className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
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
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="relative">
                <select
                  value={newCustomerFilterPeriod}
                  onChange={(e) => handleDropdownChange(e.target.value, 'newCustomer')}
                  className="appearance-none bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-md pl-3 pr-8 py-1 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
                >
                  <option value="Today">Today</option>
                  <option value="Yesterday">Yesterday</option>
                  <option value="This Week">This Week</option>
                  <option value="Last Week">Last Week</option>
                  <option value="This Month">This Month</option>
                  <option value="Last Month">Last Month</option>
                  <option value="Last 6 Months">Last 6 Months</option>
                  <option value="This Year">This Year</option>
                  <option value="Last Year">Last Year</option>
                  <option value="All Time">All Time</option>
                  <option value="Custom Period">Custom Period</option>
                </select>
                <ListFilter className="absolute right-2.5 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            {activeCustomPeriodDropdown === 'newCustomer' && newCustomerFilterPeriod === 'Custom Period' && (
              <div className="flex items-center space-x-2 mt-2">
                <input
                  type="date"
                  value={filterDate.start}
                  onChange={(e) => setFilterDate(prev => ({ ...prev, start: e.target.value }))}
                  className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={filterDate.end}
                  onChange={(e) => setFilterDate(prev => ({ ...prev, end: e.target.value }))}
                  className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            )}
            <div>
              <p className="text-lg font-medium text-gray-500 dark:text-gray-400">New Customers</p>
              <div className="flex items-center justify-between mt-2">
                <p className="text-3xl font-semibold text-gray-900 dark:text-white">
                  {(() => {
                    const { startDate, endDate } = getDateRange(newCustomerFilterPeriod);
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
                    const { startDate, endDate } = getDateRange(newCustomerFilterPeriod);
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
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                <Package className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="relative">
                <select
                  value={totalSoldFilterPeriod}
                  onChange={(e) => handleDropdownChange(e.target.value, 'totalSold')}
                  className="appearance-none bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-md pl-3 pr-8 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  <option value="Today">Today</option>
                  <option value="Yesterday">Yesterday</option>
                  <option value="This Week">This Week</option>
                  <option value="Last Week">Last Week</option>
                  <option value="This Month">This Month</option>
                  <option value="Last Month">Last Month</option>
                  <option value="Last 6 Months">Last 6 Months</option>
                  <option value="This Year">This Year</option>
                  <option value="Last Year">Last Year</option>
                  <option value="All Time">All Time</option>
                  <option value="Custom Period">Custom Period</option>
                </select>
                <ListFilter className="absolute right-2.5 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            {activeCustomPeriodDropdown === 'totalSold' && totalSoldFilterPeriod === 'Custom Period' && (
              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="date"
                  value={filterDate.start}
                  onChange={(e) => setFilterDate(prev => ({ ...prev, start: e.target.value }))}
                  className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-gray-500 dark:text-gray-400">to</span>
                <input
                  type="date"
                  value={filterDate.end}
                  onChange={(e) => setFilterDate(prev => ({ ...prev, end: e.target.value }))}
                  className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}
            <div>
              <p className="text-lg font-medium">Total Sold Products</p>
              <p className="text-5xl font-bold mt-2">
                {(() => {
                  const { startDate, endDate } = getDateRange(totalSoldFilterPeriod);
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
            className="bg-sky-100/50 dark:bg-gray-800 rounded-3xl shadow-lg p-6 col-span-full"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Customer Habbits</h3>
              <div className="flex items-center space-x-2">
                {/* Switcher Button */}
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-md p-1">
                  <button
                    className={`px-3 py-1 rounded-md text-sm font-medium ${displayMode === 'Graph' ? 'bg-green-600 text-white' : 'text-gray-700 dark:text-gray-300'}`}
                    onClick={() => setDisplayMode('Graph')}
                  >
                    Graph
                  </button>
                  <button
                    className={`px-3 py-1 rounded-md text-sm font-medium ${displayMode === 'Records' ? 'bg-green-600 text-white' : 'text-gray-700 dark:text-gray-300'}`}
                    onClick={() => setDisplayMode('Records')}
                  >
                    Records
                  </button>
                </div>
                {/* Filter Dropdown and Custom Date Picker */}
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <select
                      value={salesTrendFilterPeriod}
                      onChange={(e) => handleDropdownChange(e.target.value, 'salesTrend')}
                      className="appearance-none bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-md pl-3 pr-8 py-1 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
                    >
                      <option value="Today">Today</option>
                      <option value="Yesterday">Yesterday</option>
                      <option value="This Week">This Week</option>
                      <option value="Last Week">Last Week</option>
                      <option value="This Month">This Month</option>
                      <option value="Last Month">Last Month</option>
                      <option value="Last 6 Months">Last 6 Months</option>
                      <option value="This Year">This Year</option>
                      <option value="Last Year">Last Year</option>
                      <option value="All Time">All Time</option>
                      <option value="Custom Period">Custom Period</option>
                    </select>
                    <ListFilter className="absolute right-2.5 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                  {activeCustomPeriodDropdown === 'salesTrend' && salesTrendFilterPeriod === 'Custom Period' && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="date"
                        value={filterDate.start}
                        onChange={(e) => setFilterDate(prev => ({ ...prev, start: e.target.value }))}
                        className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="date"
                        value={filterDate.end}
                        onChange={(e) => setFilterDate(prev => ({ ...prev, end: e.target.value }))}
                        className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Track your customer habbits</p>
            <div className="h-80">
              {displayMode === 'Graph' ? (
                <div className="h-full overflow-x-auto relative">
                  <ResponsiveContainer width={salesTrendData.length > 6 ? (salesTrendData.length * 100) : "100%"} height="100%">
                    <BarChart data={salesTrendData} barCategoryGap="20%">
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#E5E7EB"} vertical={false} />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: darkMode ? "#9CA3AF" : "#4B5563" }}
                      />
                      <YAxis
                        tick={{ fill: darkMode ? "#9CA3AF" : "#4B5563" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `${value}`}
                      />
                      <Tooltip
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{
                          backgroundColor: '#262626',
                          border: 'none',
                          borderRadius: '30px',
                          color: '#FFFFFF'
                        }}
                        labelStyle={{ color: '#FFFFFF' }}
                        itemStyle={{ color: '#FFFFFF' }}
                        formatter={(value, name, props) => {
                          if (name === 'Top Product Sales') {
                            return [`${value.toLocaleString()} Units`, props.payload.topProduct !== null ? `Product: ${props.payload.topProduct}` : 'No Top Product'];
                          }
                          if (name === 'Best Customer Sales') {
                            return [`${value.toLocaleString()} Units`, props.payload.bestCustomer !== null ? `Customer: ${props.payload.bestCustomer} (${props.payload.bestCustomerOrders} orders)` : 'No Best Customer'];
                          }
                          return value;
                        }}
                      />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        wrapperStyle={{ paddingTop: '20px', paddingBottom: '20px', marginLeft: '20px' }}
                        payload={[
                          { value: 'Top Product Sales', type: 'circle', color: '#D4D4D8' },
                          { value: 'Best Customer Sales', type: 'circle', color: '#6366F1' },
                        ]}
                      />
                      <Bar
                        dataKey="topProductQuantity"
                        fill="#D4D4D8"
                        radius={[20, 20, 20, 20]}
                        name="Top Product Sales"
                      />
                      <Bar
                        dataKey="bestCustomerQuantity"
                        fill="#6366F1"
                        radius={[20, 20, 20, 20]}
                        name="Best Customer Sales"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-full overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Customer
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                            {sale.customer}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Right Column for Product Statistics */}
        <div className="lg:col-span-1 grid grid-cols-1 gap-6">
          {/* Product Statistics Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-green-100/50 dark:bg-gray-800 rounded-3xl shadow-lg p-6 flex flex-col h-auto justify-between"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-700 dark:text-white">Product Statistics</h3>
              <div className="relative">
                <select
                  value={productStatsFilter}
                  onChange={(e) => handleDropdownChange(e.target.value, 'productStats')}
                  className="appearance-none bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-md pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="Today">Today</option>
                  <option value="Yesterday">Yesterday</option>
                  <option value="This Week">This Week</option>
                  <option value="Last Week">Last Week</option>
                  <option value="This Month">This Month</option>
                  <option value="Last Month">Last Month</option>
                  <option value="Last 6 Months">Last 6 Months</option>
                  <option value="This Year">This Year</option>
                  <option value="Last Year">Last Year</option>
                  <option value="All Time">All Time</option>
                  <option value="Custom Period">Custom Period</option>
                </select>
                <ListFilter className="absolute right-2.5 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            {activeCustomPeriodDropdown === 'productStats' && productStatsFilter === 'Custom Period' && (
              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="date"
                  value={filterDate.start}
                  onChange={(e) => setFilterDate(prev => ({ ...prev, start: e.target.value }))}
                  className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={filterDate.end}
                  onChange={(e) => setFilterDate(prev => ({ ...prev, end: e.target.value }))}
                  className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Track your product sales</p>

            <div className="flex flex-col items-center justify-center flex-grow">
              <div className="relative w-60 h-60 flex items-center justify-center mb-40">
                <svg className="w-full h-full" viewBox="0 0 120 120">
                  {/* Background 3/4 circle for 100% total sales */}
                  <path
                    d={describeArc(60, 60, 50, 135, 405)} // Start 135, end 405 (135 + 270) for 3/4 circle
                    fill="none"
                    stroke="#E5E7EB" // Light gray for background
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                  
                  {/* Arcs for top 3 products */}
                  {productStatistics.data.map((entry, index) => {
                    const total = productStatistics.totalQuantityCurrentPeriod;
                    const percentageOfTotal = total > 0 ? (entry.value / total) : 0;

                    let arcRadius = 50; // Radius for the outermost arc
                    let arcStrokeWidth = 10; // Stroke width for the outermost arc

                    // Adjust radius and stroke width for nested arcs
                    if (index === 0) { arcRadius = 50; arcStrokeWidth = 10; } // Outermost
                    else if (index === 1) { arcRadius = 35; arcStrokeWidth = 8; } // Middle
                    else if (index === 2) { arcRadius = 20; arcStrokeWidth = 6; } // Innermost

                    // Total angle for 3/4 circle is 270 degrees. Percentage of this total angle.
                    const totalAngle = 270; 
                    // Start from 135 degrees (top-left) and sweep for the calculated percentage
                    const startArcAngle = 80;
                    const endArcAngle = startArcAngle + (percentageOfTotal * totalAngle);

                    return (
                      <path
                        key={entry.name}
                        d={describeArc(60, 60, arcRadius, startArcAngle, endArcAngle)}
                        fill="none"
                        stroke={entry.fill}
                        strokeWidth={arcStrokeWidth}
                        strokeLinecap="round"
                      />
                    );
                  })}
                </svg>
                {/* Central text displaying total quantity of top products */}
                <div className="absolute flex flex-col items-center justify-center">
                  <p className="text-3xl font-semibold text-gray-900 dark:text-white">{productStatistics.totalQuantityCurrentPeriod.toLocaleString()}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Products Sales</p>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full mt-1 ${productStatistics.overallPercentageChange >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {productStatistics.overallPercentageChange >= 0 ? '+' : ''}{productStatistics.overallPercentageChange}%
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
                      {entry.value.toLocaleString()} 
                      <span className={`ml-1 font-normal text-xs ${entry.percentageChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {entry.percentageChange >= 0 ? '+' : ''}{entry.percentageChange}%
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Customer Growth Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-violet-100/50 dark:bg-gray-800 rounded-3xl shadow-lg p-6 flex flex-col"
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex flex-col">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Customer Growth</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Track customer by largest customer</p>
              </div>
              <div className="relative">
                <select
                  value={customerFilterPeriod}
                  onChange={(e) => handleDropdownChange(e.target.value, 'customer')}
                  className="appearance-none bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-md pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="Today">Today</option>
                  <option value="Yesterday">Yesterday</option>
                  <option value="This Week">This Week</option>
                  <option value="Last Week">Last Week</option>
                  <option value="This Month">This Month</option>
                  <option value="Last Month">Last Month</option>
                  <option value="Last 6 Months">Last 6 Months</option>
                  <option value="This Year">This Year</option>
                  <option value="Last Year">Last Year</option>
                  <option value="All Time">All Time</option>
                  <option value="Custom Period">Custom Period</option>
                </select>
                <ListFilter className="absolute right-2.5 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex flex-row space-x-6 h-full items-center justify-center">
              {/* Left section: Circular bubbles */}
              <div className="relative w-1/2 h-60 flex items-center justify-center">
                {(() => {
                  const { startDate, endDate } = getDateRange(customerFilterPeriod);
                  const filteredSales = salesData.filter(sale => {
                    const saleDate = new Date(sale.date);
                    return saleDate >= startDate && saleDate <= endDate;
                  });
                  
                  // Calculate customer totals
                  const customerTotals = filteredSales.reduce((acc, sale) => {
                    acc[sale.customer] = (acc[sale.customer] || 0) + sale.quantity;
                    return acc;
                  }, {});
                  
                  // Get top 2 customers for circular display
                  const top2Customers = Object.entries(customerTotals)
                    .sort(([, qtyA], [, qtyB]) => qtyB - qtyA)
                    .slice(0, 2); // Only take top 2
                  
                  const totalQuantity = Object.values(customerTotals).reduce((sum, qty) => sum + qty, 0);
                  
                  if (top2Customers.length === 0) {
                    return (
                      <div className="text-center text-gray-500 dark:text-gray-400">
                        <p>No customer data available</p>
                      </div>
                    );
                  }
                  
                  // Specific colors for the two main circles
                  const circleColors = ['#3B82F6', '#EF4444', '#E5E7EB']; // Blue, Red
                  
                  // Positioning and sizing based on the image (smaller, more overlapping)
                  const circleStyles = [
                    { width: '80px', height: '80px', top: '30px', left: '30px', zIndex: 3 }, // Larger blue circle
                    { width: '60px', height: '60px', top: '70px', left: '70px', zIndex: 2 },  // Smaller red circle, overlapping
                    { width: '40px', height: '40px', top: '20px', left: '20px', zIndex: 1 }
                  ];

                  return top2Customers.map(([customer, quantity], index) => {
                    const percentage = totalQuantity > 0 ? (quantity / totalQuantity) * 100 : 0;
                    const style = circleStyles[index];
                    const color = circleColors[index];
                    
                    return (
                      <div
                        key={customer}
                        className="absolute rounded-full flex items-center justify-center shadow-lg text-white font-bold transition-all duration-300 hover:scale-110"
                        style={{
                          width: style.width,
                          height: style.height,
                          backgroundColor: color,
                          top: style.top,
                          left: style.left,
                          zIndex: style.zIndex,
                          fontSize: index === 0 ? 'xl' : 'lg' // Adjust font size based on circle size
                        }}
                      >
                        <div className="text-center">
                          <div className="font-bold text-2xl">{quantity}</div>
                          <div className="text-sm opacity-90">{percentage.toFixed(0)}%</div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Right section: Scrollable customer list */}
              <div className="w-1/2 h-60">
                <div 
                  className="overflow-y-auto h-full pr-2 space-y-1"
                  style={{
                    scrollbarWidth: 'none', // Firefox
                    msOverflowStyle: 'none', // IE and Edge
                  }}
                >
                  <style jsx>{`
                    div::-webkit-scrollbar {
                      display: none;
                    }
                  `}</style>
                  
                  {(() => {
                    const { startDate, endDate } = getDateRange(customerFilterPeriod);
                    const filteredSales = salesData.filter(sale => {
                      const saleDate = new Date(sale.date);
                      return saleDate >= startDate && saleDate <= endDate;
                    });
                    
                    // Calculate customer totals and orders count
                    const customerData = filteredSales.reduce((acc, sale) => {
                      if (!acc[sale.customer]) {
                        acc[sale.customer] = { quantity: 0, orders: 0 };
                      }
                      acc[sale.customer].quantity += sale.quantity;
                      acc[sale.customer].orders += 1;
                      return acc;
                    }, {});
                    
                    // Sort customers by total quantity (highest to lowest)
                    const sortedCustomers = Object.entries(customerData)
                      .sort(([, dataA], [, dataB]) => dataB.quantity - dataA.quantity);
                    
                    const totalQuantity = Object.values(customerData).reduce((sum, data) => sum + data.quantity, 0);
                    
                    if (sortedCustomers.length === 0) {
                      return (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                          <p>No customers found for selected period</p>
                        </div>
                      );
                    }
                    
                    return sortedCustomers.map(([customer, data], index) => {
                      const percentage = totalQuantity > 0 ? (data.quantity / totalQuantity) * 100 : 0;
                      // Specific colors for the first two items, then generic
                      const itemColor = index === 0 ? '#3B82F6' : index === 1 ? '#EF4444' : '#6B7280';
                      
                      return (
                        <div 
                          key={customer} 
                          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 group relative"
                        >
                          
                          {/* Customer info (minimal initially) */}
                          <div className="flex-grow min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {customer}
                            </p>
                            {/* Hidden on default, visible on hover as overlay */}
                            <div className="absolute z-10 hidden group-hover:block bg-gray-800 text-white text-xs rounded-lg py-1 px-2 bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap shadow-lg">
                              {data.quantity} units • {data.orders} orders • {percentage.toFixed(1)}%
                              <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800 translate-y-full"></div>
                            </div>
                            {/* Progress bar */}
                            <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-600 mt-2">
                              <div 
                                className="h-1.5 rounded-full transition-all duration-300"
                                style={{ 
                                  width: `${Math.max(percentage, 2)}%`,
                                  backgroundColor: itemColor 
                                }}
                              ></div>
                            </div>
                          </div>
                          
                          {/* Percentage (removed from here) */}
                          <div className="text-right flex-shrink-0 hidden">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              
                            </p>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Add Sale Modal */}
      {showAddSaleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4"
          >
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Add New Sale</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <button
                onClick={() => setShowAddSaleModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={(e) => {
              handleSubmit(e);
              setShowAddSaleModal(false);
            }} className="space-y-4">
              <div className="space-y-4">
                <input
                  type="hidden"
                  name="date"
                  value={new Date().toISOString().split('T')[0]}
                  onChange={handleInputChange}
                />
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Customer Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="customer"
                      value={formData.customer}
                      onChange={handleInputChange}
                      placeholder="Enter customer name"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                    />
                    <UserCircle className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddSaleModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  Add Sale
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SalesTracker;