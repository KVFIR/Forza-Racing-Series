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
    description: "📜 [Rules]\n🚘 [Cars]\n🗺️ [Track]",
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
        name: "📅 Registration closes",
        value: `<t:${data.registration_close}:R>`
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