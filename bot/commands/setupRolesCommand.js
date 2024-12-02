import { InteractionResponseType } from 'discord-interactions';
import { ref, set } from 'firebase/database';
import { db } from '../firebase.js';

export async function handleSetupRoles(req, res) {
  try {
    const { guild_id, data } = req.body;
    const raceControlRole = data.options.find(opt => opt.name === 'race_control')?.value;
    const participantRole = data.options.find(opt => opt.name === 'participant')?.value;

    if (!raceControlRole || !participantRole) {
      throw new Error('Both roles must be provided');
    }

    // Сохраняем роли в Firebase
    const rolesRef = ref(db, `guild_roles/${guild_id}`);
    await set(rolesRef, {
      race_control_role: raceControlRole,
      participant_role: participantRole,
      updated_at: Date.now()
    });

    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `✅ Roles have been set up:\nRace Control: <@&${raceControlRole}>\nParticipant: <@&${participantRole}>`,
        flags: 64
      }
    });
  } catch (error) {
    console.error('Error setting up roles:', error);
    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "Failed to set up roles. Error: " + error.message,
        flags: 64
      }
    });
  }
}
