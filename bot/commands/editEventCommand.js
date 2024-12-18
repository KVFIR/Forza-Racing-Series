import { InteractionResponseType } from 'discord-interactions';
import { eventService } from '../services/eventService.js';

export async function handleEditEvent(req, res) {
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

    // Собираем изменения
    const updates = {};
    const title = data.options.find(opt => opt.name === 'title')?.value;
    const maxParticipants = data.options.find(opt => opt.name === 'max_participants')?.value;

    if (title) updates.title = title;
    if (maxParticipants) updates.max_participants = maxParticipants;

    // Обновляем событие
    await eventService.updateEvent(messageId, updates);

    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "�� Event has been updated!",
        flags: 64
      }
    });
  } catch (error) {
    console.error('Error editing event:', error);
    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "⚠️ Failed to edit event",
        flags: 64
      }
    });
  }
} 