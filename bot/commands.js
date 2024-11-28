import dotenv from 'dotenv';
dotenv.config();
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';

async function cleanupCommands() {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  
  try {
    console.log('Getting existing commands...');
    
    // Получаем существующие команды
    const existingCommands = await rest.get(
      Routes.applicationCommands(process.env.APP_ID)
    );
    
    // Находим Entry Point команду
    const entryPointCommand = existingCommands.find(cmd => cmd.name === 'launch');
    
    if (!entryPointCommand) {
      console.error('Entry Point command not found!');
      return;
    }
    
    // Создаем новый список команд, начиная с Entry Point
    const commands = [
      {
        name: entryPointCommand.name,
        description: entryPointCommand.description,
        type: entryPointCommand.type,
        ...entryPointCommand
      },
      {
        name: 'test',
        description: 'Basic command',
        type: 1,
      },
      {
        name: 'challenge',
        description: 'Challenge to a match',
        type: 1,
      },
      {
        name: 'score',
        description: 'Check your current score',
        type: 1,
      },
      {
        name: 'create_race',
        description: 'Start the process of creating a new race',
        type: 1,
      },
      {
        name: 'create_event',
        description: 'Create a new event announcement',
        type: 1,
        options: [
          {
            name: 'title',
            description: 'Event title',
            type: 3, // STRING
            required: true
          },
          {
            name: 'registration_close',
            description: 'Registration close date (Unix timestamp)',
            type: 4, // INTEGER
            required: true
          },
          {
            name: 'max_participants',
            description: 'Maximum number of participants',
            type: 4, // INTEGER
            required: true
          }
        ]
      }
    ];
    
    console.log('Updating commands...');
    
    // Обновляем команды
    await rest.put(
      Routes.applicationCommands(process.env.APP_ID),
      { body: commands }
    );
    
    console.log('Successfully updated application commands.');
    
  } catch (error) {
    console.error('Error updating commands:', error);
  }
}

cleanupCommands();
