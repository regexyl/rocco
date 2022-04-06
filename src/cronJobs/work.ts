import { CronJob } from 'cron';
import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import { CallbackActions } from '..';
import { sendPenaltyEmail } from '../functions';
import { getTime } from '../utils';

export function getWorkStartCronJob(
  bot: TelegramBot,
  hour: number,
  minute: number,
  workStatus: { startedWork: boolean }
) {
  return new CronJob(
    `${minute} ${hour} * * *`,
    async function generateWorkStartMessage() {
      const message = `It's ${getTime()}! Ready to start deep work? ⏱`;
      const response = await bot.sendMessage(
        process.env.TELEGRAM_USER_CHAT_ID,
        message,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'Yup, starting work now.',
                  callback_data: CallbackActions.START_WORK,
                },
              ],
            ],
          },
        }
      );

      const {
        text,
        message_id,
        chat: { id: chat_id },
      } = response;

      setTimeout(async () => {
        if (!workStatus.startedWork) {
          const response = await sendPenaltyEmail();
          let penaltySendStatus: string;

          if (response && response.status === 200) {
            penaltySendStatus = `Penalty email sent to ${process.env.EMAIL_LATE_RECEIVER}`;
          } else {
            penaltySendStatus = `Penalty email had failed to be sent to ${process.env.EMAIL_LATE_RECEIVER}`;
          }

          bot.sendMessage(
            process.env.TELEGRAM_USER_CHAT_ID,
            '‼️ Late! ' + penaltySendStatus
          );

          // Remove inline btn to prevent additional clicking
          bot.editMessageText(text || '', {
            chat_id,
            message_id,
            reply_markup: undefined,
          });
        }

        workStatus.startedWork = false;
      }, 2 * 60 * 1000);
    },
    null,
    true,
    process.env.TIME_ZONE
  );
}
