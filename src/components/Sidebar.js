import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/outline';
import { CiGrid42, CiKeyboard, CiMemoPad, CiBellOn } from 'react-icons/ci';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = ({ darkMode, sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();
  const sidebarVariants = {
    open: { width: 256, transition: { duration: 0.3, ease: 'easeInOut' } },
    closed: { width: 64, transition: { duration: 0.3, ease: 'easeInOut' } },
  };

  const navItems = [
    { to: '/dashboard', icon: <CiGrid42 className="h-6 w-6 mr-3 text-xl text-green-600" />, label: 'Dashboard' },
    { to: '/inputs', icon: <CiKeyboard className="h-6 w-6 mr-3 text-xl text-green-600" />, label: 'Inputs' },
    { to: '/reports', icon: <CiMemoPad className="h-6 w-6 mr-3 text-xl text-green-600" />, label: 'Reports' },
    { to: '/alerts', icon: <CiBellOn className="h-6 w-6 mr-3 text-xl text-green-600" />, label: 'Alerts' },
  ];

  return (
    <motion.div
      className={`h-screen fixed z-10 border-r shadow-lg transition-colors duration-300 ${
        darkMode
          ? 'bg-gray-900 border-gray-800 text-white'
          : 'bg-white border-gray-200 text-gray-900'
      }`}
      variants={sidebarVariants}
      initial={sidebarOpen ? 'open' : 'closed'}
      animate={sidebarOpen ? 'open' : 'closed'}
    >
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <AnimatePresence>
            {!sidebarOpen ? (
              <motion.img
                key="icon"
                src="/logo.png"
                alt="Icon"
                className="h-6 w-6 object-contain rounded-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            ) : (
              <motion.div
                key="logo"
                className="flex items-center space-x-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <motion.img
                  src="/logo.png"
                  alt="Logo"
                  className="h-8 w-8 object-contain rounded-full"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                />
                <motion.h2
                  className="text-lg font-bold"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: 0.1 }}
                >
                  Beta Plastics Co.
                </motion.h2>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <motion.button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`rounded-full p-1 transition-colors duration-200 ${
            darkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
          }`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.2, type: 'spring', stiffness: 300 }}
        >
          {sidebarOpen ? <ChevronLeftIcon className="h-6 w-6" /> : <ChevronRightIcon className="h-6 w-6" />}
        </motion.button>
      </div>
      <nav className="mt-10">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <motion.div key={item.to} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, delay: 0.1 }}>
              <Link
                to={item.to}
                className={`flex items-center p-4 my-1 rounded-lg transition-all duration-200 font-medium text-base ${
                  isActive
                    ? darkMode
                      ? 'bg-green-700/10 border-l-4 border-green-600 text-green-400 shadow-sm'
                      : 'bg-green-100 border-l-4 border-green-600 text-green-700 shadow-sm'
                    : darkMode
                      ? 'hover:bg-gray-800'
                      : 'hover:bg-gray-100'
                }`}
              >
                {item.icon}
                {sidebarOpen && <span className="transition-opacity duration-200">{item.label}</span>}
              </Link>
            </motion.div>
          );
        })}
      </nav>
    </motion.div>
  );
};

export default Sidebar;