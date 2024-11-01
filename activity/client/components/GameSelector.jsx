import React from 'react';
import { motion } from 'framer-motion';
import { IoArrowBackOutline } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';

const GameSelector = ({ onSelect }) => {
  const navigate = useNavigate();
  const games = [
    {
      id: 'fm',
      name: 'Forza Motorsport',
      image: '/images/fm.svg',
      alt: 'Forza Motorsport'
    },
    {
      id: 'fh5',
      name: 'Forza Horizon 5',
      image: '/images/fh5.svg',
      alt: 'Forza Horizon 5'
    }
  ];

  return (
    <div>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/')}
        className="mb-4 flex items-center bg-white bg-opacity-20 text-white py-2 px-4 rounded-lg font-semibold transition duration-300 ease-in-out hover:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
      >
        <IoArrowBackOutline className="mr-2" />
        Back to Menu
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="p-6 bg-gray-800 bg-opacity-80 rounded-lg shadow-lg max-w-4xl mx-auto"
      >
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Select Game</h2>
        <div className="grid grid-cols-2 gap-6">
          {games.map((game) => (
            <motion.button
              key={game.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(game.id)}
              className="h-32 cursor-pointer flex items-center justify-center p-4"
            >
              <img 
                src={game.image} 
                alt={game.alt} 
                className="h-24 w-auto object-contain "
              />
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default GameSelector;