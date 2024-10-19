import React from 'react';
import { motion } from 'framer-motion';

const MainMenu = ({ onCreateRace, onMyRaces, onJoinRace }) => {
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
          onClick={onCreateRace}
          className="w-full bg-gray-500 bg-opacity-50 text-white py-3 px-6 rounded-lg text-lg font-semibold transition duration-300 ease-in-out hover:bg-gray-600 hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 border border-gray-400"
        >
          Create Race
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onJoinRace}
          className="w-full bg-gray-500 bg-opacity-50 text-white py-3 px-6 rounded-lg text-lg font-semibold transition duration-300 ease-in-out hover:bg-gray-600 hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 border border-gray-400"
        >
          Join Race
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onMyRaces}
          className="w-full bg-gray-500 bg-opacity-50 text-white py-3 px-6 rounded-lg text-lg font-semibold transition duration-300 ease-in-out hover:bg-gray-600 hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 border border-gray-400"
        >
          My Races
        </motion.button>
      </div>
    </motion.div>
  );
};

export default MainMenu;
