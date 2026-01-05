import { api } from './base';
import { Category, Collection } from '@/types/game';
import { normalizeApiResponse } from '@/lib/utils/utils';
import { logger } from '@/lib/utils/logger';

/**
 * Category API - Official and user-created categories
 */
export const categoriesAPI = {
  /**
   * Get all category data including collections, saved categories, and fallback categories
   */
  getAllCategoryData: async (): Promise<{
    collections: Collection[];
    saved_categories: Category[];
    fallback_categories: Category[];
  }> => {
    try {
      const response = await api.get('/api/content/collections/all_data/');

      // Validate the shape
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid response from /all_data/');
      }

      return response.data;
    } catch (error) {
        logger.exception(error, { where: 'categories.getAllCategoryData' });
      throw error;
    }
  },

  /**
   * Get all official categories
   */
  getCategories: async (): Promise<Category[]> => {
    try {
      const response = await api.get('/api/content/categories/');
      return normalizeApiResponse<Category>(response.data);
    } catch (error) {
        logger.exception(error, { where: 'categories.getCategories' });
      throw error;
    }
  },


};
