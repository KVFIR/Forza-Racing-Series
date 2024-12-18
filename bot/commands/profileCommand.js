import { InteractionResponseType } from 'discord-interactions';
import { eventService } from '../services/eventService.js';

export async function handleProfile(req, res) {
  const { guild_id, member: { user: { id: userId, username } } } = req.body;

  try {
    try {
      await eventService.migrateEvents(guild_id);
    } catch (migrationError) {
      console.error('Migration error:', migrationError);
    }
    
    const userEvents = await eventService.getUserEvents(guild_id, userId);
    
    if (!userEvents || userEvents.length === 0) {
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: "You haven't registered for any events yet!",
          flags: 64
        }
      });
    }

    // Улучшенный дизайн профиля
    let message = `# 🏁 Racing Profile: ${username}\n\n`;
    
    // Статистика
    message += `## 📊 Statistics\n`;
    message += `• Total Events: ${userEvents.length}\n`;
    message += `• Active Events: ${userEvents.filter(e => !e.completed).length}\n`;
    message += `• Completed Events: ${userEvents.filter(e => e.completed).length}\n\n`;

    // Активные события
    const activeEvents = userEvents.filter(e => !e.completed);
    if (activeEvents.length > 0) {
      message += `## 🏎️ Upcoming Events\n`;
      for (const event of activeEvents) {
        const registration = event.participants.find(p => p.id === userId);
        
        message += `### ${event.title}\n`;
        // Информация о событии
        message += `**Event Details:**\n`;
        if (event.date) message += `• Date: <t:${Math.floor(event.date/1000)}:F>\n`;
        message += `• Participants: ${event.participants?.length || 0}/${event.max_participants}\n`;
        
        // Информация о регистрации
        message += `\n**Your Registration:**\n`;
        message += `• XBOX: ${registration.xbox_nickname}\n`;
        if (registration.twitch_username) {
          message += `• Twitch: <https://twitch.tv/${registration.twitch_username}>\n`;
        }
        message += `• Car: ${registration.car_choice}\n`;
        message += `• Registered: <t:${Math.floor(registration.registered_at/1000)}:R>\n\n`;
      }
    }

    // Завершенные события
    const completedEvents = userEvents.filter(e => e.completed);
    if (completedEvents.length > 0) {
      message += `## 🏆 Past Events\n`;
      for (const event of completedEvents) {
        const registration = event.participants.find(p => p.id === userId);
        
        message += `### ${event.title}\n`;
        // Результаты события
        if (event.results) {
          const userResult = event.results.find(r => r.userId === userId);
          if (userResult) {
            message += `• Position: ${userResult.position}\n`;
            if (userResult.points) message += `• Points: ${userResult.points}\n`;
          }
        }
        
        // Информация о регистрации
        message += `• Car Used: ${registration.car_choice}\n`;
        if (event.date) message += `• Completed: <t:${Math.floor(event.date/1000)}:D>\n\n`;
      }
    }

    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: message,
        flags: 64
      }
    });

  } catch (error) {
    console.error('Error handling profile command:', error);
    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: process.env.NODE_ENV === 'development' ? 
          `⚠️ Error: ${error.message}` :
          "⚠️ Failed to load profile. Please try again later.",
        flags: 64
      }
    });
  }
} 