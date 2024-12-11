import { MessageComponentTypes, ButtonStyleTypes } from 'discord-interactions';

export function createEventEmbed(data) {
  console.log('Creating embed with data:', {
    title: data.title,
    participantsCount: data.participants?.length || 0,
    maxParticipants: data.max_participants,
    fullData: JSON.stringify(data, null, 2)
  });

  const participants = data.participants || [];
  const participantsList = participants.length > 0
    ? participants.map(p => `<@${p.id}>`).join('\n')
    : 'No registered participants';

  console.log('Participants list:', {
    count: participants.length,
    list: participantsList,
    rawParticipants: JSON.stringify(participants, null, 2)
  });

  const embed = {
    title: data.title,
    url: "",
    color: 460551,
    description: "",
    thumbnail: {
      url: ""
    },
    footer: {
      text: "powered by FRS"
    },
    image: {
      url: "https://cdn.discordapp.com/attachments/1192170720311132282/1312388356449107968/IMG_20220720_0121372.png?ex=674c5067&is=674afee7&hm=bbeecd025fb4d5b7eb97c8f96e42770745a53533e6019458e14cd6b0b6593903&"
    },
    fields: [
      {
        name: "📅 Date",
        value: `Day 1: <t:1734789600:f>\nDay 2: <t:1734876000:f>`
      },
      {
        name: "🚘 Cars",
        value: `[Ford Mustang Shelby GT350R (2016)](https://discord.com/channels/983016177146155069/1308730927614263308)\n[Mercedes-AMG GT R (2017)](https://discord.com/channels/983016177146155069/1308731405320192022)\n[Jaguar XKR-S GT (2015)](https://discord.com/channels/983016177146155069/1308731832941940756)\n[Chevrolet Camaro Z/28 (2015)](https://discord.com/channels/983016177146155069/1308732311591714878)\n[Porsche Cayman GT4 (2016)](https://discord.com/channels/983016177146155069/1308732612965175316)\n[Aston Martin Vantage GT12 (2015)](https://discord.com/channels/983016177146155069/1308732751247052830)`
      },
      {
        name: "🛣️ Tracks",
        value: `[Track #1](https://discord.com/channels/983016177146155069/1315318752598036532)\n[Track #2](https://discord.com/channels/983016177146155069/1315319996255305779)\n[Track #3](https://discord.com/channels/983016177146155069/1315324661105688586)`
      },
      {
        name: `👥 Participants (${participants.length}/${data.max_participants})`,
        value: participantsList
      }
    ]
  };

  console.log('Created embed:', {
    title: embed.title,
    fieldsCount: embed.fields.length,
    participantsField: embed.fields[3],
    fullEmbed: JSON.stringify(embed, null, 2)
  });

  return embed;
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