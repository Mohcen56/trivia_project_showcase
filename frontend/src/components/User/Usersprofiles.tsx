'use client';

import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { VerifyBadge } from '@/components/ui/verify-badge';
import { AnimatedBadge } from '@/components/ui/animatedbadge';
import { useUserCategories } from '@/hooks/useUserCategories';
import { useMembership } from '@/hooks/useMembership';
import { getFullImageUrl } from '@/lib/utils/imageUtils';

interface User {
  id: number;
  username: string;
  email: string;
  avatar: string;
  is_premium?: boolean;
}

interface UserProfileProps {
  user: User;
  onBack: () => void;
}

export default function UserProfile({ user, onBack }: UserProfileProps) {
  const router = useRouter();
  const { membership, isLoaded } = useMembership(); // ✅ get membership info
  const { userCategories, isLoadingCategories, approvedCategoriesCount, creatorBadge } = useUserCategories(user.id);
  const [formData] = useState({
    username: user.username,
    avatar: user.avatar,
  });
  const [showBadgeLabel, setShowBadgeLabel] = useState(true);
  
  const [avatarPreview, setAvatarPreview] = useState(user.avatar || '/avatars/thumbs.svg');

  // Auto-detect screen size and toggle badge label
  React.useEffect(() => {
    const handleResize = () => {
      setShowBadgeLabel(window.innerWidth >= 640); // sm breakpoint is 640px
    };

    handleResize(); // Set initial value
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow"
            aria-label="Go back"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Profile Settings</h1>
        </div>
      </div>

      {/* Profile Form */}
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-lg">
              {avatarPreview && avatarPreview !== '/avatars/thumbs.svg' ? (
                <Image
                  src={getFullImageUrl(avatarPreview) || ''}
                  alt="Profile Avatar"
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                  unoptimized={true}
                  onError={() => {
                    setAvatarPreview('/avatars/thumbs.svg');
                  }}
                />
              ) : (
                <Image
                  src="/avatars/thumbs.svg"
                  alt="Default Avatar"
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>
          
          {/* Username */}
          <h2 className="text-2xl font-bold text-gray-800 mt-4">
            {formData.username}
          </h2>
          <div className="flex items-center space-x-2">
          {/* Premium Badge */}
          {isLoaded && (membership?.is_premium || user?.is_premium) && (
            <VerifyBadge type="premium" size="md" showLabel={showBadgeLabel} />
          )}

            {/* Creator Level - Animated Badge based on approved categories */}
            {approvedCategoriesCount > 0 && (
              <AnimatedBadge
                text={showBadgeLabel ? `${creatorBadge.level} · ${creatorBadge.count}` : ''}
                icon={creatorBadge.icon}
                borderColor={creatorBadge.borderColor}
                shadowColor={creatorBadge.shadowColor}
              />
            )}
        </div></div>

        {/* Categories Created by User */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Categories Created ({userCategories.length})
          </h3>
          
          {isLoadingCategories ? (
            <div className="text-center py-8 text-gray-500">Loading categories...</div>
          ) : userCategories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No categories created yet
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {userCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => router.push(`/categories/edit/${category.id}`)}
                  className="relative aspect-[4/5] rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer group"
                >
                  {/* Category Image */}
                  <div className="h-4/5 relative">
                      {category.image_url || category.image ? (
                        <Image
                          src={getFullImageUrl(category.image_url || category.image) || ''}
                        alt={category.name}
                        fill
                        unoptimized={true}
                        className="object-cover group-hover:brightness-110 transition-all"
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-cyan-900 flex items-center justify-center group-hover:from-cyan-600 group-hover:to-cyan-800 transition-all">
                        <span className="text-white text-4xl font-bold">
                          {category.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    
                    {/* Questions Count Badge */}
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-bold">
                      {category.questions_count || 0} questions
                    </div>

                    {/* Approval Status */}
                    {!category.is_approved && (
                      <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-0.5 rounded text-xs font-bold">
                        Pending
                      </div>
                    )}

                    {/* Privacy Badge */}
                    {category.privacy === 'private' && (
                      <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-0.5 rounded text-xs font-bold">
                        Private
                      </div>
                    )}
                  </div>

                  {/* Category Name */}
                  <div className="h-1/5 bg-gradient-to-br from-eastern-blue-500 to-eastern-blue-700 flex items-center justify-center px-2 group-hover:from-eastern-blue-600 group-hover:to-eastern-blue-800 transition-all">
                    <h4 className="text-white font-bold text-sm text-center line-clamp-2">
                      {category.name}
                    </h4>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
