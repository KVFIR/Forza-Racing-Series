import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { IoTrashOutline, IoArrowBackOutline, IoPencilOutline, IoCarSportOutline, IoCalendarOutline, IoLocationOutline, IoSettingsOutline, IoPeopleOutline } from 'react-icons/io5';
import LoadingSpinner from './LoadingSpinner';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleBackToMenu = () => {
    navigate('/');
  };

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

  return (
    <div>
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
        className="p-6 bg-gray-800 bg-opacity-80 rounded-lg shadow-lg max-w-md mx-auto"
      >
        {isLoading ? (
          <LoadingSpinner />
        ) : !event ? (
          <p className="text-white">Event not found.</p>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-white mb-6">{event.name}</h2>
            <div className="flex justify-between items-center mb-6">
            </div>

            <div className="space-y-4">
              <div className="flex items-center text-gray-300">
                <IoLocationOutline className="mr-2" />
                <span>{event.track}{event.trackConfig ? ` - ${event.trackConfig}` : ''}</span>
              </div>
              <div className="flex items-center text-gray-300">
                <IoCarSportOutline className="mr-2" />
                <span>{event.carClasses.join(', ')}</span>
              </div>
              <div className="flex items-center text-gray-300">
                <IoCalendarOutline className="mr-2" />
                <span>{new Date(event.dateTime).toLocaleString()}</span>
              </div>
              <div className="flex items-center text-gray-300">
                <IoPeopleOutline className="mr-2" />
                <span>{event.slots}</span>
              </div>
              <div className="flex items-center text-gray-300">
                <IoSettingsOutline className="mr-2" />
                <span>Settings: {JSON.stringify(event.settings)}</span>
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/edit-event/${event.id}`)}
                className="px-3 py-1 bg-blue-500 text-white rounded-lg flex items-center"
              >
                <IoPencilOutline className="mr-1" /> Edit
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDelete}
                className="px-3 py-1 bg-red-500 text-white rounded-lg flex items-center"
              >
                <IoTrashOutline className="mr-1" /> Delete
              </motion.button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default EventDetails;
