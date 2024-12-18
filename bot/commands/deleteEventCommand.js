import { InteractionResponseType } from 'discord-interactions';
import { eventService } from '../services/eventService.js';

export async function handleDeleteEvent(req, res) {
  const { guild_id, data } = req.body;
  const messageId = data.options.find(opt => opt.name === 'message_id').value;

  try {
    const event = await eventService.findEvent(messageId);
    if (!event) {
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: "⚠️ Event not found",
          flags: 64
        }
      });
    }

    // Удаляем событие
    await eventService.deleteEvent(messageId);

    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "✅ Event has been deleted!",
        flags: 64
      }
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "⚠️ Failed to delete event",
        flags: 64
      }
    });
  }
} 