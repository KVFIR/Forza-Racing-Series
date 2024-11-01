import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import MainMenu from './MainMenu';
import GameSelector from './GameSelector';
import MotorsportCreateForm from './MotorsportCreateForm';
import EventList from './EventList';
import EventDetails from './EventDetails';
import ProfilePage from './ProfilePage';

const AppRoutes = () => {
  const navigate = useNavigate();

  const handleGameSelect = (gameId) => {
    if (gameId === 'fm') {
      navigate('/create-motorsport');
    } else if (gameId === 'fh5') {
      navigate('/create-motorsport');
    }
  };

  return (
    <Routes>
      <Route path="/" element={<MainMenu />} />
      <Route path="/create-race" element={<GameSelector onSelect={handleGameSelect} />} />
      <Route path="/create-motorsport" element={<MotorsportCreateForm userId={auth?.user?.id} />} />
      <Route path="/event-list" element={<EventList />} />
      <Route path="/event/:id" element={<EventDetails user={auth?.user} />} />
      <Route path="/profile" element={<ProfilePage user={auth?.user} />} />
    </Routes>
  );
};

export default AppRoutes;