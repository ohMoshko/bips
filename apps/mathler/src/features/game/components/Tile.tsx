import type { TileStatus } from '../types';

interface TileProps {
  char: string;
  status: TileStatus;
  isCurrentRow?: boolean;
  isCursor?: boolean;
  onClick?: () => void;
}

const statusColors: Record<TileStatus, string> = {
  correct: 'bg-correct border-correct',
  present: 'bg-present border-present',
  absent: 'bg-absent border-absent',
  empty: 'bg-transparent border-gray-600',
};

export function Tile({ char, status, isCurrentRow, isCursor, onClick }: TileProps) {
  const hasChar = char !== '';
  const baseStyles =
    'w-11 h-11 sm:w-14 sm:h-14 flex items-center justify-center text-xl sm:text-2xl font-bold uppercase border-2 text-white relative no-select';

  const animationClass = isCurrentRow && hasChar ? 'animate-pop' : '';
  const cursorClass = isCursor ? 'ring-2 ring-white ring-offset-1 sm:ring-offset-2 ring-offset-tile' : '';
  const clickableClass = onClick ? 'cursor-pointer active:brightness-90' : '';

  return (
    <div
      className={`${baseStyles} ${statusColors[status]} ${animationClass} ${cursorClass} ${clickableClass}`}
      onClick={onClick}
    >
      {char}
      {/* Blinking cursor indicator */}
      {isCursor && !hasChar && (
        <div className="absolute bottom-1.5 sm:bottom-2 w-5 sm:w-6 h-0.5 bg-white animate-pulse" />
      )}
    </div>
  );
}
