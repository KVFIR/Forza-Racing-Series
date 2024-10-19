import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

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
    <div className="space-y-4">
      {isLoading ? (
        <p>Loading races...</p>
      ) : (
        <>
          {races.map((race) => (
            <motion.div
              key={race.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white shadow rounded-lg p-4"
            >
              <h3 className="text-lg font-semibold">{race.name}</h3>
              <p>Track: {race.track}</p>
              <p>Car Class: {race.carClass}</p>
              <p>Date: {new Date(race.dateTime).toLocaleString()}</p>
              <button
                onClick={() => handleDelete(race.id)}
                className="mt-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </motion.div>
          ))}
          <div className="flex justify-between mt-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default EventList;
