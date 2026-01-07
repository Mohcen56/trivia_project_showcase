import { useEffect, useRef } from 'react';
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
  
  // Keep stable reference to liveTeams to avoid infinite loops
  const liveTeamsRef = useRef(liveTeams);
  liveTeamsRef.current = liveTeams;

  useEffect(() => {
    if (!teamsFromGame || teamsFromGame.length === 0) return;

    const currentLiveTeams = liveTeamsRef.current;

    // Merge backend teams with current Redux teams (keep scores)
    const mergedTeams = teamsFromGame.map((t: Team) => {
      const existing = currentLiveTeams.find(et => et.id === t.id);
      return { ...t, score: existing?.score ?? t.score ?? 0 };
    });

    // If Redux is empty, set immediately
    if (currentLiveTeams.length === 0) {
      dispatch(setTeams(mergedTeams));
      return;
    }

    // Detect roster changes (id, name, or avatar differences)
    const rosterChanged =
      mergedTeams.length !== currentLiveTeams.length ||
      mergedTeams.some((t, i) =>
        t.id !== currentLiveTeams[i]?.id ||
        t.name !== currentLiveTeams[i]?.name ||
        t.avatar !== currentLiveTeams[i]?.avatar
      );

    if (rosterChanged) {
      dispatch(setTeams(mergedTeams));
    }
  }, [teamsFromGame, dispatch]); // Removed liveTeams from deps, using ref instead
}
