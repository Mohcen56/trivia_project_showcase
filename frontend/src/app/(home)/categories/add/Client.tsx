'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userCategoriesAPI } from '@/lib/api';
import { User, Category } from '@/types/game';
import { Search,Lock, ArrowDownUp } from 'lucide-react';

import Image from 'next/image';
import Usersprofiles from '@/components/User/Usersprofiles';
import { useAuthGate } from '@/hooks/useAuthGate';
import { useImageError } from '@/hooks/useImageError';
import { useCategoriesData } from '@/hooks/useCategoriesData';
import { VerifyIcon } from '@/components/ui/verify-badge';
import { useHeader } from '@/contexts/HeaderContext';
import { logger } from '@/lib/utils/logger';
import BounceLoader from '@/components/ui/loadingscreen';
import { getFullImageUrl } from '@/lib/utils/imageUtils';

interface Props {
  userIsPremium: boolean;
  userId: number;
}

export default function Client({ userIsPremium, userId }: Props) {
  const [showProfile, setShowProfile] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortMode, setSortMode] = useState<'default' | 'likes' | 'saves' | 'newest'>('default');
  const router = useRouter();
  const { setHeader } = useHeader();
  const { user, isLoading: authLoading } = useAuthGate();
  const { handleError: handleImageError, hasError: hasImageError } = useImageError<number>();
  const { categories, isLoading: isLoadingCategories, error: categoriesError } = useCategoriesData('user');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  // Mutation for saving/unsaving categories with optimistic updates
  const saveMutation = useMutation({
    mutationFn: async ({ categoryId, isSaved }: { categoryId: number; isSaved: boolean }) => {
      if (isSaved) {
        return userCategoriesAPI.unsaveCategory(categoryId);
      } else {
        return userCategoriesAPI.saveCategory(categoryId);
      }
    },
    onMutate: async ({ categoryId, isSaved }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['categories', 'user'] });

      // Snapshot the previous value
      const previousCategories = queryClient.getQueryData(['categories', 'user']);

      // Optimistically update to the new value
      queryClient.setQueryData(['categories', 'user'], (old: Category[] | undefined) => {
        if (!old) return old;
        return old.map(cat =>
          cat.id === categoryId ? { ...cat, is_saved: !isSaved } : cat
        );
      });

      return { previousCategories };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousCategories) {
        queryClient.setQueryData(['categories', 'user'], context.previousCategories);
      }
      logger.exception(err, { where: 'categories.add.saveMutation' });
      setError('Failed to update category. Please try again.');
    },
    onSuccess: () => {
      // Refetch to ensure consistency across pages
      queryClient.invalidateQueries({ queryKey: ['categories', 'user'] });
      queryClient.invalidateQueries({ queryKey: ['allCategoryData'] });
    },
  });

  // Mutation for liking/unliking categories with optimistic updates
  const likeMutation = useMutation({
    mutationFn: async ({ categoryId, isLiked }: { categoryId: number; isLiked: boolean }) => {
      if (isLiked) {
        return userCategoriesAPI.unlikeCategory(categoryId);
      } else {
        return userCategoriesAPI.likeCategory(categoryId);
      }
    },
    onMutate: async ({ categoryId, isLiked }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['categories', 'user'] });

      // Snapshot the previous value
      const previousCategories = queryClient.getQueryData(['categories', 'user']);

      // Optimistically update to the new value
      queryClient.setQueryData(['categories', 'user'], (old: Category[] | undefined) => {
        if (!old) return old;
        return old.map(cat =>
          cat.id === categoryId ? { 
            ...cat, 
            is_liked: !isLiked,
            likes_count: isLiked 
              ? Math.max(0, (cat.likes_count || 0) - 1)
              : (cat.likes_count || 0) + 1
          } : cat
        );
      });

      return { previousCategories };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousCategories) {
        queryClient.setQueryData(['categories', 'user'], context.previousCategories);
      }
      logger.exception(err, { where: 'categories.add.likeMutation' });
      setError('Failed to update like. Please try again.');
    },
    onSuccess: () => {
      // Refetch to ensure consistency across pages
      queryClient.invalidateQueries({ queryKey: ['categories', 'user'] });
      queryClient.invalidateQueries({ queryKey: ['allCategoryData'] });
    },
  });

  useEffect(() => {
    setHeader({ title: " Categories Added by Users", backHref: "/categories" });
  }, [setHeader]);

  // Close filters dropdown when clicking outside
  useEffect(() => {
    if (!filtersOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-filters-menu]')) {
        setFiltersOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [filtersOpen]);

  // Sync categories error to local error state
  useEffect(() => {
    if (categoriesError) {
      setError(categoriesError);
    }
  }, [categoriesError]);

  // Auto-dismiss error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleCategoryClick = useCallback((category: Category) => {
    // Navigate to edit/view page for all custom categories
    router.push(`/categories/edit/${category.id}`);
  }, [router]);

  const handleSaveCategory = useCallback(async (e: React.MouseEvent, category: Category) => {
    e.stopPropagation();
    
    // Check if user is premium or owns the category
    const isOwner = user && category.created_by_id === user.id;
    const isPremium = userIsPremium;
    
    if (!isOwner && !isPremium) {
      setError('Saving categories is a premium feature. Upgrade to premium to save categories created by others!');
      return;
    }
    
    // Use the mutation with optimistic updates
    saveMutation.mutate({
      categoryId: category.id,
      isSaved: category.is_saved || false,
    });
  }, [user, userIsPremium, saveMutation]);

  const handleLikeCategory = useCallback(async (e: React.MouseEvent, category: Category) => {
    e.stopPropagation();
    
    // Use the mutation with optimistic updates
    likeMutation.mutate({
      categoryId: category.id,
      isLiked: category.is_liked || false,
    });
  }, [likeMutation]);

  // Keep list separate for use in JSX
  const list = categories || [];
  
  // Memoize filtered and sorted categories for performance
  const filteredCategories = useMemo(() => {
    return list
      .filter((cat) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        const name = cat.name?.toLowerCase() || '';
        const creator = (cat.created_by_username || '').toLowerCase();
        return name.includes(q) || creator.includes(q);
      })
      .slice()
      .sort((a, b) => {
        if (sortMode === 'likes') {
          const la = a.likes_count ?? 0;
          const lb = b.likes_count ?? 0;
          if (lb !== la) return lb - la;
        } else if (sortMode === 'saves') {
          const sa = a.saves_count ?? 0;
          const sb = b.saves_count ?? 0;
          if (sb !== sa) return sb - sa;
        } else if (sortMode === 'newest') {
          if (b.id !== a.id) return b.id - a.id;
        }
        return (a.name || '').localeCompare(b.name || '');
      });
  }, [list, search, sortMode]);

  if (authLoading || isLoadingCategories) {
    return (
      <div className="min-h-screen bg-eastern-blue-50 flex items-center justify-center">
        <BounceLoader />
      </div>
    );
  }

  return (
    <>
      {showProfile && selectedUser ? (
        <Usersprofiles
          user={selectedUser}
          onBack={() => setShowProfile(false)}
        />
      ) : (
        <div className="min-h-screen bg-eastern-blue-50">
 
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {error && (
            <div className="bg-red-100 border border-red-300 rounded-lg p-4">
              <p className="text-primary-800 text-center">{error}</p>
            </div>
          )}
              {/* Search + Filters */}
              <div className="flex  gap-3 justify-center mb-6 flex-row md:items-center md:gap-4">
                {/* Search input */}
                <div className="relative flex-1 max-w-5xl">
                  <Search className="w-4 h-4 text-primary-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or creator…"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-primary-200 bg-white/80 outline-none focus:ring-2 focus:ring-eastern-blue-400 text-sm text-primary-800 placeholder:text-primary-400"
                    aria-label="Search categories"
                  />
                </div>

                {/* Sort button */}
                <div className="relative" data-filters-menu>
                  <button 
                    onClick={() => setFiltersOpen((v) => !v)}
                    className="inline-flex items-center gap-2 bg-white/70 hover:bg-white/90 px-8 py-2 rounded-xl border border-primary-200 shadow-sm text-sm text-primary-800"
                    aria-haspopup="true"
                    aria-expanded={filtersOpen}
                  >
                    <ArrowDownUp className="w-4 h-4" />
                    Sort
                    {sortMode !== 'default' && (
                      <span className="ml-1 inline-flex items-center justify-center text-xs bg-eastern-blue-600 text-white rounded-full px-1.5 py-0.5">
                        1
                      </span>
                    )}
                  </button>

                  {filtersOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-primary-200 shadow-lg rounded-xl p-2 z-30">
                      <ul className="text-sm text-primary-800">
                        <li>
                          <button onClick={() => { setSortMode('default'); setFiltersOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg hover:bg-primary-50 ${sortMode==='default' ? 'bg-primary-50 font-semibold' : ''}`}>Default (A–Z)</button>
                        </li>
                        <li>
                          <button onClick={() => { setSortMode('likes'); setFiltersOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg hover:bg-primary-50 ${sortMode==='likes' ? 'bg-primary-50 font-semibold' : ''}`}>Most liked</button>
                        </li>
                        <li>
                          <button onClick={() => { setSortMode('saves'); setFiltersOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg hover:bg-primary-50 ${sortMode==='saves' ? 'bg-primary-50 font-semibold' : ''}`}>Most saved</button>
                        </li>
                        <li>
                          <button onClick={() => { setSortMode('newest'); setFiltersOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg hover:bg-primary-50 ${sortMode==='newest' ? 'bg-primary-50 font-semibold' : ''}`}>Newest</button>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          {/* Categories Section */}
          <div className="bg-cyan-50 backdrop-blur-md rounded-2xl p-6 mb-8 border border-primary-200 shadow-lg">
            {/* Section Header */}
            <div className="relative flex flex-col gap-4 -mt-11 mb-4">
              <div className="flex items-center justify-between">
                <div className="bg-cyan-700 text-white px-2 md:px-6 py-2 rounded-full  shadow-md">
                  <h3 className=" text-xs md:text-xl font-bold text-start md:text-center">Added Categories</h3>
                </div>
                <div className="text-primary-600 text-xs px-2 md:text-sm bg-primary-50 md:px-3 py-1 rounded-full">
                  {filteredCategories.length} of {list.length} categories
                </div>
              </div>

            

            {/* Categories Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {/* Add Category Button */}
              <Link
                href="/categories/create"
                className="relative w-full aspect-[3/4] min-h-[230px] sm:min-h-[230px] rounded-3xl border-2 border-dashed border-cyan-600 overflow-hidden shadow-xl transition-all duration-200 transform hover:scale-105 hover:border-cyan-600 bg-white/50 backdrop-blur-sm flex flex-col items-center justify-center group"
              >
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="w-15 h-15 md:w-20 md:h-20 bg-gradient-to-br from-cyan-600 to-cyan-700 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div className=" text-center text-xs font-normal text-cyan-600 mt-1">Add your own Category</div>
                </div>
              </Link>

              {/* Existing Categories */}
              {filteredCategories.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <div className="text-primary-600 text-xl mb-4">
                  No categories match your search or filters.  
                  </div>
                  <p className="text-primary-400">
                    Try adjusting your search or clearing filters.
                  </p>
                </div>
              ) : (
                filteredCategories.map((category) => {
                  const isOwner = user && category.created_by_id === user.id;
                  const isPending = isOwner && !category.is_approved;
                  const canSave = isOwner || userIsPremium;

                  return (
                    <div
                      key={category.id}
                      onClick={() => handleCategoryClick(category)}
                      className={`relative w-full h-full aspect-[3/4] min-h-[230px] rounded-3xl border-primary-300 overflow-hidden shadow-xl transition-all duration-200 transform hover:scale-105 cursor-pointer ${
                        isPending ? 'opacity-75 ring-2 ring-orange-400' : ''
                      }`}
                    >
                      {/* Pending Approval Overlay */}
                      {isPending && (
                        <div className="absolute top-0 left-0 right-0 bg-orange-500 text-white text-xs font-bold py-1 px-2 text-center z-20">
                          Pending Approval
                        </div>
                      )}

                      {/* Top Section - User Profile Header (10%) */}
                      <div className="h-[15%] bg-gradient-to-br from-cyan-500 to-cyan-900 rounded-t-xl px-3 py-1 flex items-center justify-between z-10">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (category.created_by_id) {
                                setSelectedUser({
                                  id: category.created_by_id,
                                  username: category.created_by_username || 'Unknown',
                                  email: '',
                                  avatar: category.created_by_avatar || '/avatars/thumbs.svg',
                                  is_premium: category.created_by_is_premium
                                });
                                setShowProfile(true);
                              }
                            }}
                            className=" w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center hover:scale-105 transition-transform cursor-pointer overflow-hidden shadow-lg bg-white/20"
                            aria-label="View creator profile"
                          >
                            <Image
                              src={getFullImageUrl(category.created_by_avatar) || '/avatars/thumbs.svg'}
                              alt="Creator Profile"
                              width={32}
                              height={32}
                              className="w-full h-full object-cover rounded-full"
                              loading="lazy"
                              unoptimized={true}
                              quality={75}
                            />
                          </button>
                          <span className="text-eastern-blue-100  text-xs md:text-sm font-semibold leading-tight flex items-center gap-1">
                            {category.created_by_username || 'Unknown'}
                            {category.created_by_is_premium && (
                              <VerifyIcon type="premium" size="xs" />
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Middle Section - Category Image (60%) */}
                      <div className="h-[65%] relative flex justify-center items-center overflow-hidden bg-white">
                        <div className="relative h-full w-full">
                          {(category.image_url || category.image) && !hasImageError(category.id) ? (
                            <Image
                              src={getFullImageUrl(category.image_url || category.image) || ''}
                              alt={category.name}
                              className="w-full h-full object-cover"
                              fill
                              sizes="(max-width: 768px) 80vw, 33vw"
                              loading="lazy"
                              quality={85}
                              unoptimized={true}
                              onError={() => handleImageError(category.id)}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-18 h-18 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 rounded-4xl flex items-center justify-center text-white text-2xl font-bold shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
                                {category.name.charAt(0).toUpperCase()}
                              </div>
                            </div>
                          )}
                          
                          {/* Questions Count Badge */}
                          <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{category.questions_count || 0}</span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Section - Dark Background with Actions */}
                      <div className="relative h-[22%] bg-gradient-to-br from-cyan-500 to-cyan-900  px-3 py-1 flex flex-col justify-between">

                        <div className="flex flex-col gap-1 ">
                          {/* Category Name */}
                          <h3 className="text-eastern-blue-100 font-bold mb-0 text-xs md:text-sm leading-tight  line-clamp-2 flex-grow">
                            {category.name}
                          </h3>

                          {/* Actions */}
                          <div className="flex items-center gap-2 mb-1">
                            <button
                              onClick={(e) => handleSaveCategory(e, category)}
                              disabled={!canSave && !category.is_saved}
                              className={`flex-1 ${
                                category.is_saved
                                  ? 'bg-green-500 hover:bg-green-600'
                                  : canSave
                                  ? 'bg-white/20 hover:bg-white/30 backdrop-blur-sm'
                                  : 'bg-gray-500/50 cursor-not-allowed'
                              } text-white text-xs font-semibold p-1 md:py-2 px-3 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 ${
                                !canSave && !category.is_saved ? 'opacity-60' : ''
                              }`}
                              title={!canSave && !category.is_saved ? '🔒 Premium feature' : ''}
                            >
                              {/* PREMIUM STAR ICON */}
                              {!canSave && !category.is_saved && (
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              )}

                              {category.is_saved ? (
                                <>
                                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  <span className="hidden md:inline">Saved</span>
                                </>
                              ) : (
                                <>
                                  {/* Show Plus icon only if allowed to save */}
                                  {canSave && (
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                  )}

                                  {/* Premium Logic */}
                                  {!canSave && (
                                    <>
                                      {/* Lock Icon: Visible ONLY on mobile (Removed mb-2) */}
                                      <Lock className="w-3 h-3 text-white md:hidden" />
                                      
                                      {/* "Premium only" Text: Visible ONLY on desktop */}
                                      <span className="hidden md:inline">Premium only</span>
                                    </>
                                  )}
                                </>
                              )}
                            </button>
                            
                            <button
                              onClick={(e) => handleLikeCategory(e, category)}
                              className={`${
                                category.is_liked 
                                  ? 'bg-red-500 hover:bg-red-600' 
                                  : 'bg-white/20 hover:bg-white/30'
                              } backdrop-blur-sm px-3 md:py-2 py-1 rounded-lg transition-all shadow-md hover:shadow-lg group flex items-center gap-1.5`}
                              aria-label={category.is_liked ? 'Unlike category' : 'Like category'}
                              title={category.is_liked ? 'Unlike this category' : 'Like this category'}
                            >
                              {category.is_liked ? (
                                // Filled heart when liked
                                <svg 
                                  className="w-4 h-4 text-white transition-all scale-110" 
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                              ) : (
                                // Empty heart when not liked
                                <svg 
                                  className="w-4 h-4 text-white group-hover:text-red-300 transition-colors" 
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                              )}
                              <span className="text-white text-xs font-semibold">
                                {category.likes_count || 0}
                              </span>
                            </button>
                          </div>
                        </div>

                      
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
      )}
    </>
  );
}
