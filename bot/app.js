import 'dotenv/config';
import express from 'express';
import { Client, GatewayIntentBits } from 'discord.js';
import {
  InteractionType,
  InteractionResponseType,
  verifyKeyMiddleware,
} from 'discord-interactions';
import { getRandomEmoji } from './utils.js';
import { getUser, createUser, updateUserScore } from './database.js';
import { db } from './firebase.js';
import { ref, set, get } from 'firebase/database';
import { createRaceModal } from './modals/createRaceModal.js';

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// Login to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 * Parse request body and verifies incoming requests using discord-interactions package
 */
app.post('/interactions', verifyKeyMiddleware(process.env.PUBLIC_KEY), async function (req, res) {
  const { type, data, member } = req.body;
  
  console.log('Received interaction:', type, data); // Добавляем логирование

  /**
   * Handle verification requests
   */
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  /**
   * Handle slash command requests
   * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
   */
  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;
    const userId = member.user.id;
    const username = member.user.username;

    try {
      let user = await getUser(userId);
      if (!user) {
        await createUser(userId, username);
        user = { score: 0 };
      }

      console.log('Received command:', name); // Логируем полученную команду

      // "test" command
      if (name === 'test') {
        // Send a message into the channel where command was triggered from
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            // Fetches a random emoji to send from a helper function
            content: `hello world ${getRandomEmoji()}`,
          },
        });
      }

      // "challenge" command
      if (name === 'challenge') {
        // Обработка команды challenge
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: 'Challenge accepted!',
          },
        });
      }

      if (name === 'score') {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `Your current score is: ${user.score || 0}`,
          },
        });
      }

      if (name === 'add_score') {
        const newScore = (user.score || 0) + 1;
        await updateUserScore(userId, newScore);
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `Your score has been increased to ${newScore}!`,
          },
        });
      }

      if (name === 'create_race') {
        return res.send(createRaceModal());
      }

      console.error(`Unknown command: ${name}`);
      return res.status(400).json({ error: 'Unknown command' });
    } catch (error) {
      console.error('Error processing command:', error);
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: 'An error occurred while processing your command. Please try again later.',
        },
      });
    }
  }

  console.error('Unknown interaction type:', type);
  return res.status(400).json({ error: 'Unknown interaction type' });
});

// Тестовое соединение с Firebase
const testRef = ref(db, 'test');
set(testRef, { test: 'Connection successful' })
  .then(() => console.log('Firebase connection successful'))
  .catch(error => console.error('Firebase connection error:', error));

app.listen(PORT, () => {
  console.log('Listening on port', PORT);
});
