import React from 'react';
import { motion } from 'framer-motion';
import { IoAdd, IoList } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';

const MainMenu = () => {
  const navigate = useNavigate();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 text-center w-full max-w-sm mx-auto"
    >
      <img src="/images/frs.webp" alt="FRS" className="mb-1 w-32 h-auto mx-auto" />
      <h2 className="text-xl font-bold text-white mb-4">Event Manager</h2>
      <div className="space-y-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/create-race')}
          className="w-full bg-gray-500 bg-opacity-60 text-white py-3 px-6 rounded-lg text-lg font-semibold transition duration-300 ease-in-out hover:bg-gray-600 hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 border border-gray-400 flex items-center justify-center"
        >
          <IoAdd className="mr-2 text-2xl" /> Create Race
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/event-list')}
          className="w-full bg-gray-500 bg-opacity-60 text-white py-3 px-6 rounded-lg text-lg font-semibold transition duration-300 ease-in-out hover:bg-gray-600 hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 border border-gray-400 flex items-center justify-center"
        >
          <IoList className="mr-2 text-2xl" /> My Races
        </motion.button>
      </div>
    </motion.div>
  );
};

export default MainMenu;
