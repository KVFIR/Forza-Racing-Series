import { InteractionResponseType } from 'discord-interactions';
import { ref, set, get } from 'firebase/database';
import { db } from '../firebase.js';

export async function handleLogging(req, res) {
  const { guild_id, data } = req.body;
  const channelId = data.options[0].value;

  try {
    // Сохраняем канал для логов в Firebase
    const loggingRef = ref(db, `logging/${guild_id}`);
    await set(loggingRef, {
      channelId,
      updatedAt: Date.now()
    });

    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `Logging channel set to <#${channelId}>`,
        flags: 64 // Эфемерное сообщение
      }
    });
  } catch (error) {
    console.error('Error setting logging channel:', error);
    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: 'Failed to set logging channel.',
        flags: 64
      }
    });
  }
}

// Функция для отправки лога
export async function sendLog(guildId, content) {
  try {
    // Получаем ID канала для логов
    const loggingRef = ref(db, `logging/${guildId}`);
    const snapshot = await get(loggingRef);
    
    if (!snapshot.exists()) {
      return;
    }

    const { channelId } = snapshot.val();

    // Отправляем сообщение в канал
    await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content,
        allowed_mentions: { parse: [] }
      })
    });
  } catch (error) {
    console.error('Error sending log:', error);
  }
}