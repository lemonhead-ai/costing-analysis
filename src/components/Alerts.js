import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const MARGIN_THRESHOLD = 0.2; // 20%

const Alerts = ({ darkMode }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch products and filter for margin alerts
    const fetchAlerts = async () => {
      setLoading(true);
      try {
        const res = await fetch('http://localhost:5000/api/products');
        const data = await res.json();
        const lowMarginProducts = data.filter(
          (product) => product.calculations && product.calculations.currentMargin < MARGIN_THRESHOLD
        );
        setAlerts(lowMarginProducts);
      } catch (err) {
        setAlerts([]);
      }
      setLoading(false);
    };
    fetchAlerts();
  }, []);

  const handleView = (product) => {
    navigate('/inputs', { state: { product } });
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Margin Alerts</h2>
      <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800/50' : 'bg-white'} shadow-lg border border-gray-700/50`}>
        {loading ? (
          <p>Loading alerts...</p>
        ) : alerts.length === 0 ? (
          <p>No margin alerts at this time.</p>
        ) : (
          <ul>
            {alerts.map((product) => (
              <li key={product._id} className="mb-4 p-4 rounded-lg bg-red-900/20 flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <span className="font-bold text-lg text-white">{product.productName}</span>
                  <span className="ml-2 text-gray-400">({product.item})</span>
                  <span className="ml-4 text-red-400 font-semibold">
                    Margin: {(product.calculations.currentMargin * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="mt-2 md:mt-0 flex gap-2">
                  <button
                    onClick={() => handleView(product)}
                    className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition"
                  >
                    View
                  </button>
                  {/* Example resolve action (would need backend support) */}
                  {/* <button
                    onClick={() => handleResolve(product._id)}
                    className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition"
                  >
                    Resolve
                  </button> */}
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