import React from 'react';

const Dashboard = () => {
  const metrics = {
    totalMaterialCost: 25242.00,
    minProduction: 111,
    avgSellingPrice: 45.27,
    marginAlerts: 0,
    lastDownload: '2025-05-08',
    realTimeCost: 3759.12,
  };

  return (
    <div>
      <h2 className="text-3xl font-semibold mb-6">Dashboard</h2>
      <div className="grid grid-cols-2 md:grid-cols-2 1g:grid-cols-2 gap-6">
        <div className="bg-gray-800/50 backdrop-blur-md p-6 rounded-xl shadow-lg border border-gray-700/50">
          <h3 className="text-sm text-gray-300">Total Material Cost</h3>
          <p className="text-2xl font-bold">{metrics.totalMaterialCost.toFixed(2)} KES</p>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-md p-6 rounded-xl shadow-lg border border-gray-700/50">
          <h3 className="text-sm text-gray-300">Minimum Production Estimate</h3>
          <p className="text-2xl font-bold">{metrics.minProduction}</p>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-md p-6 rounded-xl shadow-lg border border-gray-700/50">
          <h3 className="text-sm text-gray-300">Average Selling Price</h3>
          <p className="text-2xl font-bold">{metrics.avgSellingPrice.toFixed(2)} KES</p>
        </div>
        <div className="bg-red-500/70 backdrop-blur-md p-6 rounded-xl shadow-lg border border-gray-700/50">
          <h3 className="text-sm">Margin Alerts</h3>
          <p className="text-2xl font-bold">{metrics.marginAlerts}</p>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-md p-6 rounded-xl shadow-lg border border-gray-700/50">
          <h3 className="text-sm text-gray-300">Last Downloaded Report</h3>
          <p className="text-2xl font-bold">{metrics.lastDownload}</p>
        </div>
        <div className="bg-green-500/70 backdrop-blur-md p-6 rounded-xl shadow-lg border border-gray-700/50">
          <h3 className="text-sm">Cost Summary</h3>
          <p className="text-2xl font-bold">{metrics.realTimeCost.toFixed(2)} KES</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;