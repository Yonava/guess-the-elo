import { Client, GatewayIntentBits } from 'discord.js';

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

  if (message.content === 'what are the guesses') {

    if (!guesses.length) {
      message.reply('No guesses have been made yet');
      return;
    }

    const guessList = guesses
      .map(({ user, guess }) => `${user} guessed ${guess[0]} and ${guess[1]}`)
      .join('\n');
    message.reply(guessList);
    return;
  }

  // tests to see if the message contains two numbers inside square brackets
  const regex = /.*\[(\d+),\s*(\d+)\].*/;
  const guess = message.content.match(regex);

  if (guess) {
    const [_, num1, num2] = guess;
    guesses.push({
      user: message.author.username,
      guess: [parseInt(num1), parseInt(num2)]
    });
    message.reply(`Your guess of ${num1} and ${num2} has been recorded, good luck!`);
  } else {
    message.reply('that does not look like a guess to me');
  }
});

client.login(process.env.DISCORD_TOKEN);