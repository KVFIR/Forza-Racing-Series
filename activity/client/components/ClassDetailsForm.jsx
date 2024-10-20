import React from 'react';
import { motion } from 'framer-motion';

const ClassDetailsForm = ({ classData, onChange, attemptedSubmit }) => {
  const handleCarChange = (index, value) => {
    let newCars = [...classData.availableCars];
    newCars[index] = value;
    
    // Удаляем пустые значения, кроме последнего
    newCars = newCars.filter((car, i) => car !== '' || i === newCars.length - 1);
    
    // Добавляем новое пустое поле, если последнее поле не пустое
    if (newCars[newCars.length - 1] !== '' && newCars.length < 10) {
      newCars.push('');
    }
    
    onChange('availableCars', newCars);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-2">{classData.class} class details</h3>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Available Cars
        </label>
        {classData.availableCars.map((car, index) => (
          <input
            key={index}
            type="text"
            value={car}
            onChange={(e) => handleCarChange(index, e.target.value)}
            className={`w-full p-2 mb-2 rounded bg-gray-700 text-white border ${
              attemptedSubmit && index === 0 && !car ? 'border-red-500' : 'border-gray-600'
            } focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 ${
              index === classData.availableCars.length - 1 && !car ? 'opacity-50' : ''
            }`}
            placeholder={`Car ${index + 1}`}
          />
        ))}
        {attemptedSubmit && !classData.availableCars[0] && (
          <p className="text-red-500 text-xs mt-1">At least one car is required</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Restrictions (BoP)
        </label>
        <select
          value={classData.restrictions}
          onChange={(e) => onChange('restrictions', e.target.value)}
          className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
        >
          <option value="stock">Full Stock</option>
          <option value="featured">Featured Multiplayer Parts</option>
          <option value="custom">Custom BoP</option>
        </select>
      </div>
      {classData.restrictions === 'custom' && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Custom BoP Details
          </label>
          <textarea
            value={classData.customBop}
            onChange={(e) => onChange('customBop', e.target.value)}
            className={`w-full p-2 rounded bg-gray-700 text-white border ${
              attemptedSubmit && !classData.customBop ? 'border-red-500' : 'border-gray-600'
            } focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50`}
            rows={4}
            placeholder="Describe custom BoP restrictions here..."
          />
          {attemptedSubmit && classData.restrictions === 'custom' && !classData.customBop && (
            <p className="text-red-500 text-xs mt-1">Custom BoP details are required</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ClassDetailsForm;
