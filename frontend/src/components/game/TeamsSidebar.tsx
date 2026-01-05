'use client';

import React from 'react';
import { logger } from '@/lib/utils/logger';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { activateDoublePerk, consumeRerollBuffer } from '@/store/gameSlice';
import { useReroll } from '@/hooks/useReroll';
import { Question as QuestionType, Team } from '@/types/game';

interface TeamsSidebarProps {
  teams: Team[];
  currentTeam: number;
  doublePerkActiveTeamId: number | null;
  doublePerkUsed: Record<number, boolean>;
  rerollPerkUsed: Record<number, boolean>;
  choicesPerkUsed?: Record<number, boolean>;
  perksLocked?: boolean;
  rerollBuffer?: Record<number, number | null>;
  gameId: string;
  question: QuestionType | null;
  questions: QuestionType[];
  playedQuestions: number[];
  onShowChoices: () => void;
}

export default function TeamsSidebar({
  teams,
  currentTeam,
  doublePerkActiveTeamId,
  doublePerkUsed,
  rerollPerkUsed,
  choicesPerkUsed,
  perksLocked,
  rerollBuffer,
  gameId,
  question,
  questions,
  playedQuestions,
  onShowChoices,
}: TeamsSidebarProps) {
  const dispatch = useAppDispatch();
  const backupQuestions = useAppSelector((state) => state.game.backupQuestions);
  const { reroll } = useReroll(Number(gameId), question);
  const router = useRouter();
  // prevent unused warnings for optional legacy props
  void questions; void playedQuestions;

  const isPerkDisabled = (teamId: number, extra?: boolean) => {
    const isTeamsTurn = teams.findIndex(t => t.id === teamId) === (currentTeam - 1);
    return !!(perksLocked || !isTeamsTurn || extra);
  };

  const handleReroll = async (teamId: number) => {
    try {
      // Prefer backup list via hook; if it cannot reroll, fallback to buffer
      await reroll(teamId);
    } catch (e) {
      logger.warn('useReroll failed, attempting buffer fallback:', e);
      if (rerollBuffer && rerollBuffer[teamId] && question) {
        const bufferedId = rerollBuffer[teamId];
        dispatch(consumeRerollBuffer({ teamId }));
        router.push(`/game/${gameId}/question/${bufferedId}`);
      }
    }
  };

  return (
    <div className="w-full lg:w-80 px-2 flex justify-center">
      <div className="flex lg:flex-col gap-1 lg:gap-1 justify-center items-stretch max-w-2xl lg:max-w-none w-full">
        {teams.slice(0, 4).map((team, index) => {
          const isTeamsTurn = teams.findIndex(t => t.id === team.id) === (currentTeam - 1);
          const isDoubleUsed = !!doublePerkUsed[team.id];
          const isRerollUsed = !!rerollPerkUsed[team.id];
          const isChoicesUsed = !!(choicesPerkUsed?.[team.id]);
          const isDisabledGeneric = !!(perksLocked || !isTeamsTurn);
          return (
            <div key={team.id} className="mt-1 lg:max-w-none lg:mb-0">
              <div className="bg-brown-800  border-brown-900 text-white rounded-xl p-2 lg:p-4 flex flex-col lg:flex-row items-center lg:space-x-4 space-y-1 lg:space-y-0">
                {/* Team Avatar */}
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-17 lg:h-17 rounded-full border-2 border-amber-500 flex items-center justify-center overflow-hidden flex-shrink-0 bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 p-0.5">
                  <div className="w-full h-full rounded-full bg-brown-800 flex items-center justify-center overflow-hidden">
                    {team.avatar ? (
                      <Image
                        src={`/avatars/${team.avatar}.png`}
                        alt={team.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                        unoptimized={true}
                      />
                    ) : (
                      <span className="text-white text-base sm:text-lg font-bold">
                        {index + 1}
                      </span>
                    )}
                  </div>
                </div>

                {/* Team Info */}
                <div className="flex-col items-center lg:ml-3 lg:items-start">
                  <div className="font-bold text-base sm:text-lg sm:text-center justify-content-center mb-2">
                    {team.name}
                  </div>

                  {/* Team Actions */}
                  <div className="flex flex-row space-x-1 sm:space-x-2 justify-center lg:justify-start">
                    {/* Double Points Perk */}
                    <button
                      onClick={() => dispatch(activateDoublePerk({ teamId: team.id }))}
                      disabled={
                        isDoubleUsed ||
                        doublePerkActiveTeamId !== null ||
                        isPerkDisabled(team.id)
                      }
                      title={
                        isDoubleUsed
                          ? 'Perk already used'
                          : doublePerkActiveTeamId !== null
                            ? 'Another perk is active'
                            : !isTeamsTurn
                              ? "You can only activate on your team's turn"
                              : 'Use Double Points once'
                      }
                      className={`p-1 sm:p-2 rounded-md transition-colors border text-xs sm:text-base ${
                        isDoubleUsed
                          ? 'bg-brown-900 text-white border-white/30 opacity-30'
                          : doublePerkActiveTeamId === team.id
                            ? 'bg-brown-900 text-white border-white/30 opacity-30'
                            : 'bg-brown-900 hover:bg-white/30 text-white border-white/30'
                      } ${isDisabledGeneric && !isDoubleUsed && doublePerkActiveTeamId !== team.id ? 'opacity-50' : ''}`}
                    >
                      <Image src="/icons/Untitled design.svg" alt="multiplier icon" width={25} height={25} className="w-5 h-5" />
                    </button>

                    {/* Reroll Question Perk */}
                    <button
                      onClick={() => handleReroll(team.id)}
                      disabled={isRerollUsed || isPerkDisabled(team.id)}
                      title={
                        isRerollUsed
                          ? 'Reroll already used'
                          : !isTeamsTurn
                            ? "You can only reroll on your team's turn"
                            : 'Change to a random new question'
                      }
                      className={`p-1 sm:p-2 rounded-md transition-colors border text-xs sm:text-base ${
                        isRerollUsed
                          ? 'bg-brown-900 text-white border-white/30 opacity-30'
                          : 'bg-brown-900 hover:bg-white/30 text-white border-white/30'
                      } ${isDisabledGeneric && !isRerollUsed ? 'opacity-50' : ''}`}
                    >
                      <Image src="/icons/arrow-change.svg" alt="refresh icon" width={25} height={25} className="w-5 h-5" />
                    </button>

                    {/* Show Choices Button */}
                    <button
                      onClick={onShowChoices}
                      disabled={isChoicesUsed || isPerkDisabled(team.id)}
                      title={
                        isChoicesUsed
                          ? 'Choices already used'
                          : !isTeamsTurn
                            ? "You can only use on your team's turn"
                            : 'Show answer choices'
                      }
                      className={`p-1 sm:p-2 rounded-md transition-colors border text-xs sm:text-base ${
                        isChoicesUsed
                          ? 'bg-brown-900 text-white border-white/30 opacity-30'
                          : 'bg-brown-900 hover:bg-white/30 text-white border-white/30'
                      } ${isDisabledGeneric && !isChoicesUsed ? 'opacity-50' : ''}`}
                    >
                      <Image src="/icons/clover-48-regular.svg" alt="multiplier icon" width={25} height={25} className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
