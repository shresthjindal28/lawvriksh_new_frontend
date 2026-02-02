'use client';
import { motion } from 'framer-motion';

interface SignupFormProps {
  email: string;
  error: string;
  onEmailChange: (email: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onSocialLogin: (provider: 'google' | 'linkedin') => void;
  onSwitchToLogin: () => void;
  isloading: boolean;
  isDisabled: boolean;
}

const SignupForm = ({
  email,
  error,
  onEmailChange,
  onSubmit,
  onSocialLogin,
  onSwitchToLogin,
  isloading,
  isDisabled,
}: SignupFormProps) => {
  return (
    <>
      <motion.h2
        className="font-['NyghtSerif-LightItalic'] text-[3rem] md:text-[3.5rem] font-light mb-4 text-center leading-tight text-black"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Glad to have you!
      </motion.h2>
      <motion.p
        className="text-center text-[#666] mb-8 text-sm sm:text-base font-serif max-w-[80%] mx-auto leading-relaxed font-['NyghtSerif-LightItalic']"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        To access your account, please enter your email and we will send you OTP for verification
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

        <motion.div
          className="mb-6 text-center w-[80%] mx-auto"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <label htmlFor="email" className="block mb-2 font-medium text-black text-sm text-left font-sans">
            Email
          </label>
          <motion.input
            type="text"
            id="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            required
            whileFocus={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
            className="w-full p-3 sm:p-4 border-none rounded bg-[#f8f9fa] text-black text-sm font-sans placeholder:text-[#bbb] placeholder:opacity-70 disabled:bg-[#f0f0f0] disabled:text-[#666] focus:outline-2 focus:outline-black/20"
          />
        </motion.div>

        <motion.button
          type="submit"
          className={`w-[80%] p-3 sm:p-4 border-none rounded bg-black text-white text-sm sm:text-base font-light tracking-wide cursor-pointer transition-all duration-300 hover:bg-[#333] hover:-translate-y-px hover:shadow-lg font-serif
            ${isloading || isDisabled ? 'bg-[#464545] cursor-not-allowed' : ''}
          `}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          disabled={isloading || isDisabled}
        >
          Next
        </motion.button>
      </motion.form>

      <motion.div
        className="mt-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <p className="text-sm text-[#666] m-0">
          Already have an account?{' '}
          <motion.button
            type="button"
            className="bg-none border-none text-black font-medium cursor-pointer underline hover:text-[#333] text-sm"
            onClick={onSwitchToLogin}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Log in
          </motion.button>
        </p>
      </motion.div>
    </>
  );
};

export default SignupForm;
