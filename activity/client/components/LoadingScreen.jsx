import React from 'react';
import { motion } from 'framer-motion';

const LoadingScreen = () => {
  return (
    <div className="h-full w-full flex items-center justify-center bg-black bg-opacity-50">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full"
      />
    </div>
  );
};

export default LoadingScreen;
