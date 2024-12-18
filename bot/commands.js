import dotenv from 'dotenv';
dotenv.config();
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import ora from 'ora';

export const commandIds = {};

export async function initializeCommands() {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  const spinner = ora('Initializing commands').start();
  
  try {
    spinner.text = 'Getting existing commands...';
    const existingCommands = await rest.get(Routes.applicationCommands(process.env.APP_ID));
    
    spinner.succeed('Found existing commands');
    spinner.start('Checking Entry Point command');
    
    const entryPointCommand = existingCommands.find(cmd => cmd.name === 'launch');
    if (!entryPointCommand) {
      spinner.fail('Entry Point command not found!');
      return;
    }
    spinner.succeed('Entry Point command found');

    // Создаем новый список команд
    const commands = [
      entryPointCommand,
      {
        name: 'test',
        description: 'Basic command',
        type: 1,
        default_member_permissions: "8",
        dm_permission: false
      },
      {
        name: 'create_event',
        description: 'Create a new event announcement',
        type: 1,
        default_member_permissions: "8",
        dm_permission: false,
        options: [
          {
            name: 'title',
            description: 'Title of the event',
            type: 3, // STRING
            required: true,
            min_length: 1,
            max_length: 100
          },
          {
            name: 'day',
            description: 'Day of the event',
            type: 4, // INTEGER
            required: true,
            min_value: 1,
            max_value: 31
          },
          {
            name: 'month',
            description: 'Month of the event',
            type: 4, // INTEGER
            required: true,
            min_value: 1,
            max_value: 12
          },
          {
            name: 'year',
            description: 'Year of the event',
            type: 4, // INTEGER
            required: true,
            min_value: 2024,
            max_value: 2025
          },
          {
            name: 'hour',
            description: 'Hour of the event (24h format)',
            type: 4, // INTEGER
            required: true,
            min_value: 0,
            max_value: 23
          },
          {
            name: 'minute',
            description: 'Minute of the event',
            type: 4, // INTEGER
            required: true,
            min_value: 0,
            max_value: 59
          }
        ]
      },
      {
        name: 'Update Event',
        type: 3, // MESSAGE context menu command
        default_member_permissions: "8",
        dm_permission: false
      },
      {
        name: 'Event Participants',
        type: 3, // MESSAGE context menu command
        default_member_permissions: "8",
        dm_permission: false
      },
      {
        name: 'logging',
        description: 'Set up logging channel',
        type: 1,
        default_member_permissions: "8",
        dm_permission: false,
        options: [
          {
            name: 'channel',
            description: 'Channel for logs',
            type: 7,
            required: true,
            channel_types: [0]
          }
        ]
      },
      {
        name: 'create_ticket_button',
        description: 'Create a button for incident reporting',
        type: 1,
        default_member_permissions: "8",
        dm_permission: false
      },
      {
        name: 'setup_roles',
        description: 'Set up Race Control and Participant roles',
        type: 1,
        default_member_permissions: "8",
        dm_permission: false,
        options: [
          {
            name: 'race_control',
            description: 'Role for Race Control members',
            type: 8,
            required: true
          },
          {
            name: 'participant',
            description: 'Role for Event Participants',
            type: 8,
            required: true
          }
        ]
      },
      {
        name: 'profile',
        description: 'View your event profile',
        type: 1,
        dm_permission: false
      },
      {
        name: 'edit_event',
        description: 'Edit existing event',
        type: 1,
        default_member_permissions: "8",
        dm_permission: false,
        options: [
          {
            name: 'message_id',
            description: 'ID of the event message',
            type: 3, // STRING
            required: true
          },
          {
            name: 'title',
            description: 'New title of the event',
            type: 3,
            required: false
          },
          {
            name: 'max_participants',
            description: 'New maximum participants limit',
            type: 4, // INTEGER
            required: false,
            min_value: 1
          }
        ]
      },
      {
        name: 'delete_event',
        description: 'Delete an event',
        type: 1,
        default_member_permissions: "8",
        dm_permission: false,
        options: [
          {
            name: 'message_id',
            description: 'ID of the event message',
            type: 3,
            required: true
          }
        ]
      },
      {
        name: 'add_results',
        description: 'Add race results',
        type: 1,
        default_member_permissions: "8",
        dm_permission: false,
        options: [
          {
            name: 'message_id',
            description: 'ID of the event message',
            type: 3,
            required: true
          }
        ]
      },
      {
        name: 'events',
        description: 'Show all server events',
        type: 1,
        dm_permission: false,
        options: [
          {
            name: 'filter',
            description: 'Filter events',
            type: 3, // STRING
            required: false,
            choices: [
              {
                name: 'All',
                value: 'all'
              },
              {
                name: 'Active',
                value: 'active'
              },
              {
                name: 'Completed',
                value: 'completed'
              }
            ]
          }
        ]
      },
      {
        name: 'preview',
        description: 'Preview event by ID',
        type: 1,
        dm_permission: false,
        options: [
          {
            name: 'event_id',
            description: 'Event ID (e.g. FH5-123456)',
            type: 3, // STRING
            required: true
          }
        ]
      },
      {
        name: 'publish',
        description: 'Publish event to channel',
        type: 1,
        default_member_permissions: "8",
        dm_permission: false,
        options: [
          {
            name: 'event_id',
            description: 'Event ID (e.g. FRS-20240317-X1Y2)',
            type: 3, // STRING
            required: true
          },
          {
            name: 'channel',
            description: 'Channel to publish event',
            type: 7, // CHANNEL
            required: true,
            channel_types: [0] // TEXT channels only
          }
        ]
      }
    ];

    // Проверяем изменения
    const differences = compareCommands(existingCommands, commands);
    if (Object.values(differences).some(arr => arr.length > 0)) {
      spinner.info('Command changes detected:');
      if (differences.added.length) spinner.info(`Added: ${differences.added.join(', ')}`);
      if (differences.modified.length) spinner.info(`Modified: ${differences.modified.join(', ')}`);
      if (differences.removed.length) spinner.info(`Removed: ${differences.removed.join(', ')}`);

      try {
        const registeredCommands = await registerCommandsWithRetry(rest, commands, spinner);
        Object.assign(commandIds, registeredCommands.reduce((acc, cmd) => {
          acc[cmd.name] = cmd.id;
          return acc;
        }, {}));
      } catch (error) {
        spinner.warn('Registration failed, using existing commands...');
        Object.assign(commandIds, existingCommands.reduce((acc, cmd) => {
          acc[cmd.name] = cmd.id;
          return acc;
        }, {}));
      }
    } else {
      spinner.info('No command changes detected');
      // Используем существующие ID
      Object.assign(commandIds, existingCommands.reduce((acc, cmd) => {
        acc[cmd.name] = cmd.id;
        return acc;
      }, {}));
    }

    spinner.succeed('Command IDs saved');

  } catch (error) {
    spinner.fail('Failed to initialize commands');
    console.error('Error:', error);
    // В случае ошибки пытаемся использовать существующие команды
    try {
      const existingCommands = await rest.get(Routes.applicationCommands(process.env.APP_ID));
      Object.assign(commandIds, existingCommands.reduce((acc, cmd) => {
        acc[cmd.name] = cmd.id;
        return acc;
      }, {}));
      spinner.succeed('Using existing command IDs');
    } catch (fallbackError) {
      spinner.fail('Failed to get existing commands');
      console.error('Fallback error:', fallbackError);
    }
  } finally {
    spinner.stop();
  }
}

function compareCommands(existing, new_commands) {
  const differences = {
    added: [],
    removed: [],
    modified: []
  };

  // Проверяем новые/измененные команды
  new_commands.forEach(newCmd => {
    const existingCmd = existing.find(e => e.name === newCmd.name);
    if (!existingCmd) {
      differences.added.push(newCmd.name);
    } else if (hasCommandChanged(existingCmd, newCmd)) {
      differences.modified.push(newCmd.name);
    }
  });

  // Проверяем удаленные команды
  existing.forEach(existingCmd => {
    if (!new_commands.find(n => n.name === existingCmd.name)) {
      differences.removed.push(existingCmd.name);
    }
  });

  return differences;
}

function hasCommandChanged(existing, newCmd) {
  // Сравниваем только критически важные свойства
  const relevantProps = [
    'name',
    'description',
    'type'
  ];

  // Проверяем базовые свойства
  for (const prop of relevantProps) {
    const existingValue = existing[prop] || '';
    const newValue = newCmd[prop] || '';
    
    if (existingValue !== newValue) {
      return true;
    }
  }

  // Проверяем опции, только если они действительно изменились
  if (existing.options || newCmd.options) {
    const existingOpts = existing.options || [];
    const newOpts = newCmd.options || [];

    if (existingOpts.length !== newOpts.length) {
      return true;
    }

    // Сравниваем только основные свойства опций
    return existingOpts.some((existingOpt, index) => {
      const newOpt = newOpts[index];
      return (
        existingOpt.name !== newOpt.name ||
        existingOpt.description !== newOpt.description ||
        existingOpt.type !== newOpt.type ||
        existingOpt.required !== newOpt.required
      );
    });
  }

  return false;
}

// Вспомогательная функция для сравнения массивов
function areArraysEqual(arr1, arr2) {
  if (arr1 === arr2) return true;
  if (arr1 == null && arr2 == null) return true;
  if (arr1 == null || arr2 == null) return false;
  if (arr1.length !== arr2.length) return false;

  return JSON.stringify(arr1) === JSON.stringify(arr2);
}

async function registerCommandsWithRetry(rest, commands, spinner, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      spinner.start(`Registering commands (attempt ${attempt}/${maxAttempts})...`);
      
      const registrationPromise = rest.put(
        Routes.applicationCommands(process.env.APP_ID),
        { body: commands }
      );

      const result = await Promise.race([
        registrationPromise,
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Registration timeout')), 10000);
        })
      ]);

      spinner.succeed('Commands registered successfully');
      return result;
    } catch (error) {
      if (error.message === 'Registration timeout') {
        spinner.warn(`Registration attempt ${attempt} timed out, retrying...`);
        continue;
      }
      if (attempt === maxAttempts) {
        throw error;
      }
      spinner.warn(`Registration attempt ${attempt} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Пауза перед следующей попыткой
    }
  }
  throw new Error('Failed to register commands after all attempts');
}
