/**
 * Service for managing Discord roles
 */
class RoleService {
    /**
     * Add role to user
     */
    async addRoleToUser(guildId, userId, roleId) {
      const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${userId}/roles/${roleId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
  
      if (!response.ok) {
        throw new Error(`Failed to add role. Status: ${response.status}`);
      }
    }
  
    /**
     * Remove role from user
     */
    async removeRoleFromUser(guildId, userId, roleId) {
      try {
        const response = await fetch(
          `https://discord.com/api/v10/guilds/${guildId}/members/${userId}/roles/${roleId}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        );
  
        if (!response.ok && response.status !== 404) {
          throw new Error(`Failed to remove role: ${response.status}`);
        }
      } catch (error) {
        console.error('Error removing role:', error);
        throw error;
      }
    }
  }
  
  export const roleService = new RoleService();