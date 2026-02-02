'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface UserSetupFormProps {
  name: string;
  error: string;
  onNameChange: (name: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  showDpSetup: boolean;
  onShowDpSetupChange: (show: boolean) => void;
  profileImage: File | null;
  onProfileImageChange: (file: File | null) => void;
  isLoading?: boolean;
}

const UserSetupForm = ({
  name,
  error,
  onNameChange,
  onSubmit,
  onBack,
  showDpSetup,
  onShowDpSetupChange,
  profileImage,
  onProfileImageChange,
  isLoading = false,
}: UserSetupFormProps) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onProfileImageChange(e.target.files[0]);
    }
  };

  return (
    <>
      <motion.h2
        className="font-serif text-[clamp(2.5rem,4vh,3.5rem)] font-light mb-4 mt-0 text-black text-center leading-tight md:text-[3rem]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        What should we call you?
      </motion.h2>
      <motion.p
        className="text-center text-[#666] mb-8 text-sm sm:text-base font-sans max-w-[80%] mx-auto leading-relaxed md:text-[0.9rem] md:mb-12"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        This is the last step, we promise! Let us know what name to use on your new profile.
      </motion.p>

      <motion.form
        onSubmit={onSubmit}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full"
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
          className="w-full max-w-[600px] mx-auto mb-16 md:mb-12 md:w-full"
          initial={{ opacity: 0, x: -20, height: 0 }}
          animate={{ opacity: 1, x: 0, height: 'auto' }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <motion.input
            type="text"
            id="name"
            placeholder="Enter your Name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            required
            whileFocus={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
            className="w-full text-lg border-none rounded-[25px] bg-[#f8f9fa] text-[#333] font-light min-h-[60px] px-6 focus:bg-white focus:outline-none focus:ring-4 focus:ring-black/10 transition-all placeholder:text-[#999] block font-sans md:w-[600px] md:mx-auto sm:w-[300px]"
          />
        </motion.div>

        <motion.div
          className="w-full max-w-[600px] mx-auto mt-5 text-center"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <label className="inline-flex items-center cursor-pointer gap-2.5">
            <input
              type="checkbox"
              checked={showDpSetup}
              onChange={(e) => onShowDpSetupChange(e.target.checked)}
              className="w-auto mr-2 accent-black"
            />
            <span className="text-sm text-gray-600">
              Do you want to setup your DP?
            </span>
          </label>
        </motion.div>

        {showDpSetup && (
          <motion.div
            className="w-full max-w-[600px] mx-auto mt-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-5 text-center bg-gray-50">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="profile-image-upload"
              />
              <label
                htmlFor="profile-image-upload"
                className="cursor-pointer text-blue-600 text-sm block hover:underline"
              >
                {profileImage ? profileImage.name : 'Click to upload profile picture'}
              </label>
              {profileImage && (
                <div className="mt-2.5">
                  <Image
                    src={URL.createObjectURL(profileImage)}
                    alt="Preview"
                    width={60}
                    height={60}
                    unoptimized
                    className="rounded-full object-cover mx-auto"
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}

        <motion.div 
            className="absolute bottom-20 right-8 flex justify-end items-end gap-2.5 
            md:static md:mt-12 md:w-full md:px-8 md:justify-end sm:static sm:mt-12 sm:px-4 sm:justify-end"
        >
          <motion.button
            type="button"
            className="min-w-[100px] px-6 py-3 text-sm flex items-center justify-center bg-transparent text-black border border-black rounded-[5px] font-sans font-light cursor-pointer transition-all hover:bg-[#e9ecef] hover:-translate-y-px hover:shadow-sm"
            onClick={onBack}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Back
          </motion.button>
          <motion.button
            type="submit"
            className="min-w-[100px] h-[42px] px-2.5 text-sm flex items-center justify-center bg-black text-white border-none rounded-[5px] font-sans font-light cursor-pointer transition-all hover:bg-[#333] hover:-translate-y-px hover:shadow-sm disabled:cursor-not-allowed disabled:bg-[#464545]"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Next'}
          </motion.button>
        </motion.div>
      </motion.form>
    </>
  );
};

export default UserSetupForm;
