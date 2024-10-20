import React from 'react';
import Toggle from './Toggle';
import { motion, AnimatePresence } from 'framer-motion';

const startingTimeOptions = [
  'Random', 'Sunrise', 'Morning', 'Late Morning', 'Noon', 'Afternoon', 
  'Late Afternoon', 'Evening', 'Sunset', 'Night', 'Midnight'
];

const practiceTimeLimitOptions = ['5', '10', '15', '20', '30', '45', '60'];
const qualifyingLapsOptions = ['1', '2', '3', '4', '5'];

const RaceStageForm = ({ stage, data, onChange }) => {
  if (stage === 'Practice & Qualifying') {
    return (
      <div className="space-y-4 mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">{stage}</h3>
        <div className="mb-4">
          <Toggle
            checked={data.enabled}
            onChange={(e) => onChange('enabled', e.target.checked)}
            label="Enable Practice & Qualifying"
          />
        </div>
        <AnimatePresence>
          {data.enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div>
                <label htmlFor="practiceTimeLimit" className="block text-sm font-medium text-gray-300 mb-1">
                  Practice time limit
                </label>
                <select
                  id="practiceTimeLimit"
                  value={data.practiceTimeLimit}
                  onChange={(e) => onChange('practiceTimeLimit', e.target.value)}
                  className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                >
                  {practiceTimeLimitOptions.map(option => (
                    <option key={option} value={option}>{option} minutes</option>
                  ))}
                </select>
              </div>
              <div className="mt-4">
                <label htmlFor="qualifyingLaps" className="block text-sm font-medium text-gray-300 mb-1">
                  Qualifying laps
                </label>
                <select
                  id="qualifyingLaps"
                  value={data.qualifyingLaps}
                  onChange={(e) => onChange('qualifyingLaps', e.target.value)}
                  className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                >
                  {qualifyingLapsOptions.map(option => (
                    <option key={option} value={option}>{option} lap{option !== '1' ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  } else if (stage === 'Race') {
    return (
      <div className="space-y-4 mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">{stage}</h3>
        <div>
          <label htmlFor="raceType" className="block text-sm font-medium text-gray-300 mb-1">
            Race Type
          </label>
          <select
            id="raceType"
            value={data.raceType}
            onChange={(e) => onChange('raceType', e.target.value)}
            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
          >
            <option value="laps">Number of laps</option>
            <option value="timer">Race timer</option>
          </select>
        </div>
        <div>
          {data.raceType === 'laps' ? (
            <>
              <label htmlFor="numberOfLaps" className="block text-sm font-medium text-gray-300 mb-1">
                Number of laps *
              </label>
              <input
                type="number"
                id="numberOfLaps"
                value={data.numberOfLaps}
                onChange={(e) => onChange('numberOfLaps', Math.min(Math.max(parseInt(e.target.value) || 0, 1), 1000))}
                className={`w-full p-2 rounded bg-gray-700 text-white border ${
                  data.numberOfLaps === undefined || data.numberOfLaps === null || data.numberOfLaps === '' ? 'border-red-500' : 'border-gray-600'
                } focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50`}
                min="1"
                max="1000"
                required
              />
              {(data.numberOfLaps === undefined || data.numberOfLaps === null || data.numberOfLaps === '') && (
                <p className="text-red-500 text-xs mt-1">Number of laps is required and must be between 1 and 1000</p>
              )}
            </>
          ) : (
            <>
              <label htmlFor="raceTimer" className="block text-sm font-medium text-gray-300 mb-1">
                Race timer (minutes) *
              </label>
              <input
                type="number"
                id="raceTimer"
                value={data.raceTimer}
                onChange={(e) => onChange('raceTimer', Math.max(parseInt(e.target.value) || 0, 1))}
                className={`w-full p-2 rounded bg-gray-700 text-white border ${
                  data.raceTimer === undefined || data.raceTimer === null || data.raceTimer === '' ? 'border-red-500' : 'border-gray-600'
                } focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50`}
                min="1"
                required
              />
              {(data.raceTimer === undefined || data.raceTimer === null || data.raceTimer === '') && (
                <p className="text-red-500 text-xs mt-1">Race timer is required and must be at least 1 minute</p>
              )}
            </>
          )}
        </div>
        <div>
          <label htmlFor="startingTime" className="block text-sm font-medium text-gray-300 mb-1">
            Starting time of a day
          </label>
          <select
            id="startingTime"
            value={data.startingTime}
            onChange={(e) => onChange('startingTime', e.target.value)}
            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
          >
            {startingTimeOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="weather" className="block text-sm font-medium text-gray-300 mb-1">
            Weather
          </label>
          <select
            id="weather"
            value={data.weather}
            onChange={(e) => onChange('weather', e.target.value)}
            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
          >
            <option value="Random">Random</option>
            <option value="Variable Dry">Variable Dry</option>
            <option value="Variable Wet">Variable Wet</option>
            <option value="Rain at End">Rain at End</option>
            <option value="Rain at Start">Rain at Start</option>
            <option value="Fixed Dry">Fixed Dry</option>
            <option value="Fixed Wet">Fixed Wet</option>
          </select>
        </div>
      </div>
    );
  }
  return null;
};

export default RaceStageForm;
