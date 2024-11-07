import React from 'react';
import { motion } from 'framer-motion';

const LoadingButton = ({ 
  isLoading, 
  loadingText = 'Loading...', 
  children, 
  disabled, 
  className = '',
  ...props 
}) => {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      disabled={disabled || isLoading}
      className={`w-full rounded-xl bg-blue-600 py-3 text-lg font-semibold text-white transition-all hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center justify-center space-x-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          <span>{loadingText}</span>
        </div>
      ) : (
        children
      )}
    </motion.button>
  );
};

export default LoadingButton;