import { InteractionResponseType, MessageComponentTypes } from 'discord-interactions';

export function createRaceModal() {
  return {
    type: InteractionResponseType.MODAL,
    data: {
      custom_id: "create_race_modal",
      title: "Create a New Race",
      components: [
        {
          type: MessageComponentTypes.ACTION_ROW,
          components: [
            {
              type: MessageComponentTypes.INPUT_TEXT,
              custom_id: "race_name",
              label: "Race Name",
              style: 1,
              min_length: 1,
              max_length: 100,
              placeholder: "Enter the name of the race",
              required: true
            }
          ]
        },
        {
          type: MessageComponentTypes.ACTION_ROW,
          components: [
            {
              type: MessageComponentTypes.INPUT_TEXT,
              custom_id: "race_date",
              label: "Race Date and Time",
              style: 1,
              min_length: 1,
              max_length: 100,
              placeholder: "YYYY-MM-DD HH:MM",
              required: true
            }
          ]
        },
        {
          type: MessageComponentTypes.ACTION_ROW,
          components: [
            {
              type: MessageComponentTypes.INPUT_TEXT,
              custom_id: "race_track",
              label: "Track",
              style: 1,
              min_length: 1,
              max_length: 100,
              placeholder: "Enter the track name",
              required: true
            }
          ]
        },
        {
          type: MessageComponentTypes.ACTION_ROW,
          components: [
            {
              type: MessageComponentTypes.INPUT_TEXT,
              custom_id: "race_class",
              label: "Car Class",
              style: 1,
              min_length: 1,
              max_length: 100,
              placeholder: "Enter the car class",
              required: true
            }
          ]
        },
        {
          type: MessageComponentTypes.ACTION_ROW,
          components: [
            {
              type: MessageComponentTypes.INPUT_TEXT,
              custom_id: "race_description",
              label: "Additional Information",
              style: 2,
              min_length: 1,
              max_length: 1000,
              placeholder: "Enter any additional information about the race",
              required: false
            }
          ]
        }
      ]
    }
  };
}

