'use client';
import Image from 'next/image';
import React from 'react';
import { Globe, ImagePlus, Lock } from 'lucide-react';
import { getFullImageUrl } from '@/lib/utils/imageUtils';

interface CategoryDisplayProps {
  categoryName: string;
  categoryDescription: string;
  categoryImage: string | null;
  privacy: 'public' | 'private';
  likesCount: number;
  savesCount?: number;
}

function CategoryDisplay({
  categoryName,
  categoryDescription,
  categoryImage,
  privacy,
  likesCount,
  savesCount,
}: CategoryDisplayProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-6 items-start">
      {/* Image */}
      <div className="w-60 h-60 bg-gray-100 border   rounded-xl overflow-hidden flex items-center justify-center">
        {categoryImage ? (
         
          <Image
          src={getFullImageUrl(categoryImage) || ''}
          alt={categoryName}
          width={240}
          height={240}
          className="object-cover w-full h-full"
          unoptimized={true}
          onError={() => {/* fallback UI */}}
        />
        ) : (
          <ImagePlus className="h-12 w-12 text-gray-400" />
        )}
      </div>

      {/* Text info */}
      <div className="flex-1">
        <h2 className="text-2xl text-primary-800 font-bold mb-2">
          {categoryName || 'Untitled Category'}
        </h2>
        <p className="text-primary-700 mb-4">
          {categoryDescription || 'No description provided.'}
        </p>
        
        {/* Privacy Badge */}
        <div className="flex mb-6 ">
          <span className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 ${
            privacy === 'public' 
              ? 'bg-cyan-100 text-cyan-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {privacy === 'public' 
            ? (
              <>
                <Globe className="w-4 h-4" />
                Public
              </>)
             : (
              <>
                <Lock className="w-4 h-4" />
                Private
              </>
            )}
          </span>
        </div>
        
        {/* Stats Section */}
        <div className="bg-cyan-600 rounded-3xl shadow-lg p-1 inline-flex">
          <div className=" rounded-3xl p-1 flex items-center gap-3">
            {/* Likes */}
            <div className="flex flex-col items-center min-w-[100px]">
              <span className="text-white text-sm font-medium mb-1">Likes</span>
              <span className="text-white text-xl font-bold">{likesCount}</span>
            </div>
            
            {/* Divider */}
            <div className="w-px h-16 bg-white/30"></div>
            
            {/* Saves */}
            <div className="flex flex-col items-center min-w-[100px]">
              <span className="text-white text-sm font-medium mb-1">Saves</span>
              <span className="text-white text-xl font-bold">{savesCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Memoize to avoid rerenders when props are unchanged (image-heavy component)
export default React.memo(CategoryDisplay);
