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
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Margin Alerts</h2>
      <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-900' : 'bg-white'} shadow-lg border ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
        {loading ? (
          <p>Loading alerts...</p>
        ) : alerts.length === 0 ? (
          <p>No margin alerts at this time.</p>
        ) : (
          <ul>
            {alerts.map((product) => (
              <li key={product._id} className={`mb-4 p-4 rounded-xl flex flex-col md:flex-row md:items-center md:justify-between ${darkMode ? 'bg-red-900/10' : 'bg-red-100/60'}`}>
                <div>
                  <span className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>{product.productName}</span>
                  <span className="ml-2 text-gray-400">({product.item})</span>
                  <span className="ml-4 text-red-500 font-semibold">
                    Margin: {(product.calculations.currentMargin * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="mt-2 md:mt-0 flex gap-2">
                  <button
                    onClick={() => handleView(product)}
                    className="flex items-center gap-2 px-5 py-2 rounded-full font-semibold transition-colors duration-200 shadow-sm bg-blue-600 hover:bg-blue-700 text-white"
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