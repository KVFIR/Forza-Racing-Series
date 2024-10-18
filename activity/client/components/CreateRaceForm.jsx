import React, { useState } from 'react';
import { motion } from 'framer-motion';

const CreateRaceForm = ({ onCreateRace }) => {
  const [formData, setFormData] = useState({
    name: '',
    track: '',
    carClass: '',
    dateTime: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Здесь должна быть логика создания гонки
    console.log('Race created:', formData);
    onCreateRace(formData);
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <input
        type="text"
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="Race Name"
        className="w-full p-2 rounded bg-gray-700 text-white"
      />
      <input
        type="text"
        name="track"
        value={formData.track}
        onChange={handleChange}
        placeholder="Track"
        className="w-full p-2 rounded bg-gray-700 text-white"
      />
      <input
        type="text"
        name="carClass"
        value={formData.carClass}
        onChange={handleChange}
        placeholder="Car Class"
        className="w-full p-2 rounded bg-gray-700 text-white"
      />
      <input
        type="datetime-local"
        name="dateTime"
        value={formData.dateTime}
        onChange={handleChange}
        className="w-full p-2 rounded bg-gray-700 text-white"
      />
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        type="submit"
        className="w-full bg-blue-500 text-white py-2 px-4 rounded"
      >
        Create Race
      </motion.button>
    </motion.form>
  );
};

export default CreateRaceForm;
