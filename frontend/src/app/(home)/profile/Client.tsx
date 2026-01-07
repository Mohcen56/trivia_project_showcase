"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import UserProfile from "@/components/User/UserProfile";
import { authAPI } from "@/lib/api/auth";
import { logger } from '@/lib/utils/logger';
import { useNotification } from '@/hooks/useNotification';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/authSlice';
import { refreshUserAction } from '@/lib/auth/actions';
import type { User } from '@/lib/auth/types';

interface ProfileClientProps {
  initialUser: User;
}

export default function ProfileClient({ initialUser }: ProfileClientProps) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const notify = useNotification();
  const dispatch = useAppDispatch();

  // Helper to update both local state and Redux store
  const updateUserEverywhere = (updatedUser: User) => {
    setUser(updatedUser);
    // Update Redux store for client components that need it
    dispatch(setCredentials({ user: updatedUser }));
  };

  const handleSave = async (data: {
    username: string;
    email: string;
    avatar: string;
    avatarFile?: File;
    password?: string;
    currentPassword?: string;
  }): Promise<boolean> => {
    try {
      let profileUpdated = false;

      // 1) Update basic profile fields if changed
      if (
        (data.username && data.username !== user!.username) ||
        (data.email && data.email !== user!.email)
      ) {
        const res = await authAPI.updateProfile({
          username: data.username,
          email: data.email,
        });
        if (!res.success) {
          // Handle specific error messages
          const errorMsg = res.error || "Failed to update profile";
          
          if (errorMsg.toLowerCase().includes('username') && errorMsg.toLowerCase().includes('already')) {
            notify.error('Username Taken', 'This username is already in use. Please choose a different one.');
          } else if (errorMsg.toLowerCase().includes('email') && errorMsg.toLowerCase().includes('already')) {
            notify.error('Email Already Used', 'This email is already registered. Please use a different email.');
          } else if (errorMsg.toLowerCase().includes('invalid')) {
            notify.error('Invalid Input', errorMsg);
          } else {
            notify.error('Update Failed', errorMsg);
          }
          return false; // Return false to prevent success notification
        }
        if (res.user) {
          updateUserEverywhere(res.user);
          profileUpdated = true;
        }
      }

      // 2) Update avatar if a new file was selected
      if (data.avatarFile) {
        const res = await authAPI.updateProfilePicture(data.avatarFile);
        if (!res.success) {
          const errorMsg = res.error || "Failed to update avatar";
          
          if (errorMsg.toLowerCase().includes('size') || errorMsg.toLowerCase().includes('large')) {
            notify.error('File Too Large', 'Please upload an image smaller than 5MB.');
          } else if (errorMsg.toLowerCase().includes('format') || errorMsg.toLowerCase().includes('type')) {
            notify.error('Invalid Format', 'Please upload a valid image file (JPG, PNG, or GIF).');
          } else if (errorMsg.toLowerCase().includes('premium')) {
            notify.error('Premium Feature', 'Avatar changing is available for premium members only.');
          } else {
            notify.error('Avatar Update Failed', errorMsg);
          }
          return false; // Return false to prevent success notification
        }
        if (res.user) {
          updateUserEverywhere(res.user);
          profileUpdated = true;
        }
      }

      // 3) Change password if provided
      if (data.password) {
        const res = await authAPI.changePassword(data.currentPassword || "", data.password);
        if (!res.success) {
          const errorMsg = res.error || "Failed to change password";
          
          if (errorMsg.toLowerCase().includes('current password') || errorMsg.toLowerCase().includes('incorrect')) {
            notify.error('Wrong Password', 'The current password you entered is incorrect. Please try again.');
          } else if (errorMsg.toLowerCase().includes('too short') || errorMsg.toLowerCase().includes('weak')) {
            notify.error('Weak Password', 'Your new password must be at least 6 characters long.');
          } else if (errorMsg.toLowerCase().includes('same')) {
            notify.error('Same Password', 'New password must be different from your current password.');
          } else {
            notify.error('Password Change Failed', errorMsg);
          }
          return false; // Return false to prevent success notification
        }
      }

      // Refetch user profile to ensure all changes are synced (including Redux)
      if (profileUpdated || data.avatarFile || data.password) {
        try {
          const result = await authAPI.getProfile();
          if (result.user) {
            updateUserEverywhere(result.user as User);
          }
          // Invalidate server-side cache
          await refreshUserAction();
        } catch (error) {
          logger.warn('Failed to refetch user profile after save', error);
          // Don't fail the entire operation if refetch fails
        }
      }

      logger.log("Profile saved successfully");
      return true; // Return true only if everything succeeded
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save profile";
      logger.exception(message, { where: 'profile.saveProfile' });
      return false; // Return false on exception
    }
  };

  return (
    <UserProfile
      user={user}
      onBack={() => router.back()}
      onSave={handleSave}
    />
  );
}
