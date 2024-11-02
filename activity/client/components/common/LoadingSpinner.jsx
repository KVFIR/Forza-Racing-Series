import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center gap-4">
    <motion.div
      initial={{ scale: 0.8 }}
      animate={{ 
        rotate: 360,
        scale: [0.8, 1, 0.8]
      }}
      transition={{ 
        rotate: { duration: 1, repeat: Infinity, ease: "linear" },
        scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
      }}
      className="w-12 h-12 border-4 border-white-500 border-t-transparent rounded-full shadow-lg"
    />
  </div>
);

export default LoadingSpinner;