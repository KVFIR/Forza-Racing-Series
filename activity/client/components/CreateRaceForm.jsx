import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoCarSport, IoStopwatch, IoFlag } from 'react-icons/io5';
import { toast } from 'react-toastify';
import { tracks } from './TrackData';
import RaceStageForm from './RaceStageForm';
import Toggle from './Toggle';

const CreateRaceForm = ({ onCreateRace, userId }) => {
  const [step, setStep] = useState(1);
  const [activeTab, setActiveTab] = useState('race');
  const [formData, setFormData] = useState({
    name: '',
    dateTime: '',
    slots: 24,
    track: '',
    trackConfig: '',
    carClasses: [''],
    createdBy: userId,
    practiceAndQualifying: {
      enabled: false,
      practiceTimeLimit: 30,
      qualifyingLaps: 3,
      intermissionPeriod: 2
    },
    race: {
      raceType: 'laps',
      numberOfLaps: 10,
      raceTimer: 60,
      startingTime: 'Random',
      timeProgression: 'x1',
      dynamicTrackRubber: true,
      startingTrackRubber: 50,
      weather: 'Random'
    },
    settings: {
      carToCarCollisions: 'Default',
      ghostBackmarkers: false,
      simulationLevel: 'Damage, fuel & tires',
      tireWear: 'x1.0',
      forzaRaceRegulations: 'Moderate Penalty',
      frrDisqualification: false,
      disableGhostEffect: false
    }
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

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

  const handleNextStep = (e) => {
    e.preventDefault();
    setAttemptedSubmit(true);
    if (step === 1) {
      const selectedTrack = tracks.find(t => t.name === formData.track);
      const isConfigRequired = selectedTrack && selectedTrack.configs.length > 0;
      if (
        formData.name &&
        formData.dateTime &&
        formData.slots &&
        formData.track &&
        formData.carClasses[0] &&
        (!isConfigRequired || formData.trackConfig)
      ) {
        setStep(2);
        setAttemptedSubmit(false);
      } else {
        toast.error('Please fill in all required fields before proceeding.');
      }
    } else if (step === 2) {
      // Здесь можно добавить проверку для второго шага, если необходимо
      setStep(3);
      setAttemptedSubmit(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
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
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">Car Classes *</label>
        {formData.carClasses.map((carClass, index) => (
          <div key={index} className="flex items-center space-x-2 mb-2">
            <input
              type="text"
              value={carClass}
              onChange={(e) => handleCarClassChange(index, e.target.value)}
              placeholder={index === 0 ? "Enter car class (required)" : "Add multiclass"}
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
          <label htmlFor="dateTime" className="block text-sm font-medium text-gray-300 mb-2">Date and Time *</label>
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
          <label className="block text-sm font-medium text-gray-300 mb-2">Slots *</label>
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
          <label htmlFor="track" className="block text-sm font-medium text-gray-300 mb-2">Track *</label>
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
          <label htmlFor="trackConfig" className="block text-sm font-medium text-gray-300 mb-2">
            Track Configuration {formData.track && tracks.find(t => t.name === formData.track).configs.length > 0 ? '*' : ''}
          </label>
          <select
            id="trackConfig"
            name="trackConfig"
            value={formData.trackConfig}
            onChange={handleChange}
            disabled={!formData.track || tracks.find(t => t.name === formData.track).configs.length === 0}
            className={`w-full p-2 rounded bg-gray-700 text-white border ${
              attemptedSubmit && formData.track && tracks.find(t => t.name === formData.track).configs.length > 0 && !formData.trackConfig ? 'border-red-500' : 'border-gray-600'
            } focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50`}
          >
            <option value="">Select configuration</option>
            {formData.track && tracks.find(t => t.name === formData.track).configs.map(config => (
              <option key={config} value={config}>{config}</option>
            ))}
          </select>
          {attemptedSubmit && formData.track && tracks.find(t => t.name === formData.track).configs.length > 0 && !formData.trackConfig && (
            <p className="text-red-500 text-xs mt-1">Track configuration is required for this track</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <>
      <div className="flex mb-0">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={() => setActiveTab('practiceAndQualifying')}
          className={`flex-1 py-2 px-4 rounded-tl-lg text-white ${activeTab === 'practiceAndQualifying' ? 'bg-blue-600' : 'bg-gray-700'}`}
        >
          <IoStopwatch className="inline-block mr-2" /> P&Q
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={() => setActiveTab('race')}
          className={`flex-1 py-2 px-4 rounded-tr-lg text-white ${activeTab === 'race' ? 'bg-blue-600' : 'bg-gray-700'}`}
        >
          <IoFlag className="inline-block mr-2" /> Race
        </motion.button>
      </div>
      <div className="bg-gray-700 p-4 rounded-b-lg">
        <AnimatePresence mode="wait">
          {activeTab === 'practiceAndQualifying' && (
            <motion.div
              key="practiceAndQualifying"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <RaceStageForm
                stage="Practice & Qualifying"
                data={formData.practiceAndQualifying}
                onChange={(field, value) => handleStageChange('practiceAndQualifying', field, value)}
                isRequired={false}
              />
            </motion.div>
          )}
          {activeTab === 'race' && (
            <motion.div
              key="race"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <RaceStageForm
                stage="Race"
                data={formData.race}
                onChange={(field, value) => handleStageChange('race', field, value)}
                isRequired={true}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );

  const handleStageChange = (stage, field, value) => {
    setFormData(prev => ({
      ...prev,
      [stage]: {
        ...prev[stage],
        [field]: value
      }
    }));
  };

  const renderStep3 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-2">Race Settings</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="carToCarCollisions" className="block text-sm font-medium text-gray-300 mb-1">
            Car-To-Car collisions
          </label>
          <select
            id="carToCarCollisions"
            value={formData.settings.carToCarCollisions}
            onChange={(e) => handleSettingsChange('carToCarCollisions', e.target.value)}
            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
          >
            <option value="Default">Default</option>
            <option value="Always On">Always On</option>
            <option value="Always Off">Always Off</option>
          </select>
        </div>
        <div>
          <label htmlFor="ghostBackmarkers" className="block text-sm font-medium text-gray-300 mb-1">
            Ghost Backmarkers
          </label>
          <Toggle
            id="ghostBackmarkers"
            checked={formData.settings.ghostBackmarkers}
            onChange={(e) => handleSettingsChange('ghostBackmarkers', e.target.checked)}
          />
        </div>
        <div>
          <label htmlFor="simulationLevel" className="block text-sm font-medium text-gray-300 mb-1">
            Simulation Level
          </label>
          <select
            id="simulationLevel"
            value={formData.settings.simulationLevel}
            onChange={(e) => handleSettingsChange('simulationLevel', e.target.value)}
            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
          >
            <option value="Damage, fuel & tires">Damage, fuel & tires</option>
            <option value="Damage & fuel">Damage & fuel</option>
            <option value="Damage only">Damage only</option>
            <option value="No simulation">No simulation</option>
          </select>
        </div>
        <div>
          <label htmlFor="tireWear" className="block text-sm font-medium text-gray-300 mb-1">
            Tire Wear
          </label>
          <select
            id="tireWear"
            value={formData.settings.tireWear}
            onChange={(e) => handleSettingsChange('tireWear', e.target.value)}
            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
          >
            <option value="x1.0">x1.0</option>
            <option value="x1.5">x1.5</option>
            <option value="x2.0">x2.0</option>
            <option value="x3.0">x3.0</option>
          </select>
        </div>
        <div>
          <label htmlFor="forzaRaceRegulations" className="block text-sm font-medium text-gray-300 mb-1">
            Forza Race Regulations
          </label>
          <select
            id="forzaRaceRegulations"
            value={formData.settings.forzaRaceRegulations}
            onChange={(e) => handleSettingsChange('forzaRaceRegulations', e.target.value)}
            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
          >
            <option value="Limited Penalty">Limited Penalty</option>
            <option value="Moderate Penalty">Moderate Penalty</option>
            <option value="Full Penalty">Full Penalty</option>
          </select>
        </div>
        <div>
          <label htmlFor="frrDisqualification" className="block text-sm font-medium text-gray-300 mb-1">
            FRR disqualification
          </label>
          <Toggle
            id="frrDisqualification"
            checked={formData.settings.frrDisqualification}
            onChange={(e) => handleSettingsChange('frrDisqualification', e.target.checked)}
          />
        </div>
        <div>
          <label htmlFor="disableGhostEffect" className="block text-sm font-medium text-gray-300 mb-1">
            Disable ghost effect
          </label>
          <Toggle
            id="disableGhostEffect"
            checked={formData.settings.disableGhostEffect}
            onChange={(e) => handleSettingsChange('disableGhostEffect', e.target.checked)}
          />
        </div>
      </div>
    </div>
  );

  const handleSettingsChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value
      }
    }));
  };

  return (
    <div className="p-6 bg-gray-800 rounded-lg shadow-lg max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">Create New Race</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {step === 1 ? renderStep1() : step === 2 ? renderStep2() : renderStep3()}
        <div className="flex justify-center">
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
          {step < 3 ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={handleNextStep}
              className="bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold transition duration-300 ease-in-out hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Next Step
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              onClick={handleSubmit}
              className="bg-green-600 text-white py-2 px-4 rounded-lg font-semibold transition duration-300 ease-in-out hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
            >
              Create Race
            </motion.button>
          )}
        </div>
      </form>
    </div>
  );
};

export default CreateRaceForm;
