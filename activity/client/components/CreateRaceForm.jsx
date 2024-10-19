import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { IoAdd, IoRemove } from 'react-icons/io5';
import { toast } from 'react-toastify';

const CreateRaceForm = ({ onCreateRace, userId }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    dateTime: '',
    slots: 24,
    track: '',
    trackConfig: '',
    carClasses: [''],
    createdBy: userId
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const tracks = [
    { name: 'Monza', configs: ['Full', 'GP', 'Junior'] },
    { name: 'Spa', configs: ['Full', 'GP', 'Endurance'] },
    // Добавьте другие трассы и их конфигурации
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTrackChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, track: value, trackConfig: '' }));
  };

  const handleParticipantsChange = (increment) => {
    setFormData(prev => ({
      ...prev,
      slots: Math.min(Math.max(prev.slots + increment, 1), 24)
    }));
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
    setFormData(prev => ({ ...prev, carClasses: newCarClasses }));
  };

  const addCarClass = () => {
    if (formData.carClasses.length < 4) {
      setFormData(prev => ({ ...prev, carClasses: [...prev.carClasses, ''] }));
    }
  };

  const removeCarClass = (index) => {
    const newCarClasses = formData.carClasses.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, carClasses: newCarClasses }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const raceData = {
        ...formData,
        dateTime: new Date(formData.dateTime).toISOString(),
        carClasses: formData.carClasses.filter(c => c !== '')
      };
      const response = await fetch('/.proxy/api/races', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(raceData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server response:', errorData);
        if (errorData.errors) {
          const errorMessages = errorData.errors.map(err => err.msg).join(', ');
          throw new Error(`Validation failed: ${errorMessages}`);
        } else {
          throw new Error(`Failed to create race: ${response.status} ${response.statusText}`);
        }
      }
      const newRace = await response.json();
      console.log('Race created:', newRace);
      onCreateRace(newRace);
      toast.success('Race created successfully!');
    } catch (error) {
      console.error('Error creating race:', error);
      toast.error(`Failed to create race: ${error.message}`);
    }
  };

  const handleNextStep = () => {
    setAttemptedSubmit(true);
    if (
      formData.name &&
      formData.dateTime &&
      formData.slots &&
      formData.track &&
      formData.carClasses[0]
    ) {
      setStep(2);
      setAttemptedSubmit(false);
    } else {
      toast.error('Please fill in all required fields before proceeding.');
    }
  };

  const renderStep1 = () => (
    <>
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Race Title *</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter race title"
          className={`w-full p-2 rounded bg-gray-700 text-white border ${
            attemptedSubmit && !formData.name ? 'border-red-500' : 'border-gray-600'
          } focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50`}
        />
        {attemptedSubmit && !formData.name && (
          <p className="text-red-500 text-xs mt-1">Race title is required</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Car Classes *</label>
        {formData.carClasses.map((carClass, index) => (
          <div key={index} className="flex items-center space-x-2 mb-2">
            <input
              type="text"
              value={carClass}
              onChange={(e) => handleCarClassChange(index, e.target.value)}
              placeholder={index === 0 ? "Enter car class (required)" : "Enter multiclass"}
              className={`flex-1 p-2 rounded bg-gray-700 text-white border ${
                attemptedSubmit && index === 0 && !carClass ? 'border-red-500' : 'border-gray-600'
              } focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 ${
                index !== 0 && index === formData.carClasses.length - 1 && carClass === '' ? 'opacity-50' : ''
              }`}
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
          <label htmlFor="dateTime" className="block text-sm font-medium text-gray-300 mb-1">Date and Time *</label>
          <input
            type="datetime-local"
            id="dateTime"
            name="dateTime"
            value={formData.dateTime}
            onChange={handleChange}
            className={`w-full p-2 rounded bg-gray-700 text-white border ${
              attemptedSubmit && !formData.dateTime ? 'border-red-500' : 'border-gray-600'
            } focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50`}
          />
          {attemptedSubmit && !formData.dateTime && (
            <p className="text-red-500 text-xs mt-1">Date and time is required</p>
          )}
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-300 mb-1">Slots *</label>
          <div className="flex items-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleParticipantsChange(-1)}
              className="bg-gray-600 text-white p-2 rounded-l-lg h-10 flex items-center justify-center"
            >
              -
            </motion.button>
            <input
              type="number"
              value={formData.slots}
              onChange={(e) => handleParticipantsChange(parseInt(e.target.value) - formData.slots)}
              className={`w-16 text-center p-2 bg-gray-700 text-white border-t border-b border-gray-600 h-10 ${
                attemptedSubmit && !formData.slots ? 'border-red-500' : ''
              }`}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleParticipantsChange(1)}
              className="bg-gray-600 text-white p-2 rounded-r-lg h-10 flex items-center justify-center"
            >
              +
            </motion.button>
          </div>
          {attemptedSubmit && !formData.slots && (
            <p className="text-red-500 text-xs mt-1">Number of slots is required</p>
          )}
        </div>
      </div>
      <div className="flex space-x-4">
        <div className="flex-1">
          <label htmlFor="track" className="block text-sm font-medium text-gray-300 mb-1">Track *</label>
          <select
            id="track"
            name="track"
            value={formData.track}
            onChange={handleTrackChange}
            className={`w-full p-2 rounded bg-gray-700 text-white border ${
              attemptedSubmit && !formData.track ? 'border-red-500' : 'border-gray-600'
            } focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50`}
          >
            <option value="">Select track</option>
            {tracks.map(track => (
              <option key={track.name} value={track.name}>{track.name}</option>
            ))}
          </select>
          {attemptedSubmit && !formData.track && (
            <p className="text-red-500 text-xs mt-1">Track is required</p>
          )}
        </div>
        <div className="flex-1">
          <label htmlFor="trackConfig" className="block text-sm font-medium text-gray-300 mb-1">Track Configuration</label>
          <select
            id="trackConfig"
            name="trackConfig"
            value={formData.trackConfig}
            onChange={handleChange}
            disabled={!formData.track}
            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
          >
            <option value="">Select configuration</option>
            {formData.track && tracks.find(t => t.name === formData.track).configs.map(config => (
              <option key={config} value={config}>{config}</option>
            ))}
          </select>
        </div>
      </div>
    </>
  );

  const renderStep2 = () => (
    <></>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 bg-gray-800 rounded-lg shadow-lg max-w-md mx-auto"
    >
      <h2 className="text-2xl font-bold text-white mb-6">Create New Race</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {step === 1 ? renderStep1() : renderStep2()}
        <div className="flex justify-end">
          {step > 1 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setStep(step - 1)}
              className="mr-2 bg-gray-600 text-white py-2 px-4 rounded-lg font-semibold transition duration-300 ease-in-out hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
            >
              Previous
            </motion.button>
          )}
          {step < 2 ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={handleNextStep}
              className="bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold transition duration-300 ease-in-out hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Next
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="bg-green-600 text-white py-2 px-4 rounded-lg font-semibold transition duration-300 ease-in-out hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
            >
              Create Race
            </motion.button>
          )}
        </div>
      </form>
    </motion.div>
  );
};

export default CreateRaceForm;
