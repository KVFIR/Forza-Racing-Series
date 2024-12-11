import 'dotenv/config';
import express from 'express';
import {
  InteractionType,
  InteractionResponseType,
  verifyKeyMiddleware,
  MessageComponentTypes
} from 'discord-interactions';
import { getUser, createUser } from './database.js';
import { db } from './firebase.js';
import { ref, set } from 'firebase/database';
import { handleLogging } from './commands/loggingCommand.js';
import { handleCreateTicketButton } from './commands/ticketCommand.js';
import { handleSetupRoles } from './commands/setupRolesCommand.js';
import { 
  handleTest,
  handleCreateEvent,
  handleRegisterEvent,
  handleCancelRegistration
} from './commands/index.js';
import { handleContextCommand } from './contextActions/index.js';

const app = express();

// Добавляем middleware для парсинга JSON
app.use(express.json());

// Добавляем middleware для верификации запросов от Discord
app.use('/interactions', verifyKeyMiddleware(process.env.PUBLIC_KEY));

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

// Добавим константу для прав администратора
const ADMINISTRATOR_PERMISSION = BigInt(0x8);

// Interactions endpoint
app.post('/interactions', async function(req, res) {
  const { type, data } = req.body;

  try {
    if (type === InteractionType.PING) {
      return res.send({ type: InteractionResponseType.PONG });
    }

    if (type === InteractionType.APPLICATION_COMMAND) {
      const { name, type: commandType } = data;
      
      // Обработка контекстных команд сообщений
      if (commandType === 3) { // MESSAGE type commands
        return handleContextCommand(req, res);
      }

      // Обработка обычных слэш-команд
      switch (name) {
        case 'test':
          return handleTest(req, res);
        case 'create_event':
          return handleCreateEvent(req, res);
        case 'logging':
          return handleLogging(req, res);
        case 'setup_roles':
          return handleSetupRoles(req, res);
        default:
          console.error(`Unknown command: ${name}`);
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: "Unknown command",
              flags: 64
            }
          });
      }
    }

    if (type === InteractionType.MESSAGE_COMPONENT) {
      const { custom_id } = data;
      
      switch (custom_id) {
        case 'register_event':
          return handleRegisterEvent(req, res);
        case 'cancel_registration':
          return handleCancelRegistration(req, res);
        default:
          console.error(`Unknown component interaction: ${custom_id}`);
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: "Unknown interaction",
              flags: 64
            }
          });
      }
    }

    // Если дошли до сюда - неизвестный тип взаимодействия
    console.error(`Unknown interaction type: ${type}`);
    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "Unknown interaction type",
        flags: 64
      }
    });

  } catch (error) {
    console.error('Error processing interaction:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Оборачиваем инициализацию в асинхронную функцию
async function initializeApp() {
  // Test Firebase connection
  const testRef = ref(db, 'test');
  try {
    await set(testRef, { test: 'Connection successful' });
    console.log('Firebase connection successful');
  } catch (error) {
    console.error('Firebase connection error:', error);
  }

  // Start the server
  app.listen(PORT, () => {
    console.log('Listening on port', PORT);
  });
}

// Запускаем инициализацию
initializeApp().catch(error => {
  console.error('Failed to initialize app:', error);
  process.exit(1);
});
