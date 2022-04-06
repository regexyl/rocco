declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NAME: string;
      TIME_ZONE: string;
      DAY_START_TIME: string;
      DAY_END_TIME: string;
      WORK_TIMES: string;
      FITNESS_TIME: string;

      NODE_ENV: 'development' | 'production';
      TELEBOT_HTTP_API: string;
      TELEGRAM_USER_CHAT_ID: string;

      TWILIO_ACCOUNT_SID: string;
      TWILIO_AUTH_TOKEN: string;
      TWILIO_DISTRACTED_RECEIVER: string;
      TWILIO_MESSAGING_SID: string;

      SENDER_NAME: string;
      EMAIL_LATE_SENDER: string;
      EMAIL_LATE_SENDER_PASSWORD: string;
      EMAIL_LATE_SENDER_APP_PASSWORD: string;
      EMAIL_LATE_RECEIVER: string;
      EMAIL_REPORT_RECEIVER: string;

      SSH_HOST: string;
      SSH_USERNAME: string;
      SSH_PASSWORD: string;

      NEWS_API_KEY: string;

      WEATHER_LAT: number;
      WEATHER_LON: number;
      WEATHER_APP_ID: number;

      OCTOKIT_ACCESS_TOKEN: string;
      GITHUB_USERNAME: string;
      GIST_ID: string;
      GIST_NAME: string;

      AFFIRMATIONS_LINK: string;
      GOALS_LINK: string;
    }
  }
}

export {}