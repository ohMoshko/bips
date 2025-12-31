import type { UserStats } from '../hooks/useUserStats';

interface StatsModalProps {
  stats: UserStats;
  winPercentage: number;
  isOpen: boolean;
  onClose: () => void;
}

export function StatsModal({ stats, winPercentage, isOpen, onClose }: StatsModalProps) {
  if (!isOpen) return null;

  const maxGuesses = Math.max(...Object.values(stats.guessDistribution), 1);

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-tile border border-gray-600 rounded-lg p-6 max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Statistics</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          <StatBox value={stats.gamesPlayed} label="Played" />
          <StatBox value={winPercentage} label="Win %" />
          <StatBox value={stats.currentStreak} label="Current Streak" />
          <StatBox value={stats.maxStreak} label="Max Streak" />
        </div>

        {/* Guess Distribution */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wide">
            Guess Distribution
          </h3>
          {stats.gamesWon === 0 ? (
            <p className="text-gray-500 text-sm">No data yet</p>
          ) : (
            <div className="space-y-1">
              {[1, 2, 3, 4, 5, 6].map((guess) => {
                const count = stats.guessDistribution[guess] ?? 0;
                const width = count > 0 ? Math.max((count / maxGuesses) * 100, 10) : 7;
                return (
                  <div key={guess} className="flex items-center gap-2">
                    <span className="text-white w-3">{guess}</span>
                    <div
                      className={`h-5 flex items-center justify-end px-2 text-xs font-bold text-white ${
                        count > 0 ? 'bg-correct' : 'bg-gray-600'
                      }`}
                      style={{ width: `${width}%`, minWidth: '20px' }}
                    >
                      {count}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Hints Purchased */}
        {stats.hintsPurchased > 0 && (
          <div className="pt-4 border-t border-gray-600">
            <p className="text-gray-400 text-sm">
              Hints purchased: <span className="text-white font-bold">{stats.hintsPurchased}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  );
}
