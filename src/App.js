import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Inputs from './components/Inputs';
import Reports from './components/Reports';
import Alerts from './components/Alerts';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';

function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products');
      const data = await response.json();
      setProducts(data);
      setFilteredProducts(data);
    } catch (err) {
      setError('Failed to fetch products');
    }
  };

  const handleSearch = (searchTerm) => {
    const term = searchTerm.toLowerCase();
    const filtered = products.filter(
      (product) =>
        product.productName.toLowerCase().includes(term) ||
        product.item.toLowerCase().includes(term)
    );
    setFilteredProducts(filtered);
  };

  const addProduct = async (newProduct) => {
    try {
      const response = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });

      if (!response.ok) {
        throw new Error('Failed to add product');
      }

      const savedProduct = await response.json();
      setProducts([...products, savedProduct]);
      setFilteredProducts([...products, savedProduct]);
    } catch (err) {
      setError('Failed to add product');
    }
  };

  return (
    <Router>
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
        <Sidebar darkMode={darkMode} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
          <TopNav 
            darkMode={darkMode} 
            setDarkMode={setDarkMode} 
            onSearch={handleSearch} 
            products={products}
          />
          <main className="p-6">
            {error && (
              <div className={`mb-4 p-4 rounded-lg ${
                darkMode 
                  ? 'bg-red-900/50 text-red-200 border border-red-700' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {error}
              </div>
            )}
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="/dashboard" element={<Dashboard products={filteredProducts} darkMode={darkMode} />} />
              <Route path="/inputs" element={<Inputs addProduct={addProduct} darkMode={darkMode} />} />
              <Route path="/reports" element={<Reports products={filteredProducts} darkMode={darkMode} />} />
              <Route path="/alerts" element={<Alerts darkMode={darkMode} />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;