'use client';
import { motion } from 'framer-motion';
import { useRef } from 'react';

interface OTPFormProps {
  title: string;
  subtitle: string;
  email?: string;
  otp: string[];
  error: string;
  showEmail?: boolean;
  buttonText: string;
  onOtpChange: (index: number, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onResendOTP: (e: React.FormEvent) => void;
  isloading: boolean;
  displayMessage?: string;
}

const OTPForm = ({
  title,
  subtitle,
  email,
  otp,
  error,
  showEmail = false,
  buttonText,
  onOtpChange,
  onSubmit,
  onResendOTP,
  isloading,
  displayMessage,
}: OTPFormProps) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpChange = (index: number, value: string) => {
    // Handle pasting multiple digits
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6);
      if (digits.length > 0) {
        for (let i = 0; i < 6; i++) {
          onOtpChange(i, digits[i] || '');
        }
        // Focus on the next empty field or the last field
        const nextIndex = Math.min(digits.length, 5);
        inputRefs.current[nextIndex]?.focus();
      }
      return;
    }

    // Handle single digit input
    if (!/^[0-9]?$/.test(value)) return;

    // Call the parent's onOtpChange
    onOtpChange(index, value);

    // Handle auto-focus to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);

    if (digits.length > 0) {
      // Update all OTP fields with pasted digits
      for (let i = 0; i < 6; i++) {
        onOtpChange(i, digits[i] || '');
      }
      // Focus on the next empty field or the last field
      const nextIndex = Math.min(digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <>
      <motion.h2
        className="font-['NyghtSerif-LightItalic'] text-[3rem] md:text-[3.5rem] font-light mb-4 text-center leading-tight text-black"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {title}
      </motion.h2>
      <motion.p
        className="text-center text-[#666] mb-8 text-sm sm:text-base font-serif max-w-[80%] mx-auto leading-relaxed font-['NyghtSerif-LightItalic']"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {subtitle}
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

        {showEmail && email && (
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
              type="email"
              id="email"
              value={email}
              disabled
              whileFocus={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="w-full p-3 sm:p-4 border-none rounded bg-[#f8f9fa] text-black text-sm font-sans placeholder:text-[#bbb] placeholder:opacity-70 disabled:bg-[#f0f0f0] disabled:text-[#666]"
            />
          </motion.div>
        )}

        <motion.div
          className="mb-6 text-center w-[80%] mx-auto"
          initial={{ opacity: 0, x: -20, height: 0 }}
          animate={{ opacity: 1, x: 0, height: 'auto' }}
          exit={{ opacity: 0, x: -20, height: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <label className="block mb-2 font-medium text-black text-sm text-left font-sans">OTP</label>
          <div className="flex justify-between gap-2">
            {otp.map((digit, index) => (
              <motion.input
                key={index}
                ref={(el: HTMLInputElement | null) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                required
                whileFocus={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
                className="w-12 h-12 sm:w-14 sm:h-14 text-center text-xl border-none rounded bg-[#f8f9fa] text-black font-sans focus:outline-2 focus:outline-black/20"
              />
            ))}
          </div>
        </motion.div>

        <motion.div
          className="w-[80%] text-right mb-6 mx-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <motion.button
            type="button"
            onClick={onResendOTP}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-none border-none text-black no-underline text-sm font-medium cursor-pointer transition-colors duration-300 hover:text-[#333] hover:underline"
          >
            Resend PassCode
          </motion.button>
        </motion.div>

        <motion.button
          type="submit"
          className={`w-[80%] p-3 sm:p-4 border-none rounded bg-black text-white text-sm sm:text-base font-light tracking-wide cursor-pointer transition-all duration-300 hover:bg-[#333] hover:-translate-y-px hover:shadow-lg font-serif
            ${isloading ? 'bg-[#464545] cursor-not-allowed' : ''}
          `}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          disabled={isloading}
        >
          {buttonText}
        </motion.button>
      </motion.form>
    </>
  );
};

export default OTPForm;
