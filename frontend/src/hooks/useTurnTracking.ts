import { useState, useEffect, useRef } from 'react';
import { logger } from '@/lib/utils/logger';

/** Represents a single turn entry in game history */
interface TurnEntry {
  teamId: number;
  questionId: number;
  timestamp: number;
  correct: boolean;
}

/** Tracks per-team turn statistics */
interface TeamTurnData {
  [teamId: number]: {
    turnsPlayed: number;
    correctAnswers: number;
    lastTurnTimestamp?: number;
  };
}

export function useTurnTracking(gameId: string) {
  const [turnHistory, setTurnHistory] = useState<TurnEntry[]>([]);
  const [teamTurnData, setTeamTurnData] = useState<TeamTurnData>({});
  const initialized = useRef(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (initialized.current) return;
    
    try {
      const historyKey = `game-${gameId}-turn-history`;
      const dataKey = `game-${gameId}-team-turn-data`;
      
      const savedHistory = localStorage.getItem(historyKey);
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory) as TurnEntry[];
        setTurnHistory(parsed);
      }
      
      const savedData = localStorage.getItem(dataKey);
      if (savedData) {
        const parsed = JSON.parse(savedData) as TeamTurnData;
        setTeamTurnData(parsed);
      }
      
      initialized.current = true;
    } catch (error) {
      logger.warn('Failed to load turn tracking data from localStorage', { gameId, error });
    }
  }, [gameId]);

  // Persist turn history changes
  useEffect(() => {
    if (!initialized.current) return;
    
    try {
      localStorage.setItem(`game-${gameId}-turn-history`, JSON.stringify(turnHistory));
    } catch (error) {
      logger.warn('Failed to persist turn history', { gameId, error });
    }
  }, [turnHistory, gameId]);

  // Persist team turn data changes
  useEffect(() => {
    if (!initialized.current) return;
    
    try {
      localStorage.setItem(`game-${gameId}-team-turn-data`, JSON.stringify(teamTurnData));
    } catch (error) {
      logger.warn('Failed to persist team turn data', { gameId, error });
    }
  }, [teamTurnData, gameId]);

  return { turnHistory, setTurnHistory, teamTurnData, setTeamTurnData };
}
