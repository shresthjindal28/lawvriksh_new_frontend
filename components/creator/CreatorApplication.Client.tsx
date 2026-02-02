'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import ProgressBar from '../ui/ProgressBar';
import CreatorApplicationForm from './CreatorApplicationForm';
import { creatorService } from '@/lib/api/creatorService';
import { containerVariants, formVariants, itemVariants } from '@/lib/constants/animation-variants';
import '@/styles/auth-styles/base.auth.css';
import '@/styles/auth-styles/mobile.auth.css';
import '@/styles/auth-styles/layout.auth.css';
import '@/styles/auth-styles/setup-group.auth.css';
import '@/styles/auth-styles/auth-group.auth.css';
import '@/styles/auth-styles/group-specific.auth.css';
type PageMode = 'education' | 'practise-area' | 'year-of-passing';

const CreatorApplication = () => {
  const [mode, setMode] = useState<PageMode>('education');
  const [eligible, setEligible] = useState(true);
  const [displayMessage, setDisplayMessage] = useState('');
  const [creatorApplicationDetails, setCreatorApplicationDetails] = useState({
    education: '',
    practiseArea: '',
    yearOfPassing: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const response = await creatorService.eligibleForCreator();

        if (response.success && response.data) {
          setEligible(response.data.eligible);
          if (response.data.eligible === false) {
            setError('You are not eligible to be a creator, Please Update the Profile.');
          }
        } else {
          setError(response.message || 'Could not verify eligibility.');
        }
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message || 'An error occurred while checking your eligibility.');
        } else {
          setError('An error occurred while checking your eligibility.');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getProgress = () => {
    switch (mode) {
      case 'education':
        return 25;
      case 'practise-area':
        return 50;
      case 'year-of-passing':
        return 100;
      default:
        return 0;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    console.log(`Field: ${id}, Value: ${value}`);
    setCreatorApplicationDetails((prev) => ({
      ...prev,
      [id]: value,
    }));
    setError('');
  };

  const handleBack = () => {
    setError('');
    if (mode === 'education') {
      router.push('/dashboard');
    } else if (mode === 'practise-area') {
      setMode('education');
    } else if (mode === 'year-of-passing') {
      setMode('practise-area');
    }
  };

  const handleEducation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!creatorApplicationDetails.education) {
      setError('Please enter your education');
      return;
    }
    setMode('practise-area');
    setError('');
  };

  const handlePractiseArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!creatorApplicationDetails.practiseArea) {
      setError('Please enter your practise area');
      return;
    }
    setMode('year-of-passing');
    setError('');
  };

  const handleApplicationFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      if (
        !creatorApplicationDetails.education ||
        !creatorApplicationDetails.practiseArea ||
        !creatorApplicationDetails.yearOfPassing
      ) {
        setError('Please fill all the fields');
        return;
      }
      const response = await creatorService.applyForCreator({
        education: creatorApplicationDetails.education,
        practise_area: creatorApplicationDetails.practiseArea,
        year_of_passing: Number(creatorApplicationDetails.yearOfPassing),
      });
      if (response.success) {
        router.push('/dashboard/user/applications');
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message || 'Something went wrong, Please Try Again');
      } else {
        setError('Something went wrong, Please Try Again');
      }
    } finally {
      setLoading(false);
    }
  };

  const showProgressBar =
    mode === 'education' || mode === 'practise-area' || mode === 'year-of-passing';
  const showFullBackground =
    mode === 'education' || mode === 'practise-area' || mode === 'year-of-passing';

  const renderCurrentForm = () => {
    switch (mode) {
      case 'education':
        return (
          <CreatorApplicationForm
            title="Education"
            fieldName="education"
            feild={creatorApplicationDetails.education}
            error={error}
            onChange={handleChange}
            onSubmit={handleEducation}
            onBack={handleBack}
            eligible={eligible}
            displayMessage={displayMessage}
            buttonText="Next"
          />
        );
      case 'practise-area':
        return (
          <CreatorApplicationForm
            title="Practise Area"
            fieldName="practiseArea"
            feild={creatorApplicationDetails.practiseArea}
            error={error}
            onChange={handleChange}
            onSubmit={handlePractiseArea}
            onBack={handleBack}
            eligible={eligible}
            displayMessage={displayMessage}
            buttonText="Next"
          />
        );
      case 'year-of-passing':
        return (
          <CreatorApplicationForm
            title="Year of Passing"
            fieldName="yearOfPassing"
            feild={creatorApplicationDetails.yearOfPassing}
            error={error}
            onChange={handleChange}
            onSubmit={handleApplicationFormSubmit}
            onBack={handleBack}
            eligible={eligible}
            displayMessage={displayMessage}
            buttonText="Submit"
          />
        );
      default:
        return null;
    }
  };

  const isSetupGroup = ['education', 'practise-area', 'year-of-passing'].includes(mode);

  return (
    <motion.div
      className={`loginPage ${showFullBackground ? 'fullBackground' : ''} ${isSetupGroup ? 'setupGroup' : ''}`}
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
        className={`formSection ${showFullBackground ? 'fullWidth' : ''} ${isSetupGroup ? 'setupFormSection' : ''}`}
        variants={itemVariants}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <motion.div
          className={`formContainer ${isSetupGroup ? 'setupFormContainer' : ''}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <ProgressBar
            progress={getProgress()}
            isVisible={showProgressBar}
            className="creatorApplication"
          />
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

export default CreatorApplication;
