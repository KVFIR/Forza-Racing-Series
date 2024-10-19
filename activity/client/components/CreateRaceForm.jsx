import React, { useState } from 'react';
import { motion } from 'framer-motion';

const CreateRaceForm = ({ onCreateRace, userId }) => {
  const [formData, setFormData] = useState({
    name: '',
    track: '',
    carClass: '',
    dateTime: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const raceData = {
        ...formData,
        createdBy: userId
      };
      const response = await fetch('/.proxy/api/races', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(raceData),
      });
      if (!response.ok) {
        throw new Error('Failed to create race');
      }
      const newRace = await response.json();
      console.log('Race created:', newRace);
      onCreateRace(newRace);
    } catch (error) {
      console.error('Error creating race:', error);
      // Здесь можно добавить отображение ошибки пользователю
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 bg-gray-800 rounded-lg shadow-lg max-w-md mx-auto"
    >
      <h2 className="text-2xl font-bold text-white mb-6">Create New Race</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Race Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter race name"
            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
          />
        </div>
        <div>
          <label htmlFor="track" className="block text-sm font-medium text-gray-300 mb-1">Track</label>
          <input
            type="text"
            id="track"
            name="track"
            value={formData.track}
            onChange={handleChange}
            placeholder="Enter track name"
            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
          />
        </div>
        <div>
          <label htmlFor="carClass" className="block text-sm font-medium text-gray-300 mb-1">Car Class</label>
          <input
            type="text"
            id="carClass"
            name="carClass"
            value={formData.carClass}
            onChange={handleChange}
            placeholder="Enter car class"
            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
          />
        </div>
        <div>
          <label htmlFor="dateTime" className="block text-sm font-medium text-gray-300 mb-1">Date and Time</label>
          <input
            type="datetime-local"
            id="dateTime"
            name="dateTime"
            value={formData.dateTime}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold transition duration-300 ease-in-out hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Create Race
        </motion.button>
      </form>
    </motion.div>
  );
};

export default CreateRaceForm;
