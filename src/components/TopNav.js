import React, { useState } from 'react';
import { CiLight, CiDark, CiUser } from 'react-icons/ci';
import { motion } from 'framer-motion';

const TopNav = ({ darkMode, setDarkMode, onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      onSearch(searchTerm);
      setSearchTerm(''); // Clear input after search
    }
  };

  return (
    <div className="bg-gray-800/80 backdrop-blur-xl p-4 flex justify-between items-center border-b border-gray-700/50 shadow-md z-20">
      <h2 className="text-xl font-bold text-white">Cost Analyser</h2>
      <div className="flex items-center space-x-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleSearch}
            className="bg-white/20 backdrop-blur-md text-white p-2 pl-10 rounded-lg w-72 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
          />
          <motion.button
            onClick={handleSearch}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1116.65 16.65z"
              />
            </svg>
          </motion.button>
        </div>
        <motion.button
          onClick={() => {/* Export Excel logic */}}
          className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors duration-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          Export Excel
        </motion.button>
        <motion.button
          onClick={() => {/* Export PDF logic */}}
          className="bg-blue-700 text-white px-3 py-1 rounded-lg hover:bg-purple-600 transition-colors duration-200"
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
  );
};

export default TopNav;