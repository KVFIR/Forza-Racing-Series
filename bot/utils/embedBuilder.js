import { MessageComponentTypes, ButtonStyleTypes } from 'discord-interactions';
import { formatEventDate } from './dateUtils.js';

export function createEventEmbed(eventData) {
  return {
    color: 0x0099ff,
    title: eventData.title,
    description: 'Register for the upcoming race event!',
    fields: [
      {
        name: '📅 Date',
        value: eventData.date ? formatEventDate(eventData.date) : 'TBA',
        inline: true
      },
      {
        name: '👥 Participants',
        value: `${eventData.participants?.length || 0}/${eventData.max_participants}`,
        inline: true
      }
    ],
    timestamp: new Date().toISOString()
  };
}

export function createEventButtons() {
  return {
    type: MessageComponentTypes.ACTION_ROW,
    components: [
      {
        type: MessageComponentTypes.BUTTON,
        custom_id: 'register_event',
        label: 'Register',
        style: ButtonStyleTypes.PRIMARY,
      },
      {
        type: MessageComponentTypes.BUTTON,
        custom_id: 'cancel_registration',
        label: 'Cancel',
        style: ButtonStyleTypes.DANGER,
      }
    ]
  };
}