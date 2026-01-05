'use client';

import React from 'react';
import { Question } from '@/types/game';

interface GameCardProps {
  question: Question;
  children: React.ReactNode;
}

export default function GameCard({ question, children }: GameCardProps) {
  return (
    <div className="relative px-3 mb-2 lg:ml-10 ">
      {/* Main Card */}
      <div className="bg-white rounded-[4vw] mt-2 p-3 shadow-2xl border-8 border-blue-400 relative">
        
        {/* === Floating Labels on the border === */}
        {/* Left - Category */}
        <div className="absolute -top-5 left-12 bg-slate-700 text-white px-8 py-2 rounded-xl text-md font-medium hidden md:inline-block">
          {question.category?.name || 'Category'}
        </div>

        {/* Right - Points */}
        <div className="absolute -top-5 right-12 bg-brown-800 text-white px-6 py-2 rounded-xl text-md font-bold hidden md:inline-block">
          {question.points} Points
        </div>

        {/* Content */}
        <div className=" h-80  sm:mt-6 sm:h-[28rem]">
          {children}
        </div>

      </div>
    </div>
  );
}