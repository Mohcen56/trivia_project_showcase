'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/utils/logger';
import { useRouter } from 'next/navigation';
import { gameAPI } from '@/lib/api/index';
import {   Plus, Minus, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProcessingButton } from '@/components/ui/button2';
import Image from 'next/image';
import { useHeader } from '@/contexts/HeaderContext';
import BounceLoader from '@/components/ui/loadingscreen';

interface TeamForm {
  name: string;
  avatar: string;
}

// Available avatar images - stored in public/avatars/
const AVAILABLE_AVATARS = [
  { id: 'cat', src: '/avatars/1.png', alt: 'Cat', fallback: '🐱' },
  { id: 'taro', src: '/avatars/13.png', alt: 'taro', fallback: '🔴' },
  { id: 'Luffy', src: '/avatars/11.png', alt: 'Luffy', fallback: '🏴‍☠️' },
  { id: 'Nightwing', src: '/avatars/5.png', alt: 'Nightwing', fallback: '⚔️' },
  { id: 'Nika', src: '/avatars/3.png', alt: 'Nika', fallback: '�️' },
  { id: 'Ang', src: '/avatars/2.png', alt: 'Ang', fallback: '😇' },
  { id: 'Spider', src: '/avatars/6.png', alt: 'Spider', fallback: '🦇' },
  { id: 'Ninja', src: '/avatars/7.png', alt: 'Ninja', fallback: '⚡' },
  { id: 'Ghost', src: '/avatars/8.png', alt: 'Ghost', fallback: '👻' },
  { id: 'Jiraya', src: '/avatars/9.png', alt: 'Jiraya', fallback: '🍥' },
  { id: 'Mugiwara', src: '/avatars/12.png', alt: 'Mugiwara', fallback: '�' },
  { id: 'Titan', src: '/avatars/14.png', alt: 'Titan', fallback: '⚔️' },
  { id: 'Warrior', src: '/avatars/15.png', alt: 'Warrior', fallback: '⚔️' },
  { id: 'Mage', src: '/avatars/16.png', alt: 'Mage', fallback: '🔮' },
  { id: 'Knight', src: '/avatars/17.png', alt: 'Knight', fallback: '⚔️' },
];

export default function TeamsPage() {
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [numberOfTeams, setNumberOfTeams] = useState<number>(2);
  const [teams, setTeams] = useState<TeamForm[]>([
    { name: '', avatar: AVAILABLE_AVATARS[0].id },
    { name: '', avatar: AVAILABLE_AVATARS[1].id }
  ]);
  
  const [error, setError] = useState('');
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const router = useRouter();
   const { setHeader } = useHeader();
    useEffect(() => {
    setHeader({ title: "Team Setup", backHref: "/categories" });
  }, [setHeader]);

  useEffect(() => {
    // Load selected categories from localStorage
    const savedCategories = localStorage.getItem('selectedCategories');
    if (savedCategories) {
      setSelectedCategories(JSON.parse(savedCategories));
    } else {
      // If no categories found, redirect back to categories page
      router.push('/categories');
    }
  }, [router]);

  // Update teams array when numberOfTeams changes
  useEffect(() => {
    setTeams(prevTeams => {
      const newTeams: TeamForm[] = [];
      
      for (let i = 0; i < numberOfTeams; i++) {
        if (prevTeams[i]) {
          // Keep existing team data
          newTeams.push(prevTeams[i]);
        } else {
          // Create new team with default data using available avatars
          newTeams.push({
            name: '',
            avatar: AVAILABLE_AVATARS[i % AVAILABLE_AVATARS.length].id
          });
        }
      }
      
      return newTeams;
    });
  }, [numberOfTeams]);

  const updateTeamName = (index: number, name: string) => {
    const newTeams = [...teams];
    newTeams[index].name = name;
    setTeams(newTeams);
  };

  const updateTeamAvatar = (index: number, avatarId: string) => {
    const newTeams = [...teams];
    newTeams[index].avatar = avatarId;
    setTeams(newTeams);
  };

  const getAvatarById = (avatarId: string) => {
    return AVAILABLE_AVATARS.find(avatar => avatar.id === avatarId) || AVAILABLE_AVATARS[0];
  };

  const handleImageError = (avatarId: string) => {
    setImageErrors(prev => new Set(prev).add(avatarId));
  };

  const hasImageError = (avatarId: string) => {
    return imageErrors.has(avatarId);
  };

  const getCurrentAvatarIndex = (avatarId: string) => {
    return AVAILABLE_AVATARS.findIndex(avatar => avatar.id === avatarId);
  };

  const navigateAvatar = (teamIndex: number, direction: 'prev' | 'next') => {
    const currentIndex = getCurrentAvatarIndex(teams[teamIndex].avatar);
    let newIndex;
    
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : AVAILABLE_AVATARS.length - 1;
    } else {
      newIndex = currentIndex < AVAILABLE_AVATARS.length - 1 ? currentIndex + 1 : 0;
    }
    
    updateTeamAvatar(teamIndex, AVAILABLE_AVATARS[newIndex].id);
  };

  const incrementTeams = () => {
    if (numberOfTeams < 4) {
      setNumberOfTeams(numberOfTeams + 1);
    }
  };

  const decrementTeams = () => {
    if (numberOfTeams > 2) {
      setNumberOfTeams(numberOfTeams - 1);
    }
  };

  const isValidToStart = () => {
    return selectedCategories.length >= 2;
  };

  const handleStartGame = async (): Promise<boolean> => {
    if (!isValidToStart()) {
      setError('Please select at least 2 categories');
      return false;
    }

    setError('');

    try {
      logger.log('Starting game with categories:', selectedCategories);
      logger.log('Teams:', teams);
      
      const teamsData = teams.map((team, index) => ({
        name: team.name.trim() || `Team ${index + 1}`, // Use default name if empty
        avatar: getAvatarById(team.avatar).src.replace('/avatars/', '').replace(/\.(png|jpeg|jpg|svg)$/, '') // Store filename without path and extension
      }));
      
      const game = await gameAPI.startGame(selectedCategories, teamsData);
      
      logger.log('Game created successfully:', game);
      
      if (!game.id) {
        throw new Error('Game was created but no ID was returned');
      }
      
      // Clear localStorage
      localStorage.removeItem('selectedCategories');
      
      // Navigate to game board
      router.push(`/game/${game.id}`);
      return true;
    } catch (error) {
      logger.exception(error, { where: 'teams.startGame' });
      setError('An error occurred while starting the game');
      return false;
    }
  };

  if (selectedCategories.length === 0) {
    return (
      <div className="min-h-screen bg-eastern-blue-50 flex items-center justify-center">
        <BounceLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-eastern-blue-50">
     
      

      <main className="container mx-auto px-4 py-8 lg:pt-15 2xl:pt-25">
        <div className="2xl:max-w-[1500px] mx-auto space-y-8">
          
          {/* Selected Categories and Number of Teams - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Selected Categories Summary */}
            <div className="bg-eastern-blue-100 backdrop-blur-md rounded-2xl p-6 border border-primary-200 shadow-lg">
              <h2 className="text-xl font-bold text-primary-800 mb-4 text-center">
                Selected Categories
              </h2>
              <p className="text-center text-primary-600">
                {selectedCategories.length} categories selected for the game
              </p>
            </div>

            {/* Number of Teams Selection */}
            <div className="bg-eastern-blue-100 backdrop-blur-md rounded-2xl p-6 border border-primary-200 shadow-lg">
              <h2 className="text-xl font-bold text-primary-800 mb-2 text-center">
                Number of Teams:
              </h2>
              <p className="text-primary-600 text-center mb-6 text-sm">
                (Minimum 2, Maximum 4)
              </p>
              
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={decrementTeams}
                  disabled={numberOfTeams <= 2}
                  aria-label="Decrease number of teams"
                  className="w-12 h-12 bg-cyan-700 hover:bg-cyan-800 disabled:bg-gray-400 disabled:opacity-50 rounded-xl flex items-center justify-center text-white text-xl font-bold transition-all shadow-md"
                >
                  <Minus className="w-6 h-6" />
                </button>
                
                <div className="w-16 h-12 bg-cyan-600 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-white text-2xl font-bold">{numberOfTeams}</span>
                </div>
                
                <button
                  onClick={incrementTeams}
                  disabled={numberOfTeams >= 4}
                  aria-label="Increase number of teams"
                  className="w-12 h-12 bg-cyan-700 hover:bg-cyan-800 disabled:bg-gray-400 disabled:opacity-50 rounded-xl flex items-center justify-center text-white text-xl font-bold transition-all shadow-md"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Team Setup */}
          <div className="bg-eastern-blue-100 backdrop-blur-md rounded-2xl p-6 border border-primary-200 shadow-lg">
            <div className="relative flex justify-center -mt-11 mb-6">
              <div className="bg-cyan-700 text-white px-6 py-2 rounded-full shadow-md">
                <h2 className="text-xl font-bold text-center">Team Setup</h2>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              {teams.map((team, index) => (
                <div key={index} className="bg-white/80 rounded-xl p-4 space-y-4 w-full border border-primary-200 shadow-md">
                  <h3 className="text-primary-800 font-semibold text-lg text-center w-full">
                    Team {index + 1}
                  </h3>
                  
                  {/* Team Name Input */}
                  <div className="w-full">
                    <label className="block text-primary-700 text-sm mb-2 text-center w-full font-medium">
                      Team Name
                    </label>
                    <input
                      type="text"
                      value={team.name}
                      onChange={(e) => updateTeamName(index, e.target.value)}
                      placeholder={`Team ${index + 1} name`}
                      className="w-full px-4 py-3 bg-white border border-primary-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center shadow-sm"
                      dir="ltr"
                    />
                  </div>

                  {/* Avatar Selection */}
                  <div className="w-full">
                    <label className="block text-primary-700 text-sm mb-3 text-center w-full font-medium">
                      Choose Your  Avatar
                    </label>
                    
                    {/* Avatar Carousel */}
                    <div className="flex items-center justify-center gap-2 w-full">
                      <button
                        onClick={() => navigateAvatar(index, 'prev')}
                        aria-label="Previous avatar"
                        className="w-8 h-8 bg-cyan-700 hover:bg-cyan-800 rounded-full flex items-center justify-center text-white transition-all flex-shrink-0 shadow-md"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      
                      <div className="relative w-24 h-24 bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow-xl flex-shrink-0">
                        <div className="w-22 h-22 bg-gradient-to-br from-eastern-blue-600 to-eastern-blue-800 rounded-full overflow-hidden flex items-center justify-center relative">
                          {hasImageError(team.avatar) ? (
                            <span className="text-4xl">{getAvatarById(team.avatar).fallback}</span>
                          ) : (
                            <div className="relative w-full h-full overflow-hidden rounded-full">
                              <Image
                                src={getAvatarById(team.avatar).src}
                                alt={getAvatarById(team.avatar).alt}
                                fill
                                sizes="96px"
                                className="object-cover object-center scale-110"
                                style={{ 
                                  filter: 'brightness(1.1) contrast(1.1) saturate(1.2)',
                                  objectPosition: 'center top'
                                }}
                                onError={() => handleImageError(team.avatar)}
                              />
                              {/* Overlay for better contrast */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => navigateAvatar(index, 'next')}
                        aria-label="Next avatar"
                        className="w-8 h-8 bg-cyan-700 hover:bg-cyan-700 rounded-full flex items-center justify-center text-white transition-all flex-shrink-0 shadow-md"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Selected Avatar Preview */}
                  <div className="flex items-center justify-center space-x-2 w-full">
                    <div className="relative w-8 h-8 bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                      <div className="w-7 h-7 bg-gradient-to-br from-eastern-blue-600 to-eastern-blue-800 rounded-full overflow-hidden flex items-center justify-center relative">
                        {hasImageError(team.avatar) ? (
                          <span className="text-sm">{getAvatarById(team.avatar).fallback}</span>
                        ) : (
                          <div className="relative w-full h-full overflow-hidden rounded-full">
                            <Image
                              src={getAvatarById(team.avatar).src}
                              alt={getAvatarById(team.avatar).alt}
                              fill
                              sizes="32px"
                              className="object-cover object-center scale-110"
                              style={{ 
                                filter: 'brightness(1.1) contrast(1.1) saturate(1.2)',
                                objectPosition: 'center top'
                              }}
                              onError={() => handleImageError(team.avatar)}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-primary-800 font-medium   text-sm flex-1" dir="ltr">
                      {team.name || `Team ${index + 1}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-md">
              <p className="text-red-600 text-center font-medium">{error}</p>
            </div>
          )}

          {/* Start Game Button */}
                      <div className="text-center ">
                        <div className="inline-block group/button relative overflow-hidden rounded-xl">
                          <ProcessingButton
                            onProcess={handleStartGame}
                            disabled={!isValidToStart()}
                           icon="check"
              processingText="Confirming..."
              successText=""
              errorText="Failed to confirm teams"
                            className="relative bg-cyan-600 hover:bg-cyan-700 hover:shadow-lg hover:shadow-red-500/30 disabled:bg-gray-600 text-white font-bold py-8 px-10 transition-all duration-300 ease-in-out hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
                          >
                            <span className="relative z-10">Confirm Teams</span>
                          </ProcessingButton>
                          <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-13deg)_translateX(-100%)] group-hover/button:duration-1000 group-hover/button:[transform:skew(-13deg)_translateX(100%)] pointer-events-none">
                            <div className="relative h-full w-16 bg-white/30" />
                          </div>
                        </div>
            
            {!isValidToStart() && (
              <p className="text-primary-600 text-sm mt-3">
                Please select at least 2 categories
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}