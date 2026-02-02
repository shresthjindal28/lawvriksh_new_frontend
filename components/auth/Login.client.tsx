'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LoginForm from './LoginForm.client';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/api/authService';
import OTPForm from './OTPForm.client';
import { useAuth } from '@/lib/contexts/AuthContext';
import PasswordSetupForm from './PasswordSetupForm.client';
import { MotionImage } from '../ui/Image';
import { containerVariants, formVariants, itemVariants } from '@/lib/constants/animation-variants';

type PageMode = 'login' | 'otp-verify' | 'social-confirm' | 'reset-password' | '2fa';

const LoginClientPage = () => {
  const { login, forgotPassword, isLoading, resetPassword, verify2FA } = useAuth();
  const [mode, setMode] = useState<PageMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [displayMessage, setDisplayMessage] = useState('');
  const [socialProvider, setSocialProvider] = useState<'google' | 'linkedin' | null>(null);
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleForgotPassword = async () => {
    setError('');
    setDisplayMessage('');
    try {
      if (!email) {
        setError('Please enter your email address');
        return;
      }
      const response = await forgotPassword({ email });
      if (response.success) {
        setDisplayMessage('OTP sent successfully');
        setMode('otp-verify');
      } else if (!response.success) {
        setError(response.message || 'An error occurred while sending reset password email');
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message || 'An error occurred while sending reset password email');
      } else {
        setError('An error occurred while sending reset password email');
      }
    }
  };

  const validatePassword = (password: string) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,12}$/;

    if (passwordRegex.test(password)) {
      setError('');
      return true;
    } else {
      setError(
        'Password must be 8-12 characters and include an uppercase, lowercase, number, and symbol.'
      );
      return false;
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    validatePassword(value);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      const response = await login({
        request: {
          email,
          password,
          remember_me: rememberMe,
        },
      });
      if (response.success && response.data?.requires_2fa) {
        setDisplayMessage('Please enter the OTP sent to your email');
        setMode('2fa');
      } else if (response.success && response.data?.user.role === 'user') {
        router.push('/profile-completion');
      } else if (response.success && !response.data?.requires_2fa) {
        router.push('/dashboard');
      } else {
        setError('Login failed. Please try again.');
      }
    } catch (error) {
      setIsDialogOpen(true);
      if (error instanceof Error) {
        setError(error.message || 'Login failed. Please try again.');
      } else {
        setError('Login failed. Please try again.');
      }
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'linkedin') => {
    setSocialProvider(provider);

    if (provider === 'google') {
      try {
        const { data } = await authService.getGoogleAuthUrl();
        if (!data?.auth_url) {
          setError('Failed to get Google auth URL');
          return;
        }
        window.location.href = data.auth_url;
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message || 'Failed to initiate Google login');
        } else {
          setError('Failed to initiate Google login');
        }
      }
    } else {
      // LinkedIn implementation would go here
      setError('LinkedIn login not implemented yet');
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    setOtp((prevOtp) => {
      const newOtp = [...prevOtp];
      newOtp[index] = value;
      return newOtp;
    });
  };

  const handleResendOTP = async () => {
    try {
      setError('');
      setOtp(['', '', '', '', '', '']);
      setDisplayMessage('');

      if (mode === '2fa') {
        const response = await login({
          request: {
            email,
            password,
            remember_me: rememberMe,
          },
        });
        if (response.success && response.data?.requires_2fa) {
          setDisplayMessage('OTP has been sent');
          setMode('2fa');
          return;
        }
      }

      const response = await forgotPassword({ email });
      if (response.success) {
        setDisplayMessage('OTP sent successfully');
        setMode('otp-verify');
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message || 'An error occurred while sending OTP');
      } else {
        setError('An error occurred while sending OTP');
      }
    }
  };

  const handleTakeOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setDisplayMessage('');
      const fullOtp = otp.join('');
      if (fullOtp.length !== 6) {
        setError('Please enter the complete 6-digit OTP.');
        return;
      }

      if (!fullOtp) {
        setError('Please enter the complete 6-digit OTP.');
        return;
      }

      if (mode === '2fa') {
        const response = await verify2FA({ email, otp: fullOtp });
        if (response.success) {
          router.push('/dashboard');
          return;
        }
      }
      setMode('reset-password');
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message || 'An error occurred while verifying OTP');
      } else {
        setError('An error occurred while verifying OTP');
      }
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setDisplayMessage('');
      const fullOtp = otp.join('');
      if (fullOtp.length !== 6) {
        setError('Please enter the complete 6-digit OTP.');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      if (!validatePassword(password)) {
        return;
      }
      const response = await resetPassword({
        email,
        otp: fullOtp,
        new_password: password,
      });
      if (response.success) {
        setDisplayMessage('Password reset successfully');
        setMode('login');
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message || 'An error occurred while resetting password');
      } else {
        setError('An error occurred while resetting password');
      }
    }
  };

  const renderCurrentForm = () => {
    switch (mode) {
      case 'login':
        return (
          <LoginForm
            email={email}
            password={password}
            rememberMe={rememberMe}
            error={error}
            displayMessage={displayMessage}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onRememberMeChange={setRememberMe}
            onSubmit={handleLogin}
            onSocialLogin={handleSocialLogin}
            onSwitchToSignup={() => router.push('/register')}
            onForgotPassword={handleForgotPassword}
            isLoading={isLoading}
          />
        );
      case 'otp-verify':
        return (
          <OTPForm
            title="Reset Password"
            subtitle="Please Enter the OTP sent to your email"
            email={email}
            otp={otp}
            error={error}
            showEmail={true}
            buttonText="Reset Password"
            onOtpChange={handleOtpChange}
            onSubmit={handleTakeOTP}
            onResendOTP={handleResendOTP}
            isloading={isLoading}
            displayMessage={displayMessage}
          />
        );
      case 'reset-password':
        return (
          <PasswordSetupForm
            password={password}
            error={error}
            onPasswordChange={handlePasswordChange}
            onSubmit={handleResetPassword}
            confirmPassword={confirmPassword}
            onConfirmPasswordChange={setConfirmPassword}
            isloading={isLoading}
            displayMessage={displayMessage}
            buttonText="Reset Password"
          />
        );
      case '2fa':
        return (
          <OTPForm
            title="2FA Verification"
            subtitle="Please enter the OTP sent to your email"
            otp={otp}
            error={error}
            showEmail={true}
            buttonText="Verify OTP"
            onOtpChange={handleOtpChange}
            onSubmit={handleTakeOTP}
            onResendOTP={handleResendOTP}
            isloading={isLoading}
            displayMessage={displayMessage}
          />
        );
      default:
        return null;
    }
  };

  // Determine which group the current mode belongs to
  const isAuthGroup = ['login', 'signup', 'otp-verify', 'social-confirm', 'set-password'].includes(
    mode
  );
  const isSetupGroup = ['user-setup', 'interests', 'profession'].includes(mode);

  return (
    <>
      <motion.div
        className={`min-h-[100dvh] w-full relative 
          bg-[url('/assets/images/background-image/backgroundImage.png')] bg-cover bg-center bg-fixed bg-no-repeat
          flex flex-col items-center justify-start pt-20 pb-8 px-4 sm:pt-24 sm:pb-10 sm:px-8
          lg:bg-none lg:flex-row lg:h-screen lg:overflow-hidden lg:p-0 lg:justify-center lg:items-center
          ${isAuthGroup ? '' : ''} ${isSetupGroup ? '' : ''}`}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Left Image Section - Desktop Only */}
        <AnimatePresence>
          <motion.div
            className="hidden lg:block relative w-1/2 h-full bg-[#f7f3ed] p-4 shrink-0 overflow-hidden"
            variants={itemVariants}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <MotionImage
              className="w-full h-full object-cover rounded-xl"
              src="/assets/images/background-image/backgroundImage.png"
              alt="Lawvriksh Tree"
              width={900}
              height={900}
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
            {/* Gradient Overlay */}
            <div className="absolute bottom-4 left-4 right-4 h-40 bg-gradient-to-b from-transparent to-black/80 rounded-b-xl pointer-events-none" />
            
            <motion.div
              className="absolute bottom-20 left-20 text-white max-w-sm z-10"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
            >
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="font-['NyghtSerif-LightItalic'] text-4xl mb-4 leading-tight font-normal"
              >
                For your rightful place in the creator economy.
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="text-sm opacity-90 leading-relaxed font-sans"
              >
                Your peers are about to start producing high-value content in minutes, not days. Don't
                get left behind.
              </motion.p>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Right Form Section */}
        <motion.div
          className={`w-full lg:w-1/2 flex items-start lg:items-center justify-center p-0 lg:p-8 shrink-0 h-full overflow-y-auto lg:overflow-visible
            ${isAuthGroup ? '' : ''} ${isSetupGroup ? '' : ''}`}
          variants={itemVariants}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <motion.div
            className={`w-full max-w-[400px] lg:max-w-[480px] relative flex flex-col justify-center 
              bg-white/95 backdrop-blur-xl p-6 sm:p-8 rounded-2xl shadow-2xl lg:shadow-none lg:bg-transparent lg:backdrop-blur-none lg:p-0
              ${isAuthGroup ? '' : ''} ${isSetupGroup ? '' : ''}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
             {/* Desktop Title shown in form section */}


            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                className="flex-1 flex flex-col justify-center py-8"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                {renderCurrentForm()}

                

                {/* Social Buttons */}
                {/* <div className="flex gap-4 justify-between mt-4 w-[80%] mx-auto">
                    <button 
                        onClick={() => handleSocialLogin('google')}
                        className="flex items-center justify-center gap-2 h-[50px] px-4 py-3 rounded border border-[#dadce0] bg-white text-[#757575] text-sm font-medium cursor-pointer transition-all flex-1 hover:bg-[#f8f9fa]"
                    >
                        <svg width="18" height="18" viewBox="0 0 18 18">
                            <path d="M17.64 9.2c0-.637-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
                            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.715H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
                            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.272C4.672 5.141 6.656 3.58 9 3.58z" fill="#EA4335" />
                        </svg>
                        Google
                    </button>
                    <button 
                         onClick={() => handleSocialLogin('linkedin')}
                         className="flex items-center justify-center gap-2 h-[50px] px-4 py-3 rounded border-none bg-[#0077b5] text-white text-sm font-medium cursor-pointer transition-all flex-1 hover:bg-[#005885]"
                    >
                         <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                        </svg>
                        LinkedIn
                    </button>
                </div> */}

               

              </motion.div>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </motion.div>
    </>
  );
};

export default LoginClientPage;
