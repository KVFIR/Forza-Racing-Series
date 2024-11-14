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

// Добавьте в начало файла после импортов
process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;

// Добавьте логирование запросов
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Добавьте health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Добавьте метрики
let totalCommands = 0;
let errorCount = 0;

app.get('/metrics', (req, res) => {
  res.json({
    uptime: process.uptime(),
    totalCommands,
    errorCount,
    memoryUsage: process.memoryUsage()
  });
});

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
  const { type, data } = req.body;

  // Немедленно отправляем DEFERRED ответ для всех команд
  if (type === InteractionType.APPLICATION_COMMAND) {
    await res.send({
      type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
    });

    try {
      const { name } = data;
      const userId = req.body.member.user.id;
      const username = req.body.member.user.username;

      // Получаем или создаем пользователя
      let user = await getUser(userId);
      if (!user) {
        await createUser(userId, username);
        user = { score: 0 };
      }

      // Подготавливаем ответ
      let response = {
        content: 'Processing command...'
      };

      // Обрабатываем команды
      switch (name) {
        case 'test':
          response.content = `hello world ${getRandomEmoji()}`;
          break;
        case 'challenge':
          response.content = 'Challenge accepted!';
          break;
        case 'score':
          response.content = `Your current score is: ${user.score || 0}`;
          break;
        case 'add_score':
          const newScore = (user.score || 0) + 1;
          await updateUserScore(userId, newScore);
          response.content = `Your score has been increased to ${newScore}!`;
          break;
        case 'create_race':
          return await DiscordRequest(`/webhooks/${process.env.APP_ID}/${req.body.token}/messages/@original`, {
            method: 'PATCH',
            body: createRaceModal()
          });
        default:
          response.content = 'Unknown command';
      }

      // Отправляем финальный ответ через webhook
      await DiscordRequest(`/webhooks/${process.env.APP_ID}/${req.body.token}/messages/@original`, {
        method: 'PATCH',
        body: response
      });

    } catch (error) {
      console.error('Error processing command:', error);
      await DiscordRequest(`/webhooks/${process.env.APP_ID}/${req.body.token}/messages/@original`, {
        method: 'PATCH',
        body: {
          content: 'An error occurred while processing your command.'
        }
      });
    }
    return;
  }

  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  return res.status(400).json({ error: 'Unknown interaction type' });
});

// Тестовое соединение с Firebase
const testRef = ref(db, 'test');
try {
  await set(testRef, { test: 'Connection successful' });
  console.log('Firebase connection successful');
} catch (error) {
  console.error('Firebase connection error:', error);
  // Продолжаем работу бота даже при ошибке подключения к Firebase
}

app.listen(PORT, () => {
  console.log('Listening on port', PORT);
});
