"use client";
import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { activateRerollPerk, markQuestionPlayed, pushBackupQuestions, setBackupQuestions } from '@/store/gameSlice';
import { gamesAPI } from '@/lib/api';
import { Question } from '@/types/game';
import { logger } from '@/lib/utils/logger';

/**
 * useReroll
 * - Pops the next question from backupQuestions
 * - Replaces the current displayed question (navigates)
 * - Marks reroll as used for that team
 * - Auto-refills 4 backup questions if the list is empty
 */
export function useReroll(gameId: number | string, currentQuestion?: Question | null) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const {
    currentTeam,
    teams,
    rerollPerkUsed,
    perksLocked,
    backupQuestions,
    playedQuestions,
    questions: boardQuestions,
  } = useAppSelector((s) => s.game);

  const fetchAndSetBackups = useCallback(async () => {
    try {
      const gid = Number(gameId);
      if (!Number.isFinite(gid)) return [] as Question[];
      const extras = await gamesAPI.prefetchOutsideBoard(gid, 4);
      const existingIds = new Set(boardQuestions.map(q => q.id));
      const filtered: Question[] = Array.isArray(extras)
        ? extras.filter((q) => (
            q && typeof q.id === 'number' &&
            q.id !== (currentQuestion?.id ?? -1) &&
            !playedQuestions.includes(q.id) &&
            !existingIds.has(q.id)
          ))
        : [];
      dispatch(setBackupQuestions(filtered));
      return filtered;
    } catch (e) {
      logger.warn('Failed to prefetch backup questions:', e);
      dispatch(setBackupQuestions([]));
      return [] as Question[];
    }
  }, [dispatch, gameId, currentQuestion?.id, playedQuestions, boardQuestions]);

  const reroll = useCallback(async (teamId: number) => {
    const teamIndex = teams.findIndex(t => t.id === teamId);
    const isTeamsTurn = teamIndex === (currentTeam - 1);
    if (!isTeamsTurn || perksLocked) return;
    if (rerollPerkUsed[teamId]) return;

    let backups = backupQuestions;
    if (!backups || backups.length === 0) {
      backups = await fetchAndSetBackups();
      if (backups.length === 0) return; // nothing to reroll to
    }

    const next = backups[0];
    if (!next) return;

    // Mark as used, consume one, mark current as played, and navigate
    dispatch(activateRerollPerk({ teamId }));
    if (currentQuestion?.id) {
      dispatch(markQuestionPlayed(currentQuestion.id));
    }
    // Leave picked backup in list until it's resolved (consumed after awarding points)

    router.push(`/game/${gameId}/question/${next.id}`);

    // Proactively top-up to keep buffer around 4 (optional)
    try {
      if (backups.length <= 2) {
        const gid = Number(gameId);
        if (Number.isFinite(gid)) {
          const more = await gamesAPI.prefetchOutsideBoard(gid, 4);
          const existingIds = new Set(boardQuestions.map(q => q.id));
          const filtered = Array.isArray(more)
            ? more.filter((q) => (
                q && typeof q.id === 'number' &&
                q.id !== (currentQuestion?.id ?? -1) &&
                !playedQuestions.includes(q.id) &&
                !existingIds.has(q.id)
              ))
            : [];
          if (filtered.length) dispatch(pushBackupQuestions(filtered));
        }
      }
    } catch (e) {
      logger.warn('Top-up backup questions failed:', e);
    }
  }, [teams, currentTeam, perksLocked, rerollPerkUsed, backupQuestions, dispatch, currentQuestion?.id, router, gameId, fetchAndSetBackups, playedQuestions, boardQuestions]);

  return { reroll, fetchAndSetBackups };
}
