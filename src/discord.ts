import {
  Client,
  GatewayIntentBits,
  type OmitPartialGroupDMChannel,
  type Message
} from 'discord.js';
import { getGoogleOAuthAccessToken, AUTH_ERRORS } from './constants';
import GoogleSheet from './sheets';

type Guess = {
  user: string;
  guess: [number, number];
}

const guesses: Guess[] = [];

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
  if (!guesses.length) {
    message.reply('No guesses have been made yet!');
    return;
  }

  const guessList = guesses
    .map(({ user, guess }) => `${user} guessed ${guess[0]} and ${guess[1]}`)
    .join('\n');

  message.reply(guessList);
}

const getGuessRecordedMessage = (guess: Guess) => {
  const responses = [
    `you guessed ${guess.guess[0]} and ${guess.guess[1]}!`,
    `your guess of ${guess.guess[0]} and ${guess.guess[1]} has been recorded!`,
    `thanks for guessing ${guess.guess[0]} and ${guess.guess[1]}!`,
    `${guess.guess[0]} ${guess.guess[1]}, copy that!`,
    `${guess.guess[0]} and ${guess.guess[1]}, loud and clear!`,
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
  const guessToArray = [guess.user, guess.guess[0], guess.guess[1], new Date().toLocaleTimeString()];
  const sheetRow = guessToArray.map((guess) => guess.toString());
  await sheet.postInRange('Sheet1', [sheetRow]);
}

client.login(process.env.DISCORD_TOKEN);