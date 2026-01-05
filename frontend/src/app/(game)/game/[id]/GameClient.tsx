'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import Image from 'next/image';
import Header from '@/components/Header';
import { ProcessingButton } from '@/components/ui/button2';
import BounceLoader from '@/components/ui/loadingscreen';
import { getFullImageUrl } from '@/lib/utils/imageUtils';
import { gameAPI } from '@/lib/api';
import { logger } from '@/lib/utils/logger';
import { Game, Category, Team, Question } from '@/types/game';
import { hydrateFullGameState } from '@/store/gameSlice';
import { RootState } from '@/store';

// Full payload emitted by the backend. available_questions/outside_board_questions
// are used for hydration of the board.
type FullGamePayload = Game & {
  available_questions?: Question[];
  outside_board_questions?: Question[];
};

type Props = {
  gameId: string;
  initialGame: FullGamePayload | null;
};

export default function GameClient({ gameId, initialGame }: Props) {
  const router = useRouter();
  const dispatch = useDispatch();
  const hasHydratedRef = useRef(false);

  const reduxGame = useSelector((state: RootState) => state.game.game);
  const isLoadedInRedux = useSelector((state: RootState) => state.game.isLoaded);
  const reduxGameId = reduxGame?.id ? String(reduxGame.id) : null;

  const [game, setGame] = useState<FullGamePayload | null>(initialGame);
  const [isLoading, setIsLoading] = useState(!initialGame);
  const [error, setError] = useState('');

  // Hydrate Redux immediately when server provided data is present.
  useEffect(() => {
    if (!initialGame || !initialGame.id) return;

    dispatch(
      hydrateFullGameState({
        game: initialGame,
        available_questions: initialGame.available_questions || [],
        outside_board_questions: initialGame.outside_board_questions || [],
      })
    );

    // Align local component state
    setGame(initialGame);
    setIsLoading(false);
  }, [initialGame, dispatch]);

  useEffect(() => {
    // If we already have the right game in Redux, avoid refetching.
    if (isLoadedInRedux && reduxGameId === gameId) {
      setGame(reduxGame as FullGamePayload);
      setIsLoading(false);
      return;
    }

    // Prevent duplicate fetches in React Strict Mode
    if (hasHydratedRef.current || initialGame) {
      return;
    }

    hasHydratedRef.current = true;

    const loadGame = async () => {
      if (!gameId) return;

      try {
        setIsLoading(true);
        logger.log('Loading game with ID (client fallback):', gameId);

        const gameData: FullGamePayload = await gameAPI.getGame(Number(gameId));
        setGame(gameData);

        dispatch(
          hydrateFullGameState({
            game: gameData,
            available_questions: gameData.available_questions || [],
            outside_board_questions: gameData.outside_board_questions || [],
          })
        );
      } catch (err) {
        logger.exception(err, { where: 'game.[id].clientFallback.loadGame' });
        setError('Failed to load game');
        hasHydratedRef.current = false; // allow retry on interaction
      } finally {
        setIsLoading(false);
      }
    };

    loadGame();
  }, [dispatch, gameId, initialGame, isLoadedInRedux, reduxGameId, reduxGame]);

  const handleStartGame = async () => {
    if (game) {
      router.push(`/game/${game.id}/question`);
      return true;
    }
    return false;
  };

  const isValidToStart = () => {
    return game && game.teams && game.teams.length > 0;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-eastern-blue-50 flex items-center justify-center">
        <BounceLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-eastern-blue-50 flex items-center justify-center">
        <div className="text-center bg-eastern-blue-100 backdrop-blur-md rounded-2xl p-8 shadow-lg border border-primary-200">
          <h1 className="text-2xl font-bold text-primary-800 mb-4">Error</h1>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/categories')}
            className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Back to Categories
          </button>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-eastern-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary-800 mb-4">Game not found</h1>
          <button
            onClick={() => router.push('/categories')}
            className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Create New Game
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-eastern-blue-50">
      <Header title="Game Information" backHref="/categories" />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl 2xl:max-w-screen-2xl mx-auto mt-8 2xl:mt-15">
          <div className="bg-eastern-blue-100 backdrop-blur-md rounded-2xl p-8 shadow-lg border border-primary-200 mb-8">
            <div className="mb-6">
              <h3 className="text-black text-2xl 2xl:text-4xl font-bold uppercase tracking-wide mb-5 2xl:mb-10">Categories:</h3>
              <div className="flex gap-2 flex-wrap justify-start w-full mb-5">
                {game.categories.map((category: Category) => (
                  <div
                    key={category.id}
                    className="flex justify-start items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-2 2xl:pr-10 pr-6 py-2 border border-primary-200 shadow-sm"
                  >
                    {category.image_url || category.image ? (
                      <div className="w-15 h-15 2xl:w-20 2xl:h-20 relative rounded-full overflow-hidden border-3 border-cyan-500 flex-shrink-0">
                        <Image
                          src={getFullImageUrl((category.image_url || category.image) as string) || ''}
                          alt={category.name}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 flex items-center justify-start text-white font-bold text-sm 2xl:text-xl">
                        {category.name.charAt(0)}
                      </div>
                    )}
                    <span className="text-primary-800 font-medium text-sm 2xl:text-xl">{category.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {game.teams && game.teams.length > 0 && (
              <div className="mb-20 mt-15">
                <h3 className="text-black text-2xl 2xl:text-4xl font-bold uppercase tracking-wide mb-5 2xl:mb-10">Teams:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {game.teams.map((team: Team) => {
                    const avatarSrc = team.avatar ? `/avatars/${team.avatar}.png` : '/avatars/thumbs.svg';

                    return (
                      <div
                        key={team.id}
                        className="bg-white/90 backdrop-blur-sm rounded-2xl p-3 flex items-center justify-between border border-primary-200 shadow-md"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 2xl:w-20 2xl:h-20 rounded-full overflow-hidden bg-white/20 border-3 border-amber-500 flex-shrink-0">
                            <Image
                              src={avatarSrc}
                              alt={team.name}
                              width={80}
                              height={80}
                              className="fill"
                            />
                          </div>
                          <div>
                            <div className="text-primary-800 font-semibold pl-3 2xl:pl-5text-md 2xl:text-2xl">{team.name}</div>
                          </div>
                        </div>

                        <div className="text-amber-600 font-bold bg-amber-50 px-3 py-1 rounded-full">{team.score || 0} points</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="text-center">
              <div className="inline-block group/button relative overflow-hidden rounded-xl">
                <ProcessingButton
                  onProcess={handleStartGame}
                  disabled={!isValidToStart()}
                  icon="play"
                  processingText="Starting..."
                  successText="Starting!"
                  errorText="Failed to start"
                  className="relative bg-cyan-600 hover:bg-cyan-700 hover:shadow-lg hover:shadow-red-500/30 disabled:bg-gray-600 text-white font-bold py-8 px-10 transition-all duration-300 ease-in-out hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
                >
                  <span className="relative z-10">Start Game</span>
                </ProcessingButton>
                <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-13deg)_translateX(-100%)] group-hover/button:duration-1000 group-hover/button:[transform:skew(-13deg)_translateX(100%)] pointer-events-none">
                  <div className="relative h-full w-16 bg-white/30" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
