import {
  Client,
  GatewayIntentBits,
  type OmitPartialGroupDMChannel,
  type Message
} from 'discord.js';
import { getGoogleOAuthAccessToken, AUTH_ERRORS, GUESS_TARGET_SHEET_RANGE } from './constants';
import GoogleSheet from './sheets';

type Guess = {
  user: string;
  guess: [number, number];
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
});

client.on('ready', (c) => {
  console.log(`${c.user.username} is online!`);
});

client.on('messageCreate', (message) => {
  if (message.author.bot) return;

  switch (message.content) {
    case 'guess list':
      handleGuessListRequest(message);
      break;
    default:
      handleGuess(message);
      break;
  }
});

const handleGuessListRequest = async (message: OmitPartialGroupDMChannel<Message<boolean>>) => {

  let guesses: Guess[] = [];
  try {
    guesses = await getGuesses();
  } catch (error) {
    console.error('Error getting guesses:', error);
    message.reply('There was an error getting the guesses, please try again later');
    return;
  }

  if (!guesses.length) {
    message.reply('No guesses have been made yet');
    return;
  }

  const guessList = guesses
    .map(({ user, guess }) => `${user} guessed ${guess[0]} and ${guess[1]}`)
    .join('\n');

  message.reply(guessList);
}

const getGuessRecordedMessage = (guess: Guess) => {
  const [num1, num2] = guess.guess;
  const responses = [
    `you guessed ${num1} and ${num2}!`,
    `your guess of ${num1} and ${num2} has been recorded!`,
    `thanks for guessing ${num1} and ${num2}!`,
    `${num1} ${num2}, copy that!`,
    `${num1} and ${num2}, loud and clear!`,
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

const handleGuess = async (message: OmitPartialGroupDMChannel<Message<boolean>>) => {
  // tests to see if the message contains two numbers inside square brackets
  const guessPattern = /.*\[(\d+),\s*(\d+)\].*/;
  const guess = message.content.match(guessPattern);

  if (!guess) return;

  const [_, num1, num2] = guess;

  const guessData: Guess = {
    user: message.author.username,
    guess: [parseInt(num1), parseInt(num2)]
  }

  try {
    const guesses = await getGuesses();
    const existingGuess = guesses.find((g) => g.user === guessData.user);
    if (existingGuess) {
      message.reply(`You have already made a guess! But I have updated your guess to ${num1} and ${num2}`);
      return;
    }
  } catch (error) {
    console.error('Error getting guesses:', error);
    message.reply('There was an error taking your guess, please try again later');
    return;
  }

  try {
    await enterGuess(guessData);
  } catch (error) {
    console.error('Error entering guess:', error);
    message.reply('There was an error entering your guess, please try again later');
    return;
  }

  const confirmationMessage = getGuessRecordedMessage(guessData);
  message.reply(confirmationMessage);
}

const enterGuess = async (guess: Guess) => {
  const accessToken = await getGoogleOAuthAccessToken();
  if (!accessToken) {
    console.error(AUTH_ERRORS.INVALID_GOOGLE_OAUTH_ACCESS_TOKEN, 'No access token found');
    return
  }
  const sheet = new GoogleSheet(accessToken);
  const guessArray = [guess.user, guess.guess[0], guess.guess[1], new Date().toLocaleTimeString()];
  const sheetRow = guessArray.map((guess) => guess.toString());
  try {
    await sheet.postInRange(GUESS_TARGET_SHEET_RANGE, [sheetRow]);
  } catch (error) {
    console.error('Error entering guess:', error);
    throw error;
  }
}

const getGuesses = async (): Promise<Guess[]> => {

  const accessToken = await getGoogleOAuthAccessToken();
  if (!accessToken) {
    console.error(AUTH_ERRORS.INVALID_GOOGLE_OAUTH_ACCESS_TOKEN, 'No access token found');
    throw AUTH_ERRORS.INVALID_GOOGLE_OAUTH_ACCESS_TOKEN;
  }

  const sheet = new GoogleSheet(accessToken);

  try {
    const data = await sheet.getRange(GUESS_TARGET_SHEET_RANGE);

    if (!data) return [];

    // remove the header row
    return data.slice(1).map((row) => {
      return {
        user: row[0],
        guess: [parseInt(row[1]), parseInt(row[2])]
      }
    });

  } catch (error) {
    console.error('Error getting guesses:', error);
    throw error;
  }
}

client.login(process.env.DISCORD_TOKEN);