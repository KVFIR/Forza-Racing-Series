import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { IoArrowBackOutline } from 'react-icons/io5';

const BackButton = ({ to, onClick, children = 'Back to Menu' }) => {
  const navigate = useNavigate();
  const handleClick = onClick || (() => navigate(to || '/'));

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className="group mb-6 flex items-center space-x-2 rounded-xl bg-gray-800/50 px-4 py-2.5 text-gray-300 backdrop-blur-sm transition-all hover:bg-gray-700/50"
    >
      <IoArrowBackOutline className="transition-transform group-hover:-translate-x-1" />
      <span>{children}</span>
    </motion.button>
  );
};

export default BackButton;