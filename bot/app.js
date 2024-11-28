import 'dotenv/config';
import express from 'express';
import {
  InteractionType,
  InteractionResponseType,
  verifyKeyMiddleware,
} from 'discord-interactions';
import { getRandomEmoji } from './utils.js';
import { getUser, createUser } from './database.js';
import { db } from './firebase.js';
import { ref, set, get } from 'firebase/database';
import { createRaceModal } from './modals/createRaceModal.js';
import { createEventEmbed, createEventButtons } from './utils/embedBuilder.js';

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

  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

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
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: `Hello ${username}! Bot is working ${getRandomEmoji()}`
            }
          });
        
        case 'challenge':
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: `${username} has started a new challenge! Current score: ${user.score || 0}`
            }
          });
        
        case 'score':
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: `${username}'s current score is: ${user.score || 0} points`
            }
          });
        
        case 'create_race':
          return res.send({
            type: InteractionResponseType.MODAL,
            data: createRaceModal()
          });
        
        case 'create_event':
          if (!data.options) {
            throw new Error('No options provided for create_event command');
          }

          const roleId = data.options.find(opt => opt.name === 'role')?.value;
          console.log('Creating event with role:', roleId);
          
          if (!roleId) {
            throw new Error('Role ID is required');
          }

          const eventData = {
            title: 'Race Event',
            registration_close: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60),
            max_participants: 48,
            role_id: roleId
          };

          try {
            // Создаем временный ключ для события
            const eventKey = Date.now();
            const eventRef = ref(db, `events/${eventKey}`);

            // Сначала сохраняем базовые данные события
            await set(eventRef, {
              ...eventData,
              created_at: Date.now(),
              participants: [],
              channel_id: req.body.channel_id,
              interaction_id: req.body.id,
              message_ids: []
            });

            // Отправляем сообщение
            const response = await res.send({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                embeds: [createEventEmbed(eventData)],
                components: [createEventButtons()]
              }
            });

            // Получаем ID сообщения из ответа
            const messageId = req.body.id;

            // Обновляем событие с ID сообщения
            await set(eventRef, {
              ...eventData,
              created_at: Date.now(),
              participants: [],
              channel_id: req.body.channel_id,
              interaction_id: req.body.id,
              message_ids: [messageId]
            });

            console.log('Event created with data:', {
              eventKey,
              messageId,
              channelId: req.body.channel_id,
              interactionId: req.body.id
            });

            return;
          } catch (error) {
            console.error('Error creating event:', error);
            throw error;
          }
        
        default:
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: `Unknown command "${name}". Available commands: /test, /challenge, /score, /create_race, /create_event`
            }
          });
      }
    } catch (error) {
      console.error('Error processing command:', error);
      errorCount++;
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: 'An error occurred while processing your command.'
        }
      });
    }
  }

  if (type === InteractionType.MESSAGE_COMPONENT) {
    const { custom_id } = data;
    const userId = req.body.member.user.id;
    const username = req.body.member.user.username;
    const messageId = req.body.message.id;

    try {
      switch (custom_id) {
        case 'register_event': {
          console.log('Processing registration. Message data:', {
            message_id: messageId,
            channel_id: req.body.channel_id,
            interaction_id: req.body.id
          });
          
          const eventRef = ref(db, `events`);
          const snapshot = await get(eventRef);
          
          if (!snapshot.exists()) {
            console.log('No events found in database');
            throw new Error('Event not found');
          }

          let eventFound = false;
          let eventData = null;
          let eventKey = null;

          snapshot.forEach((childSnapshot) => {
            const event = childSnapshot.val();
            console.log('Checking event:', {
              key: childSnapshot.key,
              event_message_ids: event.message_ids,
              event_channel_id: event.channel_id,
              looking_for_message: messageId,
              looking_for_channel: req.body.channel_id
            });
            
            if (
              (event.message_ids && event.message_ids.includes(messageId)) || 
              (event.channel_id === req.body.channel_id && 
               Math.abs(parseInt(childSnapshot.key) - Date.now()) < 30000) ||
              event.interaction_id === req.body.message.interaction?.id ||
              (event.channel_id === req.body.channel_id && 
               event.created_at === Math.max(...Object.values(snapshot.val()).map(e => e.created_at)))
            ) {
              eventFound = true;
              eventData = event;
              eventKey = childSnapshot.key;
              return true;
            }
          });

          if (!eventFound) {
            console.log('Event not found for message ID:', messageId);
            throw new Error('Event not found');
          }

          // Проверяем, не закрыта ли регистрация
          if (Date.now() / 1000 > eventData.registration_close) {
            return res.send({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: 'Registration is closed for this event.',
                flags: 64 // Эфемерное сообщение
              }
            });
          }

          // Проверяем, не зарегистрирован ли уже пользователь
          const participants = eventData.participants || [];
          if (participants.some(p => p.id === userId)) {
            return res.send({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: 'You are already registered for this event.',
                flags: 64
              }
            });
          }

          // Проверяем, не превышен ли лимит участников
          if (participants.length >= eventData.max_participants) {
            return res.send({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: 'This event is full.',
                flags: 64
              }
            });
          }

          // Добавляем участника
          participants.push({
            id: userId,
            username: username,
            registered_at: Date.now()
          });

          // Добавляем роль участнику
          try {
            console.log('Adding role to user:', {
              guild_id: req.body.guild_id,
              user_id: userId,
              role_id: eventData.role_id
            });

            const response = await fetch(
              `https://discord.com/api/v10/guilds/${req.body.guild_id}/members/${userId}/roles/${eventData.role_id}`,
              {
                method: 'PUT',
                headers: {
                  Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
                  'Content-Type': 'application/json'
                }
              }
            );

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              console.error('Error response from Discord:', {
                status: response.status,
                statusText: response.statusText,
                error: errorData
              });
              throw new Error(`Failed to add role: ${response.status} ${response.statusText}`);
            }

            console.log('Role added successfully');
          } catch (error) {
            console.error('Error adding role:', error);
          }

          // Обновляем данные в Firebase
          await set(ref(db, `events/${eventKey}`), {
            ...eventData,
            participants,
            message_ids: [...(eventData.message_ids || []), messageId].filter((id, index, self) => 
              self.indexOf(id) === index // Убираем дубликаты
            )
          });

          // Обновляем сообщение с событием
          const updatedEmbed = createEventEmbed({
            ...eventData,
            participants
          });

          return res.send({
            type: InteractionResponseType.UPDATE_MESSAGE,
            data: {
              embeds: [updatedEmbed],
              components: [createEventButtons()]
            }
          });
        }

        case 'cancel_registration': {
          console.log('Processing cancellation. Message data:', {
            message_id: messageId,
            channel_id: req.body.channel_id,
            interaction_id: req.body.id
          });
          
          const eventRef = ref(db, `events`);
          const snapshot = await get(eventRef);
          
          if (!snapshot.exists()) {
            console.log('No events found in database');
            throw new Error('Event not found');
          }

          let eventFound = false;
          let eventData = null;
          let eventKey = null;

          snapshot.forEach((childSnapshot) => {
            const event = childSnapshot.val();
            console.log('Checking event:', {
              key: childSnapshot.key,
              event_message_ids: event.message_ids,
              event_channel_id: event.channel_id,
              looking_for_message: messageId,
              looking_for_channel: req.body.channel_id
            });
            
            if (
              (event.message_ids && event.message_ids.includes(messageId)) || 
              (event.channel_id === req.body.channel_id && 
               Math.abs(parseInt(childSnapshot.key) - Date.now()) < 30000) ||
              event.interaction_id === req.body.message.interaction?.id ||
              (event.channel_id === req.body.channel_id && 
               event.created_at === Math.max(...Object.values(snapshot.val()).map(e => e.created_at)))
            ) {
              eventFound = true;
              eventData = event;
              eventKey = childSnapshot.key;
              return true;
            }
          });

          if (!eventFound) {
            console.log('Event not found for message ID:', messageId);
            throw new Error('Event not found');
          }

          // Проверяем, зарегистрирован ли пользователь
          const participants = eventData.participants || [];
          if (!participants.some(p => p.id === userId)) {
            return res.send({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: 'You are not registered for this event.',
                flags: 64
              }
            });
          }

          // Удаляем участника
          const updatedParticipants = participants.filter(p => p.id !== userId);

          // Удаляем роль у участника
          try {
            console.log('Removing role from user:', {
              guild_id: req.body.guild_id,
              user_id: userId,
              role_id: eventData.role_id
            });

            const response = await fetch(
              `https://discord.com/api/v10/guilds/${req.body.guild_id}/members/${userId}/roles/${eventData.role_id}`,
              {
                method: 'DELETE',
                headers: {
                  Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
                  'Content-Type': 'application/json'
                }
              }
            );

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              console.error('Error response from Discord:', {
                status: response.status,
                statusText: response.statusText,
                error: errorData
              });
              throw new Error(`Failed to remove role: ${response.status} ${response.statusText}`);
            }

            console.log('Role removed successfully');
          } catch (error) {
            console.error('Error removing role:', error);
          }

          // Обновляем данные в Firebase
          await set(ref(db, `events/${eventKey}`), {
            ...eventData,
            participants: updatedParticipants,
            message_ids: [...(eventData.message_ids || []), messageId].filter((id, index, self) => 
              self.indexOf(id) === index // Убираем дубликаты
            )
          });

          // Обновляем сообщение с событием
          const updatedEmbed = createEventEmbed({
            ...eventData,
            participants: updatedParticipants
          });

          return res.send({
            type: InteractionResponseType.UPDATE_MESSAGE,
            data: {
              embeds: [updatedEmbed],
              components: [createEventButtons()]
            }
          });
        }

        default:
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: 'Unknown button interaction',
              flags: 64
            }
          });
      }
    } catch (error) {
      console.error('Error handling button interaction:', error);
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: 'An error occurred while processing your request.',
          flags: 64
        }
      });
    }
  }

  return res.status(400).json({ error: 'Unknown interaction type' });
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
