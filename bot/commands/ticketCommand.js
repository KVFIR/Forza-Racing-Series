import { 
  InteractionType, 
  InteractionResponseType
} from 'discord-interactions';
import { ref, set, get } from 'firebase/database';
import { db } from '../firebase.js';
import { sendLog } from './loggingCommand.js';

// Создание кнопки для репорта инцидентов
export async function handleCreateTicketButton(req, res) {
  try {
    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "🏁 **Race Incident Report**\nUse this button to report any incidents that occurred during the race.",
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                custom_id: "create_incident_ticket",
                label: "Report Incident",
                style: 1,
                emoji: {
                  name: "🚨"
                }
              }
            ]
          }
        ],
        flags: 0 // Явно указываем, что сообщение должно быть публичным
      }
    });
  } catch (error) {
    console.error('Error creating ticket button:', error);
    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "Failed to create incident report button. Error: " + error.message,
        flags: 64 // Ошибки оставляем эфемерными
      }
    });
  }
}

// Показ модального окна
export async function handleShowTicketModal(req, res) {
  try {
    console.log('Showing ticket modal');
    const modalData = {
      type: InteractionResponseType.MODAL,
      data: {
        title: "Race Incident Report",
        custom_id: `ticket_modal_${Date.now()}`,
        components: [
          {
            type: 1,
            components: [
              {
                type: 4,
                custom_id: "involved_users",
                label: "Involved Participants",
                style: 2,
                min_length: 1,
                max_length: 1000,
                required: true,
                placeholder: "List the XBOX Gamertags of participants involved in the incident (e.g., Gamertag1, Gamertag2)"
              }
            ]
          },
          {
            type: 1,
            components: [
              {
                type: 4,
                custom_id: "video_link",
                label: "Video Evidence",
                style: 1,
                min_length: 1,
                max_length: 500,
                required: true,
                placeholder: "Paste a link to your video evidence"
              }
            ]
          },
          {
            type: 1,
            components: [
              {
                type: 4,
                custom_id: "comment",
                label: "Additional Comments (optional)",
                style: 2,
                required: false,
                max_length: 1000,
                placeholder: "Add any additional context or comments about the incident"
              }
            ]
          }
        ]
      }
    };

    console.log('Sending modal data:', JSON.stringify(modalData));
    return res.send(modalData);
  } catch (error) {
    console.error('Error showing modal:', error);
    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "Failed to show report form.",
        flags: 64
      }
    });
  }
}

// Добавим функцию для получения следующего номера тикета
async function getNextTicketNumber(guildId) {
  const ticketsRef = ref(db, `ticket_counters/${guildId}`);
  const snapshot = await get(ticketsRef);
  const currentNumber = snapshot.exists() ? snapshot.val().current : 1000;
  const nextNumber = currentNumber + 1;
  
  // Обновляем счетчик
  await set(ticketsRef, {
    current: nextNumber,
    updated_at: Date.now()
  });
  
  return nextNumber;
}

// Обработка отправки формы
export async function handleTicketSubmit(req, res) {
  console.log('Handling ticket submit');
  const { member, data, guild_id, channel_id } = req.body;
  
  // Мгновенно отправляем ответ пользователю
  res.send({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: "✅ Your incident report has been submitted! A private thread has been created.",
      flags: 64 // Эфемерное сообщение
    }
  });

  try {
    // Получаем следующий номер тикета
    const ticketNumber = await getNextTicketNumber(guild_id);
    
    // Получаем роли из Firebase
    const rolesSnapshot = await get(ref(db, `guild_roles/${guild_id}`));
    const raceControlRoleId = rolesSnapshot.val()?.race_control_role;

    if (!raceControlRoleId) {
      console.error('Race Control role not found for guild:', guild_id);
      return;
    }

    // Создаем приватную ветку напрямую в канале
    const threadResponse = await fetch(`https://discord.com/api/v10/channels/${channel_id}/threads`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: `ticket-${ticketNumber}-${member.user.username}`,
        type: 12, // GUILD_PRIVATE_THREAD
        auto_archive_duration: 1440, // 24 часа
        invitable: false
      })
    });

    if (!threadResponse.ok) {
      throw new Error('Failed to create thread');
    }

    const thread = await threadResponse.json();

    // Добавляем автора тикета в ветку
    await fetch(`https://discord.com/api/v10/channels/${thread.id}/thread-members/${member.user.id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bot ${process.env.DISCORD_TOKEN}`
      }
    });

    // Добавляем Race Control в ветку
    if (raceControlRoleId) {
      await fetch(`https://discord.com/api/v10/channels/${thread.id}/thread-members/${raceControlRoleId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bot ${process.env.DISCORD_TOKEN}`
        }
      });
    }

    // Отправляем информацию в приватную ветку с пингом Race Control и кнопкой закрытия
    await fetch(`https://discord.com/api/v10/channels/${thread.id}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: `<@&${raceControlRoleId}>\n\n**Race Incident Report #${ticketNumber}**\nReporter: <@${member.user.id}>\nInvolved Users: ${data.components[0].components[0].value}\nVideo Evidence: ${data.components[1].components[0].value}\nComments: ${data.components[2].components[0].value || 'None'}`,
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                custom_id: `close_ticket_${ticketNumber}`,
                label: "Close Ticket",
                style: 4, // Красная кнопка
                emoji: {
                  name: "🔒"
                }
              }
            ]
          }
        ]
      })
    });

    // Сохраняем тикет в базу данных
    const ticketRef = ref(db, `tickets/${guild_id}/${ticketNumber}`);
    await set(ticketRef, {
      ticket_number: ticketNumber,
      reporter: {
        id: member.user.id,
        username: member.user.username
      },
      involved_users: data.components[0].components[0].value,
      video_link: data.components[1].components[0].value,
      comment: data.components[2].components[0].value || null,
      status: 'open',
      thread_id: thread.id,
      channel_id: channel_id,
      created_at: Date.now()
    });

    await sendLog(guild_id, `🎫 **New Ticket Created**
• Ticket: #${ticketNumber}
• Reporter: <@${member.user.id}>
• Thread: <#${thread.id}>`);

  } catch (error) {
    console.error('Error in handleTicketSubmit:', error);
  }
}

// Обработка закрытия тикета
export async function handleCloseTicket(req, res) {
  console.log('Handling close ticket:', req.body);
  const { member, guild_id, data } = req.body;
  
  // Получаем номер тикета из custom_id кнопки
  const ticketNumber = data.custom_id.replace('close_ticket_', '');

  try {
    // Проверяем роли пользователя
    const rolesSnapshot = await get(ref(db, `guild_roles/${guild_id}`));
    const raceControlRoleId = rolesSnapshot.val()?.race_control_role;

    const hasPermission = member.permissions === "8" || // Администратор
                         member.roles.includes(raceControlRoleId); // Race Control

    if (!hasPermission) {
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: "❌ You don't have permission to close tickets!",
          flags: 64
        }
      });
    }

    // Получ��ем информацию о тикете
    const ticketRef = ref(db, `tickets/${guild_id}/${ticketNumber}`);
    const ticketSnapshot = await get(ticketRef);
    const ticket = ticketSnapshot.val();

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Удаляем создателя тикета из ветки
    await fetch(`https://discord.com/api/v10/channels/${ticket.thread_id}/thread-members/${ticket.reporter.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bot ${process.env.DISCORD_TOKEN}`
      }
    });

    // Архивируем ветку
    await fetch(`https://discord.com/api/v10/channels/${ticket.thread_id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        archived: true,
        locked: true
      })
    });

    // Обновляем статус тикета в базе данных
    await set(ticketRef, {
      ...ticket,
      status: 'closed',
      closed_by: {
        id: member.user.id,
        username: member.user.username
      },
      closed_at: Date.now()
    });

    await sendLog(guild_id, `🔒 **Ticket Closed**
• Ticket: #${ticketNumber}
• Closed by: <@${member.user.id}>
• Reporter: <@${ticket.reporter.id}>`);

    // Отправляем подтверждение
    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `✅ Ticket #${ticketNumber} has been closed.`,
        flags: 64
      }
    });

  } catch (error) {
    console.error('Error closing ticket:', error);
    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "Failed to close ticket. Error: " + error.message,
        flags: 64
      }
    });
  }
}