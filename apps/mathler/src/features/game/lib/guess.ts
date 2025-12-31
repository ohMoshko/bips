/**
 * Guess checking algorithm
 *
 * The key insight: when a character appears multiple times in the guess,
 * we need to be careful not to mark more as "present" than actually exist
 * in the solution.
 *
 * Algorithm:
 * 1. First pass: mark all exact matches as CORRECT
 * 2. Build a count of remaining (unmatched) solution characters
 * 3. Second pass: for each non-correct guess char, check if it's in the
 *    remaining pool. If yes, mark PRESENT and decrement the pool.
 *    Otherwise, mark ABSENT.
 *
 * This is like a two-phase pattern match in Elixir - first exact, then fuzzy.
 */

import type { TileStatus } from '../types';

export function checkGuess(guess: string, solution: string): TileStatus[] {
  const result: TileStatus[] = new Array(guess.length).fill('absent');

  // Track which solution characters are still available for "present" matching
  const remainingChars = new Map<string, number>();

  // Initialize counts from solution
  for (const char of solution) {
    remainingChars.set(char, (remainingChars.get(char) ?? 0) + 1);
  }

  // First pass: mark correct positions and decrement their counts
  for (let i = 0; i < guess.length; i++) {
    const guessChar = guess[i]!;
    const solutionChar = solution[i]!;

    if (guessChar === solutionChar) {
      result[i] = 'correct';
      remainingChars.set(guessChar, (remainingChars.get(guessChar) ?? 0) - 1);
    }
  }

  // Second pass: mark present/absent for non-correct positions
  for (let i = 0; i < guess.length; i++) {
    if (result[i] === 'correct') continue;

    const guessChar = guess[i]!;
    const remaining = remainingChars.get(guessChar) ?? 0;

    if (remaining > 0) {
      result[i] = 'present';
      remainingChars.set(guessChar, remaining - 1);
    } else {
      result[i] = 'absent';
    }
  }

  return result;
}
