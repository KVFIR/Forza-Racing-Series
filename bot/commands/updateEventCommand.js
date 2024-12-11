import { InteractionResponseType } from 'discord-interactions';
import { createEventEmbed, createEventButtons } from '../utils/embedBuilder.js';
import { eventService } from '../services/eventService.js';
import { logService } from '../services/logService.js';

export async function handleUpdateEvent(req, res) {
  const { guild_id, channel_id } = req.body;
  const messageId = req.body.data.options.find(opt => opt.name === 'message_id')?.value;

  try {
    console.log('Handling update event command:', {
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
    console.log('Found event:', {
      title: eventData.title,
      participantsCount: eventData.participants?.length || 0
    });

    // Обновляем существующее сообщение
    try {
      const response = await fetch(`https://discord.com/api/v10/channels/${channel_id}/messages/${messageId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          embeds: [createEventEmbed(eventData)],
          components: [createEventButtons()]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to update message:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: "⚠️ Failed to update event announcement. Please check bot permissions.",
            flags: 64
          }
        });
      }

      const updatedMessage = await response.json();
      console.log('Message updated successfully:', updatedMessage.id);

      // Отправляем лог об обновлении
      await logService.logEventUpdated(guild_id, eventData);

      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: "✅ Event announcement has been updated!",
          flags: 64
        }
      });

    } catch (error) {
      console.error('Error updating message:', error);
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: "⚠️ Failed to update event. Please try again later.",
          flags: 64
        }
      });
    }

  } catch (error) {
    console.error('Error in handleUpdateEvent:', error);
    await logService.logError(guild_id, 'handleUpdateEvent', error);
    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "⚠️ Failed to update event. Please try again later.",
        flags: 64
      }
    });
  }
} 