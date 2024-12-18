/**
 * Utility functions for working with dates
 */

/**
 * Converts date string to Unix timestamp in milliseconds
 * @param {string} dateStr - Date in format "DD/MM/YYYY HH:mm"
 * @returns {number} Unix timestamp in milliseconds
 */
export function dateToTimestamp(dateStr) {
  const [date, time] = dateStr.split(' ');
  const [day, month, year] = date.split('/');
  const [hours, minutes] = time.split(':');
  
  return new Date(year, month - 1, day, hours, minutes).getTime();
}

/**
 * Formats Unix timestamp to readable date string
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Formatted date string
 */
export function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

/**
 * Checks if date string is valid
 * @param {string} dateStr - Date in format "DD/MM/YYYY HH:mm"
 * @returns {boolean} True if date is valid
 */
export function isValidDateString(dateStr) {
  if (!/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/.test(dateStr)) {
    return false;
  }

  const [date, time] = dateStr.split(' ');
  const [day, month, year] = date.split('/');
  const [hours, minutes] = time.split(':');

  const d = new Date(year, month - 1, day, hours, minutes);
  
  return d instanceof Date && !isNaN(d) &&
    d.getDate() === parseInt(day) &&
    d.getMonth() === parseInt(month) - 1 &&
    d.getFullYear() === parseInt(year) &&
    d.getHours() === parseInt(hours) &&
    d.getMinutes() === parseInt(minutes);
}

/**
 * Gets current date in "DD/MM/YYYY HH:mm" format
 * @returns {string} Current date string
 */
export function getCurrentDateString() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
} 