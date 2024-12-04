import { sendLog } from '../commands/loggingCommand.js';

class LogService {
  async logError(guildId, context, error) {
    console.error(`[${new Date().toISOString()}] Error in ${context}:`, error);
    try {
      await sendLog(guildId, 
        `⚠️ **System Error**
> Context: ${context}
> Error: ${error.message}
> Stack: ${error.stack?.split('\n')[1] || 'No stack trace'}`
      );
    } catch (logError) {
      console.error('Failed to send error log:', logError);
    }
  }

  async logTicketCreated(guildId, ticket) {
    console.log(`[${new Date().toISOString()}] Ticket #${ticket.number} created`);
    await sendLog(guildId,
      `🎫 **New Incident Report** (#${ticket.number})
> Reporter: ${ticket.author.username} (<@${ticket.author.id}>)
> Involved Users: ${ticket.involved_users}
> Thread: <#${ticket.thread_id}>`
    );
  }

  async logTicketClosed(guildId, ticket, closedBy) {
    console.log(`[${new Date().toISOString()}] Ticket #${ticket.number} closed by ${closedBy.username}`);
    
    // Формируем информацию о вердикте, если он есть
    const verdictInfo = ticket.verdict ? `
> Verdict by: ${ticket.verdict.by.username} (<@${ticket.verdict.by.id}>)
> Decision: ${ticket.verdict.text}` : '';

    await sendLog(guildId,
      `🔒 **Incident Report Closed** (#${ticket.number})
> Closed by: ${closedBy.username} (<@${closedBy.id}>)
> Reporter: ${ticket.author.username} (<@${ticket.author.id}>)
> Thread: <#${ticket.thread_id}>
> Duration: ${this.formatDuration(ticket.created_at, Date.now())}${verdictInfo}`
    );
  }

  async logVerdictMade(guildId, ticket, verdict) {
    console.log(`[${new Date().toISOString()}] Verdict made for ticket #${ticket.number}`);
    await sendLog(guildId,
      `⚖️ **Verdict Made** (#${ticket.number})
> Judge: ${verdict.by.username} (<@${verdict.by.id}>)
> Reporter: ${ticket.author.username} (<@${ticket.author.id}>)
> Thread: <#${ticket.thread_id}>
> Decision: ${verdict.text}`
    );
  }

  async logEvent(guildId, content) {
    console.log(`[${new Date().toISOString()}] Event log:`, content);
    await sendLog(guildId, content);
  }

  formatDuration(start, end) {
    const duration = end - start;
    const minutes = Math.floor(duration / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else {
      return `${minutes}m`;
    }
  }

  async logRegistration(guildId, eventData, participant) {
    await sendLog(guildId, 
      `📝 **New Registration**
> User: ${participant.username} (<@${participant.id}>)
> Xbox: ${participant.xbox_nickname}
> Twitch: ${participant.twitch_username ? `[${participant.twitch_username}](https://www.twitch.tv/${participant.twitch_username})` : 'Not provided'}
> Car: ${participant.car_choice}
> Event: ${eventData.title}`
    );
  }

  async logRegistrationCancelled(guildId, eventData, participant) {
    await sendLog(guildId, 
      `❌ **Registration Cancelled**
> User: ${participant.username} (<@${participant.id}>)
> Xbox: ${participant.xbox_nickname}
> Event: ${eventData.title}`
    );
  }

  async logEventCreated(guildId, eventData) {
    await sendLog(guildId,
      `🏁 **New Event Created**
> Title: ${eventData.title}
> Max Participants: ${eventData.max_participants}
> Role: <@&${eventData.role_id}>`
    );
  }
}

export const logService = new LogService();