import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MARGIN_THRESHOLD = 0.2; // 20%
const MATERIAL_COST_THRESHOLD = 6000; // Example: flag if material cost > 6000 KES
const OVERHEADS_THRESHOLD = 20; // Example: flag if overheads per item > 20 KES

const Alerts = ({ darkMode }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvedIds, setResolvedIds] = useState([]);
  const navigate = useNavigate();

  // Recalculate metrics to match backend logic
  const recalcMetrics = (product) => {
    const materialCost = parseFloat(product.materialCost) || 0;
    const masterBatchCost = parseFloat(product.masterBatchCost) || 0;
    let weightPerUnit = parseFloat(product.weightPerUnit) || 1;
    const currentSellingPrice = parseFloat(product.currentSellingPrice) || 0;
    const overheadPercentage = parseFloat(product.overheadPercentage) || 25;

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

    const currentMargin = currentSellingPrice
      ? (currentSellingPrice - (costPerItem * 1.16)) / currentSellingPrice
      : 0;

    const pcsFrom1Kg = 1000 / weightPerUnit;
    const valueOfProductFrom1Kg = currentSellingPrice * pcsFrom1Kg;
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

  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      try {
        const res = await fetch('http://localhost:5000/api/products');
        const data = await res.json();
        console.log('Fetched products:', data); // Debug: Log fetched data

        // Build alerts based on multiple criteria
        const alertList = [];
        data.forEach(product => {
          // Recalculate metrics
          const calculations = recalcMetrics(product);
          const materialCost = parseFloat(product.materialCost) || 0;
          console.log(`Product: ${product.productName}, Recalculated Margin: ${calculations.currentMargin}`); // Debug: Log recalculated margin

          // Margin alert
          if (
            typeof calculations.currentMargin === 'number' &&
            isFinite(calculations.currentMargin) &&
            calculations.currentMargin < MARGIN_THRESHOLD
          ) {
            alertList.push({
              type: 'Low Margin',
              message: `Margin is below 20%.`,
              product,
              value: (calculations.currentMargin * 100).toFixed(2) + '%',
              severity: 'danger',
            });
          }
          // High material cost alert
          if (materialCost > MATERIAL_COST_THRESHOLD) {
            alertList.push({
              type: 'High Material Cost',
              message: `Material cost is above ${MATERIAL_COST_THRESHOLD} KES.`,
              product,
              value: materialCost.toFixed(2) + ' KES',
              severity: 'warning',
            });
          }
          // High overheads alert
          if (
            typeof calculations.overheads === 'number' &&
            isFinite(calculations.overheads) &&
            calculations.overheads > OVERHEADS_THRESHOLD
          ) {
            alertList.push({
              type: 'High Overheads',
              message: `Overheads per item are above ${OVERHEADS_THRESHOLD} KES.`,
              product,
              value: calculations.overheads.toFixed(2) + ' KES',
              severity: 'warning',
            });
          }
        });

        setAlerts(alertList);
      } catch (err) {
        console.error('Fetch error:', err);
        setAlerts([]);
      }
      setLoading(false);
    };
    fetchAlerts();
  }, []);

  const handleResolve = (productId, type) => {
    setResolvedIds([...resolvedIds, `${productId}-${type}`]);
  };

  const handleEdit = (product) => {
    navigate('/inputs', { state: { product } });
  };

  // Only show unresolved alerts
  const visibleAlerts = alerts.filter(
    alert => !resolvedIds.includes(`${alert.product._id}-${alert.type}`)
  );

  return (
    <div className="max-w-3xl mx-auto text-left ml-10">
      <h2 className="text-2xl font-bold mb-6 text-left">Margin & Cost Alerts</h2>
      <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-900' : 'bg-white'} shadow-lg border ${darkMode ? 'border-gray-800' : 'border-gray-200'} text-left`}>
        {loading ? (
          <p>Loading alerts...</p>
        ) : visibleAlerts.length === 0 ? (
          <p>No alerts at this time.</p>
        ) : (
          <ul>
            {visibleAlerts.map((alert, idx) => (
              <li
                key={alert.product._id + alert.type}
                className={`mb-4 p-4 rounded-xl flex flex-col md:flex-row md:items-center md:justify-between ${
                  alert.severity === 'danger'
                    ? darkMode ? 'bg-red-900/10' : 'bg-red-100/60'
                    : darkMode ? 'bg-yellow-900/10' : 'bg-yellow-100/60'
                }`}
              >
                <div className="text-left">
                  <span className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {alert.product.productName}
                  </span>
                  <span className="ml-2 text-gray-400">({alert.product.item})</span>
                  <span className="ml-4 font-semibold">
                    {alert.type}: <span className={alert.severity === 'danger' ? 'text-red-500' : 'text-yellow-600'}>
                      {alert.value}
                    </span>
                  </span>
                  <div className="text-sm mt-1 text-gray-400">{alert.message}</div>
                </div>
                <div className="mt-2 md:mt-0 flex gap-2">
                  <button
                    onClick={() => handleEdit(alert.product)}
                    className="flex items-center gap-2 px-5 py-2 rounded-full font-semibold transition-colors duration-200 shadow-sm bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleResolve(alert.product._id, alert.type)}
                    className="flex items-center gap-2 px-5 py-2 rounded-full font-semibold transition-colors duration-200 shadow-sm bg-green-600 hover:bg-green-700 text-white"
                  >
                    Resolve
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Alerts;