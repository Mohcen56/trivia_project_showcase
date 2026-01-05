'use client';

import React, { useState } from 'react';
import { Team, Question } from '@/types/game';
import { Users,  RotateCcw } from 'lucide-react';
import Image from 'next/image';
import GameCard from './GameCard';

interface TeamSelectorProps {
  question: Question;
  teams: Team[];
  onAwardPoints: (teamId: number | null) => Promise<void>;
  onBackToAnswer?: () => void;
  awardError: string;
  awardSuccess: string;
}

export default function TeamSelector({ 
  question,
  teams, 
  onAwardPoints, 
  onBackToAnswer,
 
}: TeamSelectorProps) {
  const [clickedTeamId, setClickedTeamId] = useState<number | null | 'none'>(null);

  const handleTeamClick = async (teamId: number | null) => {
    setClickedTeamId(teamId === null ? 'none' : teamId);
    await onAwardPoints(teamId);
  };

  return (
    <GameCard question={question}>
      {/* Header */}
      <div className="text-center mb-2 md:mb-8">
        <h2 className="text-gray-800 text-2xl md:text-3xl font-bold mb-2">Who answered the question?</h2>
   
      </div>

      {/* Team Selection Grid - Responsive Layout */}
      <div className="grid grid-cols-2  md:content-center gap-1  md:gap-4  md:mb-8 max-w-2xl mx-auto min-h-[15rem]">
        {teams.map((team) => (
          <button
            key={team.id}
            onClick={() => handleTeamClick(team.id)}
            className={`group transition-all duration-200 transform content-center hover:scale-105 relative ${
              clickedTeamId === team.id 
                ? 'bg-green-500 scale-105' 
                : 'bg-slate-600 hover:bg-slate-700'
            } rounded-2xl p-3 text-white shadow-lg border-4 border-white  h-15 md:h-20 flex items-center justify-start space-x-2`}
          >
            {/* Team Avatar - Circular */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 md:w-15 md:h-15 rounded-full flex items-center justify-center  border-3 border-amber-500 overflow-hidden shadow-md">
                {team.avatar ? (
                  <Image
                    src={`/avatars/${team.avatar}.png`}
                    alt={team.name}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover rounded-full"
                    unoptimized={true}
                  />
                ) : (
                  <Users className="h-8 w-8 text-slate-600" />
                )}
              </div>
            </div>

            {/* Team Name */}
            <div className="flex-1 text-center">
              <h3 className="font-bold md:text-xl text-white">
                {team.name}
              </h3>
            </div>

       
          </button>
        ))}

        {/* No One Answered Button - Same rectangular style */}
        <button
          onClick={() => handleTeamClick(null)}
          className={`group transition-all duration-200 transform hover:scale-105 relative ${
            clickedTeamId === 'none'
              ? 'bg-green-500 scale-105'
              : 'bg-slate-600 hover:bg-slate-700'
          } rounded-2xl p-3 text-white shadow-lg border-4 border-white  h-15 md:h-20 flex items-center justify-center col-span-2 `}
        >
          {/* No Answer Icon - Circular with sad face */}
          <div className="flex-shrink-0 mr-4">
            <div className="md:w-15 md:h-15 rounded-full bg-white/90  flex items-center justify-center border-3 border-amber-500 shadow-md">
              <span className="text-2xl ">😞</span>
            </div>
          </div>

          {/* No Answer Text */}
          <div className="flex-1 text-center">
            <h3 className="font-bold md:text-xl text-white">
            no one answered
            </h3>
          </div>

        
         
        </button>
      </div>

     

        {/* Back to Answer Button */}
        {onBackToAnswer && (
          <div className=" absolute -bottom-6 -right-15 transform -translate-x-1/2">
            <button
              onClick={onBackToAnswer}
              className="bg-slate-700 hover:bg-slate-600 text-white md:px-6 md:py-3 py-2 px-3 rounded-lg flex items-center space-x-2 transition-colors  text-xs md:text-lg font-bold"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Back to Answer</span>
            </button>
          </div>
        )}
    </GameCard>
  );
}