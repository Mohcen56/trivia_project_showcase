'use client';

import React, { useState, useRef, useEffect } from 'react';
import { logger } from '@/lib/utils/logger';
import { useRouter } from 'next/navigation';
import { gameAPI } from '@/lib/api/index';
import { ImagePlus, Lock, Globe } from 'lucide-react';
import ImageCropModal from '@/components/utils/ImageCropModal';
import { useHeader } from '@/contexts/HeaderContext';
import { useQueryClient } from '@tanstack/react-query';
import { ProcessingButton } from '@/components/ui/button2';
import { useSession } from '@/providers/SessionProvider';

export default function CategoryCreator() {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const { setHeader } = useHeader();
  const { isPremium } = useSession();
  
  // Form state
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [categoryImage, setCategoryImage] = useState<string | null>(null);
  const [categoryImageFile, setCategoryImageFile] = useState<File | null>(null);
  const [privacy, setPrivacy] = useState<'public' | 'private'>('public');
  
  // Crop modal state
  const [tempImageForCrop, setTempImageForCrop] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const router = useRouter();
  
  // Handle image selection - show crop modal
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create temporary preview for cropping
      const reader = new FileReader();
      reader.onload = (ev) => {
        setTempImageForCrop(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle cropped image from modal
  const handleCropComplete = (croppedFile: File) => {
    setCategoryImageFile(croppedFile);
    // Create preview from cropped file
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCategoryImage(ev.target?.result as string);
    };
    reader.readAsDataURL(croppedFile);
    setTempImageForCrop(null);
  };

  // Handle crop cancel
  const handleCropCancel = () => {
    setTempImageForCrop(null);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreateCategory = async (): Promise<boolean> => {
    setError('');

    // Validation
    if (!categoryName.trim()) {
      setError('Category name is required');
      return false;
    }

    if (!categoryImageFile) {
      setError('Category image is required');
      return false;
    }

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('name', categoryName.trim());
      formData.append('privacy', privacy);
      if (categoryDescription.trim()) {
        formData.append('description', categoryDescription.trim());
      }
      if (categoryImageFile) {
        formData.append('image', categoryImageFile);
      }

      // Send to backend
      const response = await gameAPI.createCategory(formData);
      
      // Extract category from response
      const category = response.category || response;

      // Invalidate queries to refresh the categories lists
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['categories', 'user'], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: ['savedCategories'], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: ['allCategoryData'], refetchType: 'active' })
      ]);

      // Redirect to edit page to add questions
      router.push(`/categories/edit/${category.id}`);
      return true;
    } catch (err) {
      logger.exception(err, { where: 'categories.create.handleCreateCategory' });
      const errorObj = err as { message?: string; detail?: string };
      setError(errorObj?.message || errorObj?.detail || 'Failed to create category. Please try again.');
      return false;
    }
  };
   useEffect(() => {
    setHeader({ title: "Create Category", backHref: "/categories/add" });
  }, [setHeader]);

  // Show details form
  return (
    <div className="min-h-screen bg-eastern-blue-50">
      {/* Image Crop Modal */}
      {tempImageForCrop && (
        <ImageCropModal
          imageSrc={tempImageForCrop}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}

    
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {error && (
            <div className="bg-red-100 border border-red-300 rounded-lg p-4">
              <p className="text-primary-800 text-center">{error}</p>
            </div>
          )}

          {/* Category Details Section */}
          <div className="bg-eastern-blue-50 backdrop-blur-md rounded-2xl p-6 mb-8 border border-primary-200 shadow-lg">
            {/* Section Header */}
            <div className="relative flex justify-center -mt-11 mb-8">
              
            </div>

            {/* Category Details Form */}
             
      <div className="rounded-2xl shadow-xl p-10 w-full bg-white mb-6">
       
        
        {/* Image upload */}
        <div className="flex justify-center mb-8">
    <div
      className="w-40 h-40 rounded-xl bg-gray-100 flex items-center justify-center cursor-pointer border-2 border-gray-300 overflow-hidden"
      onClick={() => fileInputRef.current?.click()}
    >
      {categoryImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={categoryImage}
          alt="Category"
          className="object-cover w-full h-full"
        />
      ) : (
        <ImagePlus className="h-12 w-12 text-gray-400" />
      )}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        className="hidden"
        title="Upload category image"
        aria-label="Upload category image"
        onChange={handleImageSelect}
      />
    </div>
        </div>

        {/* Category name */}
        <input
          type="text"
          value={categoryName}
          onChange={e => setCategoryName(e.target.value)}
          placeholder="Category name"
          className="w-full px-6 py-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all mb-6 text-left text-lg"
          maxLength={50}
        />

        {/* Category description */}
        <textarea
          value={categoryDescription}
          onChange={e => setCategoryDescription(e.target.value)}
          placeholder="Category description (optional)"
          className="w-full px-6 py-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all mb-6 text-left text-lg resize-none"
          rows={3}
          maxLength={200}
        />

        {/* Privacy toggle */}
        <div className="flex w-full mb-6 gap-2">
          <button
            type="button"
            disabled={!isPremium}
            className={`flex-1 py-3 rounded-l-lg font-bold text-lg relative flex items-center justify-center gap-2 ${
              privacy === 'private' 
                ? 'bg-blue-600 text-white' 
                : isPremium 
                ? 'bg-gray-200 text-gray-900' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            } transition-all ${!isPremium ? 'opacity-60' : ''}`}
            onClick={() => isPremium && setPrivacy('private')}
            title={!isPremium ? 'Premium feature' : 'Only you can see and play'}
          >
            <Lock className="w-5 h-5" />
            Private {!isPremium && '(Premium)'}
          </button>
          <button
            type="button"
            className={`flex-1 py-3 rounded-r-lg font-bold text-lg flex items-center justify-center gap-2 ${privacy === 'public' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-900'} transition-all`}
            onClick={() => setPrivacy('public')}
            title="Everyone can see and play"
          >
            <Globe className="w-5 h-5" />
            Public
          </button>
        </div>
      </div>


            {/* Create Button */}
            <div className="flex justify-center mt-8">
              <ProcessingButton
                onProcess={handleCreateCategory}
                disabled={!categoryName.trim() || !categoryImageFile}
                className="px-10 py-8 rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold text-xl shadow-lg"
                icon="save"
                processingText="Creating..."
                successText="Category Created!"
                errorText="Failed to Create"
              >
                Create Category
              </ProcessingButton>
            </div>
          </div>

          
        </div>
      </main>
    </div>
  );
}
