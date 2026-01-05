'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Trophy, Medal, Award, Home } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { resetGame } from '@/store/gameSlice';

export default function GameResultsPage() {

  const router = useRouter();
  const dispatch = useAppDispatch();
  

  const { teams, playedQuestions, loading, error } = useAppSelector((state) => state.game);

  // Derived state (computed directly from Redux)
  const sortedTeams = useMemo(() => {
    return [...(teams || [])].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }, [teams]);

  const playedCount = useMemo(() => playedQuestions.length, [playedQuestions]);

  const handleBackHome = () => {
    // Navigate first to avoid flash of error state
    router.push('/dashboard');
    // Reset game state after navigation starts
    setTimeout(() => {
      dispatch(resetGame());
    }, 100);
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Medal className="h-8 w-8 text-yellow-500" />;
      case 2:
        return <Award className="h-8 w-8 text-gray-400" />;
      case 3:
        return <Award className="h-8 w-8 text-amber-600" />;
      case 4:
        return <Award className="h-8 w-8 text-blue-500" />;
      default:
        return <span className="text-2xl font-bold text-gray-600">#{position}</span>;
    }
  };

  const getRankText = (position: number) => {
    if (position === 1) return '1st Place';
    if (position === 2) return '2nd Place';
    if (position === 3) return '3rd Place';
    if (position === 4) return '4th Place';
    return `${position}th Place`;
  };

  const getTeamCardColor = (position: number) => {
    switch (position) {
      case 1:
        return 'bg-gradient-to-br from-yellow-400 to-yellow-500';
      case 2:
        return 'bg-gradient-to-br from-gray-300 to-gray-400';
      case 3:
        return 'bg-gradient-to-br from-amber-400 to-amber-500';
      default:
        return 'bg-gradient-to-br from-blue-400 to-blue-500';
    }
  };

  // Handle no game or missing teams

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-orange-100 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-primary-800 text-xl">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">{error}</div>
          <button
            onClick={handleBackHome}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-orange-100 to-pink-100 relative overflow-hidden">
      {/* Decorative shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-4 h-4 bg-pink-400 rounded-full opacity-60"></div>
        <div className="absolute top-40 right-20 w-6 h-6 bg-cyan-400 transform rotate-45 opacity-60"></div>
        <div className="absolute bottom-32 left-20 w-8 h-4 bg-green-400 opacity-60"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4">🎉 Game Over! 🎉</h1>
          <p className="text-xl text-gray-600">Final Scores</p>
        </div>

        {/* Results Grid */}
        <div className="max-w-7xl mx-auto grid  gap-6 grid-cols-2 lg:grid-cols-4">
          {sortedTeams.map((team, index) => {
            const position = index + 1;
            return (
              <div
                key={team.id}
                className={`${getTeamCardColor(
                  position
                )} rounded-xl p-6  shadow-lg transform transition-all duration-300 border-1 border-white ${
                  position === 1
                    ? 'ring-2 ring-yellow-500  scale-105'
                    : position === 2
                    ? 'ring-1 ring-gray-400 scale-100'
                    : position === 3
                    ? ' ring-1 ring-amber-500 scale-97'
                    : ' ring-1 ring-blue-500 scale-93'
                } `}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="mb-3">{getRankIcon(position)}</div>

                  <div className="relative mb-4">
                    <div className="w-16 h-16 rounded-full border-4 border-white shadow-md overflow-hidden bg-white">
                      {team.avatar ? (
                        <Image
                          src={`/avatars/${team.avatar}.png`}
                          alt={`${team.name} avatar`}
                          width={80}
                          height={64}
                          className="w-full h-full object-cover"
                          unoptimized={true}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <span className="text-lg text-gray-600">👥</span>
                        </div>
                      )}
                    </div>
                    {position === 1 && (
                      <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        🏆
                      </div>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-white mb-1">{team.name}</h3>
                  <p className="text-white text-sm mb-2">{getRankText(position)}</p>
                  <p className="text-2xl font-bold text-white">{team.score || 0}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
          <button
            onClick={handleBackHome}
            className="group/button relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-lg bg-cyan-600 px-1 py-3 md:px-8  text-sm md:text-base font-bold text-white transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/30 disabled:bg-gray-600 disabled:scale-100 disabled:cursor-not-allowed"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded text-white">
              <Home className="h-6 w-6" />
            </span>
            <span className="text-lg md:text-xl font-bold">Back to Home</span>
            {/* Animated sheen overlay */}
            <div className="pointer-events-none absolute inset-0 flex h-full w-full justify-center [transform:skew(-13deg)_translateX(-100%)] group-hover/button:duration-700 group-hover/button:[transform:skew(-13deg)_translateX(100%)]">
              <div className="relative h-full w-8 bg-white/20" />
            </div>
          </button>
        </div>

        {/* Summary */}
        {playedCount > 0 && (
          <div className="text-center mt-8 text-gray-600">
            <p className="text-sm">Questions answered this round: {playedCount}</p>
          </div>
        )}
      </div>
    </div>
  );
}
