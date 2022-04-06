import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import { ERROR_MESSAGES } from './constants';
import {
  getDayEndCronJob,
  getDayStartCronJob,
  getFitnessCronJob,
  getWorkStartCronJob,
} from './cronJobs';
import { getTime } from './utils';

export enum CallbackActions {
  START_WORK = 'start work',
  START_FITNESS = 'start fitness',
}

interface WorkStartTime {
  hour: number;
  minute: number;
}

const token =
  process.env.TELEBOT_HTTP_API ||
  (() => {
    throw new Error(ERROR_MESSAGES.TELEBOT_TOKEN);
  })();
const bot = new TelegramBot(token, { polling: true });

(function main() {
  const workStartTimes: WorkStartTime[] = (() => {
    const workStartTimesRaw = process.env.WORK_TIMES;
    return workStartTimesRaw.split(',').map((time) => {
      time = time.trim();
      return {
        hour: Number(time.slice(0, 2)),
        minute: Number(time.slice(2, 4)),
      };
    });
  })();

  // Limitation: process.env.WORK_TIMES cannot have intervals of < 2 min
  let status = { startedWork: false, startedFitness: false };

  getDayStartCronJob(bot).start();
  getFitnessCronJob(bot, status).start();
  getDayEndCronJob(bot).start();

  workStartTimes.forEach(({ hour, minute }) => {
    getWorkStartCronJob(bot, hour, minute, status).start();
  });

  // Anticipate inline keyboard responses
  bot.on('callback_query', function (query: TelegramBot.CallbackQuery) {
    try {
      if (!query.message) {
        throw new Error('Query does not have message property.');
      }

      const {
        text,
        message_id,
        chat: { id: chat_id },
      } = query.message;

      switch (query.data) {
        case CallbackActions.START_WORK:
          if (!status.startedWork) {
            bot.sendMessage(
              process.env.TELEGRAM_USER_CHAT_ID,
              `🙇🏻‍♀️ Started work at ${getTime()}.`
            );
          }
          status.startedWork = true;
          break;

        case CallbackActions.START_FITNESS:
          if (!status.startedFitness) {
            bot.sendMessage(
              process.env.TELEGRAM_USER_CHAT_ID,
              `🏋🏻‍♂️ Started fitness at ${getTime()}.`
            );
          }
          status.startedFitness = true;
          break;

        default:
          break;
      }

      bot.editMessageText(text || '', {
        chat_id,
        message_id,
        reply_markup: undefined,
      });
    } catch (error) {
      console.error(error);
    }
  });
})();
