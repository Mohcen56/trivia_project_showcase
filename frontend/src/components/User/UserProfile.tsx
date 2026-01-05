'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/utils/logger';
import { ChevronLeft, Camera, Eye, EyeOff, Check, Lock } from 'lucide-react';
import Image from 'next/image';
import { getFullImageUrl } from '@/lib/utils/imageUtils';
import { ProcessingButton } from '@/components/ui/button2';
import { useNotification } from '@/hooks/useNotification';
import { VerifyBadge } from '@/components/ui/verify-badge';
import { AnimatedBadge } from '../ui/animatedbadge';
import { useUserCategories } from '@/hooks/useUserCategories';

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
  onSave: (data: { username: string; email: string; avatar: string; avatarFile?: File; password?: string; currentPassword?: string }) => Promise<boolean>;
}

export default function UserProfile({ user, onBack, onSave }: UserProfileProps) {
  const notify = useNotification();
  const { approvedCategoriesCount, creatorBadge } = useUserCategories(user.id);
  const [formData, setFormData] = useState({
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user.avatar || '/avatars/thumbs.svg');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Sync avatarPreview when user.avatar changes (after successful save)
  useEffect(() => {
    if (user.avatar && !avatarFile) {
      setAvatarPreview(user.avatar);
    }
  }, [user.avatar, avatarFile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user.is_premium) {
      notify.error('Premium Feature', 'Avatar changing is available for premium members only');
      return;
    }
    
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setAvatarPreview(result);
        setFormData({
          ...formData,
          avatar: result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (): Promise<boolean> => {
    const saveData: { username: string; email: string; avatar: string; avatarFile?: File; password?: string; currentPassword?: string } = {
      username: formData.username,
      email: formData.email,
      avatar: formData.avatar
    };

    if (avatarFile) {
      saveData.avatarFile = avatarFile;
    }

    if (formData.newPassword && formData.newPassword === formData.confirmPassword) {
      saveData.password = formData.newPassword;
      if (formData.currentPassword) {
        saveData.currentPassword = formData.currentPassword;
      }
    }

    try {
      const success = await onSave(saveData);
      if (success) {
        notify.profileUpdated();
        // Reset avatar file state after successful save
        setAvatarFile(null);
      }
      return success;
    } catch (error) {
      logger.exception(error, { where: 'UserProfile.save' });
      // Error notification is handled in the parent component (profile page)
      return false;
    }
  };

  const isPasswordValid = !formData.newPassword || 
    (formData.newPassword === formData.confirmPassword && formData.newPassword.length >= 6);

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
                  src={avatarPreview.startsWith('data:') ? avatarPreview : (getFullImageUrl(avatarPreview) || '')}
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
            <label htmlFor="avatar-upload" className={`absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
              user.is_premium ? 'cursor-pointer' : 'cursor-not-allowed'
            }`}>
              {user.is_premium ? (
                <Camera className="w-8 h-8 text-white" />
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <Lock className="w-6 h-6 text-yellow-400" />
                  <span className="text-xs text-yellow-400 font-semibold">Premium</span>
                </div>
              )}
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
              aria-label="Upload profile picture"
              disabled={!user.is_premium}
            />
          </div>
          
            <h2 className="text-xl font-bold text-gray-800">{user.username}</h2>
            {user.is_premium && (
             <div className="flex items-center space-x-2">
                       {/* Premium Badge */}
                       {user.is_premium && (
                         <div className="flex mt-2">
                           <VerifyBadge type="premium" size="md" showLabel={true} />
                         </div>
                       )}
             
                         {/* Creator Level - Animated Badge based on approved categories */}
                         {approvedCategoriesCount > 0 && (
                           <div className="mt-2 flex">
                             <AnimatedBadge
                               text={`${creatorBadge.level} · ${creatorBadge.count}`}
                               icon={creatorBadge.icon}
                               borderColor={creatorBadge.borderColor}
                               shadowColor={creatorBadge.shadowColor}
                             />
                           </div>
                         )}
                     </div>
            )}
         
          <p className="text-sm text-gray-500 mt-2">
            {user.is_premium ? 'Click to change profile picture' : (
              <span className="flex items-center gap-1 justify-center">
              
                
              </span>
            )}
          </p>
        </div>

        {/* Basic Info */}
        <div className="space-y-6 mb-8">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter email"
            />
          </div>
        </div>

        {/* Password Change Section */}
        <div className="border-t pt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Change Password</h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                >
                  {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors ${
                    formData.confirmPassword && formData.newPassword === formData.confirmPassword
                      ? 'border-green-300 focus:border-green-500'
                      : 'border-gray-300 focus:border-blue-500'
                  }`}
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                {formData.confirmPassword && formData.newPassword === formData.confirmPassword && (
                  <Check className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
                )}
              </div>
              {formData.newPassword && formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                <p className="text-sm text-red-600 mt-1">Passwords do not match</p>
              )}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 pt-6 border-t">
          <ProcessingButton
            onProcess={handleSave}
            disabled={!isPasswordValid}
            className={`w-full py-6  px-6 ${
              !isPasswordValid && 'opacity-50 cursor-not-allowed'
            }`}
            icon="save"
            processingText="Saving..."
            successText="Saved!"
            errorText="Failed to save"
          >
          
            Save Changes
          </ProcessingButton>
        </div>
      </div>
    </div>
  );
}
