import React from 'react';
import { motion } from 'framer-motion';

const MainMenu = ({ onCreateRace, onMyRaces }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 rounded-lg shadow-lg text-center w-full max-w-sm mx-auto"
    >
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Forza Race Organizer</h1>
      <div className="space-y-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onCreateRace}
          className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg text-lg font-semibold transition duration-300 ease-in-out hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
        >
          Create Race
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onMyRaces}
          className="w-full bg-green-500 text-white py-3 px-6 rounded-lg text-lg font-semibold transition duration-300 ease-in-out hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50"
        >
          My Races
        </motion.button>
      </div>
    </motion.div>
  );
};

export default MainMenu;
