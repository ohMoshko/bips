import { useEffect, useRef, useState } from 'react';
import { Board } from './Board';
import { Keyboard } from './Keyboard';
import { HintButton } from './HintButton';
import { StatsModal } from './StatsModal';
import { useGame } from '../hooks/useGame';
import { useUserStats } from '../hooks/useUserStats';
import { isValidChar } from '../types';

export function Game() {
  const {
    target,
    guesses,
    currentRow,
    cursorPosition,
    maxGuesses,
    length,
    state,
    error,
    solution,
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
  } = useGame();

  const {
    stats,
    isAuthenticated,
    recordGameResult,
    recordHintPurchase,
    winPercentage,
  } = useUserStats();

  const [showStats, setShowStats] = useState(false);
  const [hasRecordedResult, setHasRecordedResult] = useState(false);

  // When a hint is purchased, the server returns the position and character
  const handleHintPurchased = (hint: { position: number; char: string }) => {
    useHint(hint.position, hint.char);
    // Record the hint purchase in user stats
    recordHintPurchase();
  };

  // Check if hints are still available (not all positions revealed)
  const nextHint = getNextHint();

  // Ref for the game container to handle keyboard focus
  const gameRef = useRef<HTMLDivElement>(null);

  // Focus game on mount and when clicking the game area
  useEffect(() => {
    gameRef.current?.focus();
  }, []);

  // Record game result when game ends
  useEffect(() => {
    if (state !== 'playing' && !hasRecordedResult && isAuthenticated) {
      const won = state === 'won';
      recordGameResult(won, guesses.length);
      setHasRecordedResult(true);
      // Show stats modal after game ends
      setTimeout(() => setShowStats(true), 1500);
    }
  }, [state, hasRecordedResult, isAuthenticated, recordGameResult, guesses.length]);

  // Reset the recorded flag when game resets
  useEffect(() => {
    if (state === 'playing') {
      setHasRecordedResult(false);
    }
  }, [state]);

  // Handle keyboard input only when game container is focused
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ignore if modifier keys are pressed
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      backspace();
    } else if (e.key === 'Delete') {
      e.preventDefault();
      deleteChar();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      moveLeft();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      moveRight();
    } else if (isValidChar(e.key)) {
      e.preventDefault();
      addChar(e.key);
    }
  };

  return (
    <div
      ref={gameRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={() => gameRef.current?.focus()}
      className="flex flex-col items-center gap-4 sm:gap-6 p-3 sm:p-4 max-w-lg mx-auto outline-none min-h-[calc(100dvh-80px)] safe-bottom"
    >
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 sm:gap-4 mb-1 sm:mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Mathler</h1>
          {isAuthenticated && (
            <button
              onClick={() => setShowStats(true)}
              className="text-gray-400 hover:text-white transition-colors"
              title="View Statistics"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>
          )}
        </div>
        <p className="text-gray-400 text-sm sm:text-base">
          Find the equation that equals{' '}
          <span className="text-xl sm:text-2xl font-bold text-white">{target}</span>
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-2 rounded animate-shake">
          {error}
        </div>
      )}

      {/* Game over message */}
      {state !== 'playing' && (
        <div
          className={`text-center p-4 rounded ${
            state === 'won'
              ? 'bg-correct/20 border border-correct'
              : 'bg-red-500/20 border border-red-500'
          }`}
        >
          {state === 'won' ? (
            <p className="text-lg text-white">
              🎉 Excellent! You solved it in {guesses.length}{' '}
              {guesses.length === 1 ? 'guess' : 'guesses'}!
            </p>
          ) : (
            <div>
              <p className="text-lg text-white mb-2">
                The answer was: <strong>{solution}</strong>
              </p>
            </div>
          )}
          <button
            onClick={() => reset()}
            className="mt-3 px-4 py-2 bg-white/20 hover:bg-white/30 rounded text-white"
          >
            Play Again
          </button>
        </div>
      )}

      {/* Board */}
      <Board
        guesses={guesses}
        currentRow={currentRow}
        cursorPosition={state === 'playing' ? cursorPosition : undefined}
        onCellClick={state === 'playing' ? setCursor : undefined}
        maxGuesses={maxGuesses}
        length={length}
      />

      {/* Keyboard */}
      {state === 'playing' && (
        <>
          <Keyboard
            onChar={addChar}
            onBackspace={backspace}
            onSubmit={submit}
            keyStatuses={keyboardStatuses}
          />

          {/* Hint Button - Bips Integration */}
          <div className="flex gap-4">
            <HintButton
              onHintPurchased={handleHintPurchased}
              disabled={!nextHint}
            />
          </div>
        </>
      )}

      {/* Instructions - hidden on very small screens to save space */}
      <div className="text-gray-500 text-xs sm:text-sm text-center max-w-md px-2 mt-auto">
        <p className="hidden sm:block">Enter a valid equation using numbers and +, -, *, /</p>
        <p className="mt-1">
          🟩 Correct · 🟨 Wrong spot · ⬛ Not in equation
        </p>
      </div>

      {/* Stats Modal */}
      <StatsModal
        stats={stats}
        winPercentage={winPercentage}
        isOpen={showStats}
        onClose={() => setShowStats(false)}
      />
    </div>
  );
}
