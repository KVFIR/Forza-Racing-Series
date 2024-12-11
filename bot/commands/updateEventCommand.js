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
      const embed = createEventEmbed(eventData);
      const buttons = createEventButtons();

      const requestBody = {
        embeds: [embed],
        components: [buttons]
      };

      console.log('Sending update request:', {
        url: `https://discord.com/api/v10/channels/${channel_id}/messages/${messageId}`,
        method: 'PATCH',
        body: JSON.stringify(requestBody, null, 2)
      });

      const response = await fetch(`https://discord.com/api/v10/channels/${channel_id}/messages/${messageId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const responseText = await response.text();
      console.log('Discord API Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText
      });

      if (!response.ok) {
        console.error('Failed to update message:', {
          status: response.status,
          statusText: response.statusText,
          error: responseText
        });
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: "⚠️ Failed to update event announcement. Please check bot permissions.",
            flags: 64
          }
        });
      }

      const updatedMessage = JSON.parse(responseText);
      console.log('Message updated successfully:', {
        id: updatedMessage.id,
        embeds: updatedMessage.embeds,
        components: updatedMessage.components
      });

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