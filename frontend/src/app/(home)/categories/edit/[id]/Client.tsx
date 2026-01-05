'use client';

import React, { useEffect } from 'react';
import { logger } from '@/lib/utils/logger';
import { useRouter, useParams } from 'next/navigation';
import QuestionsList from '@/components/category/QuestionsList';
import CategoryFormFields from '@/components/category/CategoryFormFields';
import CategoryPublicView from '@/components/category/CategoryPublicView';
import { useHeader } from '@/contexts/HeaderContext';
import { useAuthGate } from '@/hooks/useAuthGate';
import BounceLoader from '@/components/ui/loadingscreen';
import { useCategoryData } from '@/hooks/useCategoryData';
import { useCategoryActions } from '@/hooks/useCategoryActions';

export default function Client() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;
  const { setHeader } = useHeader();
  const { user } = useAuthGate();

  const {
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
  } = useCategoryData(categoryId);

  const {
    handleSave,
    handleDelete,
    handleToggleSave,
    handleLike,
    handleReport,
    handleDeleteQuestion,
    handleEditQuestion,
  } = useCategoryActions({
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
  });

  const isOwner = user?.id === categoryOwnerId;

  useEffect(() => {
    if (isOwner) {
      setHeader({ title: " Edit the category", backHref: "/categories" });
    } else {
      setHeader({ title: categoryName || "Show the Category", backHref: "/categories/add" });
    }
  }, [setHeader, isOwner, categoryName]);

  const handleImageChange = (file: File) => {
    logger.log('📸 Edit page received file:', file.name, file.size, 'bytes');
    setCategoryImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      logger.log('📸 Setting preview, length:', result.length);
      setCategoryImage(result);
    };
    reader.onerror = (err) => {
      logger.exception(err, { where: 'categories.edit.fileReader' });
    };
    reader.readAsDataURL(file);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <BounceLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-center">{error}</p>
            </div>
          )}

          {isOwner ? (
            <div className="rounded-xl shadow-xl p-10 w-full bg-white mb-6">
              <CategoryFormFields
                categoryName={categoryName}
                setCategoryName={setCategoryName}
                categoryDescription={categoryDescription}
                setCategoryDescription={setCategoryDescription}
                categoryImage={categoryImage}
                onImageChange={handleImageChange}
                privacy={privacy}
                setPrivacy={setPrivacy}
                onSave={handleSave}
                onDelete={handleDelete}
                likesCount={likesCount}
                savesCount={savesCount}
              />
            </div>
          ) : (
            <CategoryPublicView
              categoryName={categoryName}
              categoryDescription={categoryDescription}
              categoryImage={categoryImage}
              privacy={privacy}
              isSaved={isSaved}
              isLiked={isLiked}
              likesCount={likesCount}
              savesCount={savesCount}
              onToggleSave={handleToggleSave}
              onLike={handleLike}
              onReport={handleReport}
            />
          )}
       
          <QuestionsList
            questions={questions}
            {...(isOwner && {
              onAddQuestion: () => router.push(`/categories/edit/${categoryId}/addQ`),
              onDeleteQuestion: (id) => handleDeleteQuestion(id, setQuestions),
              onEditQuestion: handleEditQuestion,
            })}
          />
        </div>
      </main>
    </div>
  );
}
