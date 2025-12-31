/**
 * useUserStats - Hook for managing user game statistics with Dynamic metadata
 *
 * Stores and retrieves user game history using Dynamic SDK's user metadata.
 * This allows the user's stats to persist across sessions and devices.
 */

import { useCallback, useMemo } from 'react';
import {
  useDynamicContext,
  useUserUpdateRequest,
} from '@dynamic-labs/sdk-react-core';

export interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: Record<number, number>; // { 1: 0, 2: 1, 3: 5, ... }
  lastPlayedDate: string | null; // ISO date string (YYYY-MM-DD)
  lastResult: 'won' | 'lost' | null;
  hintsPurchased: number;
}

const DEFAULT_STATS: UserStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  maxStreak: 0,
  guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
  lastPlayedDate: null,
  lastResult: null,
  hintsPurchased: 0,
};

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]!;
}

/**
 * Check if a date string is yesterday
 */
function isYesterday(dateStr: string): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return dateStr === yesterday.toISOString().split('T')[0];
}

export interface UseUserStatsResult {
  /** Current user stats */
  stats: UserStats;
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** Whether stats are being updated */
  isUpdating: boolean;
  /** Record a game result */
  recordGameResult: (won: boolean, guesses: number) => Promise<void>;
  /** Record a hint purchase */
  recordHintPurchase: () => Promise<void>;
  /** Check if user has already played today */
  hasPlayedToday: boolean;
  /** Calculate win percentage */
  winPercentage: number;
}

export function useUserStats(): UseUserStatsResult {
  const { user } = useDynamicContext();
  const { updateUser } = useUserUpdateRequest();

  // Parse stats from user metadata
  const stats = useMemo((): UserStats => {
    if (!user?.metadata) {
      return DEFAULT_STATS;
    }

    const metadata = user.metadata as Record<string, unknown>;
    const mathlerStats = metadata.mathlerStats as Partial<UserStats> | undefined;

    if (!mathlerStats) {
      return DEFAULT_STATS;
    }

    return {
      gamesPlayed: mathlerStats.gamesPlayed ?? 0,
      gamesWon: mathlerStats.gamesWon ?? 0,
      currentStreak: mathlerStats.currentStreak ?? 0,
      maxStreak: mathlerStats.maxStreak ?? 0,
      guessDistribution: mathlerStats.guessDistribution ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
      lastPlayedDate: mathlerStats.lastPlayedDate ?? null,
      lastResult: mathlerStats.lastResult ?? null,
      hintsPurchased: mathlerStats.hintsPurchased ?? 0,
    };
  }, [user?.metadata]);

  const isAuthenticated = !!user;

  const hasPlayedToday = useMemo(() => {
    return stats.lastPlayedDate === getTodayDate();
  }, [stats.lastPlayedDate]);

  const winPercentage = useMemo(() => {
    if (stats.gamesPlayed === 0) return 0;
    return Math.round((stats.gamesWon / stats.gamesPlayed) * 100);
  }, [stats.gamesPlayed, stats.gamesWon]);

  const recordGameResult = useCallback(
    async (won: boolean, guesses: number) => {
      if (!user) {
        console.warn('Cannot record game result: user not authenticated');
        return;
      }

      const today = getTodayDate();
      const existingMetadata = (user.metadata as Record<string, unknown>) ?? {};

      // Calculate new streak
      let newStreak = stats.currentStreak;
      if (won) {
        // If last played was yesterday, continue streak. Otherwise, start new.
        if (stats.lastPlayedDate && isYesterday(stats.lastPlayedDate)) {
          newStreak = stats.currentStreak + 1;
        } else if (stats.lastPlayedDate !== today) {
          // Starting fresh (not yesterday, not today already played)
          newStreak = 1;
        }
      } else {
        // Lost - reset streak
        newStreak = 0;
      }

      const newGuessDistribution = { ...stats.guessDistribution };
      if (won && guesses >= 1 && guesses <= 6) {
        newGuessDistribution[guesses] = (newGuessDistribution[guesses] ?? 0) + 1;
      }

      const newStats: UserStats = {
        gamesPlayed: stats.gamesPlayed + 1,
        gamesWon: stats.gamesWon + (won ? 1 : 0),
        currentStreak: newStreak,
        maxStreak: Math.max(stats.maxStreak, newStreak),
        guessDistribution: newGuessDistribution,
        lastPlayedDate: today,
        lastResult: won ? 'won' : 'lost',
        hintsPurchased: stats.hintsPurchased,
      };

      try {
        await updateUser({
          metadata: {
            ...existingMetadata,
            mathlerStats: newStats,
          },
        });
      } catch (error) {
        console.error('Failed to update user stats:', error);
      }
    },
    [user, stats, updateUser]
  );

  const recordHintPurchase = useCallback(async () => {
    if (!user) {
      console.warn('Cannot record hint purchase: user not authenticated');
      return;
    }

    const existingMetadata = (user.metadata as Record<string, unknown>) ?? {};

    const newStats: UserStats = {
      ...stats,
      hintsPurchased: stats.hintsPurchased + 1,
    };

    try {
      await updateUser({
        metadata: {
          ...existingMetadata,
          mathlerStats: newStats,
        },
      });
    } catch (error) {
      console.error('Failed to update hint count:', error);
    }
  }, [user, stats, updateUser]);

  return {
    stats,
    isAuthenticated,
    isUpdating: false, // Could track this with state if needed
    recordGameResult,
    recordHintPurchase,
    hasPlayedToday,
    winPercentage,
  };
}
