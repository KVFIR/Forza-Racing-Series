import React from 'react';
import { motion } from 'framer-motion';

const EventList = ({ events }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      <h2 className="text-xl font-bold text-white mb-4">Event List</h2>
      {events.map((event) => (
        <motion.div
          key={event.id}
          whileHover={{ scale: 1.05 }}
          className="bg-gray-700 p-4 rounded-lg"
        >
          <h3 className="text-lg font-semibold text-white">{event.name}</h3>
          <p className="text-gray-300">Track: {event.track}</p>
          <p className="text-gray-300">Car Class: {event.carClass}</p>
          <p className="text-gray-300">Date: {new Date(event.dateTime).toLocaleString()}</p>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default EventList;
