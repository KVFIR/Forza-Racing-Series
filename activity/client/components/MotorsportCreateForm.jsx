import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IoArrowBackOutline } from 'react-icons/io5';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import FMstep1 from './motorsport/FMstep1';
import FMstep2 from './motorsport/FMstep2';
import FMstep3 from './motorsport/FMstep3';
import FMstep4 from './motorsport/FMstep4';

const MotorsportCreateForm = ({ user }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    dateTime: '',
    slots: 24,
    track: '',
    trackConfig: '',
    carClasses: [''],
    createdBy: user?.id || null,
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

  // Обновляем createdBy при изменении user
  useEffect(() => {
    if (user?.id) {
      setFormData(prev => ({
        ...prev,
        createdBy: user.id
      }));
    }
  }, [user]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStageChange = (stage, field, value) => {
    setFormData(prev => ({
      ...prev,
      [stage]: {
        ...prev[stage],
        [field]: value
      }
    }));
  };

  const handleBackToMenu = () => {
    navigate('/');
  };

  const validateStep = () => {
    setAttemptedSubmit(true);
    
    switch (step) {
      case 1:
        const selectedTrack = trackList.find(t => t.name === formData.track);
        const isConfigRequired = selectedTrack && selectedTrack.configs.length > 0;
        return formData.name && 
               formData.dateTime && 
               formData.track && 
               formData.carClasses[0] && 
               (!isConfigRequired || formData.trackConfig);
      case 2:
        return formData.classDetails.every(detail => 
          detail.availableCars[0] && 
          (detail.restrictions !== 'Custom BoP' || detail.customBop)
        );
      case 3:
        return true;
      case 4:
        return formData.race.raceType === 'laps' ? 
          formData.race.numberOfLaps > 0 : 
          formData.race.raceTimer > 0;
      default:
        return false;
    }
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    
    if (validateStep()) {
      if (step === 1) {
        const newClassDetails = formData.carClasses
          .filter(className => className !== '')
          .map(className => ({
            class: className,
            availableCars: [''],
            restrictions: 'Full Stock',
            customBop: ''
          }));
        setFormData(prev => ({ ...prev, classDetails: newClassDetails }));
      }
      setStep(step + 1);
      setAttemptedSubmit(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAttemptedSubmit(true);

    if (!validateStep()) {
      return;
    }

    // Создаем основной объект гонки
    const raceData = {
      name: formData.name,
      dateTime: new Date(formData.dateTime).toISOString(),
      slots: formData.slots,
      track: formData.track,
      trackConfig: formData.trackConfig,
      carClasses: formData.carClasses.filter(cls => cls !== ''),
      createdBy: formData.createdBy,
      practiceAndQualifying: formData.practiceAndQualifying,
      race: formData.race,
      settings: formData.settings,
      classDetails: formData.classDetails.map(detail => ({
        ...detail,
        availableCars: detail.availableCars.filter(car => car !== '')
      })),
      game: 'fm' // Добавляем идентификатор игры в основной объект
    };

    try {
      const response = await fetch('/.proxy/api/races', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(raceData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errors ? errorData.errors[0].msg : 'Failed to create race');
      }

      const result = await response.json();
      toast.success('Race created successfully');
      navigate(`/event/${result.id}`);
    } catch (error) {
      console.error('Error creating race:', error);
      toast.error(error.message || 'Failed to create race. Please try again.');
    }
  };

  const trackList = [
    { name: 'Track1', configs: ['Config1', 'Config2'] },
    { name: 'Track2', configs: ['Config3', 'Config4'] },
    // Add more tracks as needed
  ];

  const [trackSuggestions, setTrackSuggestions] = useState([]);

  const handleTrackChange = (value) => {
    setFormData(prev => ({
      ...prev,
      track: value,
      trackConfig: ''
    }));
    
    const newSuggestions = trackList
      .filter(track => track.name.toLowerCase().includes(value.toLowerCase()))
      .map(track => track.name);
    setTrackSuggestions(newSuggestions);
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

  const handleTrackSuggestionClick = (value) => {
    handleTrackChange(value);
    setTrackSuggestions([]);
  };

  return (
    <div>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/create-race')}
        className="mb-4 flex items-center bg-white bg-opacity-20 text-white py-2 px-4 rounded-lg font-semibold transition duration-300 ease-in-out hover:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
      >
        <IoArrowBackOutline className="mr-2" />
        Back to Game Selection
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="p-6 bg-gray-800 bg-opacity-80 rounded-lg shadow-lg max-w-4xl mx-auto"
      >
        <h2 className="text-2xl font-bold text-white mb-1">Create Event</h2>
        <h3 className="text-xl text-white mb-6">Forza Motorsport</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && (
            <FMstep1 
              formData={formData} 
              onChange={handleChange}
              attemptedSubmit={attemptedSubmit}
            />
          )}
          {step === 2 && formData.classDetails.map((classData, index) => (
            <FMstep2
              key={index}
              classData={classData}
              onChange={(field, value) => {
                const newClassDetails = [...formData.classDetails];
                newClassDetails[index] = { ...newClassDetails[index], [field]: value };
                setFormData(prev => ({ ...prev, classDetails: newClassDetails }));
              }}
              attemptedSubmit={attemptedSubmit}
            />
          ))}
          {step === 3 && (
            <FMstep3
              data={formData.practiceAndQualifying}
              onChange={(field, value) => handleStageChange('practiceAndQualifying', field, value)}
            />
          )}
          {step === 4 && (
            <FMstep4
              data={{ ...formData.race, ...formData.settings }}
              onChange={(field, value) => {
                if (['raceType', 'numberOfLaps', 'raceTimer', 'startingTime', 'weather'].includes(field)) {
                  handleStageChange('race', field, value);
                } else {
                  handleStageChange('settings', field, value);
                }
              }}
            />
          )}

          <div className="flex justify-center mt-6">
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
            {step < 4 ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={(e) => handleNextStep(e)}
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

export default MotorsportCreateForm;