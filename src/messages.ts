import type { Guess } from './discord';

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

export const messages = {
  GUESS_RECORDED: (guess: Guess) => getGuessRecordedMessage(guess),
  NO_GUESSES: 'No guesses have been made yet',
  ERROR_GETTING_GUESSES: 'There was an error getting the guesses, please try again later',
  ERROR_RECORDING_GUESS: 'There was an error recording your guess, please try again later',
  GUESS_TO_STRING: (guess: Guess) => `${guess.user} guessed ${guess.guess[0]} and ${guess.guess[1]}`,
  GUESS_ALREADY_MADE: (guess: Guess) => `You have already made a guess! But I have updated your guess to ${guess.guess[0]} and ${guess.guess[1]}`,
} as const;