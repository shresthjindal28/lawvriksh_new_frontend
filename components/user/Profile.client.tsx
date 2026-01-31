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
    <div className="profile-cover-wrapper">
      <div className="profile-cover">
        <Image
          src={editableUser.cover_image || DEFAULT_COVER}
          alt="Cover"
          fill
          className="cover-image"
        />
      </div>
    </div>
  );

  const renderAvatar = () => (
    <div className="profile-avatar-wrapper" style={{ position: 'relative' }}>
      <div
        className={`profile-avatar ${isUploading ? 'uploading' : ''}`}
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
          className="avatar-image"
          unoptimized
        />
        {isEditing && (
          <div className="avatar-overlay">
            {isUploadingAvatar ? (
              <div className="upload-spinner">
                <div className="spinner"></div>
                <span style={{ fontSize: '12px', marginTop: '4px' }}>
                  {Math.round(avatarProgress)}%
                </span>
              </div>
            ) : (
              <div className="upload-icon">
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
            className="profile-image-dropdown"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 100,
            }}
          >
            <div className="dropdown-header">
              <div className="dropdown-avatar-preview">
                <Image
                  src={avatarSrc}
                  alt="Preview"
                  width={160}
                  height={160}
                  className="preview-image"
                  unoptimized
                />
              </div>
              <div className="dropdown-user-info">
                <span className="dropdown-user-name">
                  {editableUser.name || editableUser.username}
                </span>
                <span className="dropdown-user-role">{editableUser.role}</span>
              </div>
            </div>
            <div className="dropdown-divider" />
            <div className="dropdown-actions-list">
              <button
                className="dropdown-action-item"
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
                className="dropdown-action-item"
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
                className="dropdown-action-item text-red-600"
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
        className="profile-container-new"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Error Display */}
        {(error || avatarError || coverError) && (
          <div
            className="error-banner"
            style={{
              padding: '12px',
              backgroundColor: '#fee',
              color: '#c00',
              borderRadius: '8px',
              marginBottom: '16px',
            }}
          >
            {error || avatarError || coverError}
          </div>
        )}

        {/* Cover Image */}
        {renderCoverImage()}

        {/* Profile Card */}
        <div className="profile-card">
          {/* Avatar and Header */}
          <div className="profile-header-section">
            <div className="profile-info-wrapper">
              <div className="profile-avatar-name-group">
                {renderAvatar()}
                <div className="profile-name-section">
                  <h1 className="profile-name">
                    {editableUser.name || editableUser.username || 'N/A'}
                  </h1>
                  <p className="profile-email">{editableUser.email}</p>
                  <span className="profile-role-badge">{editableUser.role}</span>
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
