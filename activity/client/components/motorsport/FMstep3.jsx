import React from 'react';
import Toggle from '../common/Toggle';
import { motion, AnimatePresence } from 'framer-motion';

const practiceTimeLimitOptions = ['5', '10', '15', '20', '30', '45', '60'];
const qualifyingLapsOptions = ['1', '2', '3', '4', '5'];

const FMstep3 = ({ data = {}, onChange }) => {
  const enabled = data?.enabled ?? false;
  const practiceTimeLimit = data?.practiceTimeLimit ?? '20';
  const qualifyingLaps = data?.qualifyingLaps ?? '3';

  return (
    <div className="space-y-4 mb-6">
      <h3 className="text-lg font-semibold text-white mb-2">Practice & Qualifying</h3>
      <div className="mb-4">
        <Toggle
          checked={enabled}
          onChange={(e) => onChange('enabled', e.target.checked)}
          label="Enable Practice & Qualifying"
        />
      </div>
      <AnimatePresence>
        {enabled && (
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
                value={practiceTimeLimit}
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
                value={qualifyingLaps}
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
};

export default FMstep3;