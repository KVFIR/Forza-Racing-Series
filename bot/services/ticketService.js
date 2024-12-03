import { ref, set, get, push } from 'firebase/database';
import { db } from '../firebase.js';

class TicketService {
  /**
   * Создает новый тикет
   */
  async createTicket(guildId, ticketData) {
    const ticketsRef = ref(db, `tickets/${guildId}`);
    const newTicketRef = push(ticketsRef);
    
    await set(newTicketRef, {
      ...ticketData,
      created_at: Date.now(),
      status: 'open'
    });

    return {
      ticketId: newTicketRef.key,
      ticket: ticketData
    };
  }

  /**
   * Закрывает тикет
   */
  async closeTicket(guildId, ticketId) {
    const ticketRef = ref(db, `tickets/${guildId}/${ticketId}`);
    const snapshot = await get(ticketRef);
    
    if (!snapshot.exists()) {
      throw new Error('Ticket not found');
    }

    const ticket = snapshot.val();
    ticket.status = 'closed';
    ticket.closed_at = Date.now();

    await set(ticketRef, ticket);
    return ticket;
  }

  /**
   * Получает тикет по ID
   */
  async getTicket(guildId, ticketId) {
    const ticketRef = ref(db, `tickets/${guildId}/${ticketId}`);
    const snapshot = await get(ticketRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    return {
      ...snapshot.val(),
      id: ticketId
    };
  }

  /**
   * Обновляет тикет
   */
  async updateTicket(guildId, ticketId, ticketData) {
    const ticketRef = ref(db, `tickets/${guildId}/${ticketId}`);
    await set(ticketRef, ticketData);
    
    // Получаем и возвращаем обновленный тикет
    return await this.getTicket(guildId, ticketId);
  }

  /**
   * Получает следующий номер тикета
   */
  async getNextTicketNumber(guildId) {
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
}

export const ticketService = new TicketService();