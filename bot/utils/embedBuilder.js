import { MessageComponentTypes, ButtonStyleTypes } from 'discord-interactions';

export function createEventEmbed(data) {
  const participants = data.participants || [];
  const participantsList = participants.length > 0
    ? participants.map(p => `<@${p.id}>`).join('\n')
    : 'No registered participants';

  return {
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
      url: "https://cdn.discordapp.com/attachments/1257009511479246902/1311441599716266095/Picsart_24-10-31_22-39-26-706.png?ex=6748deaa&is=67478d2a&hm=7e3de6f2844c56d956417bc69c17cfd514174e5bb0949948b8624b1d0f1b64dc&"
    },
    fields: [
      {
        name: "📅 Date",
        value: `Day 1: TBA\nDay 2: TBA`
      },
      {
        name: "🚘 Cars",
        value: `[Ford Mustang Shelby GT350R (2016)](https://discord.com/channels/983016177146155069/1308730927614263308)\n[Mercedes-AMG GT R (2017)](https://discord.com/channels/983016177146155069/1308731405320192022)\n[Jaguar XKR-S GT (2015)](https://discord.com/channels/983016177146155069/1308731832941940756)\n[Chevrolet Camaro Z/28 (2015)](https://discord.com/channels/983016177146155069/1308732311591714878)\n[Porsche Cayman GT4 (2016)](https://discord.com/channels/983016177146155069/1308732612965175316)\n[Aston Martin Vantage GT12 (2015)](https://discord.com/channels/983016177146155069/1308732751247052830)`
      },
      {
        name: "🛣️ Tracks",
        value: `TBA`
      },
      {
        name: `👥 Participants (${participants.length}/${data.max_participants})`,
        value: participantsList
      }
    ]
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