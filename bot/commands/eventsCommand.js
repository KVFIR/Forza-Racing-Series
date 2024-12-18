import { InteractionResponseType } from 'discord-interactions';
import { eventService } from '../services/eventService.js';
import { formatEventDate } from '../utils/dateUtils.js';
import { commandIds } from '../commands.js';

export async function handleEvents(req, res) {
  const { guild_id, data } = req.body;
  const filter = data.options?.find(opt => opt.name === 'filter')?.value || 'all';

  try {
    const events = await eventService.getGuildEvents(guild_id);
    if (!events || events.length === 0) {
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: "No events found for this server.",
          flags: 64
        }
      });
    }

    // Фильтруем события
    const filteredEvents = events.filter(event => {
      switch (filter) {
        case 'active':
          return !event.completed && event.date > Date.now();
        case 'completed':
          return event.completed;
        default:
          return true;
      }
    });

    // Сортируем по дате
    filteredEvents.sort((a, b) => a.date - b.date);

    // Формируем сообщение
    let message = `# 📅 Server Events\n\n`;

    // Группируем по статусу
    const drafts = filteredEvents.filter(e => !e.published);
    const upcoming = filteredEvents.filter(e => e.published && !e.completed && e.date > Date.now());
    const inProgress = filteredEvents.filter(e => e.published && !e.completed && e.date <= Date.now());
    const completed = filteredEvents.filter(e => e.completed);

    // Добавляем черновики
    if (drafts.length > 0 && filter === 'all') {
      message += `## 📝 Draft Events\n`;
      for (const event of drafts) {
        message += formatEventEntry(event);
      }
    }

    // Добавляем предстоящие события
    if (upcoming.length > 0 && ['all', 'active'].includes(filter)) {
      message += `## 🎮 Active Events\n`;
      for (const event of upcoming) {
        message += formatEventEntry(event);
      }
    }

    // Добавляем текущие события
    if (inProgress.length > 0 && ['all', 'active'].includes(filter)) {
      message += `## ⚡ In Progress\n`;
      for (const event of inProgress) {
        message += formatEventEntry(event);
      }
    }

    // Добавляем завершенные события
    if (completed.length > 0 && ['all', 'completed'].includes(filter)) {
      message += `## 🏁 Completed Events\n`;
      for (const event of completed) {
        message += formatEventEntry(event, true);
      }
    }

    message += '-# **Event Management Commands:**\n';
    message += `-# </create_event:${commandIds.create_event}>\n`;
    message += `-# </preview:${commandIds.preview}>\n`;
    message += `-# </edit_event:${commandIds.edit_event}>\n`;
    message += `-# </delete_event:${commandIds.delete_event}>\n`;
    message += `-# </add_results:${commandIds.add_results}>\n`;

    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: message,
        flags: 64
      }
    });

  } catch (error) {
    console.error('Error handling events command:', error);
    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "⚠️ Failed to fetch events. Please try again later.",
        flags: 64
      }
    });
  }
}

function formatEventEntry(event, showResults = false) {
  let entry = `### ${event.title}\n`;
  entry += `• ID: \`${event.event_id}\`\n`;
  entry += `• Status: ${getEventStatus(event)}\n`;
  entry += `• Date: ${formatEventDate(event.date)}\n`;
  entry += `• Participants: ${event.participants?.length || 0}/${event.max_participants}\n`;
  
  if (event.message_ids?.[0]) {
    entry += `• Message ID: \`${event.message_ids[0]}\`\n`;
  }

  if (showResults && event.results?.length > 0) {
    entry += `\n**Top 3:**\n`;
    const top3 = event.results
      .sort((a, b) => a.position - b.position)
      .slice(0, 3);
    
    top3.forEach(result => {
      entry += `${getPositionEmoji(result.position)} <@${result.userId}> (${result.points} pts)\n`;
    });
  }

  entry += '\n';
  return entry;
}

function getEventStatus(event) {
  if (event.completed) return '🏁 Completed';
  if (event.published) {
    return event.date > Date.now() ? '🌐 Active' : '⚡ In Progress';
  }
  return '📝 Draft';
}

function getPositionEmoji(position) {
  switch (position) {
    case 1: return '🥇';
    case 2: return '🥈';
    case 3: return '🥉';
    default: return `${position}.`;
  }
} 