import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IoAdd, IoList, IoPersonOutline, IoSettingsOutline } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';

const MainMenu = ({ user }) => {
  const navigate = useNavigate();
  const [isOrgRegistered, setIsOrgRegistered] = useState(false);

  useEffect(() => {
    const checkOrganization = async () => {
      if (!user?.guildId) return;
      
      try {
        const response = await fetch(`/.proxy/api/organizations/${user.guildId}`);
        setIsOrgRegistered(response.ok);
      } catch (error) {
        console.error('Error checking organization:', error);
        setIsOrgRegistered(false);
      }
    };

    checkOrganization();
  }, [user?.guildId]);

  const handleButtonClick = (path) => {
    if (!isOrgRegistered && (path === '/create-race' || path === '/organization-settings')) {
      navigate('/register-organization');
    } else {
      navigate(path);
    }
  };

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
          onClick={() => handleButtonClick('/create-race')}
          className="w-full bg-gray-500 bg-opacity-60 text-white py-3 px-6 rounded-lg text-lg font-semibold transition duration-300 ease-in-out hover:bg-gray-600 hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 border border-gray-400 flex items-center justify-center"
        >
          <IoAdd className="mr-2 text-2xl" /> Create New Event
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleButtonClick('/event-list')}
          className="w-full bg-gray-500 bg-opacity-60 text-white py-3 px-6 rounded-lg text-lg font-semibold transition duration-300 ease-in-out hover:bg-gray-600 hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 border border-gray-400 flex items-center justify-center"
        >
          <IoList className="mr-2 text-2xl" /> Browse Events
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleButtonClick('/profile')}
          className="w-full bg-gray-500 bg-opacity-60 text-white py-3 px-6 rounded-lg text-lg font-semibold transition duration-300 ease-in-out hover:bg-gray-600 hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 border border-gray-400 flex items-center justify-center"
        >
          <IoPersonOutline className="mr-2 text-2xl" /> My Profile
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleButtonClick('/organization-settings')}
          className="w-full bg-gray-500 bg-opacity-60 text-white py-3 px-6 rounded-lg text-lg font-semibold transition duration-300 ease-in-out hover:bg-gray-600 hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 border border-gray-400 flex items-center justify-center"
        >
          <IoSettingsOutline className="mr-2 text-2xl" /> Organization Settings
        </motion.button>
      </div>
    </motion.div>
  );
};

export default MainMenu;
