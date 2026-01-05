'use client';

import { useState, useEffect, useRef } from 'react';
import { logger } from '@/lib/utils/logger';
import { gameAPI } from '@/lib/api';

interface Question {
  id: number;
  text: string;
  answer: string;
  points: number;
  image?: string;
  answer_image?: string;
}

interface UseCategoryDataReturn {
  categoryName: string;
  setCategoryName: (name: string) => void;
  categoryDescription: string;
  setCategoryDescription: (desc: string) => void;
  categoryImage: string | null;
  setCategoryImage: (image: string | null) => void;
  categoryImageFile: File | null;
  setCategoryImageFile: (file: File | null) => void;
  privacy: 'public' | 'private';
  setPrivacy: (privacy: 'public' | 'private') => void;
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  isLoading: boolean;
  error: string;
  setError: (error: string) => void;
  categoryOwnerId: number | null;
  isSaved: boolean;
  setIsSaved: (saved: boolean) => void;
  savesCount: number;
  setSavesCount: (count: number) => void;
  likesCount: number;
  setLikesCount: (count: number) => void;
  isLiked: boolean;
  setIsLiked: (liked: boolean) => void;
}

export function useCategoryData(categoryId: string): UseCategoryDataReturn {
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [categoryImage, setCategoryImage] = useState<string | null>(null);
  const [categoryImageFile, setCategoryImageFile] = useState<File | null>(null);
  const [privacy, setPrivacy] = useState<'public' | 'private'>('public');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryOwnerId, setCategoryOwnerId] = useState<number | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [savesCount, setSavesCount] = useState<number>(0);
  const [likesCount, setLikesCount] = useState<number>(0);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    logger.log('🖼️ categoryImage changed:', categoryImage ? `${categoryImage.substring(0, 50)}...` : 'null');
  }, [categoryImage]);

  useEffect(() => {
    if (!categoryId) return;

    // Prevent duplicate fetches in React Strict Mode
    if (hasLoadedRef.current) {
      logger.log('Category already loading/loaded, skipping duplicate fetch');
      return;
    }

    hasLoadedRef.current = true;

    const loadCategory = async () => {
      try {
        logger.log('🔍 Loading category:', categoryId);
        
        const data = await gameAPI.getUserCategory(categoryId);
        logger.log('✅ Category loaded:', data);
        
        setCategoryName(data.name);
        setCategoryDescription(data.description || '');
        setCategoryImage(data.image_url || null);
        setPrivacy(data.privacy || 'public');
        setCategoryOwnerId(data.created_by_id || null);
        setIsSaved(data.is_saved || false);
        setSavesCount(data.saves_count ?? 0);
        setLikesCount(data.likes_count ?? 0);
        setIsLiked(data.is_liked ?? false);
        
        try {
          logger.log('🔍 Loading questions for category:', categoryId);
          const questionsData = await gameAPI.getQuestionsByCategory(categoryId);
          logger.log('✅ Questions loaded:', questionsData);
          logger.log('📊 Questions count:', questionsData.length);
          logger.log('📋 Questions array check:', Array.isArray(questionsData));
          setQuestions(questionsData);
        } catch (err) {
          logger.exception(err, { where: 'useCategoryData.loadQuestions', categoryId });
          setQuestions([]);
        }
        
        setIsLoading(false);
      } catch (err) {
        logger.exception(err, { where: 'useCategoryData.loadCategory', categoryId });
        setError('Failed to load category');
        setIsLoading(false);
        // Reset ref on error to allow retry
        hasLoadedRef.current = false;
      }
    };

    loadCategory();
  }, [categoryId]);

  return {
    categoryName,
    setCategoryName,
    categoryDescription,
    setCategoryDescription,
    categoryImage,
    setCategoryImage,
    categoryImageFile,
    setCategoryImageFile,
    privacy,
    setPrivacy,
    questions,
    setQuestions,
    isLoading,
    error,
    setError,
    categoryOwnerId,
    isSaved,
    setIsSaved,
    savesCount,
    setSavesCount,
    likesCount,
    setLikesCount,
    isLiked,
    setIsLiked,
  };
}
