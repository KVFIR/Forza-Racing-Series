import React from 'react';
import './MainMenu.css';

const MainMenu = ({ onCreateRace, onMyRaces }) => {
  return (
    <div className="main-menu">
      <h1>Forza Race Organizer</h1>
      <div className="button-container">
        <button onClick={onCreateRace} className="menu-button">Create Race</button>
        <button onClick={onMyRaces} className="menu-button">My Races</button>
      </div>
    </div>
  );
};

export default MainMenu;

