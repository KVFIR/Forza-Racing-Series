import React from 'react';
import Toggle from './Toggle';

const startingTimeOptions = [
  'Random', 'Sunrise', 'Morning', 'Late Morning', 'Noon', 'Afternoon', 
  'Late Afternoon', 'Evening', 'Sunset', 'Night', 'Midnight'
];

const timeProgressionOptions = ['x1', 'x2', 'x4', 'x12', 'x24'];

const RaceStageForm = ({ stage, data, onChange, isRequired }) => {
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
        {data.enabled && (
          <>
            <div className="flex space-x-4">
              <div className="flex-1">
                <label htmlFor="practiceTimeLimit" className="block text-sm font-medium text-gray-300 mb-1">
                  Practice time limit
                </label>
                <input
                  type="number"
                  id="practiceTimeLimit"
                  value={data.practiceTimeLimit}
                  onChange={(e) => onChange('practiceTimeLimit', Math.min(Math.max(parseInt(e.target.value), 5), 60))}
                  className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                  min="5"
                  max="60"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="qualifyingLaps" className="block text-sm font-medium text-gray-300 mb-1">
                  Qualifying laps
                </label>
                <input
                  type="number"
                  id="qualifyingLaps"
                  value={data.qualifyingLaps}
                  onChange={(e) => onChange('qualifyingLaps', Math.min(Math.max(parseInt(e.target.value), 1), 5))}
                  className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                  min="1"
                  max="5"
                />
              </div>
            </div>
            <div>
              <label htmlFor="intermissionPeriod" className="block text-sm font-medium text-gray-300 mb-1">
                Intermission period
              </label>
              <input
                type="number"
                id="intermissionPeriod"
                value={data.intermissionPeriod}
                onChange={(e) => onChange('intermissionPeriod', Math.min(Math.max(parseInt(e.target.value), 1), 5))}
                className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                min="1"
                max="5"
              />
            </div>
          </>
        )}
      </div>
    );
  } else if (stage === 'Race') {
    return (
      <div className="space-y-4 mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">{stage}</h3>
        <div className="flex space-x-4">
          <div className="flex-1">
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
          <div className="flex-1">
            {data.raceType === 'laps' ? (
              <>
                <label htmlFor="numberOfLaps" className="block text-sm font-medium text-gray-300 mb-1">
                  Number of laps
                </label>
                <input
                  type="number"
                  id="numberOfLaps"
                  value={data.numberOfLaps}
                  onChange={(e) => onChange('numberOfLaps', Math.min(Math.max(parseInt(e.target.value), 1), 1000))}
                  className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                  min="1"
                  max="1000"
                />
              </>
            ) : (
              <>
                <label htmlFor="raceTimer" className="block text-sm font-medium text-gray-300 mb-1">
                  Race timer (minutes)
                </label>
                <input
                  type="number"
                  id="raceTimer"
                  value={data.raceTimer}
                  onChange={(e) => onChange('raceTimer', Math.max(parseInt(e.target.value), 1))}
                  className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                  min="1"
                />
              </>
            )}
          </div>
        </div>
        <div className="flex space-x-4">
          <div className="flex-1">
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
          <div className="flex-1">
            <label htmlFor="timeProgression" className="block text-sm font-medium text-gray-300 mb-1">
              Time progression
            </label>
            <select
              id="timeProgression"
              value={data.timeProgression}
              onChange={(e) => onChange('timeProgression', e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
            >
              {timeProgressionOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex space-x-4">
          <div className="flex-1">
            <label htmlFor="dynamicTrackRubber" className="block text-sm font-medium text-gray-300 mb-1">
              Dynamic Track Rubber
            </label>
            <Toggle
              id="dynamicTrackRubber"
              checked={data.dynamicTrackRubber}
              onChange={(e) => onChange('dynamicTrackRubber', e.target.checked)}
              className="mt-1"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="startingTrackRubber" className="block text-sm font-medium text-gray-300 mb-1">
              Starting Track Rubber level
            </label>
            <input
              type="number"
              id="startingTrackRubber"
              value={data.startingTrackRubber}
              onChange={(e) => onChange('startingTrackRubber', Math.min(Math.max(parseInt(e.target.value), 0), 100))}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
              min="0"
              max="100"
            />
          </div>
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
