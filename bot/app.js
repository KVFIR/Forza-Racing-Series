import 'dotenv/config';
import express from 'express';
import {
  InteractionType,
  InteractionResponseType,
  verifyKeyMiddleware,
  MessageComponentTypes
} from 'discord-interactions';
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

// Metrics
let totalCommands = 0;
let errorCount = 0;

// Middleware
app.use(express.json());
app.use('/interactions', verifyKeyMiddleware(process.env.PUBLIC_KEY));

// Error Handlers
process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
  errorCount++;
});

app.use((err, req, res, next) => {
  console.error('Express error:', err);
  errorCount++;
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Request logging middleware
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

// Metrics endpoint
app.get('/metrics', (req, res) => {
  res.json({
    uptime: process.uptime(),
    totalCommands,
    errorCount,
    memoryUsage: process.memoryUsage()
  });
});

// Helper functions
function createErrorResponse(message, isEphemeral = true) {
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: message,
      flags: isEphemeral ? 64 : 0
    }
  };
}

// Interaction handlers
function handleApplicationCommand(req, res) {
  const { name, type: commandType } = req.body.data;
  console.log(`Handling application command: ${name}`);
  totalCommands++;

  try {
    // Handle message context commands
    if (commandType === 3) {
      return handleContextCommand(req, res);
    }

    // Handle slash commands
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
        return res.send(createErrorResponse("Unknown command"));
    }
  } catch (error) {
    console.error(`Error handling command ${name}:`, error);
    errorCount++;
    return res.send(createErrorResponse(error.message || "Failed to process command"));
  }
}

function handleMessageComponent(req, res) {
  const { custom_id } = req.body.data;
  console.log(`Handling message component: ${custom_id}`);
  totalCommands++;

  try {
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
        return res.send(createErrorResponse("Unknown interaction"));
    }
  } catch (error) {
    console.error(`Error handling component interaction ${custom_id}:`, error);
    errorCount++;
    return res.send(createErrorResponse(error.message || "Failed to process interaction"));
  }
}

function handleModalSubmit(req, res) {
  const { custom_id } = req.body.data;
  console.log(`Handling modal submit: ${custom_id}`);
  totalCommands++;

  try {
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
    return res.send(createErrorResponse("Unknown modal submission"));
  } catch (error) {
    console.error(`Error handling modal submission ${custom_id}:`, error);
    errorCount++;
    return res.send(createErrorResponse(error.message || "Failed to process modal submission"));
  }
}

// Main interaction handler
app.post('/interactions', async function(req, res) {
  const { type } = req.body;

  try {
    // Handle ping
    if (type === InteractionType.PING) {
      return res.send({ type: InteractionResponseType.PONG });
    }

    // Handle commands and interactions
    switch (type) {
      case InteractionType.APPLICATION_COMMAND:
        return handleApplicationCommand(req, res);
      case InteractionType.MESSAGE_COMPONENT:
        return handleMessageComponent(req, res);
      case InteractionType.MODAL_SUBMIT:
        return handleModalSubmit(req, res);
      default:
        console.error(`Unknown interaction type: ${type}`);
        return res.send(createErrorResponse("Unknown interaction type"));
    }
  } catch (error) {
    console.error('Error processing interaction:', error);
    errorCount++;
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Server initialization
async function initializeApp() {
  try {
    app.listen(port, () => {
      console.log(`Server started successfully on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to initialize app:', error);
    process.exit(1);
  }
}

initializeApp();
