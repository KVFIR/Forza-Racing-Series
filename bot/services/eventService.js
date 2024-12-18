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
      title: eventData.title,
      participantsCount: eventData.participants?.length || 0,
      messageIds: eventData.message_ids
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
}

export const eventService = new EventService();