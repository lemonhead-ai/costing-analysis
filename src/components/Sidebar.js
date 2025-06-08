import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CiGrid42, CiKeyboard, CiMemoPad, CiBellOn, CiDollar, CiHardDrive } from 'react-icons/ci';
import { motion } from 'framer-motion';


const Sidebar = ({ darkMode, sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();
  const sidebarVariants = {
    open: { width: 256, transition: { duration: 0.2, ease: 'easeInOut' } },
    closed: { width: 64, transition: { duration: 0.2, ease: 'easeInOut' } },
    hover: { width: 256, transition: { duration: 0.2, ease: 'easeInOut' } },
  };

  const navItems = [
    { to: '/dashboard', icon: <CiGrid42 className="h-6 w-6 mr-0.0125 ml-3 text-xl text-green-600" />, label: 'Dashboard' },
    { to: '/inputs', icon: <CiKeyboard className="h-6 w-6 mr-0.0125 ml-3 text-xl text-green-600" />, label: 'Inputs' },
    { to: '/reports', icon: <CiMemoPad className="h-6 w-6 mr-0.0125 ml-3 text-xl text-green-600" />, label: 'Reports' },
    { to: '/alerts', icon: <CiBellOn className="h-6 w-7 mr-0.0125 ml-3 text-xl text-green-600" />, label: 'Alerts' },
    { to: '/sales', icon: <CiDollar className="h-6 w-7 mr-0.0125 ml-3 text-xl text-green-600" />, label: 'Sales Tracker' },
    { to: '/Maintenance', icon: <CiHardDrive className="h-6 w-7 mr-0.0125 ml-3 text-xl text-green-600" />, label: 'Maintenance' },
  ];

  return (
    <motion.div
      className={`fixed top-6 left-2 bottom-6 z-30 shadow-2xl transition-colors duration-300 rounded-2xl border border-gray-600 h-[calc(100vh-3rem)] ${
        darkMode
          ? 'bg-gray-800 text-white'
          : 'bg-gray-300 text-gray-900'
      }`}
      variants={sidebarVariants}
      initial="closed"
      animate={sidebarOpen ? 'open' : 'closed'}
      onMouseEnter={() => setSidebarOpen(true)}
      onMouseLeave={() => setSidebarOpen(false)}
      whileHover={{ scale: 1.03, transition: { type: 'spring', stiffness: 500, damping: 10 } }}
    >
      <div className={`flex flex-col items-start p-4`}>
        <div className="flex items-center w-full">
          <motion.img
            src={process.env.PUBLIC_URL + "/logo.png"}
            alt="Logo"
            className={sidebarOpen ? "h-10 w-10 object-contain rounded-full" : "h-8 w-8 object-contain rounded-full"}
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.6 }}
          />
          {sidebarOpen && (
            <span className="text-lg font-bold text-left ml-3 whitespace-nowrap">Beta Plastics Co.</span>
          )}
        </div>
      </div>
      <nav className={`mt-6 w-full flex flex-col ${sidebarOpen ? 'items-start' : 'items-center'}`}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <div key={item.to} className={`w-full flex ${sidebarOpen ? '' : 'justify-center'}`}>
              <Link
                to={item.to}
                className={`flex p-4 my-1 rounded-lg transition-all duration-200 font-medium text-base w-full
                  ${sidebarOpen ? 'items-center text-left pl-2' : 'items-center justify-center text-center pl-0'}
                  ${isActive
                    ? darkMode
                      ? 'bg-green-700/10 border-l-4 border-green-600 text-green-400 shadow-sm'
                      : 'bg-green-100 border-l-4 border-green-600 text-green-700 shadow-sm'
                    : ''}
                `}
                style={{ position: 'relative', zIndex: 1 }}
                onMouseEnter={e => {
                  e.currentTarget.classList.add(darkMode ? 'bg-gray-700/40' : 'bg-green-100', 'shadow-md', 'scale-105');
                  e.currentTarget.classList.remove('hover:bg-gray-800', 'hover:bg-gray-100');
                }}
                onMouseLeave={e => {
                  e.currentTarget.classList.remove('bg-gray-700/40', 'bg-green-100', 'shadow-md', 'scale-105');
                }}
              >
                {item.icon}
                {sidebarOpen && <span className="ml-3">{item.label}</span>}
              </Link>
            </div>
          );
        })}
      </nav>
    </motion.div>
  );
};

export default Sidebar;