import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { locationList } from './data/locationList';

const FH5step1 = ({ formData, onChange, attemptedSubmit }) => {
  const [locationSuggestions, setLocationSuggestions] = useState([]);

  const handleLocationChange = (value) => {
    onChange('location', value);
    onChange('route', '');
    
    const newSuggestions = locationList
      .filter(loc => loc.name.toLowerCase().includes(value.toLowerCase()))
      .map(loc => loc.name);
    setLocationSuggestions(newSuggestions);
  };

  const handleLocationSuggestionClick = (value) => {
    onChange('location', value);
    onChange('route', '');
    setLocationSuggestions([]);
  };

  const handleParticipantsChange = (increment) => {
    onChange('slots', Math.min(Math.max(formData.slots + increment, 1), 12));
  };

  const carClasses = [
    'D', 'C', 'B', 'A', 'S1', 'S2', 'X'
  ];

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
          Event Name
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => onChange('name', e.target.value)}
          className={`w-full p-2 rounded bg-gray-700 text-white border ${
            attemptedSubmit && !formData.name ? 'border-red-500' : 'border-gray-600'
          } focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50`}
        />
        {attemptedSubmit && !formData.name && (
          <p className="text-red-500 text-xs mt-1">Event name is required</p>
        )}
      </div>

      <div className="flex space-x-4">
        <div className="flex-1">
          <label htmlFor="dateTime" className="block text-sm font-medium text-gray-300 mb-2">
            Date and Time
          </label>
          <input
            type="datetime-local"
            id="dateTime"
            value={(formData.dateTime)}
            onChange={(e) => onChange('dateTime', e.target.value)}
            className={`w-full p-2 rounded bg-gray-700 text-white border ${
              attemptedSubmit && !formData.dateTime ? 'border-red-500' : 'border-gray-600'
            } focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50`}
          />
          {attemptedSubmit && !formData.dateTime && (
            <p className="text-red-500 text-xs mt-1">Date and time is required</p>
          )}
        </div>

        <div className="w-48">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Max Participants
          </label>
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={() => handleParticipantsChange(-1)}
              className="p-2 rounded bg-gray-700 text-white hover:bg-gray-600"
            >
              -
            </motion.button>
            <span className="w-12 text-center text-white">{formData.slots}</span>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={() => handleParticipantsChange(1)}
              className="p-2 rounded bg-gray-700 text-white hover:bg-gray-600"
            >
              +
            </motion.button>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-2">
          Location
        </label>
        <div className="relative">
          <input
            type="text"
            id="location"
            value={formData.location}
            onChange={(e) => handleLocationChange(e.target.value)}
            className={`w-full p-2 rounded bg-gray-700 text-white border ${
              attemptedSubmit && !formData.location ? 'border-red-500' : 'border-gray-600'
            } focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50`}
          />
          {locationSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-gray-700 rounded-md shadow-lg">
              {locationSuggestions.map((suggestion) => (
                <div
                  key={suggestion}
                  onClick={() => handleLocationSuggestionClick(suggestion)}
                  className="p-2 hover:bg-gray-600 cursor-pointer text-white"
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>
        {attemptedSubmit && !formData.location && (
          <p className="text-red-500 text-xs mt-1">Location is required</p>
        )}
      </div>

      <div>
        <label htmlFor="carClass" className="block text-sm font-medium text-gray-300 mb-2">
          Car Class
        </label>
        <select
          id="carClass"
          value={formData.carClass}
          onChange={(e) => onChange('carClass', e.target.value)}
          className={`w-full p-2 rounded bg-gray-700 text-white border ${
            attemptedSubmit && !formData.carClass ? 'border-red-500' : 'border-gray-600'
          } focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50`}
        >
          <option value="">Select Class</option>
          {carClasses.map((cls) => (
            <option key={cls} value={cls}>
              {cls}
            </option>
          ))}
        </select>
        {attemptedSubmit && !formData.carClass && (
          <p className="text-red-500 text-xs mt-1">Car class is required</p>
        )}
      </div>
    </div>
  );
};

export default FH5step1;
