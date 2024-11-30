import { 
  InteractionType,
  InteractionResponseType,
  MessageComponentTypes 
} from 'discord-interactions';
import { createEventEmbed, createEventButtons } from '../utils/embedBuilder.js';
import { ref, set, get } from 'firebase/database';
import { db } from '../firebase.js';
import { sendLog } from './loggingCommand.js';

// Создание события
export async function handleCreateEvent(req, res) {
  const { data } = req.body;
  
  if (!data.options) {
    throw new Error('No options provided for create_event command');
  }

  const roleId = data.options.find(opt => opt.name === 'role')?.value;
  console.log('Creating event with role:', roleId);
  
  if (!roleId) {
    throw new Error('Role ID is required');
  }

  const eventData = {
    title: 'HEAVY is the CROWN',
    max_participants: 48,
    role_id: roleId
  };

  try {
    const eventKey = Date.now();
    const eventRef = ref(db, `events/${eventKey}`);

    await set(eventRef, {
      ...eventData,
      created_at: Date.now(),
      participants: [],
      channel_id: req.body.channel_id,
      interaction_id: req.body.id,
      message_ids: []
    });

    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [createEventEmbed(eventData)],
        components: [createEventButtons()]
      }
    });
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
}

// Функция создания модального окна для регистрации
function createRegistrationModal(customId) {
  return {
    type: 9, // MODAL type
    data: {
      title: "Event Registration",
      custom_id: `register_modal_${customId}`,
      components: [
        {
          type: 1, // ACTION_ROW
          components: [
            {
              type: 4, // TEXT_INPUT
              custom_id: "xbox_nickname",
              label: "XBOX Nickname",
              style: 1, // SHORT style
              min_length: 1,
              max_length: 50,
              required: true,
              placeholder: "Enter your XBOX nickname"
            }
          ]
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: "twitch_username",
              label: "Twitch Username (optional)",
              style: 1,
              min_length: 1,
              max_length: 50,
              required: false,
              placeholder: "Enter your Twitch username (optional)"
            }
          ]
        },
        {
          type: 1,
          components: [
            {
              type: 3, // SELECT_MENU
              custom_id: "car_choice",
              placeholder: "Select your car",
              options: [
                {
                  label: "Ford Mustang Shelby GT350R",
                  value: "mustang_gt350r",
                  description: "2016",
                  emoji: "🏎️"
                },
                {
                  label: "Mercedes-AMG GT R",
                  value: "amg_gtr",
                  description: "2017",
                  emoji: "🏎️"
                },
                {
                  label: "Jaguar XKR-S GT",
                  value: "jaguar_xkrs_gt",
                  description: "2015",
                  emoji: "🏎️"
                },
                {
                  label: "Chevrolet Camaro Z/28",
                  value: "camaro_z28",
                  description: "2015",
                  emoji: "🏎️"
                },
                {
                  label: "Porsche Cayman GT4",
                  value: "cayman_gt4",
                  description: "2016",
                  emoji: "🏎️"
                },
                {
                  label: "Aston Martin Vantage GT12",
                  value: "vantage_gt12",
                  description: "2015",
                  emoji: "🏎️"
                }
              ],
              required: true
            }
          ]
        }
      ]
    }
  };
}

// Обновляем обработчик регистрации
export async function handleRegisterEvent(req, res) {
  const { type } = req.body;
  
  console.log('handleRegisterEvent called with type:', type);

  // Если это первичное нажатие на кнопку - показываем модальное окно
  if (type === InteractionType.MESSAGE_COMPONENT) {
    console.log('Showing modal window');
    const customId = req.body.message.id;
    return res.send(createRegistrationModal(customId));
  }

  // Если это отправка формы - обрабатываем данные
  if (type === InteractionType.MODAL_SUBMIT) {
    const userId = req.body.member.user.id;
    const username = req.body.member.user.username;
    const xboxNickname = req.body.data.components[0].components[0].value;
    const twitchUsername = req.body.data.components[1].components[0].value;

    // Получаем правильный messageId из custom_id модального окна
    const messageId = req.body.data.custom_id.replace('register_modal_', '');
    
    // Получаем данные события
    const eventRef = ref(db, `events`);
    const snapshot = await get(eventRef);
    
    if (!snapshot.exists()) {
      console.log('No events found in database');
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: 'Event not found.',
          flags: 64
        }
      });
    }

    // Ищем событие
    const event = await findEvent(snapshot, messageId, req.body.channel_id);
    if (!event) {
      console.log('Event not found for message:', messageId);
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: 'Event not found.',
          flags: 64
        }
      });
    }

    const { eventData, eventKey } = event;

    // Добавляем участника
    const participants = eventData.participants || [];
    participants.push({
      id: userId,
      username: username,
      xbox_nickname: xboxNickname,
      twitch_username: twitchUsername || null,
      registered_at: Date.now()
    });

    // Добавляем роль
    await addRoleToUser(req.body.guild_id, userId, eventData.role_id);

    // Обновляем данные в Firebase
    await updateEvent(eventKey, eventData, participants, messageId);

    // Отправляем обновленное сообщение
    await sendLog(req.body.guild_id, 
      `📝 **New Registration**
User: ${username} (<@${userId}>)
Xbox: ${xboxNickname}
Twitch: ${twitchUsername ? `[${twitchUsername}](https://www.twitch.tv/${twitchUsername})` : 'Not provided'}
Event: ${eventData.title}`
    );

    return res.send({
      type: InteractionResponseType.UPDATE_MESSAGE,
      data: {
        embeds: [createEventEmbed({ ...eventData, participants })],
        components: [createEventButtons()]
      }
    });
  }
}

// Отмена регистрации
export async function handleCancelRegistration(req, res) {
  const userId = req.body.member.user.id;
  const messageId = req.body.message.id;

  try {
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

    const event = await findEvent(snapshot, messageId, req.body.channel_id, req.body.message.interaction?.id);
    if (!event) {
      throw new Error('Event not found');
    }

    const { eventData, eventKey } = event;
    const participants = eventData.participants || [];

    // Проверяем, зарегистрирован ли пользователь
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

    // Удаляем роль
    try {
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
        console.error('Error removing role:', {
          status: response.status,
          statusText: response.statusText
        });
      }
    } catch (error) {
      console.error('Error removing role:', error);
    }

    // Обновляем данные в Firebase
    await updateEvent(eventKey, eventData, updatedParticipants, messageId);

    // Отправляем обновленное сообщение
    await sendLog(req.body.guild_id,
      `❌ **Registration Cancelled**
User: ${username} (<@${userId}>)
Event: ${eventData.title}`
    );

    return res.send({
      type: InteractionResponseType.UPDATE_MESSAGE,
      data: {
        embeds: [createEventEmbed({ ...eventData, participants: updatedParticipants })],
        components: [createEventButtons()]
      }
    });

  } catch (error) {
    console.error('Error handling cancellation:', error);
    throw error;
  }
}

// Вспомогательные функции
async function findEvent(snapshot, messageId, channelId, interactionId) {
  let eventFound = false;
  let eventData = null;
  let eventKey = null;

  snapshot.forEach((childSnapshot) => {
    const event = childSnapshot.val();
    if (
      (event.message_ids && event.message_ids.includes(messageId)) || 
      (event.channel_id === channelId && 
       Math.abs(parseInt(childSnapshot.key) - Date.now()) < 30000) ||
      event.interaction_id === interactionId ||
      (event.channel_id === channelId && 
       event.created_at === Math.max(...Object.values(snapshot.val()).map(e => e.created_at)))
    ) {
      eventFound = true;
      eventData = event;
      eventKey = childSnapshot.key;
      return true;
    }
  });

  return eventFound ? { eventData, eventKey } : null;
}

async function addRoleToUser(guildId, userId, roleId) {
  try {
    console.log('Adding role to user:', { guild_id: guildId, user_id: userId, role_id: roleId });

    const response = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${userId}/roles/${roleId}`,
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
    throw error;
  }
}

async function updateEvent(eventKey, eventData, participants, messageId) {
  await set(ref(db, `events/${eventKey}`), {
    ...eventData,
    participants,
    message_ids: [...(eventData.message_ids || []), messageId].filter((id, index, self) => 
      self.indexOf(id) === index
    )
  });
}