import dotenv from 'dotenv';
dotenv.config();
import { getRPSChoices } from './game.js';
import { capitalize, InstallGlobalCommands } from './utils.js';

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

// Simple test command
const TEST_COMMAND = {
  name: 'test',
  description: 'Basic command',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

// Command containing options
const CHALLENGE_COMMAND = {
  name: 'challenge',
  description: 'Challenge to a match of rock paper scissors',
  options: [
    {
      type: 3,
      name: 'object',
      description: 'Pick your object',
      required: true,
      choices: createCommandChoices(),
    },
  ],
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 2],
};

// New command to check user's score
const SCORE_COMMAND = {
  name: 'score',
  description: 'Check your current score',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

// New command to add to user's score
const ADD_SCORE_COMMAND = {
  name: 'add_score',
  description: 'Increase your score by 1',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

const CREATE_RACE_COMMAND = {
  name: 'create_race',
  description: 'Start the process of creating a new race',
  type: 1,
};

const ALL_COMMANDS = [
  TEST_COMMAND, 
  CHALLENGE_COMMAND, 
  SCORE_COMMAND, 
  ADD_SCORE_COMMAND, 
  CREATE_RACE_COMMAND
];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
