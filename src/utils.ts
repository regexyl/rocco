/**
 * Capitalize the first character of a string.
 * @param  {string} string
 * @returns string
 */
export function capitalize(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Get time in the format of {hour}:{minute}.
 * @param  {number} unixTimestamp
 * @returns string Format of {hour}:{minute}
 */
export function getTime(unixTimestamp?: number): string {
  const date = unixTimestamp ? new Date(unixTimestamp * 1000) : new Date();
  return getFormattedHourMinute(date.getHours(), date.getMinutes());
}
/**
 * Get time from a 24-hour string, e.g. 0730 -> { hour: 7, minute: 30 }
 * @param  {string} time
 * @returns {hour: number, minute: number} | undefined
 */
export function getTimeFrom24HourString(time: string):
  | {
      hour: number;
      minute: number;
    }
  | undefined {
  if (time.length !== 4) return;

  return {
    hour: Number(time.slice(0, 2)),
    minute: Number(time.slice(2, 4)),
  };
}

/**
 * Get datetime in the format of `{date} {month}, {hour}:{minute}`
 * @param  {string} isoString
 * @returns string Format of `{date} {month}, {hour}:{minute}`
 */
export function getDateTimeFromISOString(isoString: string): string {
  const date = new Date(isoString);
  const monthAbbrev = date.toLocaleString('default', { month: 'short' });
  return `${date.getDate()} ${monthAbbrev}, ${getFormattedHourMinute(
    date.getHours(),
    date.getMinutes()
  )}`;
}

export function getFormattedDate(): string {
  const date = new Date();
  return `${date.toLocaleString('default', {
    weekday: 'short',
  })}, ${date.getDate()} ${date.toLocaleString('default', {
    month: 'short',
  })} ${date.getFullYear()}`;
}
/**
 * Get time in the format of `{hour}:{minute}`
 * @param  {number} hour
 * @param  {number} minute
 * @returns string
 */
export function getFormattedHourMinute(hour: number, minute: number): string {
  return `${hour.toString().length === 1 ? '0' + hour : hour}:${
    minute.toString().length === 1 ? '0' + minute : minute
  }`;
}

/**
 * For spicing up morning greetings by attaching an adjective to user's name.
 * @returns string An adjective.
 */
export function getWeirdAdjective(): string {
  const adjectives = ['Terrible', 'Cabbage', 'Bald', 'Great', 'Bad', 'Mad'];
  return adjectives[Math.floor(Math.random() * adjectives.length)];
}
