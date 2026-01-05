'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Category, Collection } from '@/types/game';
import { logger } from '@/lib/utils/logger';
import { Crown, Lock, Eye, Pencil, Info, Search, ChevronDown } from 'lucide-react';
import { ProcessingButton } from '@/components/ui/button2';
import { useNotification } from '@/hooks/useNotification';
import Image from 'next/image';
import { useMembership } from '@/hooks/useMembership';
import { categoriesAPI } from '@/lib/api';
import { useImageError } from '@/hooks/useImageError';
import { useHeader } from '@/contexts/HeaderContext';
import BounceLoader from '@/components/ui/loadingscreen';

type AllCategoryData = {
  collections: Collection[];
  saved_categories: Category[];
  fallback_categories: Category[];
};

type Props = {
  initialData: AllCategoryData | null;
};

export default function CategoriesList({ initialData }: Props) {
  const { membership, currentUserId, isLoaded } = useMembership();
  const [error, setError] = useState<string>('');
  const notify = useNotification();
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [infoModal, setInfoModal] = useState<{ open: boolean; category: Category | null }>({ open: false, category: null });
  const { setHeader } = useHeader();
  const router = useRouter();
  const { handleError: handleImageError, hasError: hasImageError } = useImageError<string>();
  // Search & filter state
  const [search, setSearch] = useState('');
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | 'all'>('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Use React Query with server-side initialData
  const { data, isLoading: queryLoading, error: queryError } = useQuery({
    queryKey: ['allCategoryData'],
    queryFn: categoriesAPI.getAllCategoryData,
    initialData: initialData || undefined,
    staleTime: 0, // always considered stale so we refetch with user auth
    refetchOnMount: 'always',
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
  });

  const isLoading = queryLoading || !data;

  // Build collections array with added categories
  const collections = useMemo(() => {
    if (!data) return [];

    const addedCollection: Collection = {
      id: 999,
      name: 'Added Categories',
      order: -1,
      categories: data.saved_categories || [],
      categories_count: (data.saved_categories || []).length,
    };

    return [addedCollection, ...(data.collections || [])];
  }, [data]);

  // Filtered collections based on search and selected collection
  const filteredCollections = useMemo(() => {
    const lower = search.trim().toLowerCase();

    // Start from collections array
    let base = collections.slice();

    // If a specific collection is selected, filter to that collection
    if (selectedCollectionId !== 'all') {
      base = base.filter((c) => c.id === selectedCollectionId);
    }

    // For each collection, filter its categories by search string
    base = base.map((col) => ({
      ...col,
      categories: (col.categories || []).filter((cat: Category) => {
        if (!lower) return true;
        const name = (cat.name || '').toString().toLowerCase();
        const creator = (cat.created_by_username || '').toString().toLowerCase();
        return name.includes(lower) || creator.includes(lower);
      }),
    }));

    // Remove empty collections, BUT always keep "Added Categories" so users can add their first category
    return base.filter((c) => 
      c.name.toLowerCase() === 'added categories' || (c.categories || []).length > 0
    );
  }, [collections, search, selectedCollectionId]);

  useEffect(() => {
    setHeader({ title: "Categories", backHref: "/dashboard" });
  }, [setHeader]);

  useEffect(() => {
    if (queryError) {
      logger.exception('Failed to load category data', { where: 'categories.page.loadAll', error: queryError });
      setError('Failed to load categories');
    }
  }, [queryError]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      // Close info modal when clicking outside
      if (infoModal.open) {
        const target = event.target as HTMLElement;
        if (!target.closest('[role="button"]') && !target.closest('.info-dropdown')) {
          setInfoModal({ open: false, category: null });
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [infoModal.open]);

  // Function to get played percentage for a category (user-specific)
  const getPlayedPercentage = (category: Category) => {
      logger.log('Category data for user percentage calculation:', {
      name: category.name,
      total_questions: category.total_questions,
      user_played_questions: category.user_played_questions
    });
    
    if (
      typeof category.total_questions === 'number' &&
      typeof category.user_played_questions === 'number' &&
      category.total_questions > 0
    ) {
      const percentage = Math.min(100, Math.round((category.user_played_questions / category.total_questions) * 100));
    logger.log(`Calculated user percentage for ${category.name}: ${percentage}%`);
      return percentage;
    }
    logger.log(`No valid user data for ${category.name}, returning 0%`);
    return 0;
  };

  // Function to get local illustration path
  const getLocalIllustration = (categoryName: string) => {
    const illustrationMap: { [key: string]: string } = {
      'anime': '/category-illustrations/anime.svg',
      'anime 2': '/category-illustrations/anime2.svg',
      'Science': '/category-illustrations/science.svg',
      'History': '/category-illustrations/history.svg',
      'Premium Literature': '/category-illustrations/literature.svg',
      'Premium Geography': '/category-illustrations/geography.svg',
      'countries': '/category-illustrations/countries.svg',
      'Sports': '/category-illustrations/sports.svg',
    };
    return illustrationMap[categoryName];
  };

  const handleCategoryToggle = (categoryId: number, isPremium: boolean) => {
    if (isPremium && !membership?.is_premium) {
      setError('This category is available for premium members only');
      return;
    }

    setError('');
    
    // Check if we're trying to select more than 6 categories
    if (!selectedCategories.includes(categoryId) && selectedCategories.length >= 6) {
      setError('You can select a maximum of 6 categories');
      return;
    }

    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const isValidToStart = () => {
    return selectedCategories.length >= 2;
  };

  const handleProceedToTeams = async (): Promise<boolean> => {
    if (!isValidToStart()) {
      setError('You must select at least two categories');
      notify.error('Selection Invalid', 'Select at least two categories');
      return false;
    }
    localStorage.setItem('selectedCategories', JSON.stringify(selectedCategories));
    notify.success('Categories Locked In', 'Proceeding to team setup...', 2500);
    setTimeout(() => router.push('/teams'), 300);
    return true;
  };

  if (isLoading || !isLoaded) {
    return (
      <div className="min-h-screen bg-eastern-blue-50 flex items-center justify-center">
        <BounceLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-eastern-blue-50">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {error && (
            <div className="bg-red-100 border border-red-300 rounded-lg p-4">
              <p className="text-primary-800 text-center">{error}</p>
            </div>
          )}

          {/* Categories Selection */}
          <div className="space-y-6">
            <div className="flex  gap-3 justify-center mb-8 flex-row md:items-center md:gap-4">
              {/* Search input */}
              <div className="relative flex-1 max-w-xs md:max-w-4xl">
                <Search className="w-4 h-4 text-primary-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name  "
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-primary-200 bg-white/80 outline-none focus:ring-2 focus:ring-eastern-blue-400 text-sm text-primary-800 placeholder:text-primary-400"
                  aria-label="Search categories"
                />
              </div>

              {/* Collection filter custom dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="inline-flex items-center gap-2 bg-white/70 px-6 py-2 rounded-xl border border-primary-200 shadow-sm text-sm text-primary-800 hover:bg-white transition-colors min-w-[200px] md:min-w-[300px] justify-between"
                  aria-label="Filter by collection"
                >
                  <span>
                    {selectedCollectionId === 'all'
                      ? 'All collections'
                      : collections.find((c) => c.id === selectedCollectionId)?.name || 'All collections'}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute top-full mt-2 w-full max-w-xs md:min-w-[300px] bg-white rounded-xl border border-primary-200 shadow-lg z-50 overflow-hidden">
                    <button
                      onClick={() => {
                        setSelectedCollectionId('all');
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-xs md:text-sm transition-colors hover:bg-blue-50 ${
                        selectedCollectionId === 'all' ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-primary-800'
                      }`}
                    >
                      All collections
                    </button>
                    {collections.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedCollectionId(c.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3  text-xs md:text-sm transition-colors hover:bg-blue-50 flex items-center justify-between ${
                          selectedCollectionId === c.id ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-primary-800'
                        }`}
                      >
                        <span>{c.name}</span>
                        <span className="text-xs bg-primary-100 text-primary-600 px-2 py-1 rounded-full">
                          {(c.categories || []).length}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

             
            </div>
            
            {/* Collections Display */}
            {filteredCollections.map((collection) => (
              <div key={collection.id} className="bg-cyan-50 backdrop-blur-md rounded-2xl p-6  mb-8 border border-primary-200 shadow-lg">
                {/* Collection Header */}
                <div className="relative flex itemscenter justify-between  -mt-11 mb-4">
                  <div className="bg-cyan-700 text-white px-2 md:px-6 py-2  rounded-full shadow-md">
                    <h3 className=" text-xs md:text-xl font-bold text-start md:text-center">{collection.name}</h3>
                  </div>
                  <div className="absolute -right-3 lg:right-0 top-1/2 transform -translate-y-1/2 text-primary-600 text-xs md:text-sm bg-primary-50 px-2 md:px-3 py-1 rounded-full">
                    {collection.categories?.length || 0} categories
                  </div>
                </div>
                
                {/* Categories in this collection */}
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                  {/* Add Category Button - Only show in "Added Categories" collection */}
                  {collection.name.toLowerCase() === "added categories" && (
                    <Link
                      href="/categories/add"
                      className="relative w-full aspect-[3/4] min-h-[180px] sm:min-h-[220px] rounded-3xl border-2 border-dashed border-cyan-600 overflow-hidden shadow-xl transition-all duration-200 transform hover:scale-105 hover:border-cyan-600 bg-white/50 backdrop-blur-sm flex flex-col items-center justify-center group"
                    >
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="w-15 h-15 lg:w-20 lg:h-20 bg-gradient-to-br from-cyan-600 to-cyan-700 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <svg className="w-8 h-8 lg:w-12 lg:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        
                          <div className="text-sm font-normal text-cyan-600 mt-1">Add Category</div>
                        </div>
                      
                    </Link>
                  )}
                  
                  {collection.categories?.map((category) => {
                    const isSelected = selectedCategories.includes(category.id);
                    const isPremium = category.is_premium;
                    const canSelect = !isPremium || membership?.is_premium;
                    const isLocked = !isSelected && selectedCategories.length >= 6; // Lock unselected categories when 6 are selected
                    const playedPercent = getPlayedPercentage(category);
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryToggle(category.id, isPremium)}
                    disabled={!canSelect || isLocked}
                    className={`relative w-full aspect-[3/4] min-h-[200px] sm:min-h-[220px] overflow-hidden border-4 rounded-4xl transition-all duration-200 transform hover:scale-105 ${
                      isSelected
                              ? 'border-yellow-400' // Selected border color
                              : 'border-cyan-700' // Default border color
                    } ${(!canSelect || isLocked) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {/* Top Section - Cream Background */}
                    <div className="relative h-[79%]   ">
                      {/* Info/Edit/View Icon Button */}
                      <div className="absolute top-2 ml-1  z-30">
                        <span
                          role="button"
                          tabIndex={3}
                          onClick={e => {
                            e.stopPropagation();
                            // If custom category, navigate to edit/view page
                            if (category.is_custom) {
                              router.push(`/categories/edit/${category.id}`);
                            } else {
                              // For official categories, toggle dropdown
                              setInfoModal({ 
                                open: infoModal.category?.id === category.id ? !infoModal.open : true, 
                                category 
                              });
                            }
                          }}
                          className="bg-gradient-to-br from-cyan-700 to-cyan-800 text-white w-7 h-7 rounded-full flex items-center justify-center text-base font-bold hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
                        >
                          {category.is_custom && category.created_by_id === currentUserId ? (
                            <Pencil className="h-4 w-4" />
                          ) : category.is_custom ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <Info className="h-9 w-9" />
                          )}
                        </span>
                        
                        {/* Dropdown Info Panel */}
                        {infoModal.open && infoModal.category?.id === category.id && (
                          <div 
                            className="info-dropdown absolute top-full  mt-2 min-w-33 md:w-53 bg-white rounded-xl shadow-2xl border border-gray-200 p-2 md:p-4 z-50 animate-fadeIn"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-bold text-gray-900 text-xs md:text-sm">{category.name}</h3>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setInfoModal({ open: false, category: null });
                                }}
                                className="text-gray-400 hover:text-gray-600 -mt-1"
                              >
                                ×
                              </button>
                            </div>
                            <p className="text-gray-600 text-[9px] md:text-xs  leading-relaxed">
                              {category.description || 'No description available for this category.'}
                            </p>
                          </div>
                        )}
                      </div>
                      {/* Percentage Badge */}
                      <div className="absolute top-2 right-0 bg-gradient-to-br from-cyan-700 to-cyan-800 text-white text-xs lg:text-sm font-bold px-2 lg:px-3 py-1  lg:min-w-[45px] text-center z-20">
                        {playedPercent}%
                      </div>
                      {/* Category image */}
                      <div className={`h-full w-full bg-cyan-100 ${(!canSelect ? 'grayscale' : '')}`}>
                        {((category.image_url || category.image || getLocalIllustration(category.name))) && !hasImageError(category.name) ? (
                          <Image
                            src={(category.image_url || category.image || getLocalIllustration(category.name))!}
                            alt={category.name}
                            className="w-full h-full object-cover  "
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            style={{ objectFit: 'cover', borderRadius: '0 rem' }}
                            loading="lazy"
                            quality={85}
                            unoptimized={true}
                            onError={() => handleImageError(category.name)}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-20 h-20  bg-gradient-to-br from-cyan-700 to-cyan-800 flex items-center justify-center text-white  text-xs md:text-2xl font-bold shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
                              {category.name.charAt(0)}
                            </div>
                          </div>
                        )}
                        {/* Locked Overlay */}
                        {isPremium && !membership?.is_premium && (
                          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center z-10">
                            <Lock className="h-8 w-8 text-white mb-2" />
                            <span className="text-white text-xs font-semibold">Premium</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Bottom Section - Dark Background */}
                    <div className="relative h-[22%] bg-gradient-to-br from-cyan-700 to-cyan-800 flex items-center justify-center z-50 p-4">
                      <h3 className="text-white  items-center font-bold text-xs md:text-lg text-center leading-tight">
                        {category.name}
                      </h3>
                      {/* Premium/Lock Indicator */}
                      {isPremium && (
                        <div className="absolute top-1 text-center">
                          {canSelect ? (
                            <Crown className="h-3 w-3 md:h-4 md:w-4 text-yellow-400" />
                          ) : (
                            <Lock className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      )}
                      {/* Selection Indicator */}
                      {isSelected && (
                        <div className="absolute top-0 left-2 lg:top-2 lg:left-2 bg-yellow-400 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">
                          ✓
                        </div>
                      )}
                    </div>
                    {/* Gold Border for Premium */}
                    
                    
                  </button>
                );
              })}
                </div>
              </div>
            ))}
            
            {/* Selected Categories Count */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-primary-200 shadow-lg text-center">
              <p className="text-primary-600 font-semibold">
                Selected: {selectedCategories.length}/6 categories
              </p>
            </div>
          </div>

          {/* Proceed to Teams Button */}
          <div className="text-center ">
            <div className="inline-block group/button relative overflow-hidden rounded-xl">
              <ProcessingButton
                onProcess={handleProceedToTeams}
                disabled={!isValidToStart()}
                icon="users"
                processingText="just a sec..."
                successText=""
                errorText="Needs 2+"
                className="relative bg-cyan-500 hover:bg-cyan-600 hover:shadow-lg hover:shadow-red-500/30 disabled:bg-gray-600 text-white font-bold py-8 px-10 transition-all duration-300 ease-in-out hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
              >
                <span className="relative z-10">Continue to Team Setup</span>
              </ProcessingButton>
              <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-13deg)_translateX(-100%)] group-hover/button:duration-1000 group-hover/button:[transform:skew(-13deg)_translateX(100%)] pointer-events-none">
                <div className="relative h-full w-16 bg-white/30" />
              </div>
            </div>
            
            {!isValidToStart() && (
              <p className="text-gray-600 text-sm mt-3">
                You must select at least two categories
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
