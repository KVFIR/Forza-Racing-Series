import { InteractionResponseType } from 'discord-interactions';
import { eventService } from '../services/eventService.js';
import { handleUpdateEvent } from './updateEventCommand.js';
import { handleEventParticipants } from './eventParticipantsCommand.js';

export async function handleContextCommand(req, res) {
  const { name, resolved } = req.body.data;
  const targetMessage = resolved.messages[Object.keys(resolved.messages)[0]];

  try {
    // Проверяем, является ли сообщение объявлением о событии
    const event = await eventService.findEvent(targetMessage.id, targetMessage.channel_id);
    if (!event) {
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: "⚠️ This message is not an event announcement.",
          flags: 64
        }
      });
    }

    switch (name) {
      case 'Update Event':
        return handleUpdateEvent(req, res);
      case 'Event Participants':
        return handleEventParticipants(req, res);
      default:
        console.error(`Unknown context menu command: ${name}`);
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: "Unknown command",
            flags: 64
          }
        });
    }
  } catch (error) {
    console.error('Error in handleContextCommand:', error);
    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "⚠️ An error occurred while processing the command.",
        flags: 64
      }
    });
  }
} 