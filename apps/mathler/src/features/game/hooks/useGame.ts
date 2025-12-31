import { useReducer, useCallback } from 'react';
import type { Game, GameState, Guess, Tile, ValidChar } from '../types';
import { isValidChar } from '../types';
import { checkGuess } from '../lib/guess';
import { evaluateExpression, isValidExpression } from '../lib/equation';
import { getDailyPuzzle, type Puzzle } from '../lib/puzzles';

const EQUATION_LENGTH = 6;
const MAX_GUESSES = 6;

type GameAction =
  | { type: 'ADD_CHAR'; char: ValidChar }
  | { type: 'BACKSPACE' }
  | { type: 'DELETE' }
  | { type: 'SUBMIT' }
  | { type: 'RESET'; puzzle?: Puzzle }
  | { type: 'USE_HINT'; position: number; char: string }
  | { type: 'MOVE_LEFT' }
  | { type: 'MOVE_RIGHT' }
  | { type: 'SET_CURSOR'; position: number };

interface GameWithError extends Game {
  error: string | null;
  cursorPosition: number;
}

function createInitialState(puzzle: Puzzle = getDailyPuzzle()): GameWithError {
  return {
    target: puzzle.target,
    solution: puzzle.solution,
    guesses: [],
    currentInput: '',
    state: 'playing',
    length: EQUATION_LENGTH,
    maxGuesses: MAX_GUESSES,
    error: null,
    cursorPosition: 0,
  };
}

function gameReducer(state: GameWithError, action: GameAction): GameWithError {
  // Clear error on any action
  const clearedState = { ...state, error: null };

  switch (action.type) {
    case 'ADD_CHAR': {
      if (state.state !== 'playing') return clearedState;

      // Always replace at cursor position (overwrite mode)
      // Pad input with spaces if needed to reach cursor position
      let paddedInput = state.currentInput.padEnd(state.cursorPosition, ' ');

      // Replace character at cursor position
      const newInput =
        paddedInput.slice(0, state.cursorPosition) +
        action.char +
        state.currentInput.slice(state.cursorPosition + 1);

      // Move cursor right (but not past the end)
      const newCursor = Math.min(state.cursorPosition + 1, state.length - 1);

      return {
        ...clearedState,
        currentInput: newInput,
        cursorPosition: newCursor,
      };
    }

    case 'BACKSPACE':
    case 'DELETE': {
      if (state.state !== 'playing') return clearedState;

      // Clear the character at cursor position
      const paddedInput = state.currentInput.padEnd(state.length, ' ');
      const newInput = (
        paddedInput.slice(0, state.cursorPosition) +
        ' ' +
        paddedInput.slice(state.cursorPosition + 1)
      ).trimEnd();

      return {
        ...clearedState,
        currentInput: newInput,
      };
    }

    case 'MOVE_LEFT': {
      if (state.state !== 'playing') return clearedState;
      return {
        ...clearedState,
        cursorPosition: Math.max(0, state.cursorPosition - 1),
      };
    }

    case 'MOVE_RIGHT': {
      if (state.state !== 'playing') return clearedState;
      return {
        ...clearedState,
        cursorPosition: Math.min(state.length - 1, state.cursorPosition + 1),
      };
    }

    case 'SET_CURSOR': {
      if (state.state !== 'playing') return clearedState;
      return {
        ...clearedState,
        cursorPosition: Math.max(0, Math.min(state.length - 1, action.position)),
      };
    }

    case 'SUBMIT': {
      if (state.state !== 'playing') return clearedState;
      if (state.currentInput.length !== state.length) {
        return { ...state, error: 'Not enough characters' };
      }

      // Validate expression
      if (!isValidExpression(state.currentInput)) {
        return { ...state, error: 'Invalid expression' };
      }

      // Check if it equals the target
      const result = evaluateExpression(state.currentInput);
      if (result !== state.target) {
        return { ...state, error: `Expression must equal ${state.target}` };
      }

      // Create the guess with tile statuses
      const statuses = checkGuess(state.currentInput, state.solution);
      const guess: Guess = state.currentInput.split('').map((char, i) => ({
        char,
        status: statuses[i]!,
      }));

      const newGuesses = [...state.guesses, guess];
      // Win if all tiles are correct (supports cumulative solutions)
      // e.g., if solution is "1+5*15" but user enters "15*5+1", both equal 76
      // The user wins when all characters match the solution positions
      const isWin = statuses.every((s) => s === 'correct');
      const isLoss = !isWin && newGuesses.length >= state.maxGuesses;

      let newState: GameState = 'playing';
      if (isWin) newState = 'won';
      else if (isLoss) newState = 'lost';

      return {
        ...clearedState,
        guesses: newGuesses,
        currentInput: '',
        state: newState,
        cursorPosition: 0,
      };
    }

    case 'RESET': {
      return createInitialState(action.puzzle);
    }

    case 'USE_HINT': {
      // Hint reveals a character at a specific position
      // This will be triggered by a Bips purchase
      if (state.state !== 'playing') return clearedState;

      // Build the new input with the hint character
      let newInput = state.currentInput.padEnd(state.length, ' ');
      newInput =
        newInput.slice(0, action.position) +
        action.char +
        newInput.slice(action.position + 1);
      newInput = newInput.trimEnd();

      return {
        ...clearedState,
        currentInput: newInput,
      };
    }

    default:
      return clearedState;
  }
}

export function useGame(initialPuzzle?: Puzzle) {
  const [state, dispatch] = useReducer(
    gameReducer,
    initialPuzzle ?? getDailyPuzzle(),
    createInitialState
  );

  const addChar = useCallback((char: string) => {
    if (isValidChar(char)) {
      dispatch({ type: 'ADD_CHAR', char });
    }
  }, []);

  const backspace = useCallback(() => {
    dispatch({ type: 'BACKSPACE' });
  }, []);

  const deleteChar = useCallback(() => {
    dispatch({ type: 'DELETE' });
  }, []);

  const submit = useCallback(() => {
    dispatch({ type: 'SUBMIT' });
  }, []);

  const moveLeft = useCallback(() => {
    dispatch({ type: 'MOVE_LEFT' });
  }, []);

  const moveRight = useCallback(() => {
    dispatch({ type: 'MOVE_RIGHT' });
  }, []);

  const setCursor = useCallback((position: number) => {
    dispatch({ type: 'SET_CURSOR', position });
  }, []);

  const reset = useCallback((puzzle?: Puzzle) => {
    dispatch({ type: 'RESET', puzzle });
  }, []);

  const useHint = useCallback((position: number, char: string) => {
    dispatch({ type: 'USE_HINT', position, char });
  }, []);

  // Get a hint for the next unrevealed position
  const getNextHint = useCallback((): { position: number; char: string } | null => {
    // Find the first position in the solution that we haven't correctly guessed
    for (let i = 0; i < state.solution.length; i++) {
      const solutionChar = state.solution[i]!;

      // Check if any previous guess had this position correct
      const alreadyRevealed = state.guesses.some(
        (guess) => guess[i]?.status === 'correct'
      );

      if (!alreadyRevealed) {
        return { position: i, char: solutionChar };
      }
    }
    return null;
  }, [state.solution, state.guesses]);

  // Build the current row for display
  const currentRow: Tile[] = Array.from({ length: state.length }, (_, i) => ({
    char: state.currentInput[i] ?? '',
    status: 'empty' as const,
  }));

  // Build keyboard letter statuses (best status for each character)
  const keyboardStatuses = new Map<string, Tile['status']>();
  for (const guess of state.guesses) {
    for (const tile of guess) {
      const current = keyboardStatuses.get(tile.char);
      // Priority: correct > present > absent
      if (tile.status === 'correct') {
        keyboardStatuses.set(tile.char, 'correct');
      } else if (tile.status === 'present' && current !== 'correct') {
        keyboardStatuses.set(tile.char, 'present');
      } else if (!current) {
        keyboardStatuses.set(tile.char, tile.status);
      }
    }
  }

  return {
    ...state,
    currentRow,
    keyboardStatuses,
    addChar,
    backspace,
    deleteChar,
    submit,
    reset,
    useHint,
    getNextHint,
    moveLeft,
    moveRight,
    setCursor,
  };
}
