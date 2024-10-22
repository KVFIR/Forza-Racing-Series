import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { IoChevronBackOutline, IoChevronForwardOutline, IoCarSportOutline, IoCalendarOutline, IoLocationOutline, IoPeopleOutline, IoArrowBackOutline } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';
import { useMediaQuery } from 'react-responsive';

const EventList = () => {
  const navigate = useNavigate();
  const [races, setRaces] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const isDesktop = useMediaQuery({ minWidth: 1024 });
  const itemsPerPage = isDesktop ? 9 : 10;

  const fetchRaces = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/.proxy/api/races?page=${page}&limit=${itemsPerPage}`);
      if (!response.ok) {
        throw new Error('Failed to fetch races');
      }
      const data = await response.json();
      
      setRaces(data.races.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime)));
      setCurrentPage(data.currentPage);
      setTotalPages(data.totalPages);
      console.log('Fetched races:', data.races);
      console.log('Total pages:', data.totalPages);
      console.log('Current page:', data.currentPage);
    } catch (error) {
      console.error('Error fetching races:', error);
      toast.error('Failed to load races. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRaces();
  }, [isDesktop]);

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/.proxy/api/races/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete race');
      }
      setRaces(races.filter(race => race.id !== id));
      toast.success('Race deleted successfully');
    } catch (error) {
      console.error('Error deleting race:', error);
      toast.error('Failed to delete race. Please try again.');
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchRaces(newPage);
    }
  };

  const handleBackToMenu = () => {
    navigate('/');
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
        className={`p-6 bg-gray-800 bg-opacity-80 rounded-lg shadow-lg mx-auto ${isDesktop ? 'max-w-6xl' : 'max-w-md'}`}
      >
        <h2 className="text-2xl font-bold text-white mb-6">Community Events</h2>
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            {races.length === 0 ? (
              <p className="text-white">No races found.</p>
            ) : (
              <div className={`${isDesktop ? 'grid grid-cols-3 gap-4' : 'space-y-4'}`}>
                {races.map((race) => (
                  <motion.div
                    key={race.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-gray-700 rounded-lg p-4 shadow-md cursor-pointer hover:bg-gray-600 transition-colors duration-300"
                    onClick={() => navigate(`/event/${race.id}`)}
                  >
                    <h3 className="text-lg font-semibold text-white">{race.name}</h3>
                    <div className="flex items-center text-gray-300 mt-2">
                      <IoLocationOutline className="mr-2" />
                      <span>{race.track}{race.trackConfig ? ` - ${race.trackConfig}` : ''}</span>
                    </div>
                    <div className="flex items-center text-gray-300 mt-1">
                      <IoCarSportOutline className="mr-2" />
                      <span>{race.carClasses.join(', ')}</span>
                    </div>
                    <div className="flex items-center text-gray-300 mt-1">
                      <IoCalendarOutline className="mr-2" />
                      <span>{new Date(race.dateTime).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center text-gray-300 mt-1">
                      <IoPeopleOutline className="mr-2" />
                      <span>{race.slots}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            {races.length > 0 && totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`mx-1 px-3 py-1 rounded-lg ${
                    currentPage === 1 ? 'bg-gray-500 text-gray-300' : 'bg-gray-600 text-white hover:bg-gray-500'
                  }`}
                >
                  <IoChevronBackOutline />
                </motion.button>
                {[...Array(totalPages)].map((_, index) => {
                  if (
                    index === 0 ||
                    index === totalPages - 1 ||
                    (index >= currentPage - 2 && index <= currentPage + 2)
                  ) {
                    return (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handlePageChange(index + 1)}
                        className={`mx-1 px-3 py-1 rounded-lg ${
                          currentPage === index + 1 ? 'bg-blue-500 text-white' : 'bg-gray-600 text-white hover:bg-gray-500'
                        }`}
                      >
                        {index + 1}
                      </motion.button>
                    );
                  } else if (index === currentPage - 3 || index === currentPage + 3) {
                    return <span key={index} className="mx-1 text-white">...</span>;
                  }
                  return null;
                })}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`mx-1 px-3 py-1 rounded-lg ${
                    currentPage === totalPages ? 'bg-gray-500 text-gray-300' : 'bg-gray-600 text-white hover:bg-gray-500'
                  }`}
                >
                  <IoChevronForwardOutline />
                </motion.button>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

export default EventList;
