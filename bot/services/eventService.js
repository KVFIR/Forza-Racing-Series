import { ref, get, set } from 'firebase/database';
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
    const eventKey = Date.now();
    const eventRef = ref(db, `events/${eventKey}`);

    await set(eventRef, {
      ...eventData,
      created_at: Date.now(),
      participants: [],
      channel_id: channelId,
      interaction_id: interactionId,
      message_ids: []
    });

    return { eventKey, eventData };
  }

  /**
   * Add participant to event
   */
  async addParticipant(eventKey, participant) {
    const eventRef = ref(db, `events/${eventKey}`);
    const snapshot = await get(eventRef);
    
    if (!snapshot.exists()) {
      throw new Error('Event not found');
    }

    const eventData = snapshot.val();
    const participants = eventData.participants || [];
    
    if (participants.some(p => p.id === participant.id)) {
      throw new Error('User already registered');
    }

    participants.push({
      ...participant,
      registered_at: Date.now()
    });

    await set(eventRef, {
      ...eventData,
      participants
    });

    return { eventData, participants };
  }

  /**
   * Remove participant from event
   */
  async removeParticipant(eventKey, userId) {
    const eventRef = ref(db, `events/${eventKey}`);
    const snapshot = await get(eventRef);
    
    if (!snapshot.exists()) {
      throw new Error('Event not found');
    }

    const eventData = snapshot.val();
    const participants = eventData.participants || [];
    
    const updatedParticipants = participants.filter(p => p.id !== userId);
    
    if (participants.length === updatedParticipants.length) {
      throw new Error('User not registered');
    }

    await set(eventRef, {
      ...eventData,
      participants: updatedParticipants
    });

    return { eventData, participants: updatedParticipants };
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
}

export const eventService = new EventService();