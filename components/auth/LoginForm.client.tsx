'use client';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface LoginFormProps {
  email: string;
  password: string;
  rememberMe: boolean;
  error: string;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onRememberMeChange: (checked: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onSocialLogin: (provider: 'google' | 'linkedin') => void;
  onSwitchToSignup: () => void;
  onForgotPassword: () => void;
  isLoading: boolean;
  displayMessage?: string;
}

const LoginForm = ({
  email,
  password,
  rememberMe,
  error,
  onEmailChange,
  onPasswordChange,
  onRememberMeChange,
  onSubmit,
  onSocialLogin,
  onSwitchToSignup,
  onForgotPassword,
  isLoading,
  displayMessage,
}: LoginFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <>
      <motion.h2
        className="font-['NyghtSerif-LightItalic'] text-[3rem] md:text-[3.5rem] font-light mb-4 text-center leading-tight text-black"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Welcome Back!
      </motion.h2>
      <motion.p
        className="text-center text-[#666] mb-8 text-sm sm:text-base font-serif max-w-[80%] mx-auto leading-relaxed font-['NyghtSerif-LightItalic']"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        To access your account, please enter your email and the password
      </motion.p>

      <motion.form
        onSubmit={onSubmit}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex flex-col items-center w-full"
      >
        {error && (
          <div className="w-full flex items-center justify-center">
            <motion.p
              className="w-[350px] text-[#d32f2f] bg-[#ffcdd2] p-3 rounded-lg mb-4 text-center border border-[#d32f2f]"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </motion.p>
          </div>
        )}
        {displayMessage && (
          <div className="w-full flex items-center justify-center">
            <motion.p
              className="w-[350px] text-[#2e7d32] bg-[#c8e6c9] p-3 rounded-lg mb-4 text-center border border-[#2e7d32]"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              {displayMessage}
            </motion.p>
          </div>
        )}

        <motion.div
          className="mb-6 text-center w-[80%] mx-auto"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <label
            htmlFor="email"
            className="block mb-2 font-medium text-black text-sm text-left font-sans"
          >
            Email
          </label>
          <motion.input
            type="email"
            id="email"
            placeholder="Enter your registered email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            required
            whileFocus={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
            className="w-full p-3 sm:p-4 border-none rounded bg-[#f8f9fa] text-black text-sm font-sans placeholder:text-[#bbb] placeholder:opacity-70 disabled:bg-[#f0f0f0] disabled:text-[#666] focus:outline-2 focus:outline-black/20"
          />
        </motion.div>

        <motion.div
          className="mb-6 text-center w-[80%] mx-auto"
          initial={{ opacity: 0, x: -20, height: 0 }}
          animate={{ opacity: 1, x: 0, height: 'auto' }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <label
            htmlFor="password"
            className="block mb-2 font-medium text-black text-sm text-left font-sans"
          >
            Password
          </label>
          <div className="relative flex items-center">
            <motion.input
              type={showPassword ? 'text' : 'password'}
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              whileFocus={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="w-full p-3 sm:p-4 pr-12 border-none rounded bg-[#f8f9fa] text-black text-sm font-sans placeholder:text-[#bbb] placeholder:opacity-70 disabled:bg-[#f0f0f0] disabled:text-[#666] focus:outline-2 focus:outline-black/20"
            />
            <motion.button
              type="button"
              className="absolute right-3 bg-none border-none cursor-pointer text-[#666] p-1 flex items-center justify-center hover:text-black touch-manipulation"
              onClick={() => setShowPassword(!showPassword)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {showPassword ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          className="flex justify-between items-center w-[80%] mx-auto mb-8 text-sm font-sans"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <label className="flex items-center gap-2 cursor-pointer">
            <motion.input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => onRememberMeChange(e.target.checked)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="accent-black"
            />
            Remember me
          </label>
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onForgotPassword}
            className="bg-none border-none text-black no-underline text-sm font-medium cursor-pointer transition-colors duration-300 hover:text-[#333] hover:underline"
          >
            Forgot Password?
          </motion.button>
        </motion.div>

        <motion.button
          type="submit"
          className={`w-[80%] p-3 sm:p-4 border-none rounded bg-black text-white text-sm sm:text-base font-light tracking-wide cursor-pointer transition-all duration-300 hover:bg-[#333] hover:-translate-y-px hover:shadow-lg font-serif
            ${isLoading ? 'bg-[#464545] cursor-not-allowed' : ''}
          `}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          disabled={isLoading}
        >
          {isLoading ? 'Logging In...' : 'Log In'}
        </motion.button>
      </motion.form>
    </>
  );
};

export default LoginForm;
