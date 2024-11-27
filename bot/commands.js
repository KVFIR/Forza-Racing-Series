import dotenv from 'dotenv';
dotenv.config();
import { getRPSChoices } from './game.js';
import { capitalize, InstallGlobalCommands } from './utils.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';

// Get the game choices from game.js
function createCommandChoices() {
  const choices = getRPSChoices();
  const commandChoices = [];

  for (let choice of choices) {
    commandChoices.push({
      name: capitalize(choice),
      value: choice.toLowerCase(),
    });
  }

  return commandChoices;
}

// Entry Point command
const ENTRY_POINT_COMMAND = {
  name: 'launch',
  description: 'Main entry point command',
  type: 1, // CHAT_INPUT
};

// Simple test command
const TEST_COMMAND = {
  name: 'test',
  description: 'Basic command',
  type: 1, // CHAT_INPUT
};

// Command containing options
const CHALLENGE_COMMAND = {
  name: 'challenge',
  description: 'Challenge to a match of rock paper scissors',
  type: 1, // CHAT_INPUT
  options: [
    {
      type: 3, // STRING
      name: 'object',
      description: 'Pick your object',
      required: true,
      choices: createCommandChoices(),
    },
  ],
};

// New command to check user's score
const SCORE_COMMAND = {
  name: 'score',
  description: 'Check your current score',
  type: 1, // CHAT_INPUT
};

// New command to add to user's score
const ADD_SCORE_COMMAND = {
  name: 'add_score',
  description: 'Increase your score by 1',
  type: 1, // CHAT_INPUT
};

const CREATE_RACE_COMMAND = {
  name: 'create_race',
  description: 'Start the process of creating a new race',
  type: 1, // CHAT_INPUT
};

async function updateCommands() {
  try {
    // Создаем REST клиент
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    
    // Получаем существующие команды
    const existingCommands = await rest.get(
      Routes.applicationCommands(process.env.APP_ID)
    );
    
    // Выведем список существующих команд для отладки
    console.log('Existing commands:', existingCommands.map(cmd => ({
      name: cmd.name,
      id: cmd.id
    })));
    
    // Находим Entry Point команду
    const entryPointCommand = existingCommands.find(cmd => cmd.name === 'launch');
    
    if (!entryPointCommand) {
      console.error('No commands found!');
      return;
    }
    
    // Создаем массив команд, начиная с Entry Point
    const commands = [
      {
        name: entryPointCommand.name,
        description: entryPointCommand.description,
        type: entryPointCommand.type,
        ...entryPointCommand
      },
      TEST_COMMAND,
      CHALLENGE_COMMAND,
      SCORE_COMMAND,
      ADD_SCORE_COMMAND,
      CREATE_RACE_COMMAND
    ];
    
    await InstallGlobalCommands(process.env.APP_ID, commands);
    console.log('Successfully registered commands');
    
  } catch (error) {
    console.error('Error updating commands:', error);
  }
}

updateCommands();
