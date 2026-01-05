'use client';

import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { gameAPI } from '@/lib/api';
import { useNotification } from '@/hooks/useNotification';
import { logger } from '@/lib/utils/logger';
import { useMembership } from '@/hooks/useMembership';
import { useAuthGate } from '@/hooks/useAuthGate';

interface UseCategoryActionsProps {
  categoryId: string;
  categoryName: string;
  categoryDescription: string;
  categoryImageFile: File | null;
  privacy: 'public' | 'private';
  setError: (error: string) => void;
  setIsSaved: (saved: boolean) => void;
  setSavesCount: (count: number) => void;
  setIsLiked: (liked: boolean) => void;
  setLikesCount: (count: number) => void;
  savesCount: number;
  likesCount: number;
  isSaved: boolean;
  isLiked: boolean;
  categoryOwnerId: number | null;
}

export function useCategoryActions({
  categoryId,
  categoryName,
  categoryDescription,
  categoryImageFile,
  privacy,
  setError,
  setIsSaved,
  setSavesCount,
  setIsLiked,
  setLikesCount,
  savesCount,
  likesCount,
  isSaved,
  isLiked,
  categoryOwnerId,
}: UseCategoryActionsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const notify = useNotification();
  const { membership } = useMembership();
  const { user } = useAuthGate();

  const handleSave = async (): Promise<boolean> => {
    try {
      setError('');

      if (!categoryName.trim()) {
        setError('Category name is required');
        return false;
      }

        logger.log('💾 Saving category...');
        logger.log('💾 categoryImageFile:', categoryImageFile);
     
      const formData = new FormData();
      formData.append('name', categoryName);
      formData.append('description', categoryDescription);
      formData.append('privacy', privacy);
      
      if (categoryImageFile) {
          logger.log('💾 Appending image to FormData:', categoryImageFile.name, categoryImageFile.size);
        formData.append('image', categoryImageFile);
      } else {
          logger.log('⚠️ No categoryImageFile to upload');
      }

        logger.log('💾 Sending update request...');
      const responseData = await gameAPI.updateUserCategory(categoryId, formData);
        logger.log('✅ Update successful:', responseData);
     
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['categories', 'user'], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: ['savedCategories'], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: ['allCategoryData'], refetchType: 'active' })
      ]);
     
      notify.success('Success', 'Category updated successfully!');
      router.push('/categories');
      return true;
      
    } catch (err) {
       logger.exception(err, { where: 'useCategoryActions.saveCategory' });
      setError('Failed to save category. Please try again.');
      return false;
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }

    try {
      await gameAPI.deleteUserCategory(categoryId);
      
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['categories', 'user'], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: ['savedCategories'], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: ['allCategoryData'], refetchType: 'active' })
      ]);
      
      notify.success('Deleted', 'Category deleted successfully');
      router.push('/categories');
    } catch (err) {
        logger.exception(err, { where: 'useCategoryActions.deleteCategory' });
      notify.error('Delete Failed', 'Failed to delete category. Please try again.');
    }
  };

  const handleToggleSave = async () => {
    try {
      // Check if user is premium or owns the category
      const isOwner = user && categoryOwnerId && user.id === categoryOwnerId;
      const isPremium = membership?.is_premium;
      
      if (!isSaved && !isOwner && !isPremium) {
        notify.error('Premium Required', 'Saving categories is a premium feature. Upgrade to save categories created by others!');
        return;
      }
      
      if (isSaved) {
        await gameAPI.unsaveCategory(Number(categoryId));
        setIsSaved(false);
        setSavesCount(Math.max(0, savesCount - 1));
        notify.success('Category Unsaved', 'Category removed from your collection');
      } else {
        await gameAPI.saveCategory(Number(categoryId));
        setIsSaved(true);
        setSavesCount(savesCount + 1);
        notify.success('Category Saved', 'Category added to your collection');
      }
      
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['allCategoryData'], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: ['categories', 'user'], refetchType: 'active' })
      ]);
    } catch (err) {
       logger.exception(err, { where: 'useCategoryActions.toggleSave' });
      notify.error('Failed', 'Could not update category. Please try again.');
    }
  };

  const handleLike = async () => {
    try {
      const idNum = Number(categoryId);
      if (!Number.isFinite(idNum)) return;
      
      if (isLiked) {
        const res = await gameAPI.unlikeCategory(idNum);
        setIsLiked(false);
        setLikesCount(res?.likes_count ?? Math.max(0, likesCount - 1));
        notify.success('Unliked', 'You removed your like');
      } else {
        const res = await gameAPI.likeCategory(idNum);
        setIsLiked(true);
        setLikesCount(res?.likes_count ?? likesCount + 1);
        notify.success('Liked', 'Thanks for the like!');
      }
      
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['allCategoryData'], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: ['categories', 'user'], refetchType: 'active' })
      ]);
    } catch (err) {
       logger.exception(err, { where: 'useCategoryActions.toggleLike' });
      notify.error('Failed', 'Could not update like. Please try again.');
    }
  };

  const handleReport = () => {
    notify.info('Report Feature', 'Report functionality will be added soon');
  };

  const handleDeleteQuestion = async (
    questionId: number, 
    setQuestions: React.Dispatch<React.SetStateAction<{ id: number; text: string; answer: string; points: number; image?: string; answer_image?: string }[]>>
  ) => {
    if (!confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      await gameAPI.deleteQuestion(questionId);
      setQuestions(prev => prev.filter(q => q.id !== questionId));
      notify.success('Question Deleted', 'Question removed successfully');
    } catch (err) {
       logger.exception(err, { where: 'useCategoryActions.deleteQuestion' });
      notify.error('Delete Failed', 'Failed to delete question. Please try again.');
    }
  };

  const handleEditQuestion = (questionId: number) => {
    router.push(`/categories/edit/${categoryId}/question/${questionId}/edit`);
  };

  return {
    handleSave,
    handleDelete,
    handleToggleSave,
    handleLike,
    handleReport,
    handleDeleteQuestion,
    handleEditQuestion,
  };
}
