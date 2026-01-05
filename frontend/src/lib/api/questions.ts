import { api } from './base';
import { logger } from '@/lib/utils/logger';
import { Question } from '@/types/game';
import { normalizeApiResponse } from '@/lib/utils/utils';

/**
 * Questions API - Question retrieval and management
 */
export const questionsAPI = {
  /**
   * Get available questions for a specific game
   */
  getAvailableQuestions: async (gameId: number): Promise<Question[]> => {
    try {
      const response = await api.get(`/api/gameplay/games/${gameId}/available_questions/`);
      return normalizeApiResponse<Question>(response.data);
    } catch (error) {
      logger.exception(error, { where: 'questions.getAvailableQuestions' });
      throw error;
    }
  },
  /**
   * Get questions filtered by category ID
   */
  getQuestionsByCategory: async (categoryId: number | string): Promise<Question[]> => {
    try {
      const response = await api.get(`/api/content/questions/?category_id=${categoryId}`);
      return normalizeApiResponse<Question>(response.data);
    } catch (error) {
      logger.exception(error, { where: 'questions.getQuestionsByCategory' });
      return []; // Return empty array on error instead of throwing
    }
  },

  /**
   * Get a single question by ID
   */
  getQuestion: async (questionId: number | string) => {
    try {
      const response = await api.get(`/api/content/questions/${questionId}/`);
      return response.data;
    } catch (error) {
      logger.exception(error, { where: 'questions.getQuestion' });
      throw error;
    }
  },



  /**
   * Delete a specific question
   */
  deleteQuestion: async (questionId: number) => {
    try {
      await api.delete(`/api/content/questions/${questionId}/`);
      return { success: true };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Create a new question (direct create). Prefer addQuestionsToCategory for bulk/add flows.
   */
  createQuestion: async (formData: FormData) => {
    try {
      const response = await api.post(`/api/content/questions/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update an existing question by ID
   */
  updateQuestion: async (questionId: number, formData: FormData) => {
    try {
      const response = await api.put(`/api/content/questions/${questionId}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
