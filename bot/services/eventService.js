import { ref, get, set, update, remove } from 'firebase/database';
import { db } from '../firebase.js';

/**
 * Service for managing events
 */
class EventService {
  /**
   * Find event by message ID and channel ID
   */
  async findEvent(messageId, channelId) {
    const eventRef = ref(db, 'events');
    const snapshot = await get(eventRef);
    
    if (!snapshot.exists()) {
      return null;
    }

    let result = null;
    snapshot.forEach((childSnapshot) => {
      const event = childSnapshot.val();
      if (
        event.message_ids?.includes(messageId) || 
        (event.channel_id === channelId && 
         event.created_at === Math.max(...Object.values(snapshot.val()).map(e => e.created_at)))
      ) {
        result = {
          eventData: event,
          eventKey: childSnapshot.key
        };
        return true;
      }
    });

    return result;
  }

  /**
   * Create new event
   */
  async createEvent(guildId, channelId, interactionId, eventData) {
    console.log('Creating event for guild:', guildId);
    
    const eventId = `FH5-${Math.random().toString().substring(2, 8)}`;
    const eventKey = Date.now();
    const eventRef = ref(db, `events/${eventKey}`);

    const fullEventData = {
      ...eventData,
      event_id: eventId,
      created_at: Date.now(),
      participants: [],
      channel_id: channelId,
      interaction_id: interactionId,
      message_ids: [],
      published: false
    };

    console.log('Saving event with data:', {
      eventId,
      guildId: fullEventData.guild_id,
      title: fullEventData.title
    });

    await set(eventRef, fullEventData);
    return { eventKey, eventData: fullEventData };
  }

  /**
   * Add participant to event
   */
  async addParticipant(eventKey, participant) {
    console.log('Adding participant:', {
      eventKey,
      participant
    });

    const eventRef = ref(db, `events/${eventKey}`);
    const snapshot = await get(eventRef);
    
    if (!snapshot.exists()) {
      throw new Error('Event not found');
    }

    const eventData = snapshot.val();
    console.log('Current event data:', {
      guildId: eventData.guild_id,
      title: eventData.title,
      participantsCount: eventData.participants?.length || 0
    });

    const participants = eventData.participants || [];
    
    if (participants.some(p => p.id === participant.id)) {
      throw new Error('User already registered');
    }

    participants.push({
      ...participant,
      registered_at: Date.now()
    });

    const updatedEventData = {
      ...eventData,
      participants
    };

    console.log('Updating event with new data:', {
      participantsCount: participants.length,
      lastParticipant: participant.username
    });

    await set(eventRef, updatedEventData);

    return { eventData: updatedEventData, participants };
  }

  /**
   * Remove participant from event
   */
  async removeParticipant(eventKey, userId) {
    console.log('Removing participant:', {
      eventKey,
      userId
    });

    const eventRef = ref(db, `events/${eventKey}`);
    const snapshot = await get(eventRef);
    
    if (!snapshot.exists()) {
      throw new Error('Event not found');
    }

    const eventData = snapshot.val();
    console.log('Current event data:', {
      title: eventData.title,
      participantsCount: eventData.participants?.length || 0,
      messageIds: eventData.message_ids
    });

    const participants = eventData.participants || [];
    
    const updatedParticipants = participants.filter(p => p.id !== userId);
    
    if (participants.length === updatedParticipants.length) {
      throw new Error('User not registered');
    }

    const updatedEventData = {
      ...eventData,
      participants: updatedParticipants
    };

    console.log('Updating event with new data:', {
      participantsCount: updatedParticipants.length
    });

    await set(eventRef, updatedEventData);

    return { eventData: updatedEventData, participants: updatedParticipants };
  }

  /**
   * Update event message IDs
   */
  async updateMessageIds(eventKey, messageId) {
    const eventRef = ref(db, `events/${eventKey}`);
    const snapshot = await get(eventRef);
    
    if (!snapshot.exists()) {
      throw new Error('Event not found');
    }

    const eventData = snapshot.val();
    const messageIds = [...(eventData.message_ids || []), messageId]
      .filter((id, index, self) => self.indexOf(id) === index);

    await set(eventRef, {
      ...eventData,
      message_ids: messageIds
    });
  }

  async getUserEvents(guildId, userId) {
    try {
      console.log('Getting events for:', { guildId, userId });
      const eventsRef = ref(db, 'events');
      const snapshot = await get(eventsRef);
      
      if (!snapshot.exists()) {
        console.log('No events found in database');
        return [];
      }

      const events = [];
      console.log('Processing events...');
      
      snapshot.forEach((childSnapshot) => {
        const eventData = childSnapshot.val();
        if (eventData.participants?.some(p => p.id === userId)) {
          events.push(eventData);
        }
      });

      console.log('Found events:', events.length);
      return events.sort((a, b) => b.created_at - a.created_at);
    } catch (error) {
      console.error('Error getting user events:', error);
      throw error;
    }
  }

  async migrateEvents(guildId) {
    try {
      console.log('Starting events migration for guild:', guildId);
      const eventsRef = ref(db, 'events');
      const snapshot = await get(eventsRef);
      
      if (!snapshot.exists()) {
        console.log('No events to migrate');
        return;
      }

      let migratedCount = 0;
      const migrationPromises = [];

      snapshot.forEach((childSnapshot) => {
        const eventData = childSnapshot.val();
        if (!eventData.guild_id) {
          const eventRef = ref(db, `events/${childSnapshot.key}`);
          migrationPromises.push(
            set(eventRef, {
              ...eventData,
              guild_id: guildId
            })
          );
          migratedCount++;
        }
      });

      if (migratedCount > 0) {
        console.log(`Migrating ${migratedCount} events...`);
        await Promise.all(migrationPromises);
        console.log('Migration completed');
      } else {
        console.log('No events need migration');
      }
    } catch (error) {
      console.error('Error migrating events:', error);
      throw error;
    }
  }

  async updateResults(messageId, results) {
    const event = await this.findEvent(messageId);
    if (!event) {
      throw new Error('Event not found');
    }

    const eventRef = ref(db, `events/${event.eventKey}`);
    await set(eventRef, {
      ...event.eventData,
      results,
      completed: true,
      updated_at: Date.now()
    });
  }

  async updateEvent(messageId, updates) {
    const event = await this.findEvent(messageId);
    if (!event) {
      throw new Error('Event not found');
    }

    const eventRef = ref(db, `events/${event.eventKey}`);
    await set(eventRef, {
      ...event.eventData,
      ...updates,
      guild_id: event.eventData.guild_id,
      updated_at: Date.now()
    });
  }

  async deleteEvent(messageId) {
    const event = await this.findEvent(messageId);
    if (!event) {
      throw new Error('Event not found');
    }

    // Удаляем сообщение
    try {
      await fetch(`https://discord.com/api/v10/channels/${event.eventData.channel_id}/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bot ${process.env.DISCORD_TOKEN}`
        }
      });
    } catch (error) {
      console.error('Error deleting message:', error);
    }

    // Уд��ляем событие из базы
    const eventRef = ref(db, `events/${event.eventKey}`);
    await remove(eventRef);
  }

  async getGuildEvents(guildId) {
    try {
      console.log('Getting events for guild:', guildId);
      const eventsRef = ref(db, 'events');
      const snapshot = await get(eventsRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      const events = [];
      snapshot.forEach((childSnapshot) => {
        const eventData = childSnapshot.val();
        const eventGuildId = String(eventData.guild_id);
        const requestedGuildId = String(guildId);
        
        console.log('Checking event:', {
          eventId: eventData.event_id,
          eventGuildId,
          requestedGuildId,
          match: eventGuildId === requestedGuildId
        });
        
        if (eventGuildId === requestedGuildId) {
          events.push(eventData);
        }
      });

      console.log(`Found ${events.length} events for guild ${guildId}`);
      return events;
    } catch (error) {
      console.error('Error getting guild events:', error);
      throw error;
    }
  }

  /**
   * Find event by ID
   */
  async findEventById(eventId) {
    const eventsRef = ref(db, 'events');
    const snapshot = await get(eventsRef);
    
    if (!snapshot.exists()) {
      return null;
    }

    let result = null;
    snapshot.forEach((childSnapshot) => {
      const event = childSnapshot.val();
      if (event.event_id === eventId) {
        result = {
          eventData: event,
          eventKey: childSnapshot.key
        };
        return true;
      }
    });

    return result;
  }

  // Добавим новый метод для обновления по event_id
  async updateEventById(eventId, updates) {
    const event = await this.findEventById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    const eventRef = ref(db, `events/${event.eventKey}`);
    await set(eventRef, {
      ...event.eventData,
      ...updates,
      guild_id: event.eventData.guild_id,
      updated_at: Date.now()
    });

    return event;
  }
}

export const eventService = new EventService();