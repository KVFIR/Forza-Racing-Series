import dotenv from 'dotenv';
dotenv.config();
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';

async function cleanupCommands() {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  
  try {
    console.log('Starting command registration...');
    console.log('APP_ID:', process.env.APP_ID); // Скроем часть ID для безопасности
    
    // Получаем существующие команды
    console.log('Getting existing commands...');
    const existingCommands = await rest.get(
      Routes.applicationCommands(process.env.APP_ID)
    );
    console.log('Existing commands:', existingCommands.map(cmd => cmd.name));
    
    // Находим Entry Point команду и сохраняем все её свойства
    const entryPointCommand = existingCommands.find(cmd => cmd.name === 'launch');
    
    if (!entryPointCommand) {
      console.error('Entry Point command not found!');
      return;
    }

    // Сохраняем точную копию Entry Point команды
    const entryPoint = {
      id: entryPointCommand.id,
      application_id: entryPointCommand.application_id,
      name: entryPointCommand.name,
      description: entryPointCommand.description,
      version: entryPointCommand.version,
      type: entryPointCommand.type,
      options: entryPointCommand.options || [],
      default_member_permissions: entryPointCommand.default_member_permissions,
      dm_permission: entryPointCommand.dm_permission,
      contexts: entryPointCommand.contexts,
      integration_types: entryPointCommand.integration_types,
    };
    
    // Создаем новый список команд
    const commands = [
      entryPoint, // Используем точную копию
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
            type: 8, // ROLE type
            required: true
          }
        ]
      }
    ];
    
    console.log('Updating commands with Entry Point:', entryPoint);
    
    console.log('Updating commands...');
    await rest.put(
      Routes.applicationCommands(process.env.APP_ID),
      { body: commands }
    );
    
    console.log('Successfully updated application commands!');
    
  } catch (error) {
    console.error('Error updating commands:', error);
    throw error;
  }
}

cleanupCommands().catch(console.error);

export { cleanupCommands };
