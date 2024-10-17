# Forza Racing Series

## Project Description

Forza Racing Series is a comprehensive project for organizing and managing racing series in the Forza game. It consists of two main components:

1. A Discord bot for user interaction and game management
2. A Discord Activity web application for enhanced race organization

## Project Structure

- `/bot` - Discord bot for user interaction and game management
- `/activity` - Discord Activity web application for race organization

## Bot Features

- Implements a rock-paper-scissors-style game
- Uses slash commands for interaction
- Supports buttons, modals, and select menus

## Activity Features

- Built using the Discord Embedded App SDK
- Provides an interactive interface for race management within Discord

## Installation and Setup

### Prerequisites

- Node.js (version specified in package.json)
- npm (comes with Node.js)
- A Discord account and a registered Discord application

### Bot Setup

1. Clone the repository:
   ```
   git clone https://github.com/your-username/Forza-Racing-Series.git
   cd Forza-Racing-Series/bot
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure environment variables:
   - Copy `.env.sample` to `.env`
   - Add your Discord app credentials (APP_ID, DISCORD_TOKEN, PUBLIC_KEY)

4. Install slash commands:
   ```
   npm run register
   ```

5. Start the bot:
   ```
   node app.js
   ```

### Activity Setup

1. Navigate to the activity directory:
   ```
   cd ../activity
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure Firebase:
   - Copy `firebase.example.js` to `firebase.js`
   - Replace placeholder values with your Firebase configuration

4. Start the activity:
   ```
   npm run dev
   ```

## Usage

[Add instructions on how to use the bot and activity here]

## Contributing

If you'd like to contribute to the project, please create an issue or submit a pull request.

## Additional Resources

- [Discord Developer Documentation](https://discord.com/developers/docs/intro)
- [Discord Developers Server](https://discord.gg/discord-developers)
- [Community Resources](https://discord.com/developers/docs/topics/community-resources#community-resources)

## License

MIT