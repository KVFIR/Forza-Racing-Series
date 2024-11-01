import React, { useState } from 'react';
import { trackList } from './data/trackList';

const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  const tzOffset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - (tzOffset * 60000));
  return localDate.toISOString().slice(0, 16);
};

const FMstep1 = ({ formData, onChange, attemptedSubmit }) => {
  const [trackSuggestions, setTrackSuggestions] = useState([]);

  const handleTrackChange = (value) => {
    onChange('track', value);
    onChange('trackConfig', '');
    
    const newSuggestions = trackList
      .filter(track => track.name.toLowerCase().includes(value.toLowerCase()))
      .map(track => track.name);
    setTrackSuggestions(newSuggestions);
  };

  const handleTrackSuggestionClick = (value) => {
    onChange('track', value);
    onChange('trackConfig', '');
    setTrackSuggestions([]);
  };

  const handleParticipantsChange = (increment) => {
    onChange('slots', Math.min(Math.max(formData.slots + increment, 1), 24));
  };

  const handleCarClassChange = (index, value) => {
    let newCarClasses = [...formData.carClasses];
    if (value === '' && index !== 0) {
      newCarClasses = newCarClasses.filter((_, i) => i !== index);
    } else {
      newCarClasses[index] = value;
      if (value !== '' && index === newCarClasses.length - 1 && newCarClasses.length < 4) {
        newCarClasses.push('');
      }
    }
    onChange('carClasses', newCarClasses);
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Race Title</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder="Enter race title"
          className={`w-full p-2 rounded bg-gray-700 text-white border ${
            attemptedSubmit && !formData.name ? 'border-red-500' : 'border-gray-600'
          } focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50`}
        />
        {attemptedSubmit && !formData.name && (
          <p className="text-red-500 text-xs mt-1">Race title is required</p>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">Car Classes</label>
        {formData.carClasses.map((carClass, index) => (
          <div key={index} className="flex items-center space-x-2 mb-2">
            <input
              type="text"
              value={carClass}
              onChange={(e) => handleCarClassChange(index, e.target.value)}
              placeholder={index === 0 ? "Enter car class" : "Add multiclass"}
              className={`flex-1 p-2 rounded bg-gray-700 text-white border ${
                attemptedSubmit && index === 0 && !carClass ? 'border-red-500' : 'border-gray-600'
              } focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50`}
              required={index === 0}
            />
          </div>
        ))}
        {attemptedSubmit && !formData.carClasses[0] && (
          <p className="text-red-500 text-xs mt-1">At least one car class is required</p>
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
            name="dateTime"
            value={formatDateForInput(formData.dateTime)}
            onChange={(e) => onChange('dateTime', e.target.value)}
            className={`w-full p-2 rounded bg-gray-700 text-white border ${
              attemptedSubmit && !formData.dateTime ? 'border-red-500' : 'border-gray-600'
            } focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50`}
          />
          {attemptedSubmit && !formData.dateTime && (
            <p className="text-red-500 text-xs mt-1">Date and time is required</p>
          )}
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-300 mb-2">Slots</label>
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => handleParticipantsChange(-1)}
              className="bg-gray-700 text-white p-2 rounded-l h-10 w-10 flex items-center justify-center"
            >
              -
            </button>
            <input
              type="number"
              value={formData.slots}
              onChange={(e) => onChange('slots', parseInt(e.target.value))}
              min="1"
              max="24"
              className="w-16 text-center bg-gray-700 text-white border-t border-b border-gray-600 h-10"
            />
            <button
              type="button"
              onClick={() => handleParticipantsChange(1)}
              className="bg-gray-700 text-white p-2 rounded-r h-10 w-10 flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="flex space-x-4">
        <div className="flex-1">
          <label htmlFor="track" className="block text-sm font-medium text-gray-300 mb-1">Track</label>
          <div className="relative">
            <input
              type="text"
              id="track"
              value={formData.track}
              onChange={(e) => handleTrackChange(e.target.value)}
              placeholder="Enter track name"
              className={`w-full p-2 rounded bg-gray-700 text-white border ${
                attemptedSubmit && !formData.track ? 'border-red-500' : 'border-gray-600'
              } focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50`}
            />
            {trackSuggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-gray-800 border border-gray-600 rounded mt-1 max-h-60 overflow-y-auto">
                {trackSuggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    className="p-2 hover:bg-gray-700 cursor-pointer text-white"
                    onClick={() => handleTrackSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {attemptedSubmit && !formData.track && (
            <p className="text-red-500 text-xs mt-1">Track is required</p>
          )}
        </div>

        <div className="flex-1">
          <label htmlFor="trackConfig" className="block text-sm font-medium text-gray-300 mb-2">
            Track Configuration {formData.track && trackList.find(t => t.name === formData.track)?.configs.length > 0 ? '*' : ''}
          </label>
          <select
            id="trackConfig"
            value={formData.trackConfig}
            onChange={(e) => onChange('trackConfig', e.target.value)}
            disabled={!formData.track || !trackList.find(t => t.name === formData.track)?.configs.length}
            className={`w-full p-2 rounded bg-gray-700 text-white border ${
              attemptedSubmit && formData.track && trackList.find(t => t.name === formData.track)?.configs.length > 0 && !formData.trackConfig ? 'border-red-500' : 'border-gray-600'
            } focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50`}
          >
            <option value="">Select configuration</option>
            {formData.track && trackList.find(t => t.name === formData.track)?.configs.map(config => (
              <option key={config} value={config}>{config}</option>
            ))}
          </select>
          {attemptedSubmit && formData.track && trackList.find(t => t.name === formData.track)?.configs.length > 0 && !formData.trackConfig && (
            <p className="text-red-500 text-xs mt-1">Track configuration is required for this track</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FMstep1;