import { useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { setTeams } from '@/store/gameSlice';
import { Team } from '@/types/game';

/**
 * Syncs fetched teams from the backend (gameAPI) into Redux state.
 * Preserves existing live scores and only updates if team roster changes.
 */
export function useSyncTeams(
  teamsFromGame: Team[] | undefined,
  liveTeams: Team[]
) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!teamsFromGame || teamsFromGame.length === 0) return;

    // Merge backend teams with current Redux teams (keep scores)
    const mergedTeams = teamsFromGame.map((t: Team) => {
      const existing = liveTeams.find(et => et.id === t.id);
      return { ...t, score: existing?.score ?? t.score ?? 0 };
    });

    // If Redux is empty, set immediately
    if (liveTeams.length === 0) {
      dispatch(setTeams(mergedTeams));
      return;
    }

    // Detect roster changes (id, name, or avatar differences)
    const rosterChanged =
      mergedTeams.length !== liveTeams.length ||
      mergedTeams.some((t, i) =>
        t.id !== liveTeams[i]?.id ||
        t.name !== liveTeams[i]?.name ||
        t.avatar !== liveTeams[i]?.avatar
      );

    if (rosterChanged) {
      dispatch(setTeams(mergedTeams));
    }
  }, [teamsFromGame, liveTeams, dispatch]);
}
