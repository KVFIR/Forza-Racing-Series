import { InteractionResponseType } from 'discord-interactions';
import { createEventEmbed, createEventButtons } from '../utils/embedBuilder.js';
import { eventService } from '../services/eventService.js';
import { logService } from '../services/logService.js';

export async function handleRecreateEvent(req, res) {
  const { guild_id, channel_id } = req.body;
  const messageId = req.body.data.options.find(opt => opt.name === 'message_id')?.value;

  try {
    console.log('Handling recreate event command:', {
      guildId: guild_id,
      channelId: channel_id,
      messageId
    });

    // Находим существующее событие
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
    console.log('Found event:', {
      title: eventData.title,
      participantsCount: eventData.participants?.length || 0
    });

    // Создаем новое сообщение
    try {
      // Проверяем права бота в канале
      const channelResponse = await fetch(`https://discord.com/api/v10/channels/${channel_id}`, {
        headers: {
          Authorization: `Bot ${process.env.DISCORD_TOKEN}`
        }
      });
      
      if (!channelResponse.ok) {
        console.error('Failed to get channel info:', await channelResponse.text());
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: "⚠️ Failed to check channel permissions. Please try again later.",
            flags: 64
          }
        });
      }

      const channel = await channelResponse.json();
      console.log('Channel info:', {
        id: channel.id,
        name: channel.name,
        permissions: channel.permission_overwrites
      });

      const embed = createEventEmbed(eventData);
      const buttons = createEventButtons();

      const response = await fetch(`https://discord.com/api/v10/channels/${channel_id}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          embeds: [embed],
          components: [buttons]
        })
      });

      if (!response.ok) {
        console.error('Failed to create message:', {
          status: response.status,
          statusText: response.statusText,
          error: await response.text()
        });
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: "⚠️ Failed to create event announcement. Please check bot permissions.",
            flags: 64
          }
        });
      }

      const newMessage = await response.json();
      console.log('New message created:', {
        id: newMessage.id,
        channelId: newMessage.channel_id
      });

      // Обновляем message_ids в событии
      eventData.message_ids = [...(eventData.message_ids || []), newMessage.id];
      await eventService.updateEvent(messageId, eventData);

      // Отправляем лог
      await logService.logEventUpdated(guild_id, eventData);

      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: "✅ New event announcement has been created!",
          flags: 64
        }
      });

    } catch (error) {
      console.error('Error creating message:', error);
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: "⚠️ Failed to create event. Please try again later.",
          flags: 64
        }
      });
    }

  } catch (error) {
    console.error('Error in handleRecreateEvent:', error);
    await logService.logError(guild_id, 'handleRecreateEvent', error);
    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "⚠️ Failed to create event. Please try again later.",
        flags: 64
      }
    });
  }
} 