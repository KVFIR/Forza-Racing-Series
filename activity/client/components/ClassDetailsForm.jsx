import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { carList } from '../data/carList';

const ClassDetailsForm = ({ classData, onChange, attemptedSubmit }) => {
  const [suggestions, setSuggestions] = useState(Array(classData.availableCars.length).fill([]));

  const handleCarChange = (index, value) => {
    let newCars = [...classData.availableCars];
    newCars[index] = value;
    
    // Фильтруем suggestions для конкретного поля
    const newSuggestions = carList.filter(car => 
      car.toLowerCase().includes(value.toLowerCase())
    );
    const updatedSuggestions = [...suggestions];
    updatedSuggestions[index] = newSuggestions;
    setSuggestions(updatedSuggestions);

    // Удаляем пустые значения, кроме последнего
    newCars = newCars.filter((car, i) => car !== '' || i === newCars.length - 1);
    
    // Добавляем новое пустое поле, если последнее поле не пустое
    if (newCars[newCars.length - 1] !== '' && newCars.length < 10) {
      newCars.push('');
      setSuggestions([...updatedSuggestions, []]);
    }
    
    onChange('availableCars', newCars);
  };

  const handleSuggestionClick = (index, value) => {
    handleCarChange(index, value);
    const updatedSuggestions = [...suggestions];
    updatedSuggestions[index] = [];
    setSuggestions(updatedSuggestions);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-2">{classData.class} class details</h3>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Available Cars
        </label>
        {classData.availableCars.map((car, index) => (
          <div key={index} className="relative mb-2">
            <input
              type="text"
              value={car}
              onChange={(e) => handleCarChange(index, e.target.value)}
              className={`w-full p-2 rounded bg-gray-700 text-white border ${
                attemptedSubmit && index === 0 && !car ? 'border-red-500' : 'border-gray-600'
              } focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 ${
                index === classData.availableCars.length - 1 && !car ? 'opacity-50' : ''
              }`}
              placeholder={`Car ${index + 1}`}
            />
            {suggestions[index] && suggestions[index].length > 0 && car && (
              <ul className="absolute z-10 w-full bg-gray-800 border border-gray-600 rounded mt-1 max-h-60 overflow-y-auto">
                {suggestions[index].map((suggestion, i) => (
                  <li
                    key={i}
                    className="p-2 hover:bg-gray-700 cursor-pointer text-white"
                    onClick={() => handleSuggestionClick(index, suggestion)}
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
          </div>
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
          <option value="Full Stock">Full Stock</option>
          <option value="Featured Multiplayer Parts">Featured Multiplayer Parts</option>
          <option value="Custom BoP">Custom BoP</option>
        </select>
      </div>
      {classData.restrictions === 'Custom BoP' && (
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
