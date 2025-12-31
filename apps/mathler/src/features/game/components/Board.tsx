import { Tile } from './Tile';
import type { Guess, Tile as TileType } from '../types';

interface BoardProps {
  guesses: Guess[];
  currentRow: TileType[];
  cursorPosition?: number;
  onCellClick?: (position: number) => void;
  maxGuesses: number;
  length: number;
}

export function Board({
  guesses,
  currentRow,
  cursorPosition,
  onCellClick,
  maxGuesses,
  length,
}: BoardProps) {
  // Build all rows: completed guesses + current row + empty rows
  const rows: TileType[][] = [];

  // Add completed guesses
  for (const guess of guesses) {
    rows.push(guess);
  }

  // Add current row if game is still in progress
  if (guesses.length < maxGuesses) {
    rows.push(currentRow);
  }

  // Fill remaining with empty rows
  while (rows.length < maxGuesses) {
    rows.push(
      Array.from({ length }, () => ({ char: '', status: 'empty' as const }))
    );
  }

  const currentRowIndex = guesses.length;

  return (
    <div className="grid gap-1.5">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-1.5 justify-center">
          {row.map((tile, colIndex) => {
            const isCurrentRow = rowIndex === currentRowIndex;
            const isCursor = isCurrentRow && cursorPosition === colIndex;

            return (
              <Tile
                key={colIndex}
                char={tile.char}
                status={tile.status}
                isCurrentRow={isCurrentRow}
                isCursor={isCursor}
                onClick={isCurrentRow && onCellClick ? () => onCellClick(colIndex) : undefined}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
