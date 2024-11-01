import React from 'react';
import { motion } from 'framer-motion';

const FH5step2 = ({ data, onChange, attemptedSubmit }) => {
  const raceTypes = [
    { id: 'circuit', name: 'Circuit Race' },
    { id: 'sprint', name: 'Sprint Race' },
    { id: 'crosscountry', name: 'Cross Country' },
    { id: 'drift', name: 'Drift Zone' }
  ];

  const seasons = [
    'Summer - Day',
    'Summer - Night',
    'Autumn - Day',
    'Autumn - Night',
    'Winter - Day',
    'Winter - Night',
    'Spring - Day',
    'Spring - Night'
  ];

  const weather = [
    'Clear',
    'Light Rain',
    'Heavy Rain',
    'Storm',
    'Snow',
    'Blizzard'
  ];

  const routeTypes = [
    'Asphalt',
    'Dirt',
    'Mixed',
    'Snow'
  ];

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Race Type
        </label>
        <div className="grid grid-cols-2 gap-4">
          {raceTypes.map((type) => (
            <motion.button
              key={type.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChange('raceType', type.id)}
              className={`p-3 rounded-lg text-white font-medium transition-colors ${
                data.raceType === type.id 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {type.name}
            </motion.button>
          ))}
        </div>
      </div>

      {data.raceType === 'circuit' && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Number of Laps
          </label>
          <input
            type="number"
            min="1"
            max="50"
            value={data.numberOfLaps}
            onChange={(e) => onChange('numberOfLaps', parseInt(e.target.value))}
            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Season and Time
        </label>
        <select
          value={data.seasonAndTime}
          onChange={(e) => onChange('seasonAndTime', e.target.value)}
          className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
        >
          {seasons.map((season) => (
            <option key={season} value={season}>{season}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Weather
        </label>
        <select
          value={data.weather}
          onChange={(e) => onChange('weather', e.target.value)}
          className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
        >
          {weather.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Route Type
        </label>
        <select
          value={data.routeType}
          onChange={(e) => onChange('routeType', e.target.value)}
          className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
        >
          {routeTypes.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default FH5step2;
