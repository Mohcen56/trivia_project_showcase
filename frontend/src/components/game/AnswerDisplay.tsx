'use client';

import React, { useEffect, useState } from 'react';
import { Question } from '@/types/game';
import { RotateCcw, Users } from 'lucide-react';
import Image from 'next/image';
import { getFullImageUrl } from '@/lib/utils/imageUtils';
import GameCard from './GameCard';

interface AnswerDisplayProps {
  question: Question;
  onShowQuestion: () => void;
  onShowTeamSelector: () => void;
}

function AnswerDisplay({ question, onShowQuestion, onShowTeamSelector }: AnswerDisplayProps) {
  const [answerImageStatus, setAnswerImageStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');

  useEffect(() => {
    if (question.answer_image) {
      setAnswerImageStatus('loading');
    } else {
      setAnswerImageStatus('idle');
    }
  }, [question.id, question.answer_image]);

  const shouldCenterAnswerText = answerImageStatus !== 'loaded';
  const showAnswerImage = Boolean(question.answer_image) && answerImageStatus !== 'error';

  return (
    <GameCard question={question}>
      {/* Answer Text */}
      <div
        className={`text-center md:-mt-4  mb-8  ${shouldCenterAnswerText ? 'flex min-h-[18rem] items-center justify-center' : ''}`}
      >
        <h1 className="select-none text-gray-800 text-2xl md:text-3xl font-bold leading-relaxed">
          {question.answer_ar || question.answer}
        </h1>
      </div>
      
      {/* Answer Image if available */}
      {showAnswerImage && (
        
          <div className="relative items-center justify-center max-w-2xl mx-auto rounded-xl overflow-hidden">
           <Image
              src={getFullImageUrl(question.answer_image) || ''}
             alt="Answer image"
             width={800}
             height={400}
             className="w-full max-h-50 md:max-h-75 object-contain mx-auto"
             unoptimized={true}
             onLoadingComplete={() => setAnswerImageStatus('loaded')}
             onError={() => setAnswerImageStatus('error')}
           />
         
        </div>
      )}

      {/* Action Buttons */}
      <div className="absolute -bottom-6  -right-18 md:-right-15 transform -translate-x-1/2">
        {/* Back to Question Button */}
        <button
          onClick={onShowQuestion}
          className=" bg-brown-800 hover:bg-brown-700 text-white md:px-6  md:py-3 py-2 px-3 rounded-lg flex items-center space-x-2 transition-colors text-xs md:text-lg font-bold"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Show Question</span>
        </button>
</div>

      {/* Team Selector Button */}
      <div className="absolute -bottom-6 left-20 md:left-35 transform -translate-x-1/2">
        <button
          onClick={onShowTeamSelector}
          className="bg-slate-700 hover:bg-slate-600 text-white md:px-4 md:py-3 py-2 px-3 rounded-xl flex items-center space-x-2 transition-colors font-bold text-xs md:text-lg"
        >
          <Users className="h-4 w-4" />
          <span>Who Answered?</span>
        </button>
      </div>
    </GameCard>
  );
}

// Memoize because this component renders images and heavy layout; avoid rerenders unless props change
export default React.memo(AnswerDisplay);
