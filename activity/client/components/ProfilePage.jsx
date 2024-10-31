import React from 'react';
import { motion } from 'framer-motion';
import { IoArrowBackOutline } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from './common/LoadingSpinner';

const ProfilePage = ({ user }) => {
  const navigate = useNavigate();

  const handleBackToMenu = () => {
    navigate('/');
  };

  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex justify-center items-center h-screen"
      >
        <LoadingSpinner />
      </motion.div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleBackToMenu}
        className="mb-4 flex items-center bg-white bg-opacity-20 text-white py-2 px-4 rounded-lg font-semibold transition duration-300 ease-in-out hover:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
      >
        <IoArrowBackOutline className="mr-2" />
        Back to Menu
      </motion.button>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gray-800 bg-opacity-80 rounded-lg shadow-lg p-6 max-w-md mx-auto"
      >
        <h2 className="text-2xl font-bold text-white mb-6">User Profile</h2>
        <img src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`} alt="User Avatar" className="w-24 h-24 rounded-full mb-4 mx-auto" />
        <div className="space-y-2 text-gray-300">
          <p><span className="font-semibold">Username:</span> {user.username}</p>
          <p><span className="font-semibold">Discriminator:</span> {user.discriminator}</p>
          <p><span className="font-semibold">ID:</span> {user.id}</p>
          {user.email && <p><span className="font-semibold">Email:</span> {user.email}</p>}
        </div>
      </motion.div>
    </div>
  );
};

export default ProfilePage;
