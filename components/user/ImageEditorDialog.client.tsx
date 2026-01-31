'use client';

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Point, Area } from 'react-easy-crop';
import getCroppedImg from '@/lib/utils/canvasUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, Check, RotateCw } from 'lucide-react';

interface ImageEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string | null;
  onSave: (file: Blob) => Promise<void>;
}

const FILTERS = [
  { name: 'Normal', value: 'none' },
  { name: 'Grayscale', value: 'grayscale(100%)' },
  { name: 'Sepia', value: 'sepia(100%)' },
  { name: 'Warm', value: 'sepia(50%) saturate(150%)' },
  { name: 'Cool', value: 'hue-rotate(180deg) saturate(80%)' },
  { name: 'Vintage', value: 'sepia(50%) contrast(120%) brightness(90%)' },
];

export default function ImageEditorDialog({
  isOpen,
  onClose,
  imageSrc,
  onSave,
}: ImageEditorDialogProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [selectedFilter, setSelectedFilter] = useState(FILTERS[0]);
  const [isSaving, setIsSaving] = useState(false);

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setIsSaving(true);
      const croppedImage = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation,
        undefined,
        selectedFilter.value
      );

      if (croppedImage) {
        await onSave(croppedImage);
        onClose();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Edit Profile Picture</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Cropper Area */}
          <div className="relative h-[300px] md:h-[400px] w-full bg-gray-900">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              cropShape="round"
              showGrid={false}
              style={{
                containerStyle: {
                  filter: selectedFilter.value !== 'none' ? selectedFilter.value : undefined,
                },
              }}
            />
          </div>

          {/* Controls */}
          <div className="p-6 space-y-6 overflow-y-auto">
            {/* Zoom & Rotation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span className="flex items-center gap-2">
                    <ZoomOut size={14} /> Zoom
                  </span>
                  <span>{Math.round(zoom * 100)}%</span>
                </div>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span className="flex items-center gap-2">
                    <RotateCw size={14} /> Rotation
                  </span>
                  <span>{rotation}°</span>
                </div>
                <input
                  type="range"
                  value={rotation}
                  min={0}
                  max={360}
                  step={1}
                  aria-labelledby="Rotation"
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Filters</label>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {FILTERS.map((filter) => (
                  <button
                    key={filter.name}
                    onClick={() => setSelectedFilter(filter)}
                    className={`
                      flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all
                      ${
                        selectedFilter.name === filter.name
                          ? 'bg-black text-white shadow-md transform scale-105'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }
                    `}
                  >
                    {filter.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check size={16} />
                Save Profile Picture
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
