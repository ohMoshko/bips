/**
 * Mathler game types
 *
 * The game state is like an Elixir struct - immutable data that represents
 * the current state of play.
 */

/** The status of a single tile after a guess is checked */
export type TileStatus = 'correct' | 'present' | 'absent' | 'empty';

/** A single tile in the game board */
export interface Tile {
  char: string;
  status: TileStatus;
}

/** The state of the game */
export type GameState = 'playing' | 'won' | 'lost';

/** A complete guess (one row of tiles) */
export type Guess = Tile[];

/** The full game state */
export interface Game {
  /** The target number to reach */
  target: number;
  /** The solution equation */
  solution: string;
  /** Previous guesses */
  guesses: Guess[];
  /** Current input (not yet submitted) */
  currentInput: string;
  /** Game state */
  state: GameState;
  /** Number of characters per guess */
  length: number;
  /** Maximum number of guesses */
  maxGuesses: number;
}

/** Valid characters in an equation */
export const VALID_CHARS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '-', '*', '/'] as const;
export type ValidChar = (typeof VALID_CHARS)[number];

/** Check if a character is valid */
export function isValidChar(char: string): char is ValidChar {
  return VALID_CHARS.includes(char as ValidChar);
}
