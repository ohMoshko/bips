import { describe, test, expect } from 'vitest';
import { checkGuess } from '../lib/guess';

/**
 * The checkGuess algorithm is tricky because of duplicates.
 *
 * Example: solution = "10+5*2", guess = "11+5*2"
 * - Position 0: guess '1', solution '1' → CORRECT (green)
 * - Position 1: guess '1', solution '0' → is '1' elsewhere? Yes, but it's already matched!
 *   So this should be ABSENT (gray), not PRESENT (yellow)
 *
 * Algorithm:
 * 1. First pass: mark all CORRECT positions
 * 2. Second pass: for each non-correct, check if char exists in unmatched solution chars
 */

describe('checkGuess', () => {
  test('all correct returns all "correct"', () => {
    const result = checkGuess('10+5*2', '10+5*2');
    expect(result).toEqual([
      'correct',
      'correct',
      'correct',
      'correct',
      'correct',
      'correct',
    ]);
  });

  test('all wrong returns all "absent"', () => {
    const result = checkGuess('999999', '10+5*2');
    // 9 is not in the solution at all
    expect(result).toEqual([
      'absent',
      'absent',
      'absent',
      'absent',
      'absent',
      'absent',
    ]);
  });

  test('character in wrong position returns "present"', () => {
    // Solution: 10+5*2
    // Guess:    01+5*2 (0 and 1 are swapped)
    const result = checkGuess('01+5*2', '10+5*2');
    expect(result).toEqual([
      'present', // 0 is in solution but wrong position
      'present', // 1 is in solution but wrong position
      'correct', // +
      'correct', // 5
      'correct', // *
      'correct', // 2
    ]);
  });

  test('handles duplicate correctly - only one match available', () => {
    // Solution: 10+5*2 (has one '1')
    // Guess:    11+5*2 (has two '1's)
    const result = checkGuess('11+5*2', '10+5*2');
    expect(result).toEqual([
      'correct', // First 1 matches
      'absent', // Second 1 - no more 1s in solution
      'correct', // +
      'correct', // 5
      'correct', // *
      'correct', // 2
    ]);
  });

  test('handles duplicate correctly - correct takes priority over present', () => {
    // Solution: 12+1*2 (has two '1's at positions 0 and 3)
    // Guess:    11+1*2 (has two '1's at 0,1 and one at 3)
    //
    // Both '1's in solution are matched by CORRECT positions (0 and 3),
    // so the extra '1' at position 1 has nothing to match → ABSENT
    const result = checkGuess('11+1*2', '12+1*2');
    expect(result).toEqual([
      'correct', // 1 at position 0 matches solution position 0
      'absent', // 1 - both solution 1s already matched as correct
      'correct', // +
      'correct', // 1 at position 3 matches solution position 3
      'correct', // *
      'correct', // 2
    ]);
  });

  test('present only awarded when not already matched as correct', () => {
    // Solution: 5+5+52 (three 5s at positions 0, 2, 4)
    // Guess:    555552 (five 5s at 0,1,2,3,4)
    //
    // Positions 0, 2, 4 are exact matches → CORRECT
    // All three solution 5s are used up
    // Positions 1, 3 have no remaining 5s to match → ABSENT
    const result = checkGuess('555552', '5+5+52');
    expect(result).toEqual([
      'correct', // 5 at position 0 matches
      'absent', // 5 - no unmatched 5s left
      'correct', // 5 at position 2 matches
      'absent', // 5 - no unmatched 5s left
      'correct', // 5 at position 4 matches
      'correct', // 2
    ]);
  });
});
