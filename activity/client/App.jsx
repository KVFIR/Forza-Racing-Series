import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { DiscordSDK } from "@discord/embedded-app-sdk";
import { DiscordProxy } from '@robojs/patch';
import MainMenu from './components/MainMenu';
import MotorsportCreateForm from './components/MotorsportCreateForm';
import HorizonCreateForm from './components/HorizonCreateForm';
import EventList from './components/EventList';
import EventDetails from './components/EventDetails';
import ProfilePage from './components/ProfilePage';
import GameSelector from './components/GameSelector';
import "./style.css";
import { motion } from 'framer-motion';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Route, Routes } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

const isProd = import.meta.env.PROD;
let auth;

const discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);

async function setupApp() {
  if (isProd) {
    await DiscordProxy.patch({
      urlMappings: [
        {prefix: '/firebase', target: 'firebasedatabase.app'},
        {prefix: '/.proxy', target: 'localhost:3001'},
        // Добавьте здесь другие неоходимые маппинги
      ]
    });
  }
  await setupDiscordSdk();
}

async function setupDiscordSdk() {
  await discordSdk.ready();
  console.log("Discord SDK is ready");

  const { code } = await discordSdk.commands.authorize({
    client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
    response_type: "code",
    state: "",
    prompt: "none",
    scope: [
      "identify",
      "guilds",
      "applications.commands"
    ],
  });

  try {
    const response = await fetch("/.proxy/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code,
      }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const { access_token } = await response.json();
    
    auth = await discordSdk.commands.authenticate({
      access_token,
    });

    if (auth == null) {
      throw new Error("Authenticate command failed");
    }

    console.log("Discord SDK is authenticated");
  } catch (error) {
    console.error("Error during authentication:", error);
    // Здесь можно добавить код для отображения ошибки пользователю
  }
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setupApp().then(() => {
      setIsAuthenticated(true);
      if (auth && auth.user) {
        setUser(auth.user);
      }
    });
  }, []);

  const handleGameSelect = (gameId) => {
    if (gameId === 'fm') {
      navigate('/create-motorsport');
    } else if (gameId === 'fh5') {
      navigate('/create-horizon');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="App container mx-auto p-4"
    >
      <ToastContainer />
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/create-race" element={<GameSelector onSelect={handleGameSelect} />} />
        <Route path="/create-motorsport" element={<MotorsportCreateForm userId={user?.id} />} />
        <Route path="/create-horizon" element={<HorizonCreateForm userId={user?.id} />} />
        <Route path="/event-list" element={<EventList />} />
        <Route path="/event/:id" element={<EventDetails user={user} />} />
        <Route path="/profile" element={<ProfilePage user={user} />} />
      </Routes>
    </motion.div>
  );
}
export default App;