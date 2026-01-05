import React from 'react';

interface CategorySkeletonProps {
  count?: number;
  showAddButton?: boolean;
  variant?: 'default' | 'user'; // default for main categories page, user for add page
}

export default function CategorySkeleton({ 
  count = 10, 
  showAddButton = false,
  variant = 'default'
}: CategorySkeletonProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Search & Filter Skeleton */}
        <div className="flex flex-col gap-3 justify-center mb-8 md:flex-row md:items-center md:gap-4 animate-pulse">
          {/* Search input skeleton */}
          <div className="relative flex-1 max-w-xl">
            <div className="w-full h-10 bg-white/80 rounded-xl border border-primary-200"></div>
          </div>
          
          {/* Filter/Sort button skeleton */}
          <div className="w-full md:w-[250px] h-10 bg-white/70 rounded-xl border border-primary-200"></div>
        </div>

        {/* Collection/Section skeleton */}
        <div className={`${variant === 'user' ? 'bg-eastern-blue-100' : 'bg-cyan-50'} backdrop-blur-md rounded-2xl p-6 mb-8 border border-primary-200 shadow-lg animate-pulse`}>
          {/* Collection Header Skeleton */}
          <div className="relative flex justify-start -mt-11 mb-4">
            <div className={`${variant === 'user' ? 'bg-eastern-blue-700' : 'bg-cyan-700'} text-white px-6 py-2 rounded-full shadow-md`}>
              <div className="h-6 w-48 bg-white/30 rounded"></div>
            </div>
            <div className="absolute -right-3 lg:right-0 top-1/2 transform -translate-y-1/2 bg-primary-50 px-3 py-1 rounded-full">
              <div className="h-4 w-28 bg-primary-200 rounded"></div>
            </div>
          </div>

          {/* Categories Grid Skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* Add Button Skeleton (optional) */}
            {showAddButton && (
              <div className="relative w-full aspect-[3/4] min-h-[180px] sm:min-h-[220px] rounded-3xl border-2 border-dashed border-eastern-blue-400 bg-white/50 backdrop-blur-sm">
                <div className="flex flex-col items-center justify-center h-full space-y-3">
                  <div className="w-15 h-15 md:w-20 md:h-20 bg-gradient-to-br from-eastern-blue-400/50 to-eastern-blue-600/50 rounded-2xl"></div>
                  <div className="h-3 w-24 bg-eastern-blue-400/30 rounded"></div>
                </div>
              </div>
            )}

            {/* Category Card Skeletons */}
            {Array.from({ length: count }).map((_, index) => (
              <div
                key={index}
                className={`relative w-full aspect-[3/4] ${variant === 'user' ? 'min-h-[220px]' : 'min-h-[180px] sm:min-h-[220px]'} overflow-hidden ${variant === 'user' ? 'rounded-3xl shadow-xl' : 'border-4 border-cyan-700/50 rounded-4xl'}`}
              >
                {variant === 'user' ? (
                  <>
                    {/* User Variant - Similar to add page */}
                    {/* Top Section - User Profile Header (15%) */}
                    <div className="h-[15%] bg-gradient-to-br from-cyan-500 to-cyan-900 rounded-t-xl px-3 py-1 flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-white/20"></div>
                      <div className="h-3 w-20 bg-eastern-blue-100/30 rounded"></div>
                    </div>

                    {/* Middle Section - Category Image (65%) */}
                    <div className="h-[65%] bg-gradient-to-br from-gray-200 to-gray-300 relative">
                      {/* Question count badge skeleton */}
                      <div className="absolute bottom-3 left-3 bg-black/40 px-3 py-1.5 rounded-full">
                        <div className="h-3 w-16 bg-white/30 rounded"></div>
                      </div>
                    </div>

                    {/* Bottom Section - Actions (20%) */}
                    <div className="h-[20%] bg-gradient-to-br from-cyan-500 to-cyan-900 px-3 py-2 flex flex-col justify-between">
                      {/* Category name skeleton */}
                      <div className="h-3 w-24 bg-white/30 rounded mb-2"></div>
                      {/* Action buttons skeleton */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-8 bg-white/20 rounded-lg"></div>
                        <div className="w-12 h-8 bg-white/20 rounded-lg"></div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Default Variant - Similar to main categories page */}
                    {/* Top Section (80%) */}
                    <div className="relative h-[80%] bg-gradient-to-br from-cyan-700 to-cyan-800">
                      {/* Info icon skeleton */}
                      <div className="absolute top-2 left-2 w-7 h-7 bg-white/30 rounded-full"></div>
                      {/* Percentage badge skeleton */}
                      <div className="absolute top-2 right-0 bg-gradient-to-br from-cyan-700 to-cyan-800 text-white text-xs lg:text-sm font-bold px-2 lg:px-3 py-1  lg:min-w-[45px] text-center z-20">
                        <div className="h-3 w-10 bg-white/30 rounded"></div>
                      </div>
                      
                      {/* Image placeholder */}
                      <div className="h-full w-full bg-gradient-to-br from-gray-300 to-gray-400"></div>
                    </div>

                    {/* Bottom Section (21%) */}
                    <div className="relative h-[21%] bg-gradient-to-br from-cyan-700 to-cyan-800 flex items-center justify-center p-4">
                      {/* Category name skeleton */}
                      <div className="h-4 w-24 bg-white/30 rounded"></div>
                     
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
