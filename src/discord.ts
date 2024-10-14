import {
  Client,
  GatewayIntentBits,
  type OmitPartialGroupDMChannel,
  type Message
} from 'discord.js';
import { getGoogleOAuthAccessToken } from './constants';
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
    message.reply('No guesses have been made yet');
    return;
  }

  const guessList = guesses
    .map(({ user, guess }) => `${user} guessed ${guess[0]} and ${guess[1]}`)
    .join('\n');

  message.reply(guessList);
}

const handleGuess = async (message: OmitPartialGroupDMChannel<Message<boolean>>) => {
  // tests to see if the message contains two numbers inside square brackets
  const guessPattern = /.*\[(\d+),\s*(\d+)\].*/;
  const guess = message.content.match(guessPattern);

  if (!guess) return;

  const [_, num1, num2] = guess;
  guesses.push({
    user: message.author.username,
    guess: [parseInt(num1), parseInt(num2)]
  });

  message.reply(`Your guess of ${num1} and ${num2} has been recorded, good luck!`);
}

client.login(process.env.DISCORD_TOKEN);