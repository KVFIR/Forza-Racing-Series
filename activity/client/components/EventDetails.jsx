import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { IoTrashOutline, IoArrowBackOutline, IoPencilOutline, IoCarSportOutline, IoCalendarOutline, IoLocationOutline, IoSettingsOutline, IoPeopleOutline, IoFlagOutline, IoSpeedometerOutline, IoTimeOutline, IoCloudOutline, IoChevronDownOutline, IoChevronUpOutline } from 'react-icons/io5';
import LoadingSpinner from './LoadingSpinner';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

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
        <div className="space-y-2">
          <p className="text-gray-300">Restrictions: {detail.restrictions}</p>
          {detail.customBop && <p className="text-gray-300">Custom BoP: {detail.customBop}</p>}
          <p className="text-gray-300">Available Cars:</p>
          <ul className="list-disc list-inside text-gray-300 pl-4">
            {detail.availableCars.filter(car => car !== "").map((car, idx) => (
              <li key={idx}>{car}</li>
            ))}
          </ul>
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
          {showSettings ? <IoChevronUpOutline /> : <IoChevronDownOutline />}
        </button>
        {showSettings && (
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
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/list')}
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
            <h2 className="text-3xl font-bold text-white mb-6">{event.name}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div className="flex items-center text-gray-300">
                  <IoLocationOutline className="mr-2 text-xl" />
                  <span>{event.track}{event.trackConfig ? ` - ${event.trackConfig}` : ''}</span>
                </div>
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
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/edit-event/${event.id}`)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center"
              >
                <IoPencilOutline className="mr-2" /> Edit Event
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg flex items-center"
              >
                <IoTrashOutline className="mr-2" /> Delete Event
              </motion.button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default EventDetails;
