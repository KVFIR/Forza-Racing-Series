import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import FH5step1 from './horizon/FH5step1';
import FH5step2 from './horizon/FH5step2';
import FH5step3 from './horizon/FH5step3';
import BackButton from './common/BackButton';

const HorizonCreateForm = ({ user }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    dateTime: '',
    slots: 12,
    location: '',
    route: '',
    carClass: '',
    createdBy: user?.id || null,
    race: {
      raceType: 'circuit',
      numberOfLaps: 3,
      seasonAndTime: 'Summer - Day',
      weather: 'Clear',
      routeType: 'Asphalt'
    },
    settings: {
      collisions: true,
      ghosting: false,
      customUpgrades: true,
      tuning: true,
      abs: true,
      tcr: true,
      stab: true,
      rewind: false
    }
  });

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

  const validateStep = () => {
    setAttemptedSubmit(true);
    
    switch (step) {
      case 1:
        return formData.name && 
               formData.dateTime && 
               formData.location && 
               formData.carClass;
      case 2:
        return formData.race.raceType && 
               (formData.race.raceType !== 'circuit' || formData.race.numberOfLaps > 0);
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    
    if (step === 3) {
      return;
    }
    
    if (validateStep()) {
      setStep(step + 1);
      setAttemptedSubmit(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('User authentication required');
      navigate('/');
      return;
    }
    
    setAttemptedSubmit(true);

    if (!validateStep()) {
      return;
    }

    try {
      const localDate = new Date(formData.dateTime);
      if (isNaN(localDate.getTime())) {
        throw new Error('Invalid date format');
      }
      
      // Создаем объект с массивом FH
      const submitData = {
        FH5: [{
          name: formData.name,
          dateTime: localDate.toISOString(),
          slots: formData.slots,
          location: formData.location,
          route: formData.route,
          carClass: formData.carClass,
          createdBy: formData.createdBy,
          race: formData.race,
          settings: formData.settings
        }],
        game: 'fh5'
      };

      const response = await fetch('/.proxy/api/races', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errors ? errorData.errors[0].msg : 'Failed to create race');
      }

      const data = await response.json();
      toast.success('Race created successfully');
      navigate(`/event/${data.id}`);
    } catch (error) {
      console.error('Error creating race:', error);
      toast.error(error.message || 'Failed to create race. Please try again.');
    }
  };

  return (
    <div>
      <BackButton to="/create-race" children="Back to Game Selection" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="p-6 bg-gray-800 bg-opacity-80 rounded-lg shadow-lg max-w-4xl mx-auto"
      >
        <h2 className="text-2xl font-bold text-white mb-1">Create Event</h2>
        <h3 className="text-xl text-white mb-6">Forza Horizon 5</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && (
            <FH5step1 
              formData={formData} 
              onChange={handleChange}
              attemptedSubmit={attemptedSubmit}
            />
          )}
          {step === 2 && (
            <FH5step2
              data={formData.race}
              onChange={(field, value) => handleStageChange('race', field, value)}
              attemptedSubmit={attemptedSubmit}
            />
          )}
          {step === 3 && (
            <FH5step3
              data={formData.settings}
              onChange={(field, value) => handleStageChange('settings', field, value)}
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

export default HorizonCreateForm;
