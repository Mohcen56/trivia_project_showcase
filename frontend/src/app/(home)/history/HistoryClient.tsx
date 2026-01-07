'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { gamesAPI } from '@/lib/api';
import { logger } from '@/lib/utils/logger';
import { useHeader } from '@/contexts/HeaderContext';
import { Clock, Play } from 'lucide-react';
import Image from 'next/image';
import { useImageError } from '@/hooks/useImageError';
import { getFullImageUrl } from '@/lib/utils/imageUtils';
import { ShinyButton } from '@/components/ui/ShinyButton';
import BounceLoader from '@/components/ui/loadingscreen';

interface GameCategory {
  id: number;
  name: string;
  description: string;
  image_url: string | null;
  is_premium: boolean;
}

interface GameHistory {
  id: number;
  mode: string;
  date_played: string;
  categories: GameCategory[];
}

export default function HistoryClient() {
  const router = useRouter();
  const { setHeader } = useHeader();
  const [games, setGames] = useState<GameHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { handleError: handleImageError, hasError: hasImageError } = useImageError<string>();

  useEffect(() => {
    setHeader({ title: 'Game History', backHref: '/dashboard' });
  }, [setHeader]);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        const data = await gamesAPI.getRecentGames();
        setGames(data);
      } catch (err) {
        logger.exception(err, { where: 'history.fetchGameHistory' });
        setError('Failed to load game history');
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  const handlePlayAgain = (categories: GameCategory[]) => {
    // Store selected category IDs in localStorage
    const categoryIds = categories.map(cat => cat.id);
    localStorage.setItem('selectedCategories', JSON.stringify(categoryIds));
    
    // Navigate to teams page to start a new game
    router.push('/teams');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-custom-bg flex items-center justify-center">
        <BounceLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-eastern-blue-50">
      <main className="container mx-auto px-4 py-8 ">
        <div className="max-w-7xl mx-auto space-y-8">
          {error && (
            <div className="bg-red-100 border border-red-300 rounded-lg p-4">
              <p className="text-gray-800 text-center">{error}</p>
            </div>
          )}

          {games.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-md rounded-2xl md:p-12 border border-gray-200 shadow-lg text-center">
              <div className="text-gray-400 mb-4">
                <Clock className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">No Games Yet</h3>
              <p className="text-gray-600 mb-6">Start your first game to see it here!</p>
              <ShinyButton
                onClick={() => router.push('/categories')}
                icon="play-svg"
                bgColor="bg-gradient-to-r from-green-600 to-blue-600"
                hoverColor="hover:from-green-700 hover:to-blue-700"
                shadowColor="hover:shadow-green-500/30"
              >
                Start New Game
              </ShinyButton>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-center"></div>

              {games.map((game) => (
                <div
                  key={game.id}
                  className="bg-cyan-50 backdrop-blur-md rounded-2xl p-4 mb-12 border border-primary-200 shadow-lg relative pb-20"
                >
                  {/* Game Header */}
                  <div className="relative flex justify-between items-center -mt-10 mb-6">
                    <div className="bg-cyan-700 text-white px-6 py-2 rounded-full shadow-md">
                      <h3 className=" text-xs lg:text-xl font-bold text-center flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        {formatDate(game.date_played)}
                      </h3>
                    </div>

                    <div className="text-primary-600 text-sm bg-primary-50 px-3 py-1 rounded-full">
                      {game.categories.length} categories
                    </div>
                  </div>

                  {/* Categories Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
                    {game.categories.map((category) => (
                      <div
                        key={category.id}
                        className="relative w-full aspect-[3/4] min-h-[180px] sm:min-h-[220px] overflow-hidden border-5 border-cyan-700 rounded-4xl"
                      >
                        {/* Top Section - Category Image */}
                        <div className="relative h-[80%]">
                          <div className="h-full w-full">
                            {category.image_url && !hasImageError(category.name) ? (
                              <Image
                                src={getFullImageUrl(category.image_url) || ''}
                                alt={category.name}
                                className="w-full h-full object-cover"
                                fill
                                sizes="(max-width: 768px) 100vw, 33vw"
                                style={{ objectFit: 'cover' }}
                                loading="lazy"
                                quality={85}
                                onError={() => handleImageError(category.name)}
                                unoptimized={true}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-eastern-blue-200 to-eastern-blue-300">
                                <div className="w-20 h-20 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg transform rotate-3">
                                  {category.name.charAt(0)}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Bottom Section - Category Name */}
                        <div className="relative h-[21%] bg-gradient-to-br from-cyan-700 to-cyan-800 flex items-center justify-center p-4">
                          <h3 className="text-white items-center font-bold text-sm lg:text-lg text-center leading-tight">
                            {category.name}
                          </h3>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Play Again Button — STICKY TO CARD BOTTOM */}
                  <div className="absolute -bottom-9 left-0 w-full flex justify-center pb-4 z-10">
                    <ShinyButton
                      onClick={() => handlePlayAgain(game.categories)}
                      icon={Play}
                      bgColor="bg-cyan-600"
                      hoverColor="hover:bg-cyan-700"
                      shadowColor="hover:shadow-cyan-500/30"
                      className="shadow-lg"
                      paddingX="px-6 md:px-12"
                      paddingY="py-2 md:py-4"
                      textSize="text-xs md:text-xl"
                    >
                      Play Again 
                    </ShinyButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
