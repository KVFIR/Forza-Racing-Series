import { 
  InteractionResponseType
} from 'discord-interactions';
import { ref, get } from 'firebase/database';
import { db } from '../firebase.js';
import { createEventEmbed, createEventButtons } from '../utils/embedBuilder.js';
import { eventService } from '../services/eventService.js';

/**
 * Временная команда для повторной публикации существующего ивента
 */
export async function handleRepublishEvent(req, res) {
  const { guild_id, channel_id } = req.body;
  const eventKey = req.body.data.options[0].value; // Получаем eventKey из параметра команды

  try {
    // Получаем данные ивента
    const eventRef = ref(db, `events/${eventKey}`);
    const snapshot = await get(eventRef);
    
    if (!snapshot.exists()) {
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: "⚠️ Event not found with provided ID.",
          flags: 64
        }
      });
    }

    const eventData = snapshot.val();

    // Публикуем сообщение
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
          content: "⚠️ Failed to publish event message.",
          flags: 64
        }
      });
    }

    const message = await messageResponse.json();

    // Обновляем message_ids в ивенте
    await eventService.updateMessageIds(eventKey, message.id);

    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `✅ Event republished successfully!\nEvent ID: ${eventKey}\nMessage ID: ${message.id}`,
        flags: 64
      }
    });

  } catch (error) {
    console.error('Error in handleRepublishEvent:', error);
    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "⚠️ An error occurred while republishing the event.",
        flags: 64
      }
    });
  }
} 