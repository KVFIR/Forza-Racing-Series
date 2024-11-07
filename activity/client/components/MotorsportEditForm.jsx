import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IoArrowBackOutline } from 'react-icons/io5';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';
import FMstep1 from './motorsport/FMstep1';
import FMstep2 from './motorsport/FMstep2';
import FMstep3 from './motorsport/FMstep3';
import FMstep4 from './motorsport/FMstep4';
import LoadingSpinner from './common/LoadingSpinner';
import { trackList } from './motorsport/data/trackList';

const MotorsportEditForm = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  // Обновляем структуру начального состояния
  const [formData, setFormData] = useState({
    name: '',
    dateTime: '',
    slots: 24,
    track: '',
    trackConfig: '',
    carClasses: [''],
    createdBy: user.id,
    practiceAndQualifying: {
      enabled: false,
      practiceTimeLimit: '20',  // Строковое значение для select
      qualifyingLaps: '3'       // Строковое значение для select
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

  // Обновляем функцию загрузки данных
  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const response = await fetch(`/.proxy/api/races/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch event details');
        }
        const data = await response.json();
        
        // Преобразуем дату из ISO в локальную дату
        const dateObj = new Date(data.dateTime);
        if (isNaN(dateObj.getTime())) {
          throw new Error('Invalid date received from server');
        }
        
        // Получаем смещение часового пояса в минутах
        const tzOffset = dateObj.getTimezoneOffset();
        // Создаем новую дату с учетом смещения
        const localDate = new Date(dateObj.getTime() - (tzOffset * 60000));
        // Форматируем в строку для input
        const formattedDateTime = localDate.toISOString().slice(0, 16);
        
        const normalizedData = {
          ...formData,
          ...data,
          dateTime: formattedDateTime,
          practiceAndQualifying: {
            ...formData.practiceAndQualifying,
            ...(data.practiceAndQualifying || {})
          },
          race: {
            ...formData.race,
            ...(data.race || {})
          },
          settings: {
            ...formData.settings,
            ...(data.settings || {})
          }
        };

        setFormData(normalizedData);
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
    if (!isLoading && formData && user?.id && formData.createdBy !== user.id) {
      toast.error('You do not have permission to edit this event');
      navigate(`/event/${id}`);
    }
  }, [formData, user, id, navigate, isLoading]);

  // Остальные функции такие же, как в MotorsportCreateForm
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Обновляем функцию handleSubmit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setAttemptedSubmit(true);

    if (!validateStep()) {
      return;
    }

    try {
      // Преобразуем локальную дату в UTC для отправки на сервер
      const localDate = new Date(formData.dateTime);
      if (isNaN(localDate.getTime())) {
        throw new Error('Invalid date format');
      }
      
      // Создаем глубокую копию данных для отправки
      const submitData = JSON.parse(JSON.stringify(formData));
      
      // Преобразуем дату в UTC формат
      submitData.dateTime = localDate.toISOString();
      
      // Фильтруем пустые значения
      submitData.carClasses = submitData.carClasses.filter(cls => cls !== '');
      submitData.classDetails = submitData.classDetails.map(detail => ({
        ...detail,
        availableCars: detail.availableCars.filter(car => car !== '')
      }));

      const response = await fetch(`/.proxy/api/races/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errors ? errorData.errors[0].msg : 'Failed to update race');
      }

      toast.success('Race updated successfully');
      navigate(`/event/${id}`);
    } catch (error) {
      console.error('Error updating race:', error);
      toast.error(error.message || 'Failed to update race. Please try again.');
    }
  };

  // Обновляем функцию handleStageChange
  const handleStageChange = (stage, field, value) => {
    setFormData(prev => {
      // Создаем глубокую копию предыдущего состояния
      const newState = JSON.parse(JSON.stringify(prev));
      
      // Убеждаемся, что объект существует
      if (!newState[stage]) {
        newState[stage] = {};
      }
      
      // Обновляем значение
      newState[stage][field] = value;
      
      return newState;
    });
  };

  const handleNextStep = (e) => {
    // Предотвращаем отправку формы
    e.preventDefault();
    
    if (step === 4) {
      return;
    }
    
    if (validateStep()) {
      if (step === 1) {
        const existingDetails = [...formData.classDetails];
        const currentClasses = formData.carClasses.filter(cls => cls !== '');
        
        const updatedClassDetails = currentClasses.map(className => {
          const existing = existingDetails.find(detail => detail.class === className);
          return existing || {
            class: className,
            availableCars: [''],
            restrictions: 'Full Stock',
            customBop: ''
          };
        });
        
        setFormData(prev => ({ ...prev, classDetails: updatedClassDetails }));
      }
      setStep(step + 1);
      setAttemptedSubmit(false);
    }
  };

  const validateStep = () => {
    setAttemptedSubmit(true);
    
    switch (step) {
      case 1:
        const selectedTrack = trackList.find(t => t.name === formData.track);
        const isConfigRequired = selectedTrack && selectedTrack.configs.length > 0;
        const dateTime = new Date(formData.dateTime);
        return formData.name && 
               !isNaN(dateTime.getTime()) && 
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

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Рендер формы такой же, как в MotorsportCreateForm, но с измененным заголовком
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
        className="p-6 bg-gray-800 bg-opacity-80 rounded-lg shadow-lg max-w-4xl mx-auto"
      >
        <h2 className="text-2xl font-bold text-white mb-1">Edit Event</h2>
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
                Save Event
              </motion.button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default MotorsportEditForm;