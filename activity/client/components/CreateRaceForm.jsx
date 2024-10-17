import React, { useState } from 'react';
import './CreateRaceForm.css';

const CreateRaceForm = () => {
  const [formData, setFormData] = useState({
    raceName: '',
    dateTime: '',
    track: '',
    carClass: '',
    restrictions: '',
    format: '',
    prize: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Добавить логику сохранения данных в Firebase
    console.log('Form submitted:', formData);
  };

  return (
    <form onSubmit={handleSubmit} className="create-race-form">
      <h2>Create New Race</h2>
      
      <div className="form-group">
        <label htmlFor="raceName">Race Name:</label>
        <input
          type="text"
          id="raceName"
          name="raceName"
          value={formData.raceName}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="dateTime">Date and Time:</label>
        <input
          type="datetime-local"
          id="dateTime"
          name="dateTime"
          value={formData.dateTime}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="track">Track:</label>
        <input
          type="text"
          id="track"
          name="track"
          value={formData.track}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="carClass">Car Class:</label>
        <input
          type="text"
          id="carClass"
          name="carClass"
          value={formData.carClass}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="restrictions">Restrictions (optional):</label>
        <textarea
          id="restrictions"
          name="restrictions"
          value={formData.restrictions}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label htmlFor="format">Race Format:</label>
        <textarea
          id="format"
          name="format"
          value={formData.format}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="prize">Prize (optional):</label>
        <input
          type="text"
          id="prize"
          name="prize"
          value={formData.prize}
          onChange={handleChange}
        />
      </div>

      <button type="submit" className="submit-button">Create Race</button>
    </form>
  );
};

export default CreateRaceForm;