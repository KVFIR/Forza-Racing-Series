import React, { useState, useEffect, useReducer } from 'react';
import ReactDOM from 'react-dom/client';
import { DiscordSDK, patchUrlMappings } from "@discord/embedded-app-sdk";
import MainMenu from './components/MainMenu';
import CreateRaceForm from './components/CreateRaceForm';
import EventList from './components/EventList';
import "./style.css";
import { motion } from 'framer-motion';
import { IoArrowBackOutline } from 'react-icons/io5';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const isProd = import.meta.env.PROD;
let auth;

const discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);

async function setupApp() {
  if (isProd) {
    patchUrlMappings([
      {prefix: '/firebase', target: 'firebasedatabase.app'},
      {prefix: '/.proxy', target: 'localhost:3001'},
      // Добавьте здесь другие необходимые маппинги
    ]);
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
  const [view, setView] = useState('menu');
  const [state, dispatch] = useReducer(reducer, initialState);

  const renderView = () => {
    switch (view) {
      case 'create':
        return <CreateRaceForm onCreateRace={(newRace) => {
          dispatch({ type: 'ADD_EVENT', payload: newRace });
          setView('list');
        }} />;
      case 'join':
        return <CreateRaceForm onJoinRace={() => setView('list')} />;
      case 'list':
        return <EventList />;
      default:
        return <MainMenu onNavigate={setView} />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto p-4"
    >
      {view !== 'menu' && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setView('menu')}
          className="mb-4 w-full sm:w-auto bg-gray-500 bg-opacity-25 text-white py-2 px-4 rounded-lg text-base font-semibold transition duration-300 ease-in-out hover:bg-gray-600 hover:bg-opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 flex items-center justify-center"
        >
          <IoArrowBackOutline className="mr-2" /> Back to Menu
        </motion.button>
      )}
      {renderView()}
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
