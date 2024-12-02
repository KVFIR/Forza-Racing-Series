import dotenv from 'dotenv';
dotenv.config();
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';

async function cleanupCommands() {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  
  try {
    console.log('Starting command registration...');
    
    if (!process.env.APP_ID) {
      throw new Error('APP_ID not found in environment variables');
    }
    
    console.log('Getting existing commands...');
    const existingCommands = await rest.get(
      Routes.applicationCommands(process.env.APP_ID)
    ).catch(error => {
      console.error('Error getting existing commands:', error);
      throw error;
    });
    
    console.log('Found existing commands:', existingCommands.map(cmd => cmd.name));
    
    // Находим Entry Point команду
    const entryPointCommand = existingCommands.find(cmd => cmd.name === 'launch');
    console.log('Entry Point command found:', entryPointCommand ? 'yes' : 'no');
    
    if (!entryPointCommand) {
      console.error('Entry Point command not found!');
      return;
    }

    // Создаем новый список команд
    const commands = [
      entryPointCommand,
      {
        name: 'test',
        description: 'Basic command',
        type: 1,
        default_member_permissions: "8"
      },
      {
        name: 'create_event',
        description: 'Create a new event announcement',
        type: 1,
        default_member_permissions: "8",
        options: [
          {
            name: 'role',
            description: 'Role to assign to participants',
            type: 8,
            required: true
          }
        ]
      },
      {
        name: 'logging',
        description: 'Set logging channel for registration events',
        type: 1,
        default_member_permissions: "8",
        options: [
          {
            name: 'channel',
            description: 'Text channel for logging',
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
        default_member_permissions: "8"
      },
      {
        name: 'setup_roles',
        description: 'Set up Race Control and Participant roles',
        type: 1,
        default_member_permissions: "8",
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
      }
    ];

    console.log('Preparing to update commands...');
    console.log('Total commands to register:', commands.length);

    // Добавляем таймаут
    const updateProm = rest.put(
      Routes.applicationCommands(process.env.APP_ID),
      { body: commands }
    ).catch(error => {
      console.error('Error updating commands:', error);
      throw error;
    });

    await updateProm;

    console.log('Successfully updated application commands!');
    
  } catch (error) {
    console.error('Error updating commands:', error);
    throw error;
  }
}

cleanupCommands().catch(console.error);

export { cleanupCommands };
