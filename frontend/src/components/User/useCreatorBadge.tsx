import React from 'react';

export type CreatorLevel = 'Beginner' | 'Novice' | 'Advanced' | 'Master';

export const useCreatorBadge = (approvedCategoriesCount: number) => {
  const getCreatorLevel = (count: number): CreatorLevel => {
    if (count === 1) return 'Beginner';
    if (count === 2) return 'Novice';
    if (count >= 3 && count <= 9) return 'Advanced';
    return 'Master'; // 10+
  };

  const getCreatorBorderColor = (count: number): string => {
    // Blue for Beginner
    if (count === 1) return 'via-blue-500';
    // Gold (amber) for middle (2-9)
    if (count >= 2 && count <= 9) return 'via-amber-500';
    // Purple for Master (10+)
    return 'via-purple-500';
  };

  const getCreatorShadow = (count: number): string => {
    if (count === 1) return 'shadow-lg shadow-blue-500/50';
    if (count >= 2 && count <= 9) return 'shadow-lg shadow-amber-500/50';
    return 'shadow-lg shadow-purple-500/50';
  };

  const BoltIcon = ({ className = 'w-4 h-4', color = '#7C3AED' }: { className?: string; color?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
      <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" fill={color} />
    </svg>
  );

  const getLevelIcon = (count: number) => {
    if (count === 1) return <BoltIcon color="#3B82F6" />; // blue
    if (count >= 2 && count <= 9) return <BoltIcon color="#F59E0B" />; // gold/amber
    return <BoltIcon color="#8B5CF6" />; // purple
  };

  return {
    level: getCreatorLevel(approvedCategoriesCount),
    borderColor: getCreatorBorderColor(approvedCategoriesCount),
    shadowColor: getCreatorShadow(approvedCategoriesCount),
    icon: getLevelIcon(approvedCategoriesCount),
    count: approvedCategoriesCount,
    // Expose helper functions if needed
    getCreatorLevel,
    getCreatorBorderColor,
    getCreatorShadow,
    getLevelIcon,
  };
};
