import React from 'react';
import { motion } from 'framer-motion';
import Toggle from '../common/Toggle';

const startingTimeOptions = [
  'Random', 'Sunrise', 'Morning', 'Late Morning', 'Noon', 'Afternoon', 
  'Late Afternoon', 'Evening', 'Sunset', 'Night', 'Midnight'
];

const FMstep4 = ({ data, onChange }) => {
  const handleRaceTypeChange = (value) => {
    onChange('raceType', value);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-2">Race Settings</h3>
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label htmlFor="carToCarCollisions" className="block text-sm font-medium text-gray-300 mb-1">
            Car-To-Car collisions
          </label>
          <select
            id="carToCarCollisions"
            value={data.carToCarCollisions}
            onChange={(e) => onChange('carToCarCollisions', e.target.value)}
            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
          >
            <option value="Always On">Always On</option>
            <option value="Default">Default</option>
            <option value="Always Off">Always Off</option>
          </select>
        </div>

        <div>
          <label htmlFor="simulationLevel" className="block text-sm font-medium text-gray-300 mb-1">
            Simulation Level
          </label>
          <select
            id="simulationLevel"
            value={data.simulationLevel}
            onChange={(e) => onChange('simulationLevel', e.target.value)}
            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
          >
            <option value="Full Simulation">Full Simulation</option>
            <option value="Fuel & tires only">Fuel & tires only</option>
            <option value="No simulation">No simulation</option>
          </select>
        </div>

        <div>
          <label htmlFor="forzaRaceRegulations" className="block text-sm font-medium text-gray-300 mb-1">
            Forza Race Regulations
          </label>
          <select
            id="forzaRaceRegulations"
            value={data.forzaRaceRegulations}
            onChange={(e) => onChange('forzaRaceRegulations', e.target.value)}
            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
          >
            <option value="Full Penalty">Full Penalty</option>
            <option value="Warnings Only">Warnings Only</option>
            <option value="Off">Off</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Ghost Backmarkers
            </label>
            <Toggle
              checked={data.ghostBackmarkers}
              onChange={(e) => onChange('ghostBackmarkers', e.target.checked)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              FRR Disqualification
            </label>
            <Toggle
              checked={data.frrDisqualification}
              onChange={(e) => onChange('frrDisqualification', e.target.checked)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Dynamic Track Rubber
            </label>
            <Toggle
              checked={data.dynamicTrackRubber}
              onChange={(e) => onChange('dynamicTrackRubber', e.target.checked)}
            />
          </div>

          <div>
            <label htmlFor="startingTrackRubber" className="block text-sm font-medium text-gray-300 mb-1">
              Starting Track Rubber level
            </label>
            <input
              type="number"
              id="startingTrackRubber"
              value={data.startingTrackRubber}
              onChange={(e) => onChange('startingTrackRubber', Math.min(Math.max(parseInt(e.target.value) || 0, 0), 100))}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
              min="0"
              max="100"
            />
          </div>
        </div>

        <div>
          <label htmlFor="raceType" className="block text-sm font-medium text-gray-300 mb-1">
            Race Type
          </label>
          <select
            id="raceType"
            value={data.raceType}
            onChange={(e) => handleRaceTypeChange(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
          >
            <option value="laps">Number of laps</option>
            <option value="timer">Race timer</option>
          </select>
        </div>

        {data.raceType === 'laps' ? (
          <div>
            <label htmlFor="numberOfLaps" className="block text-sm font-medium text-gray-300 mb-1">
              Number of laps
            </label>
            <input
              type="number"
              id="numberOfLaps"
              value={data.numberOfLaps}
              onChange={(e) => onChange('numberOfLaps', Math.min(Math.max(parseInt(e.target.value) || 0, 1), 1000))}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
              min="1"
              max="1000"
            />
          </div>
        ) : (
          <div>
            <label htmlFor="raceTimer" className="block text-sm font-medium text-gray-300 mb-1">
              Race timer (minutes)
            </label>
            <input
              type="number"
              id="raceTimer"
              value={data.raceTimer}
              onChange={(e) => onChange('raceTimer', Math.max(parseInt(e.target.value) || 0, 1))}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
              min="1"
            />
          </div>
        )}

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
    </div>
  );
};

export default FMstep4;