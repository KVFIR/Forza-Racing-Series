import React from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const CreateRaceForm = () => {
  const { register, handleSubmit, formState: { errors }, setValue } = useForm();

  const onSubmit = (data) => {
    console.log('Form submitted:', data);
    // TODO: Добавить логику сохранения данных в Firebase
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white bg-opacity-80 p-6 rounded-lg shadow-lg max-w-md mx-auto"
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Create New Race</h2>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="raceName" className="block text-sm font-medium text-gray-700">Race Name</label>
          <input
            {...register("raceName", { required: "Race name is required" })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
          {errors.raceName && <p className="mt-1 text-sm text-red-600">{errors.raceName.message}</p>}
        </div>

        <div>
          <label htmlFor="dateTime" className="block text-sm font-medium text-gray-700">Date and Time</label>
          <DatePicker
            selected={new Date()}
            onChange={(date) => setValue('dateTime', date)}
            showTimeSelect
            dateFormat="Pp"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        </div>

        <div>
          <label htmlFor="track" className="block text-sm font-medium text-gray-700">Track</label>
          <input
            {...register("track", { required: "Track is required" })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
          {errors.track && <p className="mt-1 text-sm text-red-600">{errors.track.message}</p>}
        </div>

        <div>
          <label htmlFor="carClass" className="block text-sm font-medium text-gray-700">Car Class</label>
          <input
            {...register("carClass", { required: "Car class is required" })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
          {errors.carClass && <p className="mt-1 text-sm text-red-600">{errors.carClass.message}</p>}
        </div>

        <div>
          <label htmlFor="restrictions" className="block text-sm font-medium text-gray-700">Restrictions (optional)</label>
          <textarea
            {...register("restrictions")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            rows="3"
          />
        </div>

        <div>
          <label htmlFor="format" className="block text-sm font-medium text-gray-700">Race Format</label>
          <textarea
            {...register("format", { required: "Race format is required" })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            rows="3"
          />
          {errors.format && <p className="mt-1 text-sm text-red-600">{errors.format.message}</p>}
        </div>

        <div>
          <label htmlFor="prize" className="block text-sm font-medium text-gray-700">Prize (optional)</label>
          <input
            {...register("prize")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        type="submit"
        className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
      >
        Create Race
      </motion.button>
    </motion.form>
  );
};

export default CreateRaceForm;
