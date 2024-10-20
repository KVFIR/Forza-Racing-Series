import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { IoArrowBackOutline } from 'react-icons/io5';
import { toast } from 'react-toastify';
import { tracks } from './TrackData';
import RaceStageForm from './RaceStageForm';
import Toggle from './Toggle';
import { useNavigate } from 'react-router-dom';
import ClassDetailsForm from './ClassDetailsForm';

const CreateRaceForm = ({ onCreateRace, userId }) => {
  const navigate = useNavigate();

  const handleBackToMenu = () => {
    navigate('/');
  };

  const [step, setStep] = useState(1);
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
      practiceTimeLimit: 20,
      qualifyingLaps: 3
    },
    race: {
      raceType: 'laps',
      numberOfLaps: 10,
      raceTimer: 60,
      startingTime: 'Late Morning',
      weather: 'Fixed Dry'
    },
    settings: {
      carToCarCollisions: 'Default',
      ghostBackmarkers: true,
      simulationLevel: 'Fuel & tires only',
      tireWear: 'x1.0',
      forzaRaceRegulations: 'Full Penalty',
      frrDisqualification: false,
      dynamicTrackRubber: true,
      startingTrackRubber: 50
    },
    classDetails: []
  });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAttemptedSubmit(true);

    const isRaceValid = (formData.race.raceType === 'laps' && formData.race.numberOfLaps > 0) ||
                        (formData.race.raceType === 'timer' && formData.race.raceTimer > 0);
    const isPracticeQualifyingValid = !formData.practiceAndQualifying.enabled ||
                                      (formData.practiceAndQualifying.practiceTimeLimit >= 5 &&
                                       formData.practiceAndQualifying.qualifyingLaps >= 1);
    const isStartingTrackRubberValid = formData.settings.startingTrackRubber >= 0 && formData.settings.startingTrackRubber <= 100;

    if (!isRaceValid) {
      toast.error('Please check race settings.');
      return;
    }

    if (!isPracticeQualifyingValid) {
      toast.error('Please check practice and qualifying settings.');
      return;
    }

    if (!isStartingTrackRubberValid) {
      toast.error('Starting Track Rubber level must be between 0 and 100.');
      return;
    }

    // Если все проверки пройдены, отправляем данные
    try {
      const dataToSend = {
        ...formData,
        carClasses: formData.carClasses.filter(cls => cls !== '')
      };
      console.log('Sending race data:', dataToSend);
      const response = await fetch('/.proxy/api/races', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, message: ${JSON.stringify(errorData)}`);
      }
      const result = await response.json();
      console.log('Race creation result:', result);
      toast.success('Race created successfully!');
      navigate('/races');
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
        const classDetails = formData.carClasses.filter(cls => cls !== '').map(cls => ({
          class: cls,
          availableCars: [''],
          restrictions: 'Full Stock',
          customBop: ''
        }));
        setFormData(prev => ({ ...prev, classDetails }));
        setStep(2);
        setAttemptedSubmit(false);
      }
    } else if (step <= formData.classDetails.length + 1) {
      const currentClassDetails = formData.classDetails[step - 2];
      if (
        currentClassDetails.availableCars[0] && 
        currentClassDetails.restrictions &&
        (currentClassDetails.restrictions !== 'custom' || currentClassDetails.customBop)
      ) {
        setStep(step + 1);
        setAttemptedSubmit(false);
      }
    } else {
      setStep(step + 1);
      setAttemptedSubmit(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Race Title</label>
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
          <label htmlFor="dateTime" className="block text-sm font-medium text-gray-300 mb-2">Date and Time</label>
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
              name="slots"
              value={formData.slots}
              onChange={handleChange}
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
          {attemptedSubmit && !formData.slots && (
            <p className="text-red-500 text-xs mt-1">Number of slots is required</p>
          )}
        </div>
      </div>
      <div className="flex space-x-4">
        <div className="flex-1">
          <label htmlFor="track" className="block text-sm font-medium text-gray-300 mb-2">Track</label>
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
    <div className="space-y-4">
      <RaceStageForm
        stage="Practice & Qualifying"
        data={formData.practiceAndQualifying}
        onChange={(field, value) => handleStageChange('practiceAndQualifying', field, value)}
        isRequired={true}
      />
      <RaceStageForm
        stage="Race"
        data={formData.race}
        onChange={(field, value) => handleStageChange('race', field, value)}
        isRequired={true}
      />
    </div>
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
      <div className="grid grid-cols-1 gap-4">
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
            <option value="Always On">Always On</option>
            <option value="Default">Default</option>
            <option value="Always Off">Always Off</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
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
              <option value="Cosmetic damage only">Cosmetic damage only</option>
              <option value="Fuel & tires only">Fuel & tires only</option>
              <option value="Damage, fuel & tires">Damage, fuel & tires</option>
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
              className={`w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 ${
                formData.settings.simulationLevel === 'Cosmetic damage only' ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={formData.settings.simulationLevel === 'Cosmetic damage only'}
            >
           <option value="x0.5">x0.5</option>
            <option value="x1.0">x1.0</option>
            <option value="x1.5">x1.5</option>
            <option value="x2.0">x2.0</option>
            <option value="x2.5">x2.5</option>
            <option value="x3.0">x3.0</option>
            <option value="x3.5">x3.5</option>
            <option value="x4.0">x4.0</option>
            <option value="x4.5">x4.5</option>
            <option value="x5.0">x5.0</option>
            <option value="x6.0">x6.0</option>
            <option value="x7.0">x7.0</option>
            <option value="x8.0">x8.0</option>
            <option value="x9.0">x9.0</option>
            <option value="x10.0">x10.0</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
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
              <option value="No Penalty">No Penalty</option>
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
        </div>
      
        <div className="grid grid-cols-2 gap-4">
        <div>
            <label htmlFor="startingTrackRubber" className="block text-sm font-medium text-gray-300 mb-1">
              Starting Track Rubber level
            </label>
            <input
              type="number"
              id="startingTrackRubber"
              value={formData.settings.startingTrackRubber}
              onChange={(e) => handleSettingsChange('startingTrackRubber', Math.min(Math.max(parseInt(e.target.value) || 0, 0), 100))}
              className={`w-full p-2 rounded bg-gray-700 text-white border ${
                attemptedSubmit && (formData.settings.startingTrackRubber === undefined || formData.settings.startingTrackRubber === null || formData.settings.startingTrackRubber === '') ? 'border-red-500' : 'border-gray-600'
              } focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50`}
              min="0"
              max="100"
              required
            />
            {attemptedSubmit && (formData.settings.startingTrackRubber === undefined || formData.settings.startingTrackRubber === null || formData.settings.startingTrackRubber === '') && (
              <p className="text-red-500 text-xs mt-1">Starting Track Rubber level is required and must be between 0 and 100</p>
            )}
          </div>
          <div>
            <label htmlFor="dynamicTrackRubber" className="block text-sm font-medium text-gray-300 mb-1">
              Dynamic Track Rubber
            </label>
            <Toggle
              id="dynamicTrackRubber"
              checked={formData.settings.dynamicTrackRubber}
              onChange={(e) => handleSettingsChange('dynamicTrackRubber', e.target.checked)}
            />
          </div>
          
        </div>
      </div>
    </div>
  );

  const handleSettingsChange = (field, value) => {
    setFormData(prev => {
      const newSettings = {
        ...prev.settings,
        [field]: value
      };
      
      return {
        ...prev,
        settings: newSettings
      };
    });
  };

  return (
    <div>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleBackToMenu}
        className="mb-4 flex items-center bg-white bg-opacity-20 text-white py-2 px-4 rounded-lg font-semibold transition duration-300 ease-in-out hover:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
      >
        <IoArrowBackOutline className="mr-2" />
        Back to Menu
      </motion.button>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="p-6 bg-gray-800 bg-opacity-80 rounded-lg shadow-lg max-w-md mx-auto"
      >
        <h2 className="text-2xl font-bold text-white mb-6">Create New Race</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && renderStep1()}
          {step > 1 && step <= formData.classDetails.length + 1 && (
            <ClassDetailsForm
              classData={formData.classDetails[step - 2]}
              onChange={(field, value) => {
                const newClassDetails = [...formData.classDetails];
                newClassDetails[step - 2] = { ...newClassDetails[step - 2], [field]: value };
                setFormData(prev => ({ ...prev, classDetails: newClassDetails }));
              }}
              attemptedSubmit={attemptedSubmit}
            />
          )}
          {step > formData.classDetails.length + 1 && (
            step === formData.classDetails.length + 2 ? renderStep2() : renderStep3()
          )}
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
            {step < formData.classDetails.length + 3 ? (
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
                className="bg-green-600 text-white py-2 px-4 rounded-lg font-semibold transition duration-300 ease-in-out hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
              >
                Create Race
              </motion.button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateRaceForm;
