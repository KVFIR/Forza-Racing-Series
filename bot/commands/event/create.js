export const createEventCommand = {
  name: 'create_event',
  description: 'Create a new event announcement',
  type: 1, // CHAT_INPUT
  options: [
    {
      name: 'title',
      description: 'Event title',
      type: 3, // STRING
      required: true
    },
    {
      name: 'registration_close',
      description: 'Registration close date (Unix timestamp)',
      type: 3, // STRING
      required: true
    },
    {
      name: 'max_participants',
      description: 'Maximum number of participants',
      type: 4, // INTEGER
      required: true
    }
  ]
};
