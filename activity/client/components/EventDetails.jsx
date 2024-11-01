import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  IoTrashOutline,
  IoArrowBackOutline, 
  IoPencilOutline,
  IoCalendarOutline,
  IoLocationOutline,
  IoSettingsOutline,
  IoPeopleOutline,
  IoTimeOutline,
  IoCloudOutline,
  IoChevronDownOutline,
  IoCarSportOutline,
  IoFlagOutline
} from 'react-icons/io5';
import LoadingSpinner from './common/LoadingSpinner';

const EventDetails = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [creatorInfo, setCreatorInfo] = useState(null);

  useEffect(() => {
    const fetchEventDetails = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/.proxy/api/races/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch event details');
        }
        const data = await response.json();
        setEvent(data);
      } catch (error) {
        console.error('Error fetching event details:', error);
        toast.error('Failed to load event details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventDetails();
  }, [id]);

  useEffect(() => {
    const fetchCreatorInfo = async () => {
      if (event && event.createdBy) {
        console.log('Fetching creator info for:', event.createdBy); // Добавим логирование
        try {
          if (user && user.id === event.createdBy) {
            console.log('Using current user info:', user);
            setCreatorInfo(user);
          } else {
            const response = await fetch(`/api/user/${event.createdBy}`);
            console.log('Creator info response:', response); // Добавим логирование
            
            if (!response.ok) {
              throw new Error(`Failed to fetch creator info: ${response.status}`);
            }
            
            const userData = await response.json();
            console.log('Received creator data:', userData); // Добавим логирование
            
            setCreatorInfo(userData);
          }
        } catch (error) {
          console.error('Error fetching creator info:', error);
          const defaultAvatarIndex = (BigInt(event.createdBy) >> 22n) % 6n;
          setCreatorInfo({
            id: event.createdBy,
            username: 'Unknown User',
            avatar: null,
            defaultAvatarUrl: `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`
          });
        }
      }
    };

    if (event) {
      fetchCreatorInfo();
    }
  }, [event, user]);

  const handleDelete = async () => {
    try {
      const response = await fetch(`/.proxy/api/races/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete race');
      }
      toast.success('Race deleted successfully');
      navigate('/');
    } catch (error) {
      console.error('Error deleting race:', error);
      toast.error('Failed to delete race. Please try again.');
    }
  };

  const renderClassDetails = (classDetails) => {
    return classDetails.map((detail, index) => (
      <div key={index} className="bg-gray-700 p-4 rounded-lg mb-4">
        <h4 className="text-lg font-semibold mb-2 text-white">{detail.class}</h4>
        <div className="space-y-4">
          <div className="text-gray-300">
            <div className="flex items-center mb-2">
              <IoCarSportOutline className="mr-2 text-xl" />
              <span className="font-semibold">Available Cars:</span>
            </div>
            <ul className="list-disc list-inside text-gray-300 pl-6">
              {detail.availableCars.filter(car => car !== "").map((car, idx) => (
                <li key={idx}>{car}</li>
              ))}
            </ul>
          </div>

          <div className="text-gray-300">
            <div className="flex items-center mb-2">
              <IoFlagOutline className="mr-2 text-xl" />
              <span className="font-semibold">Restrictions:</span>
            </div>
            {detail.restrictions === 'Custom BoP' ? (
              <div className="whitespace-pre-wrap pl-6">
                {detail.customBop}
              </div>
            ) : (
              <div className="pl-6">{detail.restrictions}</div>
            )}
          </div>
        </div>
      </div>
    ));
  };

  const renderSettings = (settings) => {
    return (
      <div className="bg-gray-700 p-4 rounded-lg mb-4">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center justify-between w-full text-lg font-semibold text-white mb-2"
        >
          <span>Race Settings</span>
          <motion.div
            animate={{ rotate: showSettings ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <IoChevronDownOutline />
          </motion.div>
        </button>
        <motion.div
          animate={{
            height: showSettings ? "auto" : 0,
            opacity: showSettings ? 1 : 0
          }}
          initial={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          style={{ overflow: "hidden" }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
            <div className="text-gray-300">
              <span className="font-semibold">Car to Car Collisions:</span> {settings.carToCarCollisions}
            </div>
            <div className="text-gray-300">
              <span className="font-semibold">Dynamic Track Rubber:</span> {settings.dynamicTrackRubber ? 'Enabled' : 'Disabled'}
            </div>
            <div className="text-gray-300">
              <span className="font-semibold">Forza Race Regulations:</span> {settings.forzaRaceRegulations}
            </div>
            <div className="text-gray-300">
              <span className="font-semibold">FRR Disqualification:</span> {settings.frrDisqualification ? 'Enabled' : 'Disabled'}
            </div>
            <div className="text-gray-300">
              <span className="font-semibold">Ghost Backmarkers:</span> {settings.ghostBackmarkers ? 'Enabled' : 'Disabled'}
            </div>
            <div className="text-gray-300">
              <span className="font-semibold">Simulation Level:</span> {settings.simulationLevel}
            </div>
            <div className="text-gray-300">
              <span className="font-semibold">Starting Track Rubber:</span> {settings.startingTrackRubber}%
            </div>
            <div className="text-gray-300">
              <span className="font-semibold">Tire Wear:</span> {settings.tireWear}
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/event-list')}
        className="mb-4 flex items-center bg-white bg-opacity-20 text-white py-2 px-4 rounded-lg font-semibold transition duration-300 ease-in-out hover:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
      >
        <IoArrowBackOutline className="mr-2" />
        Back to List
      </motion.button>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gray-800 bg-opacity-80 rounded-lg shadow-lg p-6 max-w-3xl mx-auto"
      >
        {isLoading ? (
          <LoadingSpinner />
        ) : !event ? (
          <p className="text-white">Event not found.</p>
        ) : (
          <>
            <h2 className="text-3xl font-bold text-white mb-2">{event.name}</h2>
            
            {creatorInfo && (
              <div className="flex items-center text-gray-300 mb-6">
                <span>Created by </span>
                <img 
                  src={creatorInfo.avatar 
                    ? `https://cdn.discordapp.com/avatars/${creatorInfo.id}/${creatorInfo.avatar}.png?size=256`
                    : creatorInfo.defaultAvatarUrl
                  } 
                  alt="Creator avatar" 
                  className="w-6 h-6 rounded-full mx-2"
                />
                <span>{creatorInfo.username}</span>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center text-gray-300 col-span-2">
                <IoLocationOutline className="mr-2 text-xl" />
                <span>{event.track}{event.trackConfig ? `, ${event.trackConfig}` : ''}</span>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center text-gray-300">
                  <IoCarSportOutline className="mr-2 text-xl" />
                  <span>{event.carClasses.join(', ')}</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <IoCalendarOutline className="mr-2 text-xl" />
                  <span>{new Date(event.dateTime).toLocaleString()}</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <IoPeopleOutline className="mr-2 text-xl" />
                  <span>{event.slots} slots</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center text-gray-300">
                  <IoTimeOutline className="mr-2 text-xl" />
                  <span>{event.race.startingTime}</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <IoCloudOutline className="mr-2 text-xl" />
                  <span>{event.race.weather}</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <IoSettingsOutline className="mr-2 text-xl" />
                  <span>{event.settings.simulationLevel}</span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold mb-2 text-white">Practice & Qualifying</h4>
                  {event.practiceAndQualifying.enabled ? (
                    <p className="text-gray-300">
                      {event.practiceAndQualifying.practiceTimeLimit} min | {event.practiceAndQualifying.qualifyingLaps} laps
                    </p>
                  ) : (
                    <p className="text-gray-300">Disabled</p>
                  )}
                </div>

                <div className="bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold mb-2 text-white">Race</h4>
                  <p className="text-gray-300">
                    {event.race.raceType === 'laps' 
                      ? `${event.race.numberOfLaps} laps`
                      : `${event.race.raceTimer} minutes`
                    }
                  </p>
                </div>
              </div>
            </div>

            {renderSettings(event.settings)}

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white mb-4">Car Classes</h3>
              {renderClassDetails(event.classDetails)}
            </div>

            <div className="flex justify-between mt-6">
              {user && user.id === event.createdBy && (
                <div className="flex gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(`/edit-event/${event.id}`)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center hover:bg-blue-600 transition-colors"
                  >
                    <IoPencilOutline className="mr-2" /> Edit Event
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg flex items-center hover:bg-red-600 transition-colors"
                  >
                    <IoTrashOutline className="mr-2" /> Delete Event
                  </motion.button>
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default EventDetails;
