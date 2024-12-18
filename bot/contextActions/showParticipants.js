import { InteractionResponseType } from 'discord-interactions';
import { eventService } from '../services/eventService.js';

export async function handleEventParticipants(req, res) {
  try {
    // 1. Сразу отправляем первое сообщение
    await res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "🔄 Loading participants list...",
        flags: 64
      }
    });

    const { guild_id } = req.body;
    const targetMessage = req.body.data.resolved.messages[Object.keys(req.body.data.resolved.messages)[0]];
    const { id: messageId, channel_id } = targetMessage;

    // 2. Получаем данные события
    const event = await eventService.findEvent(messageId, channel_id);
    if (!event) {
      return updateMessage(req, "⚠️ Event not found. Please check the message ID.");
    }

    const { eventData } = event;
    const participants = eventData.participants || [];

    if (participants.length === 0) {
      return updateMessage(req, "No participants registered for this event yet.");
    }

    // 3. Формируем заголовок
    const header = `**📋 Participants List - ${eventData.title}**\n` +
                  `Total: ${participants.length}/${eventData.max_participants}\n\n`;

    // 4. Разбиваем участников на группы по 5 человек
    const CHUNK_SIZE = 5;
    const messages = [];
    
    for (let i = 0; i < participants.length; i += CHUNK_SIZE) {
      const chunk = participants.slice(i, i + CHUNK_SIZE);
      let messageContent = i === 0 ? header : ''; // Добавляем заголовок только к первому сообщению
      
      chunk.forEach((p, index) => {
        const twitchInfo = p.twitch_username ? `[${p.twitch_username}](<https://twitch.tv/${p.twitch_username}>)` : 'N/A';
        messageContent += `${i + index + 1}. <@${p.id}>\n`;
        messageContent += `> Xbox: ${p.xbox_nickname}\n`;
        messageContent += `> Twitch: ${twitchInfo}\n`;
        messageContent += `> Car: ${p.car_choice}\n`;
      });
      
      messages.push(messageContent);
    }

    // 5. Отправляем сообщения последовательно
    for (let i = 0; i < messages.length; i++) {
      if (i === 0) {
        await updateMessage(req, messages[i]);
      } else {
        await sendFollowUp(req, messages[i]);
      }
      // Небольшая задержка между сообщениями
      if (i < messages.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

  } catch (error) {
    console.error('Error in handleEventParticipants:', error);
    return updateMessage(req, "⚠️ Failed to get participants list. Please try again later.");
  }
}

// Обновляем первое сообщение
async function updateMessage(req, content) {
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
    console.error('Error updating message:', error);
  }
}

// Отправляем дополнительные сообщения
async function sendFollowUp(req, content) {
  try {
    await fetch(`https://discord.com/api/v10/webhooks/${process.env.APP_ID}/${req.body.token}`, {
      method: 'POST',
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