import 'dotenv/config';
import express from 'express';
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

const app = express();
const PORT = process.env.PORT || 8080;

// Metrics
let totalCommands = 0;
let errorCount = 0;

// Unhandled promise rejection
process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
  errorCount++;
});

// Express error handling
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  errorCount++;
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Logging requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Metrics
app.get('/metrics', (req, res) => {
  res.json({
    uptime: process.uptime(),
    totalCommands,
    errorCount,
    memoryUsage: process.memoryUsage()
  });
});

// Interactions endpoint
app.post('/interactions', verifyKeyMiddleware(process.env.PUBLIC_KEY), async function (req, res) {
  const { type, data } = req.body;

  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;
    
    switch (name) {
      case 'test':
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `hello world ${getRandomEmoji()}`
          }
        });
      
      case 'challenge':
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: 'Challenge accepted!'
          }
        });
      
      case 'score':
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: 'Score command received'
          }
        });
      
      default:
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: 'Unknown command'
          }
        });
    }
  }

  return res.status(400).json({ error: 'Unknown interaction type' });
});

// Test Firebase
const testRef = ref(db, 'test');
try {
  await set(testRef, { test: 'Connection successful' });
  console.log('Firebase connection successful');
} catch (error) {
  console.error('Firebase connection error:', error);
}

app.listen(PORT, () => {
  console.log('Listening on port', PORT);
});
