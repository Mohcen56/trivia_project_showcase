'use client';

import React from 'react';
import { Heart, Flag, Bookmark, BookmarkCheck } from 'lucide-react';
import CategoryDisplay from './CategoryDisplay';

interface CategoryPublicViewProps {
  categoryName: string;
  categoryDescription: string;
  categoryImage: string | null;
  privacy: 'public' | 'private';
  isSaved: boolean;
  isLiked: boolean;
  likesCount: number;
  savesCount?: number;
  onToggleSave: () => Promise<void>;
  onLike: () => Promise<void>;
  onReport: () => void;
}

export default function CategoryPublicView({
  categoryName,
  categoryDescription,
  categoryImage,
  privacy,
  isSaved,
  isLiked,
  likesCount,
  savesCount,
  onToggleSave,
  onLike,
  onReport,
}: CategoryPublicViewProps) {
  return (
    <div className="rounded-xl shadow-xl p-10 w-full bg-white mb-6">
      <CategoryDisplay
        categoryName={categoryName}
        categoryDescription={categoryDescription}
        categoryImage={categoryImage}
        privacy={privacy}
        likesCount={likesCount}
        savesCount={savesCount}
      />
      
    

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 flex-wrap mt-6">
        {/* Save/Unsave Toggle Button */}
        <button
          onClick={onToggleSave}
          title={isSaved ? "Unsave category" : "Save category"}
          aria-label={isSaved ? "Unsave category" : "Save category"}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg ${
            isSaved
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {isSaved ? (
            <>
              <BookmarkCheck className="h-5 w-5" />
              <span className="sr-only">Unsave category</span>
            </>
          ) : (
            <>
              <Bookmark className="h-5 w-5" />
              <span className="sr-only">Save category</span>
            </>
          )}
        </button>

        {/* Like Button */}
        <button
          onClick={onLike}
          title={isLiked ? "Unlike category" : "Like category"}
          aria-label={isLiked ? "Unlike category" : "Like category"}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg ${
            isLiked ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-pink-500 hover:bg-pink-600 text-white'
          }`}
        >
          <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
          <span className="sr-only">{isLiked ? "Unlike category" : "Like category"}</span>
        </button>
        
        {/* Report Button */}
        <button
          onClick={onReport}
          title="Report category"
          aria-label="Report category"
          className="flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg"
        >
          <Flag className="h-5 w-5" />
          <span className="sr-only">Report category</span>
        </button>
      </div>
    </div>
  );
}
