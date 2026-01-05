'use client';

import React, { useState, useMemo } from 'react';
import { logger } from '@/lib/utils/logger';
import { PlusCircle, Trash2, Edit } from 'lucide-react';

interface Question {
  id: number;
  text: string;
  answer: string;
  points: number;
  image?: string;
  answer_image?: string;
  created_at?: string; // Add created_at for sorting
}

interface QuestionsListProps {
  questions: Question[];
  onAddQuestion?: () => void;
  onDeleteQuestion?: (questionId: number) => void;
  onEditQuestion?: (questionId: number) => void;
}

type SortType = 'newest' | 'oldest' | 'points-high' | 'points-low';

export default function QuestionsList({
  questions,
  onAddQuestion,
  onDeleteQuestion,
  onEditQuestion,
}: QuestionsListProps) {
  const [sortBy, setSortBy] = useState<SortType>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Debug: Log what we received
  logger.log('📦 QuestionsList received questions:', questions);
  logger.log('📦 QuestionsList questions type:', typeof questions);
  logger.log('📦 QuestionsList is array?:', Array.isArray(questions));
  
  // Ensure questions is an array (wrapped in useMemo to avoid dependency issues)
  const questionsArray = useMemo(() => {
    return Array.isArray(questions) ? questions : [];
  }, [questions]);
  
  logger.log('📦 QuestionsList questionsArray length:', questionsArray.length);
  
  // Filter and sort questions
  const filteredAndSortedQuestions = useMemo(() => {
    let filtered = questionsArray;
    
    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(q => 
        q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.answer.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          // If created_at exists, use it; otherwise use id (higher id = newer)
          return (b.id || 0) - (a.id || 0);
        case 'oldest':
          return (a.id || 0) - (b.id || 0);
        case 'points-high':
          return b.points - a.points;
        case 'points-low':
          return a.points - b.points;
        default:
          return 0;
      }
    });
    
    return sorted;
  }, [questionsArray, searchQuery, sortBy]);
  
  // Group questions by points
  const groupedQuestions = filteredAndSortedQuestions.reduce((acc, question) => {
    if (!acc[question.points]) {
      acc[question.points] = [];
    }
    acc[question.points].push(question);
    return acc;
  }, {} as Record<number, Question[]>);

  // If no questions, show add button (only if onAddQuestion is provided)
  if (questionsArray.length === 0) {
    if (!onAddQuestion) {
      return (
        <div className="p-10 w-full mb-6">
          <div className="flex justify-center">
            <p className="text-gray-500 text-lg">No questions available in this category</p>
          </div>
        </div>
      );
    }
    return (
      <div className=" p-10 w-full mb-6">
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onAddQuestion}
            className="flex items-center justify-center space-x-3 text-balck px-10 py-5   transition-all transform hover:scale-105 text-xl font-bold"
          >
            <PlusCircle className="h-6 w-6" />
            <span>Add Questions</span>
          </button>
        </div>
      </div>
    );
  }

  // Show questions list
  return (
    <>
      <style>
        {`
          @keyframes move-bg {
            to {
              background-position: 400% 0;
            }
          }
        `}
      </style>
    <div className="rounded-xl shadow-xl p-4 w-full  bg-white mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500 text-white px-4 py-2 rounded-full font-bold  text-sm sm:text-lg">
            Questions: {filteredAndSortedQuestions.length}
          </div>
        </div>
        {onAddQuestion && (
          <button
            type="button"
            onClick={onAddQuestion}
            className="flex  items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-3 sm:px-4 py-2 rounded-lg shadow-md transition-all transform hover:scale-105 font-bold"
          >
            <PlusCircle className="h-5 w-5" />
            <span className='text-sm sm:text-lg'>Add Question</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="mb-2">
        <input
          type="text"
          placeholder="Search for a question..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-primary-600 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-4 justify-content-center overflow-x-auto p-1">
        <button 
          onClick={() => setSortBy('oldest')}
          className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
            sortBy === 'oldest' 
              ? 'bg-blue-600 text-white' 
              : 'bg-cyan-600 text-white hover:bg-cyan-900'
          }`}
        >
          Oldest
        </button>
        <button 
          onClick={() => setSortBy('points-high')}
          className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
            sortBy === 'points-high' 
              ? 'bg-blue-600 text-white' 
              : 'bg-cyan-600 text-white hover:bg-cyan-900'
          }`}
        >
          Points (High to Low)
        </button>
        <button 
          onClick={() => setSortBy('points-low')}
          className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
            sortBy === 'points-low' 
              ? 'bg-blue-600 text-white' 
              : 'bg-cyan-600 text-white hover:bg-cyan-900'
          }`}
        >
          Points (Low to High)
        </button>
        <button 
          onClick={() => setSortBy('newest')}
          className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
            sortBy === 'newest' 
              ? 'bg-blue-600 text-white' 
              : 'bg-cyan-600 text-white hover:bg-cyan-900'
          }`}
        >
          Newest
        </button>
      

      {/* Points Selector */}
    
        {[ 200,  400, 600].map((points) => (
          <button
            key={points}
            className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap transition-colors ${
              groupedQuestions[points]
                ? 'bg-slate-600 text-white hover:bg-slate-500'
                : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
            }`}
            disabled={!groupedQuestions[points]}
          >
            {points}
          </button>
        ))}
      
    </div>
      {/* Questions List */}
      <div className="space-y-3">
        {filteredAndSortedQuestions.map((question) => (
          <div
            key={question.id}
            className="relative rounded-2xl p-5 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 hover:border-blue-400 hover:shadow-xl transition-all duration-300 mb-6 group"
          >
            {/* Points Badge */}
            <div className="absolute -top-4 left-2 flex-shrink-0 bg-gradient-to-br from-cyan-500 to-cyan-600 text-white px-4 py-2 rounded-xl font-bold text-base shadow-lg">
              {question.points}
            </div>

            {/* Question Header with Label and Buttons */}
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Question</span>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {onEditQuestion && (
                  <button
                    type="button"
                    onClick={() => onEditQuestion(question.id)}
                    className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all p-2.5 rounded-lg hover:scale-110 duration-200"
                    title="Edit question"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                )}
                {onDeleteQuestion && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this question?')) {
                        onDeleteQuestion(question.id);
                      }
                    }}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 transition-all p-2.5 rounded-lg hover:scale-110 duration-200"
                    title="Delete question"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Question Content */}
            <div>
              <p className="text-gray-900 text-xs sm:text-lg font-medium leading-relaxed">
                {question.text}
              </p>

              {/* Images indicators */}
              <div className="mt-3 flex gap-2 flex-wrap">
                {question.image && (
                  <div
                    className="rounded-full p-[1px] bg-gradient-to-r from-transparent via-blue-500 to-transparent [background-size:400%_100%]"
                    style={{ animation: "move-bg 8s linear infinite" }}
                  >
                    <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs text-blue-600 border border-blue-200 shadow-sm">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                      <span className="font-semibold">Question Image</span>
                    </div>
                  </div>
                )}
                {question.answer_image && (
                  <div
                    className="rounded-full p-[1px] bg-gradient-to-r from-transparent via-green-500 to-transparent [background-size:400%_100%]"
                    style={{ animation: "move-bg 8s linear infinite" }}
                  >
                    <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs text-green-600 border border-green-200 shadow-sm">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                      <span className="font-semibold">Answer Image</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
    </>
  );
}
