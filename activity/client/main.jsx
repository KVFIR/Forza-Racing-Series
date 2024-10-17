import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { DiscordSDK } from "@discord/embedded-app-sdk";
import MainMenu from './components/MainMenu';
import CreateRaceForm from './components/CreateRaceForm';
import "./style.css";
import backgroundImage from './public/images/background.png';

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
  const [currentView, setCurrentView] = useState('menu');

  const handleCreateRace = () => {
    setCurrentView('createRace');
  };

  const handleMyRaces = () => {
    // TODO: Implement My Races view
    console.log('My Races clicked');
  };

  const handleBackToMenu = () => {
    setCurrentView('menu');
  };

  return (
    <div style={{
      backgroundImage: `url(${backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {currentView === 'menu' && (
        <MainMenu onCreateRace={handleCreateRace} onMyRaces={handleMyRaces} />
      )}
      {currentView === 'createRace' && (
        <div style={{ width: '100%', maxWidth: '600px' }}>
          <button onClick={handleBackToMenu} className="back-button">Back to Menu</button>
          <CreateRaceForm />
        </div>
      )}
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
