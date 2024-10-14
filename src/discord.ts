import {
  Client,
  GatewayIntentBits,
  type OmitPartialGroupDMChannel,
  type Message
} from 'discord.js';
import { getGoogleOAuthAccessToken, AUTH_ERRORS, GUESS_TARGET_SHEET_RANGE } from './constants';
import GoogleSheet from './sheets';
import { messages } from './messages';

export type Guess = {
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
    message.reply(messages.ERROR_GETTING_GUESSES);
    return;
  }

  if (!guesses.length) {
    message.reply(messages.NO_GUESSES);
    return;
  }

  const guessList = guesses
    .map((g) => messages.GUESS_TO_STRING(g))
    .join('\n');

  message.reply(guessList);
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
    const existingGuessIndex = guesses.findIndex((g) => g.user === guessData.user);
    if (existingGuessIndex !== -1) {
      message.reply(messages.GUESS_ALREADY_MADE(guessData));
      // 1 for 0 index, 1 for header row = 2
      await updateGuess(existingGuessIndex + 2, guessData);
      return;
    }
  } catch (error) {
    console.error('Error getting guesses:', error);
    message.reply(messages.ERROR_RECORDING_GUESS);
    return;
  }

  try {
    await enterGuess(guessData);
  } catch (error) {
    console.error('Error entering guess:', error);
    message.reply(messages.ERROR_RECORDING_GUESS);
    return;
  }

  const confirmationMessage = messages.GUESS_RECORDED(guessData);
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

const updateGuess = async (row: number, guess: Guess) => {
  const accessToken = await getGoogleOAuthAccessToken();
  if (!accessToken) {
    console.error(AUTH_ERRORS.INVALID_GOOGLE_OAUTH_ACCESS_TOKEN, 'No access token found');
    return
  }
  const sheet = new GoogleSheet(accessToken);
  const guessArray = [guess.user, guess.guess[0], guess.guess[1], new Date().toLocaleTimeString()];
  const sheetRow = guessArray.map((guess) => guess.toString());
  try {
    await sheet.updateByRow(GUESS_TARGET_SHEET_RANGE, row, [sheetRow]);
  } catch (error) {
    console.error('Error updating guess:', error);
    throw error;
  }
}

client.login(process.env.DISCORD_TOKEN);