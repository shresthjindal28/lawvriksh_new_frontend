'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/contexts/AuthContext';
import { UpdateProfileRequest, UserProfile } from '@/types';
import ProfileUpdateForm from './ProfileUpdateForm.client';
import ProfileImageDialog from './ProfileImageDialog.client';
import { useImageUpload } from '@/hooks/common/useImageUpload';
import { dmsImageService } from '@/lib/api/imageService';
import { authService } from '@/lib/api/authService';
import { MobileHeader } from '@/components/common/MobileHeader';
import { Camera, Trash2, User, Upload } from 'lucide-react';
import ImageEditorDialog from './ImageEditorDialog.client';
const DEFAULT_AVATAR = '/assets/images/logos/lawVriksh-logo.png';
const DEFAULT_COVER = '/assets/images/background-image/backgroundImage.png';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 50,
      damping: 15,
    },
  },
};

export default function Profile({ user }: { user: UserProfile }) {
  const { updateProfile, getProfile, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(true);
  const [editableUser, setEditableUser] = useState<UserProfile>(user);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isImageEditorOpen, setIsImageEditorOpen] = useState(false);
  const [editorImageSrc, setEditorImageSrc] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [interestsInput, setInterestsInput] = useState(
    () => editableUser.interests?.join(', ') || ''
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Initialize image upload hook for avatar
  const {
    uploadImage: uploadAvatar,
    isUploading: isUploadingAvatar,
    uploadProgress: avatarProgress,
    uploadError: avatarError,
  } = useImageUpload({
    userId: user.user_id!,
    onSuccess: async (response) => {
      setEditableUser((prev) => ({ ...prev, picture: response.permanent_url }));
      try {
        const urlsResponse = await dmsImageService.getProfileImageUrls();
        const urls = urlsResponse.success ? urlsResponse.data?.urls : undefined;
        if (urls) {
          authService.storeProfileImageUrls(urls);
          setEditableUser((prev) => ({ ...prev, profile_image_urls: urls }));
          await refreshUser();
        }
      } catch {}
    },
    onError: (error) => {
      setError(`Avatar upload failed: ${error}`);
    },
  });

  // Initialize image upload hook for cover
  const {
    uploadImage: uploadCover,
    isUploading: isUploadingCover,
    uploadProgress: coverProgress,
    uploadError: coverError,
  } = useImageUpload({
    userId: user.user_id!,
    onSuccess: (response) => {
      setEditableUser((prev) => ({
        ...prev,
        cover_image: response.permanent_url,
      }));
    },
    onError: (error) => {
      setError(`Cover upload failed: ${error}`);
    },
  });

  const isUploading = isUploadingAvatar || isUploadingCover;

  useEffect(() => {
    setInterestsInput(editableUser.interests?.join(', ') || '');
  }, [editableUser.interests]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  const handleEditorSave = async (blob: Blob) => {
    try {
      const file = new File([blob], 'profile-image.jpg', { type: 'image/jpeg' });
      const previewUrl = URL.createObjectURL(file);
      setEditableUser((prev) => ({ ...prev, picture: previewUrl }));
      await uploadAvatar(file, 'profile_image');
      setIsImageEditorOpen(false);
    } catch (err) {
      setError('Failed to save edited image');
    }
  };

  const formattedMemberSince = useMemo(() => {
    return new Date(user.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [user.created_at]);

  const handleGenericChange = useCallback((field: keyof UserProfile, value: string) => {
    setEditableUser((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleInterestsChange = useCallback((value: string) => {
    setInterestsInput(value);
  }, []);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setEditorImageSrc(reader.result as string);
        setIsImageEditorOpen(true);
        setIsDropdownOpen(false);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleCoverChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        setSelectedCoverFile(file);
        const imageUrl = URL.createObjectURL(file);
        setEditableUser((prev) => ({ ...prev, cover_image: imageUrl }));
        await uploadCover(file, 'profile_image');
      }
    },
    [uploadCover]
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      // Process interests from the input string
      const processedInterests = interestsInput
        .split(',')
        .map((i) => i.trim())
        .filter(Boolean);

      const updatedUserData = {
        ...editableUser,
        interests: processedInterests,
      };

      const updatePayload: Partial<UpdateProfileRequest> = {};

      (Object.keys(updatedUserData) as Array<keyof UserProfile>).forEach((key) => {
        if (JSON.stringify(updatedUserData[key]) !== JSON.stringify(user[key])) {
          (updatePayload as any)[key] = updatedUserData[key];
        }
      });

      if (Object.keys(updatePayload).length === 0) {
        setIsEditing(false);
        return;
      }

      try {
        const response = await updateProfile(updatePayload);
        if (response.success) {
          setIsEditing(false);
          await getProfile();
          setEditableUser(updatedUserData);
        }
      } catch (error) {
        setError(
          error instanceof Error ? error.message : 'An error occurred while updating the profile'
        );
      } finally {
        setSelectedAvatarFile(null);
        setSelectedCoverFile(null);
      }
    },
    [editableUser, interestsInput, updateProfile, user, getProfile]
  );

  const handleCancel = useCallback(() => {
    setEditableUser(user);
    setInterestsInput(user.interests?.join(', ') || '');
    setIsEditing(false);
    setSelectedAvatarFile(null);
    setSelectedCoverFile(null);
  }, [user]);

  const handleImageUpdated = useCallback(
    async (data: { previewUrl?: string; profileImageUrls?: Record<string, string> }) => {
      if (data.previewUrl) {
        setEditableUser((prev) => ({ ...prev, picture: data.previewUrl! }));
      }

      if (data.profileImageUrls) {
        setEditableUser((prev) => ({
          ...prev,
          profile_image_urls: data.profileImageUrls!,
          picture: prev.picture?.startsWith('blob:') ? undefined : prev.picture,
        }));
        try {
          await refreshUser();
          await getProfile();
        } catch {}
      }
    },
    [getProfile, refreshUser]
  );

  const avatarSrc = useMemo(() => {
    if (editableUser.picture?.startsWith('blob:')) {
      return editableUser.picture;
    }

    const urls = editableUser.profile_image_urls;
    const bestUrl = urls?.xl || urls?.lg || urls?.md || urls?.sm || urls?.original || undefined;

    if (bestUrl) return bestUrl;
    if (editableUser.picture) return editableUser.picture;

    return DEFAULT_AVATAR;
  }, [editableUser.picture, editableUser.profile_image_urls]);

  const renderCoverImage = () => (
    <div className="w-full relative mb-0">
      <div className="w-full h-[320px] overflow-hidden relative bg-gradient-to-br from-[#f5e6d3] to-[#e8d4bb] md:h-[240px] sm:h-[180px]">
        <Image
          src={editableUser.cover_image || DEFAULT_COVER}
          alt="Cover"
          fill
          className="w-full h-full object-cover object-top"
        />
      </div>
    </div>
  );

  const renderAvatar = () => (
    <div className="relative shrink-0" style={{ position: 'relative' }}>
      <div
        className={`w-[110px] h-[110px] rounded-full overflow-hidden border-4 border-white bg-white shadow-[0_4px_12px_rgba(0,0,0,0.15)] relative cursor-pointer group md:w-[100px] md:h-[100px] sm:w-[90px] sm:h-[90px]`}
        onClick={() => {
          if (isEditing) {
            setIsDropdownOpen(!isDropdownOpen);
          } else {
            setIsImageModalOpen(true);
          }
        }}
        style={{ cursor: 'pointer' }}
      >
        <Image
          src={avatarSrc}
          alt={`${editableUser.name || editableUser.username}'s avatar`}
          width={120}
          height={120}
          className="w-full h-full object-cover"
          unoptimized
        />
        {isEditing && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            {isUploadingAvatar ? (
              <div className="text-white flex flex-col items-center">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span style={{ fontSize: '12px', marginTop: '4px' }}>
                  {Math.round(avatarProgress)}%
                </span>
              </div>
            ) : (
              <div className="text-white">
                <Camera size={20} />
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-[calc(100%+12px)] left-0 w-[320px] bg-white/95 backdrop-blur-md rounded-[20px] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2),0_8px_16px_-4px_rgba(0,0,0,0.1)] p-6 z-[100] border border-white/20"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 100,
            }}
          >
            <div className="flex flex-col items-center gap-4 pb-5 text-center">
              <div className="w-[160px] h-[160px] rounded-full overflow-hidden border-4 border-white shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
                <Image
                  src={avatarSrc}
                  alt="Preview"
                  width={160}
                  height={160}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-[15px] text-[#111827]">
                  {editableUser.name || editableUser.username}
                </span>
                <span className="text-xs text-gray-500">{editableUser.role}</span>
              </div>
            </div>
            <div className="h-px bg-gray-100 mx-[-16px] my-2" />
            <div className="flex flex-col gap-1">
              <button
                className="flex items-center gap-2.5 p-[10px_12px] rounded-lg border-none bg-transparent text-gray-700 text-sm font-medium cursor-pointer transition-all w-full text-left hover:bg-gray-50 hover:text-gray-900"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsImageModalOpen(true);
                  setIsDropdownOpen(false);
                }}
              >
                <User size={18} />
                <span>View Profile Picture</span>
              </button>
              <button
                className="flex items-center gap-2.5 p-[10px_12px] rounded-lg border-none bg-transparent text-gray-700 text-sm font-medium cursor-pointer transition-all w-full text-left hover:bg-gray-50 hover:text-gray-900"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                  setIsDropdownOpen(false);
                }}
              >
                <Camera size={18} />
                <span>Update Profile Picture</span>
              </button>
              <button
                className="flex items-center gap-2.5 p-[10px_12px] rounded-lg border-none bg-transparent text-red-600 text-sm font-medium cursor-pointer transition-all w-full text-left hover:bg-red-50"
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    // Fetch the default logo and convert it to a file
                    const response = await fetch(DEFAULT_AVATAR);
                    const blob = await response.blob();
                    const file = new File([blob], 'lawvriksh-logo.png', { type: 'image/png' });

                    // Update local state first
                    setEditableUser((prev) => ({
                      ...prev,
                      picture: DEFAULT_AVATAR,
                      profile_image_urls: undefined,
                    }));

                    // Upload the default logo to the backend
                    await uploadAvatar(file, 'profile_image');

                    setIsDropdownOpen(false);
                  } catch (err) {
                    console.error('Failed to set default avatar:', err);
                    setError('Failed to set default profile picture');
                  }
                }}
              >
                <Trash2 size={18} />
                <span>Remove Photo</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <input
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
        ref={fileInputRef}
        disabled={isUploading}
        aria-label="Update profile picture"
      />
    </div>
  );

  return (
    <>
      <MobileHeader />
      <motion.div
        className="w-full m-0 p-0 bg-[#f9fafb] min-h-screen"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Error Display */}
        {(error || avatarError || coverError) && (
          <div className="p-3 bg-[#fee] text-[#c00] rounded-lg mb-4">
            {error || avatarError || coverError}
          </div>
        )}

        {/* Cover Image */}
        {renderCoverImage()}

        {/* Profile Card */}
        <div className="bg-transparent p-0 relative max-w-[1200px] mx-auto">
          {/* Avatar and Header */}
          <div className="flex items-end justify-between px-10 pb-8 mt-[-50px] relative z-10 md:px-6 md:pb-8 md:flex-col md:items-start md:w-full md:gap-5 sm:px-4 sm:pb-6 sm:mt-[-40px]">
            <div className="w-full flex justify-between items-end min-w-0 md:flex-col md:items-start md:w-full md:gap-5">
              <div className="flex flex-col items-start gap-4 md:items-start">
                {renderAvatar()}
                <div className="flex flex-col gap-1.5 min-w-0 md:items-start">
                  <h1 className="text-[28px] font-bold text-[#1a1a1a] m-0 leading-[1.2] font-serif md:text-[22px] sm:text-[20px]">
                    {editableUser.name || editableUser.username || 'N/A'}
                  </h1>
                  <p className="text-[15px] text-gray-500 m-[0_0_8px_0] leading-[1.4] sm:text-[14px]">
                    {editableUser.email}
                  </p>
                  <span className="inline-block px-4 py-[6px] bg-[#d1d5db] text-[#1f2937] rounded-[20px] text-xs font-medium capitalize w-fit">
                    {editableUser.role}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <ProfileUpdateForm
            editableUser={editableUser}
            interestsString={interestsInput}
            isUploading={isUploading}
            memberSince={formattedMemberSince}
            onFieldChange={handleGenericChange}
            onInterestsChange={handleInterestsChange}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
        <ProfileImageDialog
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          imageUrl={avatarSrc || null}
          userName={editableUser.name || editableUser.username || 'User'}
          userId={user.user_id!}
          onImageUpdated={handleImageUpdated}
        />
        <AnimatePresence>
          {isImageEditorOpen && (
            <ImageEditorDialog
              isOpen={isImageEditorOpen}
              onClose={() => setIsImageEditorOpen(false)}
              imageSrc={editorImageSrc}
              onSave={handleEditorSave}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
