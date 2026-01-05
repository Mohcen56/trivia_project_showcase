import { useState, useEffect } from 'react';
import { gameAPI } from '@/lib/api/index';
import { logger } from '@/lib/utils/logger';
import { useCreatorBadge } from '@/components/User/useCreatorBadge';

interface Category {
  id: number;
  name: string;
  description?: string;
  image?: string;
  image_url?: string;
  questions_count?: number;
  privacy?: 'public' | 'private';
  created_by_id?: number;
  created_by_username?: string;
  created_by_is_premium?: boolean;
  is_approved?: boolean;
}

/**
 * Hook to fetch and manage user categories with creator badge calculation
 * @param userId - The ID of the user whose categories to fetch
 * @returns Object containing categories, loading state, approved count, and creator badge info
 */
export function useUserCategories(userId: number) {
  const [userCategories, setUserCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // Fetch categories created by this user
  useEffect(() => {
    const fetchUserCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const allCategories = await gameAPI.getUserCategories();
        
        // Filter to only show categories created by this user
        const filtered = allCategories.filter((cat: Category) => cat.created_by_id === userId);
        setUserCategories(filtered);
      } catch (error) {
        logger.exception(error, { where: 'useUserCategories.fetch' });
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchUserCategories();
  }, [userId]);
  
  // Calculate approved categories count and use the creator badge hook
  const approvedCategoriesCount = userCategories.filter(cat => cat.is_approved).length;
  const creatorBadge = useCreatorBadge(approvedCategoriesCount);

  return {
    userCategories,
    isLoadingCategories,
    approvedCategoriesCount,
    creatorBadge,
  };
}
