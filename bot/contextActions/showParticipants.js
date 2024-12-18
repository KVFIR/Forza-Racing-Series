import { InteractionResponseType } from 'discord-interactions';
import { eventService } from '../services/eventService.js';

export async function handleEventParticipants(req, res) {
  try {
    // 1. Сразу отправляем "думающий" статус
    await res.send({
      type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        flags: 64 // Эфемерное сообщение
      }
    });

    const { guild_id } = req.body;
    const targetMessage = req.body.data.resolved.messages[Object.keys(req.body.data.resolved.messages)[0]];
    const { id: messageId, channel_id } = targetMessage;

    // 2. Получаем данные события
    const event = await eventService.findEvent(messageId, channel_id);
    if (!event) {
      return updateResponse(req, "⚠️ Event not found. Please check the message ID.");
    }

    const { eventData } = event;
    const participants = eventData.participants || [];

    if (participants.length === 0) {
      return updateResponse(req, "No participants registered for this event yet.");
    }

    // 3. Формируем сообщение
    let message = `**📋 Participants List - ${eventData.title}**\n`;
    message += `Total: ${participants.length}/${eventData.max_participants}\n\n`;

    // 4. Добавляем участников блоками
    const participantsChunks = [];
    for (let i = 0; i < participants.length; i += 10) {
      const chunk = participants.slice(i, i + 10);
      let chunkText = '';
      chunk.forEach((p, index) => {
        const twitchInfo = p.twitch_username ? `[${p.twitch_username}](<https://twitch.tv/${p.twitch_username}>)` : 'N/A';
        chunkText += `${i + index + 1}. ${p.username}\n`;
        chunkText += `> Xbox: ${p.xbox_nickname}\n`;
        chunkText += `> Twitch: ${twitchInfo}\n`;
        chunkText += `> Car: ${p.car_choice}\n`;
      });
      participantsChunks.push(chunkText);
    }

    // 5. Отправляем обновленный ответ
    return updateResponse(req, message + participantsChunks.join('\n'));

  } catch (error) {
    console.error('Error in handleEventParticipants:', error);
    return updateResponse(req, "⚠️ Failed to get participants list. Please try again later.");
  }
}

async function updateResponse(req, content) {
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
    console.error('Error updating response:', error);
  }
} 