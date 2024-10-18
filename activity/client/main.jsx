import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { DiscordSDK } from "@discord/embedded-app-sdk";
import MainMenu from './components/MainMenu';
import CreateRaceForm from './components/CreateRaceForm';
import "./style.css";
import LoadingScreen from './components/LoadingScreen';

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

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState('menu');
  useEffect(() => {
    setIsLoading(false);
  }, []);

  const handleCreateRace = () => {
    setCurrentView('createRace');
  };

  const handleMyRaces = () => {
    console.log('My Races clicked');
  };

  const handleBackToMenu = () => {
    setCurrentView('menu');
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="h-full w-full flex flex-col items-center justify-start p-4 pt-safe overflow-auto">
      <div className="w-full max-w-sm mt-safe flex-grow flex flex-col justify-center">
        {currentView === 'menu' && (
          <MainMenu onCreateRace={handleCreateRace} onMyRaces={handleMyRaces} />
        )}
        {currentView === 'createRace' && (
          <>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBackToMenu}
              className="mb-4 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
            >
              Back to Menu
            </motion.button>
            <CreateRaceForm />
          </>
        )}
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
