import { api } from './base';
import { logger } from '@/lib/utils/logger';
import { Category } from '@/types/game';
import { normalizeApiResponse } from '@/lib/utils/utils';

/**
 * User Categories API - User-created custom categories
 */
export const userCategoriesAPI = {


  /**
   * Like a user category
   */
  likeCategory: async (categoryId: number) => {
    try {
      const response = await api.post(`/api/content/user-categories/${categoryId}/like/`, {});
      return response.data as { liked: boolean; likes_count: number };
    } catch (error) {
      logger.exception(error, { where: 'userCategories.likeCategory' });
      throw error;
    }
  },

  /**
   * Unlike a user category
   */
  unlikeCategory: async (categoryId: number) => {
    try {
      const response = await api.post(`/api/content/user-categories/${categoryId}/unlike/`, {});
      return response.data as { liked: boolean; likes_count: number };
    } catch (error) {
      logger.exception(error, { where: 'userCategories.unlikeCategory' });
      throw error;
    }
  },

  /**
   * Get all categories created by the current user
   */
  getMyCategories: async () => {
    try {
      const response = await api.get('/api/content/user-categories/my_categories/');
      return response.data;
    } catch (error) {
      logger.exception(error, { where: 'userCategories.getMyCategories' });
      throw error;
    }
  },

  /**
   * Get all user-created categories (public + user's own)
   */
  getUserCategories: async (): Promise<Category[]> => {
    try {
      const response = await api.get('/api/content/user-categories/');
      return normalizeApiResponse<Category>(response.data);
    } catch (error) {
      logger.exception(error, { where: 'userCategories.getUserCategories' });
      throw error;
    }
  },

  /**
   * Get a single user category by ID (for editing)
   */
  getUserCategory: async (categoryId: number | string) => {
    try {
      const response = await api.get(`/api/content/user-categories/${categoryId}/`);
      return response.data;
    } catch (error) {
      logger.exception(error, { where: 'userCategories.getUserCategory' });
      throw error;
    }
  },

  /**
   * Update an existing user category (PATCH)
   */
  updateUserCategory: async (categoryId: number | string, formData: FormData) => {
    try {
      const response = await api.patch(`/api/content/user-categories/${categoryId}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete a user category
   */
  deleteUserCategory: async (categoryId: number | string) => {
    try {
      await api.delete(`/api/content/user-categories/${categoryId}/`);
      return { success: true };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Add questions to an existing user category
   */
  addQuestionsToCategory: async (categoryId: number, formData: FormData) => {
    try {
      const response = await api.post(`/api/content/user-categories/${categoryId}/add_questions/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Save a category to user's collection
   */
  saveCategory: async (categoryId: number) => {
    try {
      const response = await api.post(`/api/content/user-categories/${categoryId}/add_to_collection/`, {});
      return response.data;
    } catch (error) {
      logger.exception(error, { where: 'userCategories.saveCategory' });
      throw error;
    }
  },

  /**
   * Remove a category from user's collection
   */
  unsaveCategory: async (categoryId: number) => {
    try {
      const response = await api.post(`/api/content/user-categories/${categoryId}/remove_from_collection/`, {});
      return response.data;
    } catch (error) {
      logger.exception(error, { where: 'userCategories.unsaveCategory' });
      throw error;
    }
  },

  /**
   * Get all categories saved by the current user
   */
  getMySavedCategories: async () => {
    try {
      const response = await api.get('/api/content/user-categories/my_saved_categories/');
      return response.data;
    } catch (error) {
      logger.exception(error, { where: 'userCategories.getSavedCategories' });
      throw error;
    }
  },

  /**
   * Create a new category (alias for createUserCategory)
   */
  createCategory: async (formData: FormData) => {
    try {
      const response = await api.post('/api/content/user-categories/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
