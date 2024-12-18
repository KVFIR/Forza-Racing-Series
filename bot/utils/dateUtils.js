/**
 * Validates and parses date string in format DD.MM.YYYY HH:mm
 * @param {string} dateStr - Date string to parse
 * @returns {Object} - { isValid: boolean, timestamp: number, error: string }
 */
export function parseEventDate(dateStr) {
  try {
    // Проверяем формат
    const dateRegex = /^(\d{2})\.(\d{2})\.(\d{4})\s(\d{2}):(\d{2})$/;
    const match = dateStr.match(dateRegex);
    
    if (!match) {
      return {
        isValid: false,
        error: 'Invalid date format. Use DD.MM.YYYY HH:mm'
      };
    }

    const [_, day, month, year, hours, minutes] = match;
    const date = new Date(year, month - 1, day, hours, minutes);
    const timestamp = date.getTime();

    // Проверяем, что дата в будущем
    if (timestamp <= Date.now()) {
      return {
        isValid: false,
        error: 'Event date must be in the future'
      };
    }

    // Проверяем валидность даты
    if (date.getDate() !== parseInt(day) || 
        date.getMonth() !== parseInt(month) - 1 || 
        date.getFullYear() !== parseInt(year)) {
      return {
        isValid: false,
        error: 'Invalid date'
      };
    }

    return {
      isValid: true,
      timestamp,
      error: null
    };
  } catch (error) {
    console.error('Error parsing date:', error);
    return {
      isValid: false,
      error: 'Failed to parse date'
    };
  }
}

/**
 * Formats timestamp for Discord embed
 * @param {number} timestamp - Unix timestamp
 * @returns {string} - Formatted date string
 */
export function formatEventDate(timestamp) {
  return `<t:${Math.floor(timestamp/1000)}:F>`;
} 