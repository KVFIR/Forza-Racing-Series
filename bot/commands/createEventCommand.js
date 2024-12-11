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
          flags: 64
        }
      });
    }

    const eventData = {
      title: 'HEAVY is the CROWN',
      max_participants: 48,
      role_id: participantRoleId
    };

    // Пробуем отправить сообщение
    console.log('Attempting to send message to channel:', channel_id);
    const messageResponse = await fetch(`https://discord.com/api/v10/channels/${channel_id}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        embeds: [createEventEmbed(eventData)],
        components: [createEventButtons()]
      })
    });

    if (!messageResponse.ok) {
      const errorText = await messageResponse.text();
      console.error('Failed to send message:', {
        status: messageResponse.status,
        statusText: messageResponse.statusText,
        error: errorText
      });
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: "⚠️ Cannot send messages to this channel. Please check bot permissions or use a different channel type.",
          flags: 64
        }
      });
    }

    const message = await messageResponse.json();
    console.log('Message sent successfully:', message.id);

    // Если сообщение успешно отправлено, создаем событие
    const { eventKey } = await eventService.createEvent(guild_id, channel_id, id, eventData);
    await eventService.updateMessageIds(eventKey, message.id);
    await logService.logEventCreated(guild_id, eventData);

    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "✅ Event created successfully!",
        flags: 64
      }
    });

  } catch (error) {
    console.error('Error in handleCreateEvent:', error);
    await logService.logError(guild_id, 'handleCreateEvent', error);
    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "⚠️ Failed to create event. Please try again later.",
        flags: 64
      }
    });
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

    // Сначала отправляем ответ пользователю
    res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `✅ Successfully registered for ${eventData.title}!
Your XBOX Gamertag: ${participant.xbox_nickname}
Your Car: ${participant.car_choice}`,
        flags: 64
      }
    });

    // Затем вы��олняем все остальные операции
    try {
      console.log('Starting registration process for user:', userId);

      // Добавляем участника и получаем обновленные данные
      const { eventData: updatedEventData } = await eventService.addParticipant(eventKey, participant);
      console.log('Participant added to event');

      await eventService.updateMessageIds(eventKey, messageId);
      console.log('Message IDs updated');

      // Добавляем роль
      try {
        await roleService.addRoleToUser(guild_id, userId, updatedEventData.role_id);
        console.log('Role added to user');
      } catch (error) {
        console.error('Error adding role:', error);
      }

      // Отправляем лог
      try {
        await logService.logRegistration(guild_id, updatedEventData, participant);
        console.log('Registration logged');
      } catch (error) {
        console.error('Error sending log:', error);
      }

      // Обновляем все сообщения ивента
      console.log('Starting message updates');
      await updateAllEventMessages(channel_id, updatedEventData);
      console.log('All messages updated');

    } catch (error) {
      console.error('Error processing registration:', error);
      await logService.logError(guild_id, 'handleModalSubmit', error);
    }

  } catch (error) {
    console.error('Error in handleModalSubmit:', error);
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

    // Сначала отправляем ответ
    res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `✅ Your registration for ${eventData.title} has been cancelled.`,
        flags: 64
      }
    });

    // Затем выполняем все остальные операции
    try {
      // Удаляем участника и получаем обновленные данные
      const { eventData: updatedEventData } = await eventService.removeParticipant(eventKey, userId);

      // Удаляем роль
      try {
        await roleService.removeRoleFromUser(guild_id, userId, updatedEventData.role_id);
      } catch (error) {
        console.error('Error removing role:', error);
      }

      // Отправляем лог
      await logService.logRegistrationCancelled(guild_id, participant, updatedEventData);

      // Обновляем все сообщения ивента
      await updateAllEventMessages(channel_id, updatedEventData);
    } catch (error) {
      console.error('Error processing cancellation:', error);
      await logService.logError(guild_id, 'handleCancelRegistration', error);
    }

  } catch (error) {
    console.error('Error in handleCancelRegistration:', error);
    await logService.logError(guild_id, 'handleCancelRegistration', error);
    return res.send(createErrorResponse(
      'Failed to cancel registration. Please try again later.'
    ));
  }
}

// Функция для обновления всех сообщений ивента
async function updateAllEventMessages(channelId, eventData) {
  console.log('Starting updateAllEventMessages with data:', {
    channelId,
    messageIds: eventData.message_ids,
    participantsCount: eventData.participants?.length || 0
  });

  if (!eventData.message_ids || eventData.message_ids.length === 0) {
    console.log('No message IDs to update');
    return;
  }

  try {
    const embed = createEventEmbed(eventData);
    const buttons = createEventButtons();
    
    console.log('Created embed with data:', {
      title: embed.title,
      participantsField: embed.fields.find(f => f.name.includes('Participants'))
    });

    const updatePromises = eventData.message_ids.map(async messageId => {
      try {
        console.log(`Updating message ${messageId}`);

        // Создаем веб-хук для канала
        const createWebhook = await fetch(`https://discord.com/api/v10/channels/${channelId}/webhooks`, {
          method: 'POST',
          headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: 'Event Update'
          })
        });

        if (!createWebhook.ok) {
          console.error('Failed to create webhook:', await createWebhook.text());
          return false;
        }

        const webhook = await createWebhook.json();
        console.log('Created webhook:', {
          id: webhook.id,
          token: 'hidden'
        });

        try {
          // Обновляем сообщение через веб-хук
          const response = await fetch(`https://discord.com/api/v10/webhooks/${webhook.id}/${webhook.token}/messages/${messageId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              embeds: [embed],
              components: [buttons]
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to update message ${messageId}:`, {
              status: response.status,
              statusText: response.statusText,
              error: errorText
            });
            return false;
          }

          const updatedMessage = await response.json();
          console.log(`Successfully updated message ${messageId}:`, {
            id: updatedMessage.id,
            embeds: updatedMessage.embeds?.length,
            components: updatedMessage.components?.length
          });

          return true;
        } finally {
          // Удаляем веб-хук после использования
          await fetch(`https://discord.com/api/v10/webhooks/${webhook.id}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bot ${process.env.DISCORD_TOKEN}`
            }
          });
          console.log('Webhook deleted');
        }
      } catch (error) {
        console.error(`Error updating message ${messageId}:`, error);
        return false;
      }
    });

    const results = await Promise.all(updatePromises);
    const successCount = results.filter(Boolean).length;
    console.log(`Update complete: ${successCount}/${eventData.message_ids.length} messages updated`);
  } catch (error) {
    console.error('Error in updateAllEventMessages:', error);
  }
}