import { CronJob } from 'cron';
import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import { getNewsItem, getWeatherInfo } from '../functions';
import {
  capitalize,
  getDateTimeFromISOString,
  getTime,
  getWeirdAdjective,
} from '../utils';

export function getDayStartCronJob(bot: TelegramBot): CronJob {
  return new CronJob(
    '30 7 * * *',
    async function generateDayStartMessage() {
      const [day, month, date, year] = String(new Date())
        .split(' ')
        .slice(0, 4);
      const weatherItem = await getWeatherInfo();
      const newsItem = await getNewsItem();
      const adjective = getWeirdAdjective();

      function getWeatherItemString() {
        const { temperature, description, sunrise, sunset, location } =
          weatherItem!;

        return `${capitalize(description)}
  ${capitalize(location)} ${Math.round(temperature.hi)}° / ${Math.round(
          temperature.lo
        )}°
  Sunrise ${getTime(sunrise)} Sunset ${getTime(sunset)}`;
      }

      function getNewsItemString() {
        const { author, title, description, url, publishedAt } = newsItem!;

        return `<i>${author}</i> - ${title}
  Published: ${getDateTimeFromISOString(publishedAt)}
  
  ${description} <i><a href="${url}">Read more.</a></i>`;
      }

      const message = `
  <b>${day}, ${date} ${month} ${year}</b>
  
  Good morning, ${process.env.NAME}${adjective ? ` the ${adjective}` : ''}.
  
  <b>🌡️ Weather</b>
  ${weatherItem ? getWeatherItemString() : 'No weather data to display.'}
  
  <b>📰 News of the Day</b>
  ${newsItem ? getNewsItemString() : 'No news data to display.'}
  
  <b>🚁 Daily Dose</b>
  <a href="${process.env.AFFIRMATIONS_LINK}">Your affirmations</a>
  <a href="${process.env.GOALS_LINK}">Your goals</a>
      `;

      bot.sendMessage(process.env.TELEGRAM_USER_CHAT_ID, message, {
        disable_web_page_preview: true,
        parse_mode: 'HTML',
      });

      return message;
    },
    null,
    true,
    process.env.TIME_ZONE
  );
}
