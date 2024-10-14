import type { Guess } from './discord';

const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const getGuessRecordedMessage = (guess: Guess) => {
  const [num1, num2] = guess.guess;
  const responses = [
    `you guessed ${num1} and ${num2}!`,
    `your guess of ${num1} and ${num2} has been recorded!`,
    `thanks for guessing ${num1} and ${num2}!`,
    `${num1} ${num2}, copy that!`,
    `${num1} and ${num2}, loud and clear!`,
    `${num1} and ${num2}! Got it!`,
    `${num1} and ${num2}? I wouldn't have guessed that high, but I have recorded it!`,
    `scribbled down on my tattered piece of notebook paper! (${num1} and ${num2})`,
    `thanks ${guess.user}! (${num1} and ${num2})`,
  ];
  return getRandom(responses);
}

const getGuessAlreadyMadeMessage = (guess: Guess) => {
  const [num1, num2] = guess.guess;
  // make 5 humorous responses to the users who have already made a guess
  const responses = [
    `You have already made a guess silly! But I have updated your guess to ${num1} and ${num2}`,
    `Hey! One guess per person! But its your lucky day because ive gone ahead and updated your guess to ${num1} and ${num2}`,
    `You are only allowed to guess once! But I have updated your guess to ${num1} and ${num2}`,
    `You can only guess once! But I have updated your guess to ${num1} and ${num2}`,
    `Nice try! But you can only guess once! I have updated your guess to ${num1} and ${num2}`,
    `Not so fast! My records indicate you have already made a guess! I have updated your guess to ${num1} and ${num2}`,
    `ONE person, ONE guess, NO exceptions! I have updated your guess to ${num1} and ${num2}`,
    `I have a strict no bullshit policy! You have already made a guess! I have updated your guess to ${num1} and ${num2}`,
    `Slow down there cowboy! You have already made a guess! I have updated your guess to ${num1} and ${num2}`,
    `Dont pin to malice what could be explained with stupidity - especially for ${guess.user}. I have updated your guess to ${num1} and ${num2}.`,
  ];
  return getRandom(responses);
}

export const messages = {
  GUESS_RECORDED: (guess: Guess) => getGuessRecordedMessage(guess),
  NO_GUESSES: 'No guesses have been made yet',
  ERROR_GETTING_GUESSES: 'There was an error getting the guesses, please try again later',
  ERROR_RECORDING_GUESS: 'There was an error recording your guess, please try again later',
  GUESS_TO_STRING: (guess: Guess) => `${guess.user} guessed ${guess.guess[0]} and ${guess.guess[1]}`,
  GUESS_ALREADY_MADE: (guess: Guess) => getGuessAlreadyMadeMessage(guess),
} as const;