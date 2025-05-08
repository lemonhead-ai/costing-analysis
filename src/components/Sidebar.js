import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/outline';
import { CiGrid42, CiKeyboard, CiMemoPad, CiBellOn } from 'react-icons/ci';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = ({ darkMode, sidebarOpen, setSidebarOpen }) => {
  const sidebarVariants = {
    open: { width: 256, transition: { duration: 0.3, ease: 'easeInOut' } },
    closed: { width: 64, transition: { duration: 0.3, ease: 'easeInOut' } },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.2, delay: 0.1 } },
  };

  return (
    <motion.div
      className="bg-gradient-to-br from-gray-900/80 via-gray-800/80 to-gray-700/80 backdrop-blur-xl text-white h-screen fixed z-10 border-r border-gray-700/50 shadow-lg"
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
          className="text-white hover:text-gray-300 rounded-full p-1 bg-gray-700/50 hover:bg-gray-600/50"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.2, type: 'spring', stiffness: 300 }}
        >
          {sidebarOpen ? <ChevronLeftIcon className="h-6 w-6" /> : <ChevronRightIcon className="h-6 w-6" />}
        </motion.button>
      </div>
      <nav className="mt-10">
        <motion.div initial="hidden" animate="visible" variants={itemVariants}>
          <Link
            to="/dashboard"
            className="flex items-center p-4 hover:bg-gray-700/50 rounded-lg transition-all duration-200"
          >
            <CiGrid42 className="h-6 w-6 mr-3 text-xl text-blue-500" />
            {sidebarOpen && <span className="transition-opacity duration-200">Dashboard</span>}
          </Link>
        </motion.div>
        <motion.div initial="hidden" animate="visible" variants={itemVariants}>
          <Link
            to="/inputs"
            className="flex items-center p-4 hover:bg-gray-700/50 rounded-lg transition-all duration-200"
          >
            <CiKeyboard className="h-6 w-6 mr-3 text-xl text-green-500" />
            {sidebarOpen && <span className="transition-opacity duration-200">Inputs</span>}
          </Link>
        </motion.div>
        <motion.div initial="hidden" animate="visible" variants={itemVariants}>
          <Link
            to="/reports"
            className="flex items-center p-4 hover:bg-gray-700/50 rounded-lg transition-all duration-200"
          >
            <CiMemoPad className="h-6 w-6 mr-3 text-xl text-yellow-500" />
            {sidebarOpen && <span className="transition-opacity duration-200">Reports</span>}
          </Link>
        </motion.div>
        <motion.div initial="hidden" animate="visible" variants={itemVariants}>
          <Link
            to="/alerts"
            className="flex items-center p-4 hover:bg-gray-700/50 rounded-lg transition-all duration-200"
          >
            <CiBellOn className="h-6 w-6 mr-3 text-xl text-red-500" />
            {sidebarOpen && <span className="transition-opacity duration-200">Alerts</span>}
          </Link>
        </motion.div>
      </nav>
    </motion.div>
  );
};

export default Sidebar;