import React, { useState, useEffect, useReducer } from 'react';
import ReactDOM from 'react-dom/client';
import { DiscordSDK } from "@discord/embedded-app-sdk";
import { DiscordProxy } from '@robojs/patch';
import MainMenu from './components/MainMenu';
import CreateRaceForm from './components/CreateRaceForm';
import EventList from './components/EventList';
import EventDetails from './components/EventDetails';
import "./style.css";
import { motion } from 'framer-motion';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';

const isProd = import.meta.env.PROD;
let auth;

const discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);

async function setupApp() {
  if (isProd) {
    await DiscordProxy.patch({
      urlMappings: [
        {prefix: '/firebase', target: 'firebasedatabase.app'},
        {prefix: '/.proxy', target: 'localhost:3001'},
        // Добавьте здесь другие необходимые маппинги
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

function reducer(state, action) {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, currentView: action.payload };
    case 'ADD_EVENT':
      return { ...state, events: [...state.events, action.payload] };
    default:
      throw new Error();
  }
}

const viewComponents = {
  menu: MainMenu,
  createRace: CreateRaceForm,
  eventList: EventList
};

const initialState = {
  currentView: 'menu',
  events: []
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(reducer, initialState);

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto p-4"
    >
      <Routes>
        <Route path="/" element={<MainMenu onNavigate={handleNavigate} />} />
        <Route path="/create" element={<CreateRaceForm onCreateRace={(newRace) => {
          dispatch({ type: 'ADD_EVENT', payload: newRace });
          navigate('/');
        }} userId={auth.user.id} />} />
        <Route path="/list" element={<EventList />} />
        <Route path="/event/:id" element={<EventDetails />} />
        <Route path="/races" element={<EventList />} />
      </Routes>
      <ToastContainer position="bottom-right" />
    </motion.div>
  );
}

function renderApp() {
  ReactDOM.createRoot(document.getElementById('app')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

setupApp().then(renderApp).catch(console.error);
