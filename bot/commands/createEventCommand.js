import { InteractionResponseType } from 'discord-interactions';
import { createEventEmbed, createEventButtons } from '../utils/embedBuilder.js';
import { ref, set, get } from 'firebase/database';
import { db } from '../firebase.js';

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

// Регистрация на событие
export async function handleRegisterEvent(req, res) {
  const { custom_id } = req.body.data;
  const userId = req.body.member.user.id;
  const username = req.body.member.user.username;
  const messageId = req.body.message.id;

  try {
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

    const event = await findEvent(snapshot, messageId, req.body.channel_id, req.body.message.interaction?.id);
    if (!event) {
      throw new Error('Event not found');
    }

    const { eventData, eventKey } = event;

    // Проверки
    if (Date.now() / 1000 > eventData.registration_close) {
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: 'Registration is closed for this event.',
          flags: 64
        }
      });
    }

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

    // Добавляем роль
    await addRoleToUser(req.body.guild_id, userId, eventData.role_id);

    // Обновляем данные в Firebase
    await updateEvent(eventKey, eventData, participants, messageId);

    // Отправляем обновленное сообщение
    return res.send({
      type: InteractionResponseType.UPDATE_MESSAGE,
      data: {
        embeds: [createEventEmbed({ ...eventData, participants })],
        components: [createEventButtons()]
      }
    });
  } catch (error) {
    console.error('Error handling registration:', error);
    throw error;
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