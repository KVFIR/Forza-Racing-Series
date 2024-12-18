import { InteractionResponseType } from 'discord-interactions';
import { eventService } from '../services/eventService.js';
import { createEventEmbed } from '../utils/embedBuilder.js';

export async function handlePreview(req, res) {
  const { data } = req.body;
  const eventId = data.options.find(opt => opt.name === 'event_id').value;
  if (!eventId.match(/^FH5-\d{6}$/)) {
    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "⚠️ Invalid event ID format. Expected format: FH5-XXXXXX (where X is a digit)",
        flags: 64
      }
    });
  }
  
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

    const embed = createEventEmbed(event.eventData);
    const publishStatus = event.eventData.published ? "🌐 Published" : "📝 Draft";

    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `**Event Preview** (${publishStatus})\nEvent ID: \`${eventId}\`\n\nUse \`/publish event_id:${eventId}\` to publish this event to a channel.`,
        embeds: [embed],
        flags: 64
      }
    });

  } catch (error) {
    console.error('Error in handlePreview:', error);
    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "⚠️ Failed to preview event. Please try again later.",
        flags: 64
      }
    });
  }
} 