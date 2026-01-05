import { api } from './base';
import { logger } from '@/lib/utils/logger';
import { Game } from '@/types/game';


/**
 * Games API - Game session management and gameplay
 */
export const gamesAPI = {
  /**
   * Start a new game with selected categories and teams
   */
  startGame: async (
    categories: number[],
    teams: Array<{ name: string; avatar: string }>,
    mode: 'offline' | 'online' = 'offline'
  ): Promise<Game> => {
    try {
      const response = await api.post('/api/gameplay/games/', {
        category_ids: categories,
        teams,
        mode,
      });
      return response.data;
    } catch (error) {
      logger.exception(error, { where: 'games.startGame' });
      throw error;
    }
  },


  /**
   * Get a specific game by ID
   */
  getGame: async (gameId: number): Promise<Game> => {
    try {
      if (isNaN(gameId) || !isFinite(gameId) || gameId <= 0) {
        throw new Error(`Invalid game ID: ${gameId}. Must be a positive number.`);
      }
      const response = await api.get(`/api/gameplay/games/${gameId}/`);
      return response.data;
    } catch (error) {
      logger.exception(error, { where: 'games.getGame' });
      throw error;
    }
  },

  /**
   * Finish a round and update game state
   */
  finishRound: async (gameId: number, playedQuestionIds: number[]) => {
    try {
      const response = await api.post(`/api/gameplay/games/${gameId}/finish_round/`, {
        played_question_ids: playedQuestionIds,
      });
      return response.data;
    } catch (error) {
      logger.exception(error, { where: 'games.finishRound' });
      throw error;
    }
  },

  /**
   * Get gameplay statistics for the current user
   */
  getStats: async () => {
    try {
      const response = await api.get('/api/gameplay/stats/');
      return response.data;
    } catch (error) {
      logger.exception(error, { where: 'games.getStats' });
      throw error;
    }
  },

  /**
   * Get last 3 games with their categories
   */
  getRecentGames: async () => {
    try {
      const response = await api.get('/api/gameplay/recent/');
      return response.data;
    } catch (error) {
      logger.exception(error, { where: 'games.getRecentGames' });
      throw error;
    }
  },


  
 

  /**
   * Prefetch a batch of outside-board questions for fast rerolls.
   */
  prefetchOutsideBoard: async (gameId: number, count = 4) => {
    try {
      const response = await api.get(`/api/gameplay/games/${gameId}/prefetch_outside_board/?count=${count}`);
      return response.data; // Question[]
    } catch (error) {
      logger.exception(error, { where: 'games.prefetchOutsideBoard' });
      return [];
    }
  },



};
