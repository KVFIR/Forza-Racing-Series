import { InteractionResponseType } from 'discord-interactions';
import { eventService } from '../services/eventService.js';
import { createEventEmbed, createEventButtons } from '../utils/embedBuilder.js';
import { commandIds } from '../commands.js';

export async function handlePublish(req, res) {
  const { guild_id, data } = req.body;
  const eventId = data.options.find(opt => opt.name === 'event_id').value;
  const channelId = data.options.find(opt => opt.name === 'channel').value;
  
  try {
    const event = await eventService.findEventById(eventId);
    if (!event) {
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: "⚠️ Event not found. Please check the ID.",
          flags: 64
        }
      });
    }

    if (event.eventData.published) {
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: "⚠️ This event has already been published.",
          flags: 64
        }
      });
    }

    // Отправляем сообщение в канал
    const messageResponse = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        embeds: [createEventEmbed(event.eventData)],
        components: [createEventButtons()]
      })
    });

    if (!messageResponse.ok) {
      throw new Error('Failed to send event message');
    }

    const message = await messageResponse.json();

    // Обновляем событие используя новый метод
    await eventService.updateEventById(eventId, {
      published: true,
      channel_id: channelId,
      message_ids: [message.id]
    });

    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `✅ Event published successfully!\n\nEvent ID: \`${eventId}\`\nMessage ID: \`${message.id}\`\n\nUse these commands to manage your event:\n` +
          `-# </edit_event:${commandIds.edit_event}> \`message_id:${message.id}\`\n` +
          `-# </delete_event:${commandIds.delete_event}> \`message_id:${message.id}\`\n` +
          `-# </add_results:${commandIds.add_results}> \`message_id:${message.id}\``,
        flags: 64
      }
    });

  } catch (error) {
    console.error('Error in handlePublish:', error);
    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "⚠️ Failed to publish event. Please try again later.",
        flags: 64
      }
    });
  }
} 