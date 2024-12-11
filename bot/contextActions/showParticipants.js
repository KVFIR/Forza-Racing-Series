import { InteractionResponseType } from 'discord-interactions';
import { eventService } from '../services/eventService.js';

export async function handleEventParticipants(req, res) {
  const { guild_id } = req.body;
  const targetMessage = req.body.data.resolved.messages[Object.keys(req.body.data.resolved.messages)[0]];
  const { id: messageId, channel_id } = targetMessage;

  try {
    console.log('Handling event participants command:', {
      guildId: guild_id,
      channelId: channel_id,
      messageId
    });

    // Находим событие
    const event = await eventService.findEvent(messageId, channel_id);
    if (!event) {
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: "⚠️ Event not found. Please check the message ID.",
          flags: 64
        }
      });
    }

    const { eventData } = event;
    const participants = eventData.participants || [];

    if (participants.length === 0) {
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: "No participants registered for this event yet.",
          flags: 64
        }
      });
    }

    // Формируем заголовок
    let message = `**📋 Participants List - ${eventData.title}**\n`;
    message += `Total: ${participants.length}/${eventData.max_participants}\n\n`;

    // Группируем участников по выбранным машинам
    const carGroups = {};
    participants.forEach(p => {
      if (!carGroups[p.car_choice]) {
        carGroups[p.car_choice] = [];
      }
      carGroups[p.car_choice].push(p);
    });

    // Формируем список по группам
    for (const [car, drivers] of Object.entries(carGroups)) {
      message += `**${car}** (${drivers.length}):\n`;
      drivers.forEach((p, index) => {
        const twitchInfo = p.twitch_username ? `[${p.twitch_username}](https://twitch.tv/${p.twitch_username})` : 'N/A';
        message += `${index + 1}. <@${p.id}>\n`;
        message += `   • Xbox: ${p.xbox_nickname}\n`;
        message += `   • Twitch: ${twitchInfo}\n`;
      });
      message += '\n';
    }

    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: message,
        flags: 64 // Видно только отправителю команды
      }
    });

  } catch (error) {
    console.error('Error in handleEventParticipants:', error);
    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "⚠️ Failed to get participants list. Please try again later.",
        flags: 64
      }
    });
  }
} 