'use client';

import React, { useState, useCallback } from 'react';
import { logger } from '@/lib/utils/logger';
import Cropper from 'react-easy-crop';
import { X, ZoomIn, ZoomOut } from 'lucide-react';
import { ProcessingButton } from '@/components/ui/button2';

interface ImageCropModalProps {
  imageSrc: string;
  onCropComplete: (croppedImage: File) => void;
  onCancel: () => void;
}

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

type CroppedAreaPixels = Area;

const generateUniqueFileName = (extension: string) => {
  const safeExtension = extension.startsWith('.') ? extension : `.${extension}`;
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : undefined;
  const uniquePart =
    cryptoObj && typeof cryptoObj.randomUUID === 'function'
      ? cryptoObj.randomUUID()
      : `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  return `cropped-${uniquePart}${safeExtension}`;
};

export default function ImageCropModal({ imageSrc, onCropComplete, onCancel }: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedAreaPixels | null>(null);

  const onCropChange = (location: { x: number; y: number }) => {
    setCrop(location);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropCompleteCallback = useCallback(
    (croppedArea: Area, croppedAreaPixels: CroppedAreaPixels) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: CroppedAreaPixels
  ): Promise<File> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    // Set canvas size to match the cropped area
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Draw the cropped image
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    // Convert canvas to blob then to File
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        const file = new File([blob], generateUniqueFileName('jpg'), { type: 'image/jpeg' });
        resolve(file);
      }, 'image/jpeg', 0.95);
    });
  };

  const handleSave = async (): Promise<boolean> => {
    if (!croppedAreaPixels) {
      logger.exception('❌ No cropped area available', { where: 'ImageCropModal.handleSave' });
      return false;
    }

    logger.log('🎨 Starting crop with area:', croppedAreaPixels);

    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      logger.log('🎨 Crop successful! File:', croppedImage.name, croppedImage.size, 'bytes');
      onCropComplete(croppedImage);
      return true;
    } catch (e) {
      logger.exception(e, { where: 'ImageCropModal.handleSave' });
      return false;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      <div className="bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Crop Image</h2>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-white transition-colors"
            title="Close"
            aria-label="Close crop modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Cropper Area */}
        <div className="relative w-full h-96 bg-slate-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            
            showGrid={false}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteCallback}
          />
        </div>

        {/* Zoom Controls */}
        <div className="bg-slate-900 px-6 py-4 border-t border-slate-700">
          <label className="flex items-center gap-4">
            <ZoomOut className="w-5 h-5 text-slate-400" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              title="Zoom level"
              aria-label="Zoom level"
            />
            <ZoomIn className="w-5 h-5 text-slate-400" />
          </label>
        </div>

        {/* Action Buttons */}
        <div className="bg-slate-800 px-6 py-4 flex gap-4 justify-end">
          <button
            onClick={onCancel}
            className="px-6 py-3 rounded-xl bg-slate-600 hover:bg-slate-700 text-white font-semibold transition-all"
          >
            Cancel
          </button>
          <ProcessingButton
            onProcess={handleSave}
            className="px-6 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold transition-all flex items-center gap-2"
            icon="save"
            processingText="Cropping..."
            successText="Saved!"
            errorText="Failed"
          >
            Save Crop
          </ProcessingButton>
        </div>
      </div>
    </div>
  );
}
