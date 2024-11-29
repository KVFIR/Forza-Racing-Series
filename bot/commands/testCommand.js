import { InteractionResponseType } from 'discord-interactions';
import { getRandomEmoji } from '../utils.js';

export async function handleTest(req, res) {
  const username = req.body.member.user.username;
  
  return res.send({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: `Hello ${username}! Bot is working ${getRandomEmoji()}`
    }
  });
}