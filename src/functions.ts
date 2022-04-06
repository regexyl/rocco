import 'dotenv/config';
import { google } from 'googleapis';
import fetch from 'node-fetch';
import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import twilio from 'twilio';
import { MessageStatus } from 'twilio/lib/rest/api/v2010/account/message';
import { getTime } from './utils';

export interface WeatherAPIResponse {
  lat: number;
  lon: number;
  timezone: string; // e.g. "Asia/Singapore"
  timezone_offset: number; // 28800
  daily: {
    dt: number;
    sunrise: number;
    sunset: number;
    temp: {
      day: number;
      min: number;
      max: number;
    };
    weather: {
      main: string; // e.g. "Rain"
      description: string; // e.g. "light rain"
    }[];
  }[];
}

export interface WeatherResult {
  temperature: {
    hi: number;
    lo: number;
  };
  description: string;
  sunrise: number;
  sunset: number;
  location: string;
}

export async function getWeatherInfo(): Promise<WeatherResult | void> {
  const requestOptions = {
    method: 'GET',
    redirect: 'follow' as RequestRedirect,
  };

  let weatherResult: WeatherResult;
  const lat = process.env.WEATHER_LAT;
  const lon = process.env.WEATHER_LON;
  const weatherAppId = process.env.WEATHER_APP_ID;

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=current,minutely,hourly,alerts&appid=${weatherAppId}&units=metric`,
      requestOptions
    );

    const resultObject = (await response.json()) as WeatherAPIResponse;
    const forecastToday = resultObject.daily[0];

    weatherResult = {
      temperature: {
        hi: forecastToday.temp.max,
        lo: forecastToday.temp.min,
      },
      description: forecastToday.weather[0].description,
      sunrise: forecastToday.sunrise,
      sunset: forecastToday.sunset,
      location: resultObject.timezone.split('/')[1],
    };

    return weatherResult;
  } catch (error) {
    console.error(error);
  }
}

export interface NewsAPIResponse {
  status: 'ok' | string;
  totalResults: number;
  articles: {
    source: {
      id: string; // e.g. "bbc-news"
      name: string; // e.g. "BBC News"
    };
    author: string;
    title: string;
    description: string;
    url: string;
    publishedAt: string;
  }[];
}

export interface NewsResult {
  author: string;
  title: string;
  description: string;
  url: string;
  publishedAt: string;
}

export async function getNewsItem(): Promise<NewsResult | void> {
  const newsApi = `https://newsapi.org/v2/top-headlines?sources=bbc-news`;

  try {
    const response = await fetch(newsApi, {
      method: 'GET',
      headers: { 'x-api-key': process.env.NEWS_API_KEY },
    });

    const resultObject = (await response.json()) as NewsAPIResponse;
    const { author, title, description, url, publishedAt } =
      resultObject.articles[0]; // first news item

    return {
      author,
      title,
      description,
      url,
      publishedAt, // e.g. 2022-04-04T02:22:24.6022153Z (ISO 8601 date)
    };
  } catch (error) {
    console.error(error);
  }
}

export async function sendPenaltySms(body: string): Promise<MessageStatus> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const client = twilio(accountSid, authToken);

  const message = await client.messages.create({
    messagingServiceSid: process.env.TWILIO_MESSAGING_SID,
    to: process.env.TWILIO_DISTRACTED_RECEIVER,
    body,
  });

  return message.status;
}

// TODO: Customize email title and body
export async function sendPenaltyEmail(): Promise<void | {
  result: SMTPTransport.SentMessageInfo;
  status: number;
}> {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
  );
  oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

  console.log(`Email: Delivering to ${process.env.EMAIL_LATE_RECEIVER}`);

  try {
    const accessToken = await oAuth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_LATE_SENDER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        accessToken,
      },
    } as SMTPTransport.Options);

    const result = await transporter.sendMail({
      from: `Rocco the GoodBot 🦊 <${process.env.EMAIL_LATE_SENDER}>`,
      to: process.env.EMAIL_LATE_RECEIVER,
      cc: process.env.EMAIL_REPORT_RECEIVER,
      subject: `${getTime()}: ${process.env.NAME} is starting late at work!`,
      text: `Bad News\n${process.env.NAME} has unfortunately started work late.`,
      html: `<h1>Bad News</h1><p>${process.env.NAME} has unfortunately started work late.</p>`,
    });

    return {
      result,
      status: 200,
    };
  } catch (error) {
    console.log(error);
  }
}

// /**
//  * TODO: Block off time during the day for ad-hoc activities where Rocco will
//  * not penalize for lateness or unresponsiveness
//  * @param startTime
//  * @param endTime
//  */
// export function adHocSilenceRocco(startTime: number, endTime: number) {}
