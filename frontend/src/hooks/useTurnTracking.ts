import { useState, useEffect } from 'react';

export function useTurnTracking(gameId: string) {
  const [turnHistory, setTurnHistory] = useState([]);
  const [teamTurnData, setTeamTurnData] = useState({});

  useEffect(() => {
    try {
      const h = localStorage.getItem(`game-${gameId}-turn-history`);
      if (h) setTurnHistory(JSON.parse(h));
      const d = localStorage.getItem(`game-${gameId}-team-turn-data`);
      if (d) setTeamTurnData(JSON.parse(d));
    } catch {}
  }, [gameId]);

  useEffect(() => {
    localStorage.setItem(`game-${gameId}-turn-history`, JSON.stringify(turnHistory));
  }, [turnHistory, gameId]);

  useEffect(() => {
    localStorage.setItem(`game-${gameId}-team-turn-data`, JSON.stringify(teamTurnData));
  }, [teamTurnData, gameId]);

  return { turnHistory, setTurnHistory, teamTurnData, setTeamTurnData };
}
