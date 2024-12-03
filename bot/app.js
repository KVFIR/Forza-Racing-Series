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
import { ref, set, get } from 'firebase/database';
import { handleTest, handleCreateEvent } from './commands/index.js';
import { handleLogging } from './commands/loggingCommand.js';
import { 
  handleCreateTicketButton, 
  handleShowTicketModal, 
  handleTicketSubmit, 
  handleCloseTicket, 
  handleShowVerdictModal, 
  handleVerdictSubmit 
} from './commands/ticketCommand.js';
import { handleSetupRoles } from './commands/setupRolesCommand.js';
import { 
  handleRegisterEvent, 
  handleCancelRegistration 
} from './commands/createEventCommand.js';

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

  // Увеличиваем счетчик команд для метрик
  totalCommands++;

  try {
    // Обработка PING
    if (type === InteractionType.PING) {
      return res.send({ type: InteractionResponseType.PONG });
    }

    // Обработка команд
    if (type === InteractionType.APPLICATION_COMMAND) {
      const { name } = data;
      const userId = req.body.member.user.id;
      const username = req.body.member.user.username;
      
      try {
        // Получаем или создаем пользователя
        let user = await getUser(userId);
        if (!user) {
          await createUser(userId, username);
          user = { score: 0 };
        }

        switch (name) {
          case 'test':
            return handleTest(req, res);
          case 'create_event':
            return handleCreateEvent(req, res);
          case 'logging':
            return handleLogging(req, res);
          case 'create_ticket_button':
            return handleCreateTicketButton(req, res);
          case 'setup_roles':
            return handleSetupRoles(req, res);
          default:
            console.error(`Unknown command: ${name}`);
            return res.status(400).json({ error: 'Unknown command' });
        }
      } catch (error) {
        console.error('Error handling command:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }

    // Обработка компонентов (кнопки)
    if (type === InteractionType.MESSAGE_COMPONENT) {
      const { custom_id } = data;
      
      if (custom_id === 'create_incident_ticket') {
        return handleShowTicketModal(req, res);
      }
      else if (custom_id.startsWith('close_ticket_')) {
        return handleCloseTicket(req, res);
      } 
      else if (custom_id.startsWith('verdict_ticket_')) {
        return handleShowVerdictModal(req, res);
      }
      else if (custom_id === 'register_event') {
        return handleRegisterEvent(req, res);
      }
      else if (custom_id === 'cancel_registration') {
        return handleCancelRegistration(req, res);
      }
    }

    // Обработка модальных окон
    if (type === InteractionType.MODAL_SUBMIT) {
      const { custom_id } = data;
      
      if (custom_id.startsWith('ticket_modal_')) {
        return handleTicketSubmit(req, res);
      }
      else if (custom_id.startsWith('verdict_modal_')) {
        return handleVerdictSubmit(req, res);
      }
      else if (custom_id.startsWith('register_modal_')) {
        return handleRegisterEvent(req, res);
      }
    }

    // Если дошли до сюда - неизвестный тип взаимодействия
    return res.status(400).json({ error: 'Unknown interaction type' });

  } catch (error) {
    console.error('Error processing interaction:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
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
