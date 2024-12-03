import { 
  InteractionType,
  InteractionResponseType
} from 'discord-interactions';
import { ref, get } from 'firebase/database';
import { db } from '../firebase.js';
import { createEventEmbed, createEventButtons } from '../utils/embedBuilder.js';
import { eventService } from '../services/eventService.js';
import { logService } from '../services/logService.js';
import { roleService } from '../services/roleService.js';

// Создание события
export async function handleCreateEvent(req, res) {
  const { guild_id, channel_id, id } = req.body;

  try {
    // Проверяем, настроена ли роль участника
    const rolesRef = ref(db, `guild_roles/${guild_id}`);
    const rolesSnapshot = await get(rolesRef);
    const participantRoleId = rolesSnapshot.val()?.participant_role;

    if (!participantRoleId) {
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `⚠️ Participant role is not set up!

Please follow these steps:
1. Use \`/setup_roles\` command
2. Select a role for participants using the \`participant\` option
3. Try creating the event again

Need help? Contact server administrators.`,
          flags: 64 // Эфемерное сообщение
        }
      });
    }

    const eventData = {
      title: 'HEAVY is the CROWN',
      max_participants: 48,
      role_id: participantRoleId
    };

    const { eventKey } = await eventService.createEvent(guild_id, channel_id, id, eventData);

    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [createEventEmbed(eventData)],
        components: [createEventButtons()]
      }
    });
  } catch (error) {
    await logService.logError(guild_id, 'handleCreateEvent', error);
    return res.send(createErrorResponse(
      "Failed to create event. Please try again later or contact administrators."
    ));
  }
}

// Функция создания модального окна для регистрации
function createRegistrationModal(customId) {
  return {
    type: 9,
    data: {
      title: "Event Registration",
      custom_id: `register_modal_${customId}`,
      components: [
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: "xbox_nickname",
              label: "XBOX Gamertag",
              style: 1,
              min_length: 1,
              max_length: 50,
              required: true,
              placeholder: "Enter your XBOX gamertag"
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
              placeholder: "Enter your Twitch username"
            }
          ]
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: "car_choice",
              label: "Your Car",
              style: 1,
              min_length: 1,
              max_length: 100,
              required: true,
              placeholder: "Enter your car choice"
            }
          ]
        }
      ]
    }
  };
}

// Вспомогательные функции
async function checkParticipantRole(guildId) {
  const rolesRef = ref(db, `guild_roles/${guildId}`);
  const rolesSnapshot = await get(rolesRef);
  const participantRoleId = rolesSnapshot.val()?.participant_role;

  if (!participantRoleId) {
    throw new Error('Participant role not found');
  }

  return participantRoleId;
}

function createErrorResponse(message, isEphemeral = true) {
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: message,
      flags: isEphemeral ? 64 : 0
    }
  };
}

// Обработчик нажатия кнопки регистрации
async function handleRegistrationButton(req, res) {
  const { guild_id, member: { user: { id: userId } }, message: { id: messageId }, channel_id } = req.body;

  try {
    // Проверяем роль
    await checkParticipantRole(guild_id);

    // Проверяем событие
    const event = await eventService.findEvent(messageId, channel_id);
    if (!event) {
      return res.send(createErrorResponse('Event not found.'));
    }

    const { eventData } = event;
    if (eventData.participants?.some(p => p.id === userId)) {
      return res.send(createErrorResponse('You are already registered for this event.'));
    }

    return res.send(createRegistrationModal(messageId));
  } catch (error) {
    console.error('Error handling registration button:', error);
    return res.send(createErrorResponse(
      error.message === 'Participant role not found'
        ? `⚠️ Cannot register: participant role is not set up!\n\nPlease contact server administrators to set up roles using \`/setup_roles\` command.`
        : `An error occurred: ${error.message}`
    ));
  }
}

// Обработчик отправки модального окна
async function handleModalSubmit(req, res) {
  const { 
    guild_id,
    member: { user: { id: userId, username } },
    data: { custom_id, components },
    channel_id
  } = req.body;

  try {
    const messageId = custom_id.replace('register_modal_', '');
    const event = await eventService.findEvent(messageId, channel_id);
    
    if (!event) {
      throw new Error('Event not found');
    }

    const { eventKey, eventData } = event;
    const participant = {
      id: userId,
      username,
      xbox_nickname: components[0].components[0].value,
      twitch_username: components[1].components[0].value || null,
      car_choice: components[2].components[0].value
    };

    // Добавляем участника и обновляем сообщение
    const { participants } = await eventService.addParticipant(eventKey, participant);
    await eventService.updateMessageIds(eventKey, messageId);

    // Добавляем роль
    try {
      await roleService.addRoleToUser(guild_id, userId, eventData.role_id);
    } catch (error) {
      console.error('Error adding role:', error);
      // Продолжаем выполнение, даже если не удалось добавить роль
    }

    // Отправляем лог
    try {
      await logService.logEvent(guild_id, 
        `📝 **New Registration**
> User: ${username} (<@${userId}>)
> Xbox: ${participant.xbox_nickname}
> Twitch: ${participant.twitch_username ? `[${participant.twitch_username}](https://www.twitch.tv/${participant.twitch_username})` : 'Not provided'}
> Car: ${participant.car_choice}
> Event: ${eventData.title}`
      );
    } catch (error) {
      console.error('Error sending log:', error);
      // Продолжаем выполнение, даже если не удалось отправить лог
    }

    // Сначала обновляем сообщение с эмбедом
    await fetch(`https://discord.com/api/v10/channels/${channel_id}/messages/${messageId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        embeds: [createEventEmbed({ ...eventData, participants })],
        components: [createEventButtons()]
      })
    });

    // Затем отправляем эфемерное сообщение
    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `✅ Successfully registered for ${eventData.title}!
Your XBOX Gamertag: ${participant.xbox_nickname}
Your Car: ${participant.car_choice}`,
        flags: 64
      }
    });

  } catch (error) {
    await logService.logError(guild_id, 'handleModalSubmit', error);
    return res.send(createErrorResponse(
      error.message === 'Event not found' 
        ? 'Event not found. Please try again.'
        : 'Failed to process registration. Please try again later.'
    ));
  }
}

// Основной обработчик регистрации
export async function handleRegisterEvent(req, res) {
  const { type } = req.body;
  console.log('handleRegisterEvent called with type:', type);

  if (type === InteractionType.MESSAGE_COMPONENT) {
    return handleRegistrationButton(req, res);
  }

  if (type === InteractionType.MODAL_SUBMIT) {
    return handleModalSubmit(req, res);
  }

  return res.send(createErrorResponse('Invalid interaction type.'));
}

// Обработчик отмены регистрации
export async function handleCancelRegistration(req, res) {
  const { guild_id, member: { user: { id: userId } }, message: { id: messageId }, channel_id } = req.body;

  try {
    const event = await eventService.findEvent(messageId, channel_id);
    
    if (!event) {
      return res.send(createErrorResponse('Event not found.'));
    }

    const { eventKey, eventData } = event;

    // Проверяем, зарегистрирован ли пользователь
    const participant = eventData.participants?.find(p => p.id === userId);
    if (!participant) {
      return res.send(createErrorResponse('You are not registered for this event.'));
    }

    // Удаляем участника
    const { participants } = await eventService.removeParticipant(eventKey, userId);

    // Удаляем роль
    try {
      await roleService.removeRoleFromUser(guild_id, userId, eventData.role_id);
    } catch (error) {
      console.error('Error removing role:', error);
      // Продолжаем выполнение, даже если не удалось удалить роль
    }

    // Отправляем лог
    await logService.logEvent(guild_id, 
      `❌ **Registration Cancelled**
> User: ${participant.username} (<@${userId}>)
> Xbox: ${participant.xbox_nickname}
> Event: ${eventData.title}`
    );

    // Сначала обновляем сообщение с эмбедом
    await fetch(`https://discord.com/api/v10/channels/${channel_id}/messages/${messageId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        embeds: [createEventEmbed({ ...eventData, participants })],
        components: [createEventButtons()]
      })
    });

    // Затем отправляем эфемерное сообщение
    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `✅ Your registration for ${eventData.title} has been cancelled.`,
        flags: 64
      }
    });

  } catch (error) {
    await logService.logError(guild_id, 'handleCancelRegistration', error);
    return res.send(createErrorResponse(
      'Failed to cancel registration. Please try again later.'
    ));
  }
}