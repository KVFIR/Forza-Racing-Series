import { InteractionResponseType } from 'discord-interactions';
import { eventService } from '../services/eventService.js';

export async function handleEventParticipants(req, res) {
  // Сразу отправляем начальный ответ
  res.send({
    type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      flags: 64 // Эфемерное сообщение
    }
  });

  const { guild_id } = req.body;
  const targetMessage = req.body.data.resolved.messages[Object.keys(req.body.data.resolved.messages)[0]];
  const { id: messageId, channel_id } = targetMessage;

  try {
    // Находим событие
    const event = await eventService.findEvent(messageId, channel_id);
    if (!event) {
      return sendFollowUp(req, "⚠️ Event not found. Please check the message ID.");
    }

    const { eventData } = event;
    const participants = eventData.participants || [];

    if (participants.length === 0) {
      return sendFollowUp(req, "No participants registered for this event yet.");
    }

    // Формируем сообщение
    let message = `**📋 Participants List - ${eventData.title}**\n`;
    message += `Total: ${participants.length}/${eventData.max_participants}\n\n`;

    participants.forEach((p, index) => {
      const twitchInfo = p.twitch_username ? `[${p.twitch_username}](<https://twitch.tv/${p.twitch_username}>)` : 'N/A';
      message += `${index + 1}. ${p.username}\n`;
      message += `> Xbox: ${p.xbox_nickname}\n`;
      message += `> Twitch: ${twitchInfo}\n`;
      message += `> Car: ${p.car_choice}\n`;
    });

    return sendFollowUp(req, message);

  } catch (error) {
    console.error('Error in handleEventParticipants:', error);
    return sendFollowUp(req, "⚠️ Failed to get participants list. Please try again later.");
  }
}

// Функция для отправки отложенного ответа
async function sendFollowUp(req, content) {
  try {
    await fetch(`https://discord.com/api/v10/webhooks/${process.env.APP_ID}/${req.body.token}/messages/@original`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content,
        flags: 64
      })
    });
  } catch (error) {
    console.error('Error sending follow-up:', error);
  }
} 