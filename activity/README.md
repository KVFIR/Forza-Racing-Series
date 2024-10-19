# Discord Activity: Forza Race Organizer

This guide will help you set up and run a Discord Activity for organizing races in Forza.

## Introduction

Discord Activities are web applications that can be run within Discord. Our application allows users to create and manage races in the Forza game.

## Prerequisites

- Node.js (latest version)
- npm (comes with Node.js)
- Git
- Discord Developer Account

## Project Setup

1. Clone the repository:

   ```
   git clone <repository-url>
   cd getting-started-activity
   ```

2. Install dependencies:

   ```
   cd client
   npm install
   cd ../server
   npm install
   ```

3. Set up environment variables:
   - Copy the `example.env` file to `.env` in the root directory
   - Fill in your Discord application credentials:

     ```
     VITE_DISCORD_CLIENT_ID=YOUR_DISCORD_CLIENT_ID_HERE
     DISCORD_CLIENT_SECRET=YOUR_DISCORD_CLIENT_SECRET
     ```

## Running the Application

1. Start the client:

   ```
   cd client
   npm run dev
   ```

2. In a new terminal, start the server:

   ```
   cd server
   npm run dev
   ```

3. Set up a public endpoint using cloudflared:

```
   cloudflared tunnel --url http://localhost:5173
```

4. Configure your Discord application:
   - Go to the Discord Developer Portal
   - Set up URL Mappings in your app's settings
   - Enable Activities for your app

5. Launch the Activity in Discord

## Project Structure

- `client/`: Frontend React application
- `server/`: Backend Express server
- `client/components/`: React components for the UI
- `client/main.jsx`: Main entry point for the client application
- `server/server.js`: Express server setup and API endpoints

## Features

- Create new races with customizable settings
- View and manage existing races
- Authenticate users through Discord

## Development

The project uses Vite for the frontend build and development server. The main client code is in `client/main.jsx`, and the server code is in `server/server.js`.

For more information on building Discord Activities, refer to the [Discord Developer Documentation](https://discord.com/developers/docs/activities/overview).
