import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { trackList } from '../data/trackList';
import RaceStageForm from './RaceStageForm';
import Toggle from './Toggle';
import { IoArrowBackOutline, IoSaveOutline } from 'react-icons/io5';
import ClassDetailsForm from './ClassDetailsForm';
import LoadingSpinner from './LoadingSpinner';

const EditEventForm = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [trackSuggestions, setTrackSuggestions] = useState([]);
  
  // Инициализируем formData с той же структурой, что и в CreateRaceForm
  const [formData, setFormData] = useState({
    name: '',
    dateTime: '',
    slots: 24,
    track: '',
    trackConfig: '',
    carClasses: [''],
    createdBy: user?.id,
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

  // Загрузка данных ивента
  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const response = await fetch(`/.proxy/api/races/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch event details');
        }
        const data = await response.json();
        setFormData(prev => ({
          ...prev,
          ...data
        }));
      } catch (error) {
        console.error('Error fetching event details:', error);
        toast.error('Failed to load event details');
        navigate('/event-list');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventDetails();
  }, [id, navigate]);

  // Проверка прав доступа
  useEffect(() => {
    if (!isLoading && formData && user && formData.createdBy !== user.id) {
      toast.error('You do not have permission to edit this event');
      navigate(`/event/${id}`);
    }
  }, [formData, user, id, navigate, isLoading]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Переиспользуем обработчики из CreateRaceForm
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTrackChange = (value) => {
    setFormData(prev => ({ ...prev, track: value, trackConfig: '' }));
    const newSuggestions = trackList
      .filter(track => track.name.toLowerCase().includes(value.toLowerCase()))
      .map(track => track.name);
    setTrackSuggestions(newSuggestions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAttemptedSubmit(true);

    // Валидация как в CreateRaceForm
    const isRaceValid = (formData.race.raceType === 'laps' && formData.race.numberOfLaps > 0) ||
                       (formData.race.raceType === 'timer' && formData.race.raceTimer > 0);
    
    if (!isRaceValid) {
      toast.error('Please check race settings.');
      return;
    }

    try {
      const response = await fetch(`/.proxy/api/races/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, message: ${JSON.stringify(errorData)}`);
      }

      toast.success('Race updated successfully!');
      navigate(`/event/${id}`);
    } catch (error) {
      console.error('Error updating race:', error);
      toast.error(`Failed to update race: ${error.message}`);
    }
  };

  // Копируем методы рендеринга из CreateRaceForm
  const renderStep1 = () => (
    <div className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Event Name *</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`w-full p-2 rounded bg-gray-700 text-white border ${
            attemptedSubmit && !formData.name ? 'border-red-500' : 'border-gray-600'
          } focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50`}
          required
        />
        {attemptedSubmit && !formData.name && (
          <p className="text-red-500 text-xs mt-1">Event name is required</p>
        )}
      </div>

      <div>
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
          required
        />
        {attemptedSubmit && !formData.dateTime && (
          <p className="text-red-500 text-xs mt-1">Date and time is required</p>
        )}
      </div>

      {/* Копируем остальные поля из CreateRaceForm */}
      <div className="flex space-x-4">
        <div className="flex-1">
          <label htmlFor="track" className="block text-sm font-medium text-gray-300 mb-1">Track *</label>
          <div className="relative">
            <input
              type="text"
              id="track"
              name="track"
              value={formData.track}
              onChange={(e) => handleTrackChange(e.target.value)}
              className={`w-full p-2 rounded bg-gray-700 text-white border ${
                attemptedSubmit && !formData.track ? 'border-red-500' : 'border-gray-600'
              } focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50`}
              required
            />
            {trackSuggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-gray-800 border border-gray-600 rounded mt-1">
                {trackSuggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    className="p-2 hover:bg-gray-700 cursor-pointer text-white"
                    onClick={() => handleTrackChange(suggestion)}
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate(`/event/${id}`)}
        className="mb-4 flex items-center bg-white bg-opacity-20 text-white py-2 px-4 rounded-lg font-semibold transition duration-300 ease-in-out hover:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
      >
        <IoArrowBackOutline className="mr-2" />
        Back to Event
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="p-6 bg-gray-800 bg-opacity-80 rounded-lg shadow-lg max-w-3xl mx-auto"
      >
        <h2 className="text-2xl font-bold text-white mb-6">Edit Race</h2>
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
            step === formData.classDetails.length + 2 ? (
              <RaceStageForm
                stage="Race"
                data={formData.race}
                onChange={(field, value) => handleStageChange('race', field, value)}
              />
            ) : (
              <RaceStageForm
                stage="Practice & Qualifying"
                data={formData.practiceAndQualifying}
                onChange={(field, value) => handleStageChange('practiceAndQualifying', field, value)}
              />
            )
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
                onClick={() => setStep(step + 1)}
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
                Save Changes
              </motion.button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default EditEventForm;
