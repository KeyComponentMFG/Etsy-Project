/**
 * Calculate ship-by date adding business days (skipping weekends)
 */
export function calculateShipByDate(orderDate, processingDays) {
  if (!orderDate || !processingDays) return null;

  const date = new Date(orderDate);
  if (isNaN(date.getTime())) return null;

  let daysToAdd = processingDays;

  while (daysToAdd > 0) {
    date.setDate(date.getDate() + 1);
    const dayOfWeek = date.getDay();
    // Skip Saturday (6) and Sunday (0)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      daysToAdd--;
    }
  }

  return date;
}
