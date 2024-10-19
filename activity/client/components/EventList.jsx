import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { IoTrashOutline, IoChevronBackOutline, IoChevronForwardOutline } from 'react-icons/io5';

const EventList = () => {
  const [races, setRaces] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRaces = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/.proxy/api/races?page=${page}&limit=10`);
      if (!response.ok) {
        throw new Error('Failed to fetch races');
      }
      const data = await response.json();
      setRaces(data.races);
      setCurrentPage(data.currentPage);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error fetching races:', error);
      toast.error('Failed to load races. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRaces();
  }, []);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 bg-gray-800 rounded-lg shadow-lg max-w-md mx-auto"
    >
      <h2 className="text-2xl font-bold text-white mb-6">My Races</h2>
      {isLoading ? (
        <p className="text-white">Loading races...</p>
      ) : (
        <>
          {races.length === 0 ? (
            <p className="text-white">No races found.</p>
          ) : (
            <div className="space-y-4">
              {races.map((race) => (
                <motion.div
                  key={race.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-gray-700 rounded-lg p-4 shadow-md"
                >
                  <h3 className="text-lg font-semibold text-white">{race.name}</h3>
                  <p className="text-gray-300">Track: {race.track}</p>
                  <p className="text-gray-300">Car Class: {race.carClass}</p>
                  <p className="text-gray-300">Date: {new Date(race.dateTime).toLocaleString()}</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDelete(race.id)}
                    className="mt-2 px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-300 ease-in-out flex items-center"
                  >
                    <IoTrashOutline className="mr-1" /> Delete
                  </motion.button>
                </motion.div>
              ))}
            </div>
          )}
          <div className="flex justify-between mt-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <IoChevronBackOutline className="mr-1" /> Previous
            </motion.button>
            <span className="text-white">Page {currentPage} of {totalPages}</span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              Next <IoChevronForwardOutline className="ml-1" />
            </motion.button>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default EventList;
