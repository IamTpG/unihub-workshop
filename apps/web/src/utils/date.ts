/**
 * Formats a date string to a short date representation.
 * Example output: "Sun, May 10"
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

/**
 * Formats a date string to a time representation.
 * Example output: "04:00 PM"
 */
export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

/**
 * Returns the Date representing the Monday of the given date's week at 00:00:00.
 */
export const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
  return new Date(d.getFullYear(), d.getMonth(), diff, 0, 0, 0, 0);
};

/**
 * Returns the Date representing the Sunday of the given date's week at 23:59:59.
 */
export const getEndOfWeek = (date: Date): Date => {
  const start = getStartOfWeek(date);
  return new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6, 23, 59, 59, 999);
};

/**
 * Formats a start week date into a readable range.
 * Example output: "May 10 - May 16"
 */
export const formatWeekRange = (startOfWeek: Date): string => {
  const end = getEndOfWeek(startOfWeek);
  const startStr = startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${startStr} - ${endStr}`;
};
