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
  timestamp?: string;
}

const getGuessTimestamp = () => new Date().toLocaleTimeString('en-US', {
  timeZone: 'America/New_York',
  hour: '2-digit',
  minute: '2-digit'
});

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

  // TEMP TEMP TEMP ONLY FOR TESTING!!!!
  // const [ firstWordOfMessage ] = message.content.split(' ')
  // message.author.username = firstWordOfMessage;
  // ------------------------------

  const messageContent = message.content.toLowerCase();

  switch (true) {
    case messageContent.includes('who guessed what'):
      handleGuessListRequest(message);
      break;
    case messageContent.includes('reset guesses'):
      handleResetGuesses(message);
      break;
    default:
      handleGuess(message);
      break;
  }
});

const handleResetGuesses = async (message: OmitPartialGroupDMChannel<Message<boolean>>) => {
  try {
    await resetGuesses();
  } catch (error) {
    console.error('Error resetting guesses:', error);
    message.reply(messages.ERROR_RECORDING_GUESS);
    return;
  }

  message.reply(messages.GUESS_RESET_SUCCESS);
}

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
  const guessPattern = /.*\[\s*(-?\d+),\s*(-?\d+)\s*\].*/;
  const guess = message.content.match(guessPattern);

  if (!guess) return;

  const [_, num1, num2] = guess;

  const guessData: Guess = {
    user: message.author.username,
    guess: [parseInt(num1), parseInt(num2)]
  }

  if (guessData.guess[0] < 0 || guessData.guess[1] < 0) {
    message.reply(messages.NEGATIVE_ELO_GUESS);
    return
  }

  if (guessData.guess[0] < 100 || guessData.guess[1] < 100) {
    message.reply(messages.STUPID_GUESS(guessData));
    return
  }

  if (guessData.guess[0] > 3500 || guessData.guess[1] > 3500) {
    message.reply(messages.STUPID_GUESS(guessData));
    return
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
  const guessArray = [guess.user, guess.guess[0], guess.guess[1], getGuessTimestamp()];
  try {
    await sheet.postInRange(GUESS_TARGET_SHEET_RANGE, [guessArray]);
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
        guess: [parseInt(row[1]), parseInt(row[2])],
        timestamp: row[3]
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
  const guessArray = [guess.user, guess.guess[0], guess.guess[1], getGuessTimestamp()];
  try {
    await sheet.updateByRow(GUESS_TARGET_SHEET_RANGE, row, [guessArray]);
  } catch (error) {
    console.error('Error updating guess:', error);
    throw error;
  }
}

const resetGuesses = async () => {
  const accessToken = await getGoogleOAuthAccessToken();
  if (!accessToken) {
    console.error(AUTH_ERRORS.INVALID_GOOGLE_OAUTH_ACCESS_TOKEN, 'No access token found');
    return
  }

  const sheet = new GoogleSheet(accessToken);
  try {
    const rows = await sheet.getRange(GUESS_TARGET_SHEET_RANGE);
    if (!rows || !rows[0]) throw new Error('No rows found');
    const [headerRow] = rows;
    await sheet.replaceRange(GUESS_TARGET_SHEET_RANGE, [headerRow]);
  } catch (error) {
    console.error('Error resetting guesses:', error);
    throw error;
  }
}

client.login(process.env.DISCORD_TOKEN);