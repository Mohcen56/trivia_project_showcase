'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { logger } from '@/lib/utils/logger';
import { useRouter } from 'next/navigation';
import { gameAPI } from '@/lib/api';
import { Question as QuestionType } from '@/types/game';
import Image from 'next/image';
import AnswerDisplay from '@/components/game/AnswerDisplay';
import TeamSelector from '@/components/game/TeamSelector';
import GameCard from '@/components/game/GameCard';
import GameHeader from '@/components/game/GameHeader';
import ChoicesDialog from '@/components/game/ChoicesDialog';
import TeamsSidebar from '@/components/game/TeamsSidebar';
import { getFullImageUrl } from '@/lib/utils/imageUtils';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  switchToNextTeam,
  awardPoints,
  clearActivePerk,
  markQuestionPlayed,
  endGame,
  activateChoicesPerk,
  lockPerks,
  unlockPerks,
  setRerollBuffer,
  consumeBackupQuestion,
} from '@/store/gameSlice';
import { Play, Pause, RotateCcw } from 'lucide-react';

type Props = {
  gameId: string;
  questionId: number;
};

export default function QuestionClient({ gameId, questionId }: Props) {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const {
    currentTeam,
    doublePerkActiveTeamId,
    doublePerkUsed,
    rerollPerkUsed,
    choicesPerkUsed,
    perksLocked,
    rerollBuffer,
    questions,
    playedQuestions,
    teams: liveTeams,
    game,
    isLoaded,
  } = useAppSelector((state) => state.game);

  const [awardError, setAwardError] = useState('');
  const [awardSuccess, setAwardSuccess] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentView, setCurrentView] = useState<'question' | 'answer' | 'teamSelector'>('question');
  const [isChronoRunning, setIsChronoRunning] = useState(true);
  const [isChoicesDialogOpen, setIsChoicesDialogOpen] = useState(false);
  const [selectedQuestionForChoices, setSelectedQuestionForChoices] = useState<QuestionType | null>(null);
  const [questionImageStatus, setQuestionImageStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');

  // Read from Redux - data already hydrated from game/[id] page
  const isLoading = !isLoaded;
  const error = !game && isLoaded ? 'Game not found' : null;

  const backupQuestions = useAppSelector((s) => s.game.backupQuestions);
  const question = questions.find((q) => q.id === questionId) || backupQuestions.find((q) => q.id === questionId);

  useEffect(() => {
    if (question?.image) {
      setQuestionImageStatus('loading');
    } else {
      setQuestionImageStatus('idle');
    }
  }, [question?.id, question?.image]);

  const teams = useMemo(() => (liveTeams.length > 0 ? liveTeams : game?.teams || []), [liveTeams, game?.teams]);

  useEffect(() => {
    if (!isLoading && question && currentView === 'question' && isChronoRunning) {
      const interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isLoading, question, currentView, isChronoRunning]);

  const handleShowAnswer = () => {
    setCurrentView('answer');
    setIsChronoRunning(false);
  };

  const handleShowQuestion = () => {
    setCurrentView('question');
  };

  const handleShowTeamSelector = () => {
    setCurrentView('teamSelector');
  };

  const handleBackToAnswer = () => {
    logger.log('handleBackToAnswer called');
    setCurrentView('answer');
  };

  const toggleChronometer = () => {
    setIsChronoRunning(!isChronoRunning);
  };

  const handleTeamTurnChange = () => {
    dispatch(switchToNextTeam());
    dispatch(clearActivePerk());
    setElapsedTime(0);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAwardPoints = async (teamId: number | null) => {
    setAwardError('');
    setAwardSuccess('');

    try {
      if (!question) {
        throw new Error('Question not found');
      }

      setAwardSuccess('Points awarded!');

      if (teamId && question) {
        const isDouble = doublePerkActiveTeamId === teamId;
        const delta = isDouble ? question.points * 2 : question.points;
        dispatch(awardPoints({ teamId, delta }));
        if (isDouble) {
          dispatch(clearActivePerk());
        }
      }

      if (!playedQuestions.includes(question.id)) {
        dispatch(markQuestionPlayed(question.id));
      }
      const backupHead = backupQuestions[0];
      if (backupHead && backupHead.id === question.id) {
        dispatch(consumeBackupQuestion());
      }

      dispatch(clearActivePerk());
      dispatch(switchToNextTeam());
      setElapsedTime(0);

      router.push(`/game/${gameId}/question`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while awarding points';
      logger.exception(errorMessage, { where: 'QuestionClient.award' });
      setAwardError(errorMessage);
    }
  };

  const handleBackToBoard = () => {
    router.push(`/game/${gameId}/question`);
  };

  const handleEndGame = async () => {
    try {
      const numericGameId = Number(gameId);
      if (Number.isFinite(numericGameId)) {
        await gameAPI.finishRound(numericGameId, playedQuestions);
      }
    } catch (err) {
      logger.exception(err, { where: 'QuestionClient.finishRound' });
      setAwardError('Failed to sync played questions, please try again.');
      return;
    }

    dispatch(endGame());
    router.push(`/game/${gameId}/results`);
  };

  const handleShowChoices = () => {
    if (question) {
      setSelectedQuestionForChoices(question);
      setIsChoicesDialogOpen(true);
      const teamObj = teams[currentTeam - 1];
      if (teamObj) {
        dispatch(activateChoicesPerk({ teamId: teamObj.id }));
      }
    }
  };

  const shuffledChoices = useMemo(() => {
    if (!selectedQuestionForChoices) return [];
    const choices = [
      selectedQuestionForChoices.answer,
      selectedQuestionForChoices.choice_2 || '',
      selectedQuestionForChoices.choice_3 || '',
      selectedQuestionForChoices.choice_4 || '',
    ].filter((c) => c.trim());
    const shuffled = [...choices];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [selectedQuestionForChoices]);

  const handleCloseChoicesDialog = () => {
    setIsChoicesDialogOpen(false);
    setSelectedQuestionForChoices(null);
  };

  useEffect(() => {
    if (currentView === 'question') {
      if (perksLocked) dispatch(unlockPerks());
    } else if (!perksLocked) {
      dispatch(lockPerks());
    }
  }, [currentView, dispatch, perksLocked]);

  useEffect(() => {
    if (!questions.length || !teams.length) return;
    const entries: Array<{ teamId: number; questionId: number | null }> = [];
    const playableIds = questions
      .filter((q) => !playedQuestions.includes(q.id) && q.id !== questionId)
      .map((q) => q.id);
    if (!playableIds.length) return;
    for (const t of teams) {
      if (rerollBuffer[t.id] == null) {
        const remaining = playableIds.filter((id) => id !== rerollBuffer[t.id]);
        if (remaining.length) {
          const picked = remaining[Math.floor(Math.random() * remaining.length)];
          entries.push({ teamId: t.id, questionId: picked });
        }
      }
    }
    if (entries.length) {
      dispatch(setRerollBuffer({ entries }));
    }
  }, [questions, teams, playedQuestions, rerollBuffer, questionId, dispatch]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">{error}</div>
          <button
            onClick={handleBackToBoard}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
          >
            Back to Game Board
          </button>
        </div>
      </div>
    );
  }

  if (!question) {
    return null;
  }

  const shouldCenterQuestionText = questionImageStatus !== 'loaded';
  const showQuestionImage = Boolean(question.image) && questionImageStatus !== 'error';

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <GameHeader
        onBackToBoard={handleBackToBoard}
        currentTeamTurn={currentTeam}
        onTeamTurnChange={handleTeamTurnChange}
        onEndGame={handleEndGame}
        teams={liveTeams}
      />

      <main className="container max-w-screen mt-2 mx-auto px-2 flex-1 flex items-center">
        <div className="flex flex-col lg:flex-row gap-2 lg:gap-2 max-w-screen mx-auto w-full ">
          <div className="flex-1 flex flex-col">
            {currentView === 'question' ? (
              <div className="relative">
                <GameCard question={question}>
                  <div
                    className="absolute -top-4 max-md:landscape:-top-5 lg:-top-6 left-1/2 transform -translate-x-1/2 \
                                  bg-slate-800 text-white px-4 max-md:landscape:px-6 lg:px-8 py-1.5 max-md:landscape:py-2 lg:py-2 rounded-full flex items-center space-x-3"
                  >
                    <button
                      onClick={toggleChronometer}
                      className="text-white hover:text-gray-300 transition-colors"
                      aria-label={isChronoRunning ? 'Pause timer' : 'Start timer'}
                    >
                      {isChronoRunning ? <Pause className="w-4 h-4 max-md:landscape:w-5 max-md:landscape:h-5 lg:w-5 lg:h-5" /> : <Play className="w-4 h-4 max-md:landscape:w-5 max-md:landscape:h-5 lg:w-5 lg:h-5" />}
                    </button>
                    <span className="text-lg max-md:landscape:text-xl lg:text-xl font-mono font-bold">{formatTime(elapsedTime)}</span>
                    <button
                      onClick={() => {
                        setElapsedTime(0);
                        setIsChronoRunning(false);
                      }}
                      className="text-white hover:text-gray-300 transition-colors"
                      aria-label="Reset timer"
                    >
                      <RotateCcw className="w-4 h-4 max-md:landscape:w-5 max-md:landscape:h-5 lg:w-5 lg:h-5" />
                    </button>
                  </div>

                  <div
                    className={`text-center mb-4 max-md:landscape:mb-6 lg:mb-8 mt-4 max-md:landscape:mt-5 lg:mt-6 ${shouldCenterQuestionText ? 'flex min-h-[12rem] max-md:landscape:min-h-[14rem] lg:min-h-[18rem] items-center justify-center' : ''}`}
                  >
                    <h1 className="select-none text-gray-800 text-xl max-md:landscape:text-xl md:text-3xl font-bold leading-relaxed" dir="ltr">
                      {question.text}
                    </h1>
                  </div>

                  {showQuestionImage && (
                    <div className="">
                      <div className=" items-center justify-center relative max-w-2xl mx-auto rounded-xl overflow-hidden">
                        <Image
                          src={getFullImageUrl(question.image) || ''}
                          alt="Question image"
                          width={800}
                          height={400}
                          className="w-full max-h-32 max-md:landscape:max-h-32 md:max-h-75 object-contain mx-auto"
                          unoptimized={true}
                          onLoadingComplete={() => setQuestionImageStatus('loaded')}
                          onError={() => setQuestionImageStatus('error')}
                        />
                      </div>
                    </div>
                  )}

                  <div className="absolute -bottom-4 max-md:landscape:-bottom-4 lg:-bottom-6 left-26 transform -translate-x-1/2">
                    <button
                      onClick={handleShowAnswer}
                      className="bg-brown-800 hover:bg-brown-700 text-white font-bold py-1.5 max-md:landscape:py-1.5 md:py-3 px-3 max-md:landscape:px-3 md:px-8 rounded-xl shadow-lg transition-all duration-200 text-sm max-md:landscape:text-sm md:text-md"
                    >
                      Answer
                    </button>
                  </div>
                </GameCard>
              </div>
            ) : currentView === 'teamSelector' ? (
              <TeamSelector
                question={question}
                teams={teams}
                onAwardPoints={handleAwardPoints}
                onBackToAnswer={handleBackToAnswer}
                awardError={awardError}
                awardSuccess={awardSuccess}
              />
            ) : currentView === 'answer' ? (
              <AnswerDisplay
                question={question}
                onShowQuestion={handleShowQuestion}
                onShowTeamSelector={handleShowTeamSelector}
              />
            ) : null}
          </div>

          <TeamsSidebar
            teams={teams}
            currentTeam={currentTeam}
            doublePerkActiveTeamId={doublePerkActiveTeamId}
            doublePerkUsed={doublePerkUsed}
            rerollPerkUsed={rerollPerkUsed}
            choicesPerkUsed={choicesPerkUsed}
            perksLocked={perksLocked}
            rerollBuffer={rerollBuffer}
            gameId={gameId}
            question={question}
            questions={questions}
            playedQuestions={playedQuestions}
            onShowChoices={handleShowChoices}
          />
        </div>
      </main>

      {selectedQuestionForChoices && (
        <ChoicesDialog open={isChoicesDialogOpen} onClose={handleCloseChoicesDialog} choices={shuffledChoices} />
      )}
    </div>
  );
}
