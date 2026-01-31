'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import ProgressBar from '../ui/ProgressBar';
import { containerVariants, formVariants, itemVariants } from '@/lib/constants/animation-variants';
import UserSetupForm from '../auth/UserSetupForm.client';
import ProfessionForm from '../auth/ProfessionForm.client';
import { useAuth } from '@/lib/contexts/AuthContext';
import { dmsImageService } from '@/lib/api/imageService';

type PageMode = 'user-setup' | 'profession';

const ProfileCompletionClient = () => {
  const { isLoading, UserSetup } = useAuth();
  const [mode, setMode] = useState<PageMode>('user-setup');
  const [name, setName] = useState('');
  const [selectedProfession, setSelectedProfession] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Profile Image State
  const [showDpSetup, setShowDpSetup] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string>('');

  const router = useRouter();

  const handleUserSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      if (!name.trim()) {
        setError('Please enter your name.');
        return;
      }

      if (showDpSetup && profileImage) {
        setLoading(true);
        // Using uploadImage with type 'profile_image' which internally calls uploadProfileImage
        const response = await dmsImageService.uploadImage({
          userId: 'temp', // userId is not needed for profile_image type as per service implementation but required by interface
          file: profileImage,
          imageType: 'profile_image',
        });

        if (response.success && response.data) {
          setProfileImageUrl(response.data.permanent_url);
        } else {
          setError(response.message || 'Failed to upload profile image');
          setLoading(false);
          return;
        }
        setLoading(false);
      }

      setMode('profession');
    } catch (error: any) {
      setError(error.message || 'Failed to save name');
      setLoading(false);
    }
  };

  const handleProfession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);

      const response = await UserSetup({
        name: name,
        interests: [],
        role: selectedProfession || 'student',
        picture: profileImageUrl || undefined,
      });
      if (response.success) {
        router.push('/dashboard');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to save the profile');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (mode === 'user-setup') {
      router.push('/dashboard');
    } else if (mode === 'profession') {
      setMode('user-setup');
    }
  };

  const getProgress = () => {
    switch (mode) {
      case 'user-setup':
        return 50;
      case 'profession':
        return 100;
      default:
        return 0;
    }
  };

  const showProgressBar = mode === 'user-setup' || mode === 'profession';
  const showFullBackground = mode === 'user-setup' || mode === 'profession';

  const renderCurrentForm = () => {
    switch (mode) {
      case 'user-setup':
        return (
          <UserSetupForm
            name={name}
            error={error}
            onNameChange={setName}
            onSubmit={handleUserSetup}
            onBack={handleBack}
            showDpSetup={showDpSetup}
            onShowDpSetupChange={setShowDpSetup}
            profileImage={profileImage}
            onProfileImageChange={setProfileImage}
            isLoading={loading}
          />
        );
      case 'profession':
        return (
          <ProfessionForm
            selectedProfession={selectedProfession}
            error={error}
            onProfessionChange={setSelectedProfession}
            onSubmit={handleProfession}
            onBack={handleBack}
            isLoading={isLoading}
          />
        );
      default:
        return null;
    }
  };

  const isSetupGroup = ['user-setup', 'profession'].includes(mode);

  return (
    <motion.div
      className={`loginPage ${showFullBackground ? 'fullBackground' : ''} ${
        isSetupGroup ? 'setupGroup' : ''
      }`}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <AnimatePresence>
        {!showFullBackground && (
          <motion.div
            className="imageSection"
            variants={itemVariants}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <motion.img
              src="/assets/images/background-image/backgroundImage.png"
              alt="Lawvriksh Tree"
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
            <motion.div
              className="imageText"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
            >
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                For your rightful place in the creator economy.
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="imageTextBottom"
              >
                Your peers are about to start producing high-value content in minutes, not days.
                Don't get left behind.
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        className={`formSection ${showFullBackground ? 'fullWidth' : ''} ${
          isSetupGroup ? 'setupFormSection' : ''
        }`}
        variants={itemVariants}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <motion.div
          className={`formContainer ${isSetupGroup ? 'setupFormContainer' : ''}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              className="loginForm"
              variants={formVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              {renderCurrentForm()}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default ProfileCompletionClient;
