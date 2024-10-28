import fetch from 'node-fetch';
import { config } from '../config.js';

class DiscordService {
  constructor() {
    this.baseUrl = 'https://discord.com/api/v10';
    this.botToken = `Bot ${config.discord.token.trim()}`;
  }

  getDefaultAvatarIndex(userId) {
    return Number((BigInt(userId) >> 22n) % 6n);
  }

  async getUserInfo(userId) {
    try {
      console.log('Fetching user info for:', userId);
      console.log('Using authorization:', this.botToken.replace(/Bot (.{10}).*/, 'Bot $1...'));
      
      const response = await fetch(`${this.baseUrl}/users/${userId}`, {
        headers: {
          Authorization: this.botToken,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Discord API error:', response.status);
        const errorBody = await response.text();
        console.error('Error body:', errorBody);
        throw new Error(`Discord API error: ${response.status}`);
      }

      const userData = await response.json();
      console.log('Received user data:', userData);

      const avatarUrl = userData.avatar 
        ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png?size=256`
        : `https://cdn.discordapp.com/embed/avatars/${this.getDefaultAvatarIndex(userData.id)}.png`;

      return {
        id: userData.id,
        username: userData.username,
        discriminator: userData.discriminator,
        avatar: userData.avatar,
        defaultAvatarUrl: avatarUrl
      };
    } catch (error) {
      console.error('Discord service error:', error);
      const defaultAvatarIndex = this.getDefaultAvatarIndex(userId);
      return {
        id: userId,
        username: 'Unknown User',
        discriminator: '0000',
        avatar: null,
        defaultAvatarUrl: `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`
      };
    }
  }
}

export default new DiscordService();
