/**
 * Service for managing Discord roles
 */
class RoleService {
    /**
     * Add role to user
     */
    async addRoleToUser(guildId, userId, roleId) {
      try {
        const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${userId}/roles/${roleId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });
  
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Failed to add role. Status: ${response.status}. Message: ${errorData.message || 'Unknown error'}`);
        }
      } catch (error) {
        console.error(`Failed to add role to user ${userId} in guild ${guildId}:`, error);
        throw error;
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
  
        // 404 означает, что роль уже удалена
        if (!response.ok && response.status !== 404) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Failed to remove role. Status: ${response.status}. Message: ${errorData.message || 'Unknown error'}`);
        }
      } catch (error) {
        console.error(`Failed to remove role from user ${userId} in guild ${guildId}:`, error);
        throw error;
      }
    }
}
  
export const roleService = new RoleService();