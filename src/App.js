import React, { useState } from 'react';
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
  const [products, setProducts] = useState([
    { productName: 'BASINS', item: 'GRADE 1', materialCost: 5300, weightPerUnit: 215, unit: 'grams' },
  ]);
  const [filteredProducts, setFilteredProducts] = useState(products);

  const handleSearch = (searchTerm) => {
    const term = searchTerm.toLowerCase();
    const filtered = products.filter(
      (product) =>
        product.productName.toLowerCase().includes(term) ||
        product.item.toLowerCase().includes(term)
    );
    setFilteredProducts(filtered);
  };

  const addProduct = (newProduct) => {
    setProducts([...products, newProduct]);
    setFilteredProducts([...products, newProduct]);
  };

  return (
    <Router>
      <div className={`flex h-screen ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-white-50 text-black'}`}>
        <Sidebar darkMode={darkMode} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className={`flex-1 flex flex-col ${sidebarOpen ? 'ml-64' : 'ml-16'} transition-all duration-300`}>
          <TopNav darkMode={darkMode} setDarkMode={setDarkMode} onSearch={handleSearch} />
          <div className="flex-1 p-6 overflow-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/inputs" element={<Inputs addProduct={addProduct} />} />
              <Route path="/reports" element={<Reports products={filteredProducts} />} />
              <Route path="/alerts" element={<Alerts />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;