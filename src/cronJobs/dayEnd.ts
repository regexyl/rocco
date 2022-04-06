import { Octokit } from '@octokit/core';
import { CronJob } from 'cron';
import 'dotenv/config';
import TelegramBot, { Message } from 'node-telegram-bot-api';
import { getFormattedDate, getTimeFrom24HourString } from '../utils';

export function getDayEndCronJob(bot: TelegramBot): CronJob {
  const time = getTimeFrom24HourString(process.env.DAY_END_TIME);

  if (!time) {
    throw new Error(`FITNESS_TIME is ${time}`);
  }
  const { hour, minute } = time;

  return new CronJob(
    `${minute} ${hour} * * *`,
    async function getEODSummaryMessage() {
      /**
       * 1. Send message to user at DAY_END_TIME for a summary of day
       * 2. Retrieve summary
       * 3. Check if the month summary file exists (in the format: 2022-04.md)
       *  - If it doesn't create it
       * 4. Append the summary to 2 lines below the title
       */

      const message = await bot.sendMessage(
        process.env.TELEGRAM_USER_CHAT_ID,
        'Record your summary for the day 📝',
        { reply_markup: { force_reply: true } }
      );

      const listenerID = bot.onReplyToMessage(
        Number(process.env.TELEGRAM_USER_CHAT_ID),
        message.message_id,
        async (reply: Message) => {
          if (!reply.text) return;

          await updateGist(reply.text);

          const dailySummaryReply = `<a href="https://gist.github.com/${process.env.GITHUB_USERNAME}/${process.env.GIST_ID}">Your daily summary gist</a>`;
          await bot.sendMessage(
            process.env.TELEGRAM_USER_CHAT_ID,
            dailySummaryReply,
            {
              disable_web_page_preview: true,
              parse_mode: 'HTML',
            }
          );

          bot.removeReplyListener(listenerID);
        }
      );

      if (!message) {
        throw new Error(`Bot is unable to send EOD message: ${message}`);
      }
    },
    null,
    true,
    process.env.TIME_ZONE
  );
}

async function updateGist(dailySummary: string): Promise<void> {
  const octokit = new Octokit({ auth: process.env.OCTOKIT_ACCESS_TOKEN });

  const gistFileName = process.env.GIST_NAME;
  const gistID = process.env.GIST_ID;

  try {
    const {
      data: {
        files: {
          [gistFileName]: { content: gistContentCurrent },
        },
      },
    } = await octokit.request(`GET /gists/${gistID}`, {
      gist_id: gistID,
    });

    const [title, content] = gistContentCurrent.split(/\n(.*)/s);

    // Get content from Telegram input
    const newContent = dailySummary;
    const oldContent = content ? '\n\n' + content.trim() : '';

    const dateFormatted = getFormattedDate();
    const gistContentUpdated =
      title + '\n\n' + `### ${dateFormatted}\n` + newContent + oldContent;

    await octokit.request(`PATCH /gists/${gistID}`, {
      gist_id: gistID,
      files: {
        [gistFileName]: { content: gistContentUpdated },
      },
    });
  } catch (error) {
    console.error(error);
  }
}
