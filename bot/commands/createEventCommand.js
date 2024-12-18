import { 
  InteractionType,
  InteractionResponseType
} from 'discord-interactions';
import { ref, get } from 'firebase/database';
import { db } from '../firebase.js';
import { eventService } from '../services/eventService.js';
import { logService } from '../services/logService.js';
import { roleService } from '../services/roleService.js';
import { formatEventDate } from '../utils/dateUtils.js';
import { commandIds } from '../commands.js';

export async function handleCreateEvent(req, res) {
  const { guild_id, channel_id, id, data } = req.body;
  
  try {
    // Получаем значения полей даты
    const day = data.options.find(opt => opt.name === 'day').value;
    const month = data.options.find(opt => opt.name === 'month').value;
    const year = data.options.find(opt => opt.name === 'year').value;
    const hour = data.options.find(opt => opt.name === 'hour').value;
    const minute = data.options.find(opt => opt.name === 'minute').value;

    // Создаем и проверяем дату
    const date = new Date(year, month - 1, day, hour, minute);
    const timestamp = date.getTime();

    // Про��еряем валидность даты
    if (isNaN(timestamp)) {
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: "⚠️ Invalid date combination",
          flags: 64
        }
      });
    }

    // Проверяем, что дата в будущем
    if (timestamp <= Date.now()) {
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: "⚠️ Event date must be in the future",
          flags: 64
        }
      });
    }

    // Проверяем роль участника
    const rolesRef = ref(db, `guild_roles/${guild_id}`);
    const rolesSnapshot = await get(rolesRef);
    const participantRoleId = rolesSnapshot.val()?.participant_role;

    if (!participantRoleId) {
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `⚠️ Participant role is not set up!\n\nPlease follow these steps:\n1. Use \`/setup_roles\` command\n2. Select a role for participants\n3. Try creating the event again`,
          flags: 64
        }
      });
    }

    const eventData = {
      title: data.options.find(opt => opt.name === 'title').value,
      max_participants: 12,
      role_id: participantRoleId,
      date: timestamp,
      guild_id: guild_id
    };

    // Создаем событие в базе данных
    const { eventKey, eventData: createdEvent } = await eventService.createEvent(guild_id, channel_id, id, eventData);

    // Отправляем эфемерное сообщение с информацией и подсказками
    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `✅ Event created successfully!\n\n` +
          `### ${eventData.title}\n` +
          `> ID: \`${createdEvent.event_id}\`\n` +
          `> Status: 📝 Draft\n` +
          `> Date: ${formatEventDate(eventData.date)}\n` +
          `> Participants: 0/${eventData.max_participants}\n\n` +
          `**Event Management Commands:**\n` +
          `-# </create_event:${commandIds.create_event}>\n` +
          `-# </preview:${commandIds.preview}>\n` +
          `-# </edit_event:${commandIds.edit_event}>\n` +
          `-# </delete_event:${commandIds.delete_event}>\n` +
          `-# </add_results:${commandIds.add_results}>`,
        flags: 64
      }
    });

  } catch (error) {
    console.error('Error in handleCreateEvent:', error);
    await logService.logError(guild_id, 'handleCreateEvent', error);
    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "⚠️ Failed to create event. Please try again later.",
        flags: 64
      }
    });
  }
}