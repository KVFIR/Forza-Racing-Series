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
import { 
  handleCreateTicketButton,
  handleShowTicketModal,
  handleTicketSubmit,
  handleShowVerdictModal,
  handleVerdictSubmit,
  handleCloseTicket
} from './commands/ticketCommand.js';
import { handleSetupRoles } from './commands/setupRolesCommand.js';
import { 
  handleTest,
  handleCreateEvent,
  handleRegisterEvent,
  handleCancelRegistration
} from './commands/index.js';
import { handleContextCommand } from './contextActions/index.js';

const app = express();
const port = process.env.PORT || 8080;

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
        case 'create_ticket_button':
          return handleCreateTicketButton(req, res);
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
        case 'create_ticket':
          return handleCreateTicketButton(req, res);
        case 'create_incident_ticket':
          return handleShowTicketModal(req, res);
        default:
          if (custom_id.startsWith('verdict_ticket_')) {
            return handleShowVerdictModal(req, res);
          }
          if (custom_id.startsWith('close_ticket_')) {
            return handleCloseTicket(req, res);
          }
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

    if (type === InteractionType.MODAL_SUBMIT) {
      const { custom_id } = data;
      
      if (custom_id.startsWith('register_modal_')) {
        return handleRegisterEvent(req, res);
      }
      if (custom_id.startsWith('ticket_modal_')) {
        return handleTicketSubmit(req, res);
      }
      if (custom_id.startsWith('verdict_modal_')) {
        return handleVerdictSubmit(req, res);
      }

      console.error(`Unknown modal submission: ${custom_id}`);
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: "Unknown modal submission",
          flags: 64
        }
      });
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

// Инициализация Firebase
async function initializeApp() {
  try {
    console.log('Firebase initialized successfully');
    app.listen(port, () => {
      console.log('Firebase connection successful');
      console.log(`Listening on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to initialize app:', error);
  }
}

initializeApp();
