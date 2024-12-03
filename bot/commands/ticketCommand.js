import { 
  InteractionType, 
  InteractionResponseType
} from 'discord-interactions';
import { ref, set, get } from 'firebase/database';
import { db } from '../firebase.js';
import { logService } from '../services/logService.js';
import { ticketService } from '../services/ticketService.js';

// В начале файла добавим проверку прав
const requiredPermissions = [
  'CREATE_PRIVATE_THREADS',
  'SEND_MESSAGES_IN_THREADS',
  'MANAGE_THREADS',
  'VIEW_CHANNEL'
];

// В начале файла добавим проверку
async function getTicketsChannel(guildId) {
  const settingsRef = ref(db, `guild_settings/${guildId}`);
  const snapshot = await get(settingsRef);
  const ticketsChannelId = snapshot.val()?.tickets_channel;

  if (!ticketsChannelId) {
    throw new Error('Tickets channel not configured');
  }

  return ticketsChannelId;
}

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
        flags: 0 // Явно указываем, что сообщение должно быт публичным
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
    return res.send({
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
    });
  } catch (error) {
    console.error('Error showing ticket modal:', error);
    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "Failed to show report form. Please try again.",
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

// Создаем компоненты с кнопками
function createTicketButtons(ticketId) {
  return {
    type: 1,
    components: [
      {
        type: 2,
        custom_id: `verdict_ticket_${ticketId}`,
        label: "Make Verdict",
        style: 1, // Синяя кнопка
        emoji: {
          name: "⚖️"
        }
      },
      {
        type: 2,
        custom_id: `close_ticket_${ticketId}`,
        label: "Close Ticket",
        style: 4, // Красная кнопка
        emoji: {
          name: "🔒"
        }
      }
    ]
  };
}

// Обработка отправки тикета
export async function handleTicketSubmit(req, res) {
  const { 
    guild_id,
    channel_id,
    member: { user: { id: userId, username } },
    data: { components }
  } = req.body;

  try {
    const involvedUsers = components[0].components[0].value;
    const ticketNumber = await ticketService.getNextTicketNumber(guild_id);

    // Создаем тред...
    const threadResponse = await fetch(`https://discord.com/api/v10/channels/${channel_id}/threads`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: `#${ticketNumber} | ${username}`,
        type: 12,
        auto_archive_duration: 1440,
        rate_limit_per_user: 0
      })
    });

    if (!threadResponse.ok) {
      console.error('Failed to create thread:', await threadResponse.text());
      throw new Error(`Failed to create thread: ${threadResponse.status}`);
    }

    const thread = await threadResponse.json();

    // Создаем объект тикета
    const ticketData = {
      number: ticketNumber,
      author: {
        id: userId,
        username
      },
      involved_users: involvedUsers,
      thread_id: thread.id,
      created_at: Date.now(),
      status: 'open'
    };

    // Создаем тикет в базе данных
    const { ticketId } = await ticketService.createTicket(guild_id, ticketData);

    // Отправляем первое сообщение в тред
    await fetch(`https://discord.com/api/v10/channels/${thread.id}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: `🎫 **New Incident Report** (#${ticketNumber})
> Reporter: <@${userId}>
> Involved Users: ${involvedUsers}`,
        components: [createTicketButtons(ticketId)] // Добавляем кнопки
      })
    });

    // Логируем создание тикета с полными данными
    await logService.logTicketCreated(guild_id, ticketData);

    // Отправляем успешный ответ
    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `✅ **Incident Report Created**
> Please check the <#${thread.id}> for further communication.`,
        flags: 64
      }
    });

  } catch (error) {
    console.error('Error in handleTicketSubmit:', error);
    await logService.logError(guild_id, 'handleTicketSubmit', error);
    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "Failed to create ticket. Please try again.",
        flags: 64
      }
    });
  }
}

// Обработка закрытия тикета
export async function handleCloseTicket(req, res) {
  const { 
    guild_id, 
    member,
    data: { custom_id }
  } = req.body;
  
  try {
    const ticketId = custom_id.replace('close_ticket_', '');
    
    // Получаем актуальную версию тикета
    let ticket = await ticketService.getTicket(guild_id, ticketId);
    
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Проверяем права на закрытие тикета
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

    // Удаляем создателя тикета из ветки
    await fetch(`https://discord.com/api/v10/channels/${ticket.thread_id}/thread-members/${ticket.author.id}`, {
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

    // Обновляем статус тикета
    await ticketService.updateTicket(guild_id, ticketId, {
      ...ticket,
      status: 'closed',
      closed_by: {
        id: member.user.id,
        username: member.user.username
      },
      closed_at: Date.now()
    });

    // Получаем свежую версию тикета после обновления
    ticket = await ticketService.getTicket(guild_id, ticketId);

    // Логируем закрытие тикета с актуальными данными
    await logService.logTicketClosed(guild_id, ticket, {
      id: member.user.id,
      username: member.user.username
    });

    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `✅ Ticket #${ticket.number} has been closed.`,
        flags: 64
      }
    });

  } catch (error) {
    console.error('Error closing ticket:', error);
    await logService.logError(guild_id, 'handleCloseTicket', error);
    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "Failed to close ticket. Please try again.",
        flags: 64
      }
    });
  }
}

// Добавляем обработчик для показа модального окна с вердиктом
export async function handleShowVerdictModal(req, res) {
  const { 
    member,
    data: { custom_id }
  } = req.body;

  try {
    // Проверяем права
    const guildId = req.body.guild_id;
    const rolesSnapshot = await get(ref(db, `guild_roles/${guildId}`));
    const raceControlRoleId = rolesSnapshot.val()?.race_control_role;

    const hasPermission = member.permissions === "8" || // Администратор
                         member.roles.includes(raceControlRoleId); // Race Control

    if (!hasPermission) {
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: "❌ You don't have permission to make verdicts!",
          flags: 64
        }
      });
    }

    const ticketId = custom_id.replace('verdict_ticket_', '');

    return res.send({
      type: InteractionResponseType.MODAL,
      data: {
        title: "Make Verdict",
        custom_id: `verdict_modal_${ticketId}`,
        components: [
          {
            type: 1,
            components: [
              {
                type: 4,
                custom_id: "verdict_text",
                label: "Verdict Decision",
                style: 2, // Параграф
                min_length: 1,
                max_length: 1000,
                required: true,
                placeholder: "Enter your verdict decision..."
              }
            ]
          }
        ]
      }
    });
  } catch (error) {
    console.error('Error showing verdict modal:', error);
    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "Failed to show verdict form.",
        flags: 64
      }
    });
  }
}

// Обработчик отправки вердикта
export async function handleVerdictSubmit(req, res) {
  const { 
    guild_id,
    member: { user: { id: userId, username } },
    data: { custom_id, components }
  } = req.body;

  try {
    const ticketId = custom_id.replace('verdict_modal_', '');
    const ticket = await ticketService.getTicket(guild_id, ticketId);
    
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const verdictText = components[0].components[0].value;

    // Отправляем вердикт в ветку
    await fetch(`https://discord.com/api/v10/channels/${ticket.thread_id}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: `⚖️ **Verdict** (#${ticket.number})
> Judge: <@${userId}>
> Decision: ${verdictText}`
      })
    });

    // Обновляем тикет
    await ticketService.updateTicket(guild_id, ticketId, {
      ...ticket,
      verdict: {
        text: verdictText,
        by: {
          id: userId,
          username
        },
        at: Date.now()
      }
    });

    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "✅ Verdict has been submitted.",
        flags: 64
      }
    });

  } catch (error) {
    console.error('Error submitting verdict:', error);
    await logService.logError(guild_id, 'handleVerdictSubmit', error);
    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "Failed to submit verdict. Please try again.",
        flags: 64
      }
    });
  }
}