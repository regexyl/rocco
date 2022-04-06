import { CronJob } from 'cron';
import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import { MessageStatus } from 'twilio/lib/rest/api/v2010/account/message';
import { CallbackActions } from '..';
import { sendPenaltySms } from '../functions';
import { getTime, getTimeFrom24HourString } from '../utils';

export function getFitnessCronJob(
  bot: TelegramBot,
  status: { startedFitness: boolean }
): CronJob {
  const time = getTimeFrom24HourString(process.env.FITNESS_TIME);

  if (!time) {
    throw new Error(`FITNESS_TIME is ${time}`);
  }
  const { hour, minute } = time;

  return new CronJob(
    `${minute} ${hour} * * *`,
    async function induceComputerSleep() {
      const message = `It's ${getTime()}! Ready to start fitness? ⏱`;
      const response = await bot.sendMessage(
        process.env.TELEGRAM_USER_CHAT_ID,
        message,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'Yup, starting fitness now.',
                  callback_data: CallbackActions.START_FITNESS,
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

      // Give a 2-minute window to respond
      setTimeout(async () => {
        if (!status.startedFitness) {
          const sender = process.env.SENDER_NAME;
          const status = await sendPenaltySms(
            `${sender} is late for fitness time :( Treason!`
          );

          const satisfactoryStatuses: Set<MessageStatus> = new Set([
            'sent',
            'delivered',
            'accepted',
          ]);
          const telegramUpdate = satisfactoryStatuses.has(status)
            ? 'Penalty message sent'
            : `Penalty message ${status}`;
          if (!satisfactoryStatuses.has(status)) {
            bot.sendMessage(
              process.env.TELEGRAM_USER_CHAT_ID,
              `‼️ Late-for-fitness: ${telegramUpdate}`
            );
          }

          // Remove inline btn to prevent additional clicking
          bot.editMessageText(text || '', {
            chat_id,
            message_id,
            reply_markup: undefined,
          });
        }

        status.startedFitness = false;
      }, 2 * 60 * 1000);
    },
    null,
    true,
    process.env.TIME_ZONE
  );
}

/**
 * Note to myself: I originally wanted to SSH from a remote server to my local machine to
 * induce sleep mode, but decided not due to potential risks.
 *
 * SSH - How it works https://kb.iu.edu/d/aews

 * The following works given that the private and public keys are in their
 * respective locations (listed below).
 *
 *  1. Public-private key pair is generated on the local machine (i.e. the
 *     machine that wants to connect to the remote system, aka 'Originator' in
 *     this case) via `ssh-keygen -t rsa`
 *  2. Both files are generated in ~/.ssh/id_rsa and ~/.ssh/id_rsa.pub
 *  3. The public key has to be copied to the remote server (aka 'Remote',
 *     usually via SFTP or SCP) into ~/.ssh/authorized_keys.
 *  4. Access is now ready! ssh from Originator to Remote like this `ssh
 *     username@host2.somewhere.edu`.
 *  5. If you've previously allowed for a passphrase, you'd need to key in the
 *     passphrase before accessing Remote.
 *
 * In summary
 *
 *  For remote server (aka my local machine in this case):
 *   - sshpass (official build - `apt-get install sshpass`) for providing the
 *     SSH passphrase without a prompt (https://gist.github.com/arunoda/7790979)
 *    - To use this on Originator, you need to ssh as usual first to add remote
 *      to the list of known_hosts.
 *   - Public key (stored in ~/.ssh/authorized_keys)
 *   - An additional passphrase requirement
 *
 *  For local server (aka the Heroku system):
 *    - Private key (stored in ~/.ssh/id_rsa)
*/
