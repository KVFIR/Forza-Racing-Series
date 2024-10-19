import React, { useState, useEffect, useReducer } from 'react';
import ReactDOM from 'react-dom/client';
import { DiscordSDK } from "@discord/embedded-app-sdk";
import MainMenu from './components/MainMenu';
import CreateRaceForm from './components/CreateRaceForm';
import EventList from './components/EventList';
import "./style.css";
import { motion } from 'framer-motion';
import { IoArrowBackOutline } from 'react-icons/io5';

let auth;

const discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);

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

  const response = await fetch("/.proxy/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code,
    }),
  });
  const { access_token } = await response.json();

  auth = await discordSdk.commands.authenticate({
    access_token,
  });

  if (auth == null) {
    throw new Error("Authenticate command failed");
  }

  console.log("Discord SDK is authenticated");
  renderApp();
}

const initialState = {
  currentView: 'menu',
  events: [
    { id: 1, name: "Test Race 1", dateTime: new Date(), track: "Silverstone", carClass: "S1" },
    { id: 2, name: "Test Race 2", dateTime: new Date(), track: "Nurburgring", carClass: "A" }
  ]
};

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

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const handleViewChange = (view) => {
    dispatch({ type: 'SET_VIEW', payload: view });
  };

  const handleCreateRace = () => {
    handleViewChange('createRace');
  };

  const handleMyRaces = () => {
    handleViewChange('eventList');
  };

  const CurrentView = viewComponents[state.currentView];

  return (
    <div className="flex-1 overflow-y-auto p-4 pt-safe-top pb-safe-bottom pl-safe-left pr-safe-right">
      <div className="w-full max-w-sm mx-auto relative flex flex-col mt-4">
        {state.currentView !== 'menu' && (
          <div className="flex items-center mb-4 w-full">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleViewChange('menu')}
              className="text-white p-2 rounded-full bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 flex-shrink-0"
            >
              <IoArrowBackOutline size={20} />
            </motion.button>
            <h1 className="text-2xl font-bold text-white ml-4">
              {state.currentView === 'createRace' ? 'Create Race' : 
               state.currentView === 'eventList' ? 'Event List' : ''}
            </h1>
          </div>
        )}
        <div className="flex-grow">
          <CurrentView
            onCreateRace={handleCreateRace}
            onMyRaces={handleMyRaces}
            onJoinRace={() => handleViewChange('eventList')}
            events={state.events}
          />
        </div>
      </div>
    </div>
  );
}

function renderApp() {
  ReactDOM.createRoot(document.getElementById('app')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

setupDiscordSdk().catch(console.error);
