'use client';
import React, { useState, useEffect, useRef } from 'react';
import { logger } from '@/lib/utils/logger';
import { useParams, useRouter } from 'next/navigation';
import { Game, Question } from '@/types/game';
import Image from 'next/image';
import { getFullImageUrl } from '@/lib/utils/imageUtils';
import GameHeader from '@/components/game/GameHeader';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { switchToNextTeam, awardPoints, endGame, hydrateFullGameState } from '@/store/gameSlice';
import { useSyncTeams } from '@/hooks/useSyncTeams';
import { gameAPI } from '@/lib/api';

interface QuestionSlot {
  points: number;
  question: Question;
  isSolved: boolean;
  index: number;
}

type FullGamePayload = Game & {
  available_questions?: Question[];
  outside_board_questions?: Question[];
};

export default function GameBoardPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;
  const dispatch = useAppDispatch();
  const {
    currentTeam,
    teams: liveTeams,
    questions,
    playedQuestions,
    game,
    isLoaded,
  } = useAppSelector((state) => state.game);

  const [hydrateError, setHydrateError] = useState<string>('');
  const hasFetched = useRef(false);

  useSyncTeams(game?.teams, liveTeams);

  // Derive error state (loading UI could be added here if needed)
  const error = hydrateError || (!game && isLoaded ? 'Game not found' : null);

  useEffect(() => {
    if (isLoaded || hasFetched.current) return;
    hasFetched.current = true;

    const loadGame = async () => {
      try {
        const numericGameId = Number(gameId);
        if (!Number.isFinite(numericGameId)) {
          throw new Error('Invalid game id');
        }
        const gameData: FullGamePayload = await gameAPI.getGame(numericGameId);
        dispatch(
          hydrateFullGameState({
            game: gameData,
            available_questions: gameData.available_questions || [],
            outside_board_questions: gameData.outside_board_questions || [],
          }),
        );
      } catch (err) {
        logger.exception(err, { where: 'game.[id].question.loadGame' });
        setHydrateError('Failed to load game');
      }
    };

    loadGame();
  }, [dispatch, gameId, isLoaded]);

  const handleTeamTurnChange = () => {
    dispatch(switchToNextTeam());
  };

  const handleBackToBoard = () => {
    router.push('/');
  };

  const handleEndGame = async () => {
    try {
      const numericGameId = Number(gameId);
      if (Number.isFinite(numericGameId)) {
        await gameAPI.finishRound(numericGameId, playedQuestions);
      }
    } catch (err) {
      logger.exception(err, { where: 'game.[id].question.finishRound' });
    }

    dispatch(endGame());
    router.push(`/game/${gameId}/results`);
  };

  const updateTeamScore = (teamId: number, increment: number) => {
    dispatch(awardPoints({ teamId, delta: increment }));
  };

  const organizeQuestionsByCategory = React.useMemo(() => {
    if (!game) return {};
    const organized: Record<number, Question[]> = {};

    game.categories.forEach((category) => {
      organized[category.id] = [];
    });

    questions.forEach((question) => {
      const questionCategoryId = question.category?.id;
      if (questionCategoryId && organized[questionCategoryId]) {
        organized[questionCategoryId].push(question);
      }
    });

    Object.keys(organized).forEach((categoryId) => {
      organized[parseInt(categoryId, 10)].sort((a, b) => a.points - b.points);
    });

    return organized;
  }, [game, questions]);

  const createQuestionGrid = (categoryId: number): QuestionSlot[] => {
    const categoryQuestions = organizeQuestionsByCategory[categoryId] || [];
    logger.log(`Category ${categoryId} questions:`, categoryQuestions);
    logger.log(`Category ${categoryId} question count: ${categoryQuestions.length}`);

    if (categoryQuestions.length > 6) {
      logger.warn(`Category ${categoryId} has more than 6 questions (${categoryQuestions.length}), this should not happen!`);
    }

    const sortedQuestions = [...categoryQuestions].sort((a: Question, b: Question) => b.points - a.points);

    logger.log(`Category ${categoryId} after sorting:`, sortedQuestions.length, 'questions');

    return sortedQuestions.map(
      (question: Question, index: number): QuestionSlot => ({
        points: question.points,
        question,
        isSolved: playedQuestions.includes(question.id),
        index,
      }),
    );
  };

  const handleQuestionSelect = (question: Question) => {
    if (!question || playedQuestions.includes(question.id)) return;
    router.push(`/game/${gameId}/question/${question.id}`);
  };

  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  if (error) {
    return (
      <div className="min-h-screen bg-custom-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">{error}</div>
          <div className="text-gray-600 text-sm mb-4">Game ID: {gameId}</div>
          <div className="space-x-4 space-x-reverse">
            <button
              onClick={() => router.push('/create-game')}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded"
            >
              Create New Game
            </button>
            <button
              onClick={() => router.push('/')}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!game) {
    return <div className="text-gray-600 text-center mt-10">No game found.</div>;
  }

  function handleImageError(name: string): void {
    setImageErrors((prev) => ({ ...prev, [name]: true }));
  }

  function hasImageError(name: string): boolean {
    return !!imageErrors[name];
  }

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      <GameHeader
        onBackToBoard={handleBackToBoard}
        currentTeamTurn={currentTeam}
        onTeamTurnChange={handleTeamTurnChange}
        onEndGame={handleEndGame}
        teams={liveTeams}
      />

      <main className="flex-1 p-2 overflow-hidden bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300">
        <div className="h-full grid grid-cols-3 max-md:landscape:grid-cols-6 md:grid-cols-6 gap-2 max-md:landscape:gap-2 md:gap-3">
          {game.categories.map((category) => {
            const questionGrid = createQuestionGrid(category.id);
            return (
              <div key={category.id} className="h-full flex flex-col">
                <div className="relative flex-1 w-full rounded-xl overflow-hidden border-2 max-md:landscape:border-2 md:border-4 border-white shadow mb-2 max-md:landscape:mb-2 md:mb-3 flex-shrink-0">
                  {category.image && !hasImageError(category.name) ? (
                    <Image
                      src={getFullImageUrl(category.image) || ''}
                      alt={category.name}
                      fill
                      className="object-cover"
                      unoptimized={true}
                      onError={() => handleImageError(category.name)}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                      <span className="text-gray-600 text-xl md:text-2xl">🎯</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 h-6 max-md:landscape:h-7 md:h-10 w-full bg-black/70 py-0.5 max-md:landscape:py-1 md:py-1 text-center flex items-center justify-center">
                    <span className="text-white text-xs max-md:landscape:text-sm md:text-lg font-bold truncate px-1">{category.name}</span>
                  </div>
                </div>

                <div className="h-[60%] flex flex-col gap-1 md:gap-2">
                  {questionGrid.map((slot: QuestionSlot) => (
                    <button
                      key={`${category.id}-${slot.question.id}`}
                      onClick={() => slot.question && handleQuestionSelect(slot.question)}
                      disabled={slot.isSolved || !slot.question}
                      className={`
                    flex-1 font-bold text-sm md:text-lg rounded-lg shadow transition flex items-center justify-center
                    ${slot.isSolved || !slot.question 
                      ? 'bg-[#8a95ab] text-[#5a6578] opacity-60 cursor-not-allowed' 
                      : 'bg-[#bcc2d3] text-[#34446b] hover:bg-[#cfd6e1] cursor-pointer'
                    }
                  `}
                    >
                      {slot.points}
                    </button>
                  ))}
                  {Array.from({ length: Math.max(0, 6 - questionGrid.length) }).map((_, index) => (
                    <div key={`empty-${category.id}-${index}`} className="flex-1 bg-[#8a95ab] opacity-30 rounded-lg" />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <footer className="bg-gradient-to-r from-brown-600 to-brown-800 py-2 md:py-4 flex items-center justify-center gap-1 md:gap-4 border-t-4 border-2 border-amber-500 h-15 md:h-25 flex-shrink-0">
        {liveTeams && liveTeams.length > 0 ? (
          liveTeams.map((team) => (
            <div key={team.id} className="bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 p-[1px] rounded-2xl" dir="ltr">
              <div className="w-full h-full bg-orange-200/95 rounded-xl max-md:landscape:rounded-2xl md:rounded-2xl px-1.5 max-md:landscape:px-2 md:px-4 py-1 flex flex-row items-center shadow-md">
                <div className="w-6 h-6 max-md:landscape:w-8 max-md:landscape:h-8 md:w-15 md:h-15 rounded-full items-center justify-center overflow-hidden mr-1 max-md:landscape:mr-2 md:mr-3 bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 p-[2px] hidden max-md:landscape:flex md:flex">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                    <Image
                      src={`/avatars/${team.avatar}.png`}
                      alt={team.name}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                      unoptimized={true}
                    />
                  </div>
                </div>

                <span className="text-orange-900 font-bold text-[10px] max-md:landscape:text-xs md:text-sm mr-1 max-md:landscape:mr-2 md:mr-3 min-w-[30px] max-md:landscape:min-w-[40px] md:min-w-[60px] text-center w-auto">
                  {team.name}
                </span>

                <div className="flex items-center justify-center gap-1 max-md:landscape:gap-1.5 md:gap-3 w-auto">
                  <button
                    onClick={() => updateTeamScore(team.id, -100)}
                    className="bg-amber-700 hover:bg-amber-800 text-white rounded-md w-5 h-5 max-md:landscape:w-6 max-md:landscape:h-6 md:w-8 md:h-8 flex items-center justify-center text-xs max-md:landscape:text-sm md:text-lg font-bold transition-all duration-200 shadow-sm"
                  >
                    -
                  </button>
                  <span className="text-orange-900 font-extrabold text-sm max-md:landscape:text-base md:text-xl min-w-[20px] max-md:landscape:min-w-[30px] md:min-w-[50px] text-center">
                    {team.score ?? 0}
                  </span>
                  <button
                    onClick={() => updateTeamScore(team.id, 100)}
                    className="bg-amber-700 hover:bg-amber-800 text-white rounded-md w-5 h-5 max-md:landscape:w-6 max-md:landscape:h-6 md:w-8 md:h-8 flex items-center justify-center text-xs max-md:landscape:text-sm md:text-lg font-bold transition-all duration-200 shadow-sm"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-white text-sm bg-red-500/20 border border-red-400 rounded-xl p-4">
            <p className="text-red-600">No teams added to this game</p>
          </div>
        )}
      </footer>
    </div>
  );
}
