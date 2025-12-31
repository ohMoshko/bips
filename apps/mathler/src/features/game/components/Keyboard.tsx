import type { TileStatus } from '../types';

interface KeyboardProps {
  onChar: (char: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  keyStatuses: Map<string, TileStatus>;
}

const KEYBOARD_ROWS = [
  ['1', '2', '3', '4', '5'],
  ['6', '7', '8', '9', '0'],
  ['+', '-', '*', '/'],
];

const statusColors: Record<TileStatus | 'unused', string> = {
  correct: 'bg-correct active:bg-correct/70',
  present: 'bg-present active:bg-present/70',
  absent: 'bg-absent active:bg-absent/70',
  empty: 'bg-key active:bg-key/70',
  unused: 'bg-key active:bg-key/70',
};

export function Keyboard({
  onChar,
  onBackspace,
  onSubmit,
  keyStatuses,
}: KeyboardProps) {
  const handleKeyClick = (key: string) => {
    onChar(key);
  };

  return (
    <div className="flex flex-col gap-1.5 sm:gap-2 items-center w-full max-w-md px-2 no-select">
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-1 sm:gap-1.5 w-full justify-center">
          {row.map((key) => {
            const status = keyStatuses.get(key) ?? 'unused';
            return (
              <button
                key={key}
                onClick={() => handleKeyClick(key)}
                className={`flex-1 max-w-[4rem] h-12 sm:h-14 rounded font-bold text-white text-lg sm:text-xl ${statusColors[status]} transition-colors`}
              >
                {key}
              </button>
            );
          })}
        </div>
      ))}

      {/* Action row */}
      <div className="flex gap-1 sm:gap-1.5 mt-1 sm:mt-2 w-full justify-center">
        <button
          onClick={onBackspace}
          className="flex-1 max-w-[5rem] h-12 sm:h-14 rounded font-bold text-white text-lg sm:text-xl bg-key active:bg-key/70 transition-colors"
        >
          ⌫
        </button>
        <button
          onClick={onSubmit}
          className="flex-[2] max-w-[10rem] h-12 sm:h-14 rounded font-bold text-white text-sm sm:text-base bg-green-600 active:bg-green-700 transition-colors"
        >
          ENTER
        </button>
      </div>
    </div>
  );
}
