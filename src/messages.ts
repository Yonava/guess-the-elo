import type { Guess } from './discord';

const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const gifs = {
  BLINKING_GUY: 'https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif?cid=790b7611po35danhlmyst3v0chjpd6ceycng2dvubr835ys1&ep=v1_gifs_search&rid=giphy.gif&ct=g',
  WUT_GIRL: 'https://media.giphy.com/media/kaq6GnxDlJaBq/giphy.gif?cid=790b76110dxbymnew3r6ku1lma76iathb413py3b5pz17fam&ep=v1_gifs_search&rid=giphy.gif&ct=g',
  NOTEBOOK_PENGUIN: 'https://media.giphy.com/media/LWGj0VBaxWONkMLt61/giphy.gif?cid=790b7611c6tk0ru3aaniccwujm5535vbaz14axfmr9q8g75l&ep=v1_gifs_search&rid=giphy.gif&ct=g'
}

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
    `thanks ${guess.user}! (${num1} and ${num2}) ` + gifs.NOTEBOOK_PENGUIN,
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
    `Hold your horses! You have already made a guess! I have updated your guess to ${num1} and ${num2}`,
  ];
  return getRandom(responses);
}

const getStupidGuessMessage = (guess: Guess) => {
  const [num1, num2] = guess.guess;
  const responses = [
    'Seriously?',
    'Im going to pretend I didnt see that',
    'Come back when you have a real guess',
    'You arent even trying',
    'Do you need a new keyboard? https://www.amazon.com/keyboard/s?k=keyboard',
    gifs.BLINKING_GUY,
    gifs.WUT_GIRL,
  ];
  return getRandom(responses);
}

export const messages = {
  GUESS_RECORDED: (guess: Guess) => getGuessRecordedMessage(guess),
  NO_GUESSES: 'No guesses have been made yet',
  ERROR_GETTING_GUESSES: 'There was an error getting the guesses, please try again later',
  ERROR_RECORDING_GUESS: 'There was an error recording your guess, please try again later',
  GUESS_TO_STRING: (guess: Guess) => `${guess.user} guessed ${guess.guess[0]} and ${guess.guess[1]} at ${guess.timestamp}`,
  GUESS_ALREADY_MADE: (guess: Guess) => getGuessAlreadyMadeMessage(guess),
  NEGATIVE_ELO_GUESS: 'You are supposed to submit their elo, not yours!',
  STUPID_GUESS: (guess: Guess) => getStupidGuessMessage(guess),
} as const;