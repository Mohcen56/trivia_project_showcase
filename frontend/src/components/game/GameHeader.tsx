'use client';
import Image from 'next/image';
import React from 'react';
import { ArrowRight, Trophy } from 'lucide-react';

interface GameHeaderProps {
  onBackToBoard: () => void;
  currentTeamTurn: number;
  onTeamTurnChange: () => void;
  onEndGame?: () => void | Promise<void>;
  teams?: Array<{ id: number; name: string }>;
}

function GameHeader({ onBackToBoard, currentTeamTurn, onTeamTurnChange, onEndGame, teams }: GameHeaderProps) {
  // Find the current team name based on currentTeamTurn index
  const currentTeam = teams?.[currentTeamTurn - 1];
  const teamDisplayName = currentTeam?.name || `Team ${currentTeamTurn}`;
  
  return (
    <header className="bg-slate-800/90 backdrop-blur-sm w-full">
      <div className="mx-auto max-w-screen-3xl px-2 py-3">
        {/* Responsive 3-column layout: left (logo + turn), center (title), right (actions) */}
        <div className="grid grid-cols-3 items-center gap-3">
          {/* Left: Logo + Team turn */}
          <div className="flex items-center gap-3">
            <Image
              src="/logo/mylogo.svg"
              alt="Trivia Logo"
              width={40}
              height={40}
              className="block"
            />
            <button
              onClick={onTeamTurnChange}
              className="text-white px-3 py-2 rounded-xl border-2 border-white flex items-center text-xs sm:text-sm transition-colors"
            >
              <span>🎲</span>
              <span className="hidden md:inline ml-2">Team Turn: {teamDisplayName}</span>
            </button>
          </div>

          {/* Center: Title */}
          <div className="justify-self-center text-white text-base sm:text-xl font-bold text-center">
            New Game
          </div>

          {/* Right: Actions */}
          <div className="justify-self-end flex items-center gap-2 sm:gap-3">
            <button
              onClick={onEndGame}
              className="text-white px-3 sm:px-4 py-2 rounded-xl border-2 border-white flex items-center transition-colors text-xs sm:text-sm"
            >
              <Trophy className='w-4 h-4 text-yellow-100'/>
              <span className="hidden md:inline ml-2">End the Game</span>
             
            </button>
            <button
              onClick={onBackToBoard}
              className="text-white px-3 sm:px-4 py-2 rounded-xl border-2 border-white flex items-center transition-colors text-xs sm:text-sm"
            >
              <span className="hidden md:inline mr-2">Exit</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

// Memoize to prevent rerenders when parent state changes unrelated to header props
export default React.memo(GameHeader);
