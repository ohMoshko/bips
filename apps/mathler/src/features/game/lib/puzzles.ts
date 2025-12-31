/**
 * Puzzle generation for Mathler
 *
 * Each puzzle has a target number and a solution equation.
 * For now, we'll use a curated list. In production, you'd generate
 * these dynamically or fetch from a server.
 */

export interface Puzzle {
  target: number;
  solution: string;
}

// Curated puzzles - all solutions are 6 characters
const PUZZLES: Puzzle[] = [
  { target: 42, solution: '50-8*1' },
  { target: 20, solution: '10+5*2' },
  { target: 15, solution: '9+6*01' },
  { target: 24, solution: '8*4-08' },
  { target: 36, solution: '72/2+0' },
  { target: 100, solution: '99+1+0' },
  { target: 48, solution: '6*9-06' },
  { target: 30, solution: '5*7-05' },
  { target: 18, solution: '3*6*01' },
  { target: 27, solution: '9*3+00' },
  { target: 35, solution: '7*5+00' },
  { target: 12, solution: '2*6+00' },
  { target: 45, solution: '9*5+00' },
  { target: 28, solution: '4*7+00' },
  { target: 21, solution: '3*7+00' },
];

/**
 * Get today's puzzle based on the date.
 * This ensures everyone gets the same puzzle on the same day.
 */
export function getDailyPuzzle(): Puzzle {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const index = dayOfYear % PUZZLES.length;
  return PUZZLES[index]!;
}

/**
 * Get a random puzzle (for practice mode)
 */
export function getRandomPuzzle(): Puzzle {
  const index = Math.floor(Math.random() * PUZZLES.length);
  return PUZZLES[index]!;
}

/**
 * Get a specific puzzle by index
 */
export function getPuzzle(index: number): Puzzle {
  return PUZZLES[index % PUZZLES.length]!;
}
