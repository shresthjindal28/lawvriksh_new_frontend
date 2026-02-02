'use client';
import { motion } from 'framer-motion';
import { interests } from '@/lib/constants/user-setup';

interface InterestsFormProps {
  selectedInterests: string[];
  error: string;
  onToggleInterest: (interest: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}

const InterestsForm = ({
  selectedInterests,
  error,
  onToggleInterest,
  onSubmit,
  onBack,
}: InterestsFormProps) => {
  return (
    <>
      <motion.h2
         className="font-serif text-[clamp(1.5rem,4vh,2.5rem)] font-light mb-4 mt-0 text-black text-center leading-tight md:text-[3rem]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        What Piques Your Interest?
      </motion.h2>
      <motion.p
        className="text-center text-[#666] mb-8 text-sm sm:text-base font-sans max-w-[90%] mx-auto leading-relaxed md:text-[0.9rem] md:mb-12"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        Tap on up to three bubbles to tell us what you'd like to see. This will help us personalize
        your content from day one.
      </motion.p>

      <motion.div
        className="text-center font-sans text-sm text-[#666] mb-4 font-medium md:text-base md:mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {selectedInterests.length} of 3 selected
      </motion.div>

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
          className="flex flex-wrap flex-row justify-center items-center gap-3 my-4 w-full px-2 
          md:flex-col md:gap-6 md:my-8 md:max-w-[900px] md:mx-auto md:px-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {/* First row - 4 bubbles */}
          <div className="contents md:flex md:justify-center md:gap-5">
            {interests.slice(0, 4).map((interest, index) => {
              const isSelected = selectedInterests.includes(interest);
              const isDisabled = !isSelected && selectedInterests.length >= 3;

              return (
                <motion.button
                  key={interest}
                  type="button"
                  className={`
                    px-4 py-3 text-sm rounded-[20px] border-2 border-[#e9ecef] whitespace-nowrap cursor-pointer transition-all duration-300 font-medium text-center inline-flex items-center justify-center h-10 min-w-[5rem] max-w-[12rem] bg-white text-black font-serif
                    md:px-8 md:py-4 md:text-base md:rounded-[25px] md:border-none md:h-auto md:min-w-[140px] md:max-w-[180px]
                    hover:bg-[#e9ecef] hover:-translate-y-px 
                    ${isSelected ? '!bg-black !text-white !border-black shadow-none' : ''}
                    ${isDisabled ? '!opacity-50 !cursor-not-allowed !bg-[#f5f5f5] !text-[#999] hover:!transform-none hover:!bg-[#f5f5f5]' : ''}
                  `}
                  onClick={() => !isDisabled && onToggleInterest(interest)}
                  disabled={isDisabled}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                  whileHover={!isDisabled ? { scale: 1.05 } : {}}
                  whileTap={!isDisabled ? { scale: 0.95 } : {}}
                >
                  {interest}
                </motion.button>
              );
            })}
          </div>

          {/* Second row - 3 bubbles */}
          <div className="contents md:flex md:justify-center md:gap-4">
            {interests.slice(4, 7).map((interest, index) => {
              const isSelected = selectedInterests.includes(interest);
              const isDisabled = !isSelected && selectedInterests.length >= 3;

              return (
                <motion.button
                  key={interest}
                  type="button"
                   className={`
                    px-4 py-3 text-sm rounded-[20px] border-2 border-[#e9ecef] whitespace-nowrap cursor-pointer transition-all duration-300 font-medium text-center inline-flex items-center justify-center h-10 min-w-[5rem] max-w-[12rem] bg-white text-black font-serif
                    md:px-8 md:py-4 md:text-base md:rounded-[25px] md:border-none md:h-auto md:min-w-[120px] md:max-w-[160px]
                    hover:bg-[#e9ecef] hover:-translate-y-px 
                    ${isSelected ? '!bg-black !text-white !border-black shadow-none' : ''}
                    ${isDisabled ? '!opacity-50 !cursor-not-allowed !bg-[#f5f5f5] !text-[#999] hover:!transform-none hover:!bg-[#f5f5f5]' : ''}
                  `}
                  onClick={() => !isDisabled && onToggleInterest(interest)}
                  disabled={isDisabled}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.4 + (index + 4) * 0.1 }}
                  whileHover={!isDisabled ? { scale: 1.05 } : {}}
                  whileTap={!isDisabled ? { scale: 0.95 } : {}}
                >
                  {interest}
                </motion.button>
              );
            })}
          </div>

          {/* Third row - 3 bubbles */}
          <div className="contents md:flex md:justify-center md:gap-4">
            {interests.slice(7, 10).map((interest, index) => {
              const isSelected = selectedInterests.includes(interest);
              const isDisabled = !isSelected && selectedInterests.length >= 3;

              return (
                <motion.button
                  key={interest}
                  type="button"
                  className={`
                    px-4 py-3 text-sm rounded-[20px] border-2 border-[#e9ecef] whitespace-nowrap cursor-pointer transition-all duration-300 font-medium text-center inline-flex items-center justify-center h-10 min-w-[5rem] max-w-[12rem] bg-white text-black font-serif
                    md:px-8 md:py-4 md:text-base md:rounded-[25px] md:border-none md:h-auto md:min-w-[110px] md:max-w-[150px]
                    hover:bg-[#e9ecef] hover:-translate-y-px 
                    ${isSelected ? '!bg-black !text-white !border-black shadow-none' : ''}
                    ${isDisabled ? '!opacity-50 !cursor-not-allowed !bg-[#f5f5f5] !text-[#999] hover:!transform-none hover:!bg-[#f5f5f5]' : ''}
                  `}
                  onClick={() => !isDisabled && onToggleInterest(interest)}
                  disabled={isDisabled}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.4 + (index + 7) * 0.1 }}
                  whileHover={!isDisabled ? { scale: 1.05 } : {}}
                  whileTap={!isDisabled ? { scale: 0.95 } : {}}
                >
                  {interest}
                </motion.button>
              );
            })}
          </div>

          {/* Fourth row - 2 bubbles */}
          <div className="contents md:flex md:justify-center md:gap-3">
            {interests.slice(10, 12).map((interest, index) => {
              const isSelected = selectedInterests.includes(interest);
              const isDisabled = !isSelected && selectedInterests.length >= 3;

              return (
                <motion.button
                  key={interest}
                  type="button"
                  className={`
                    px-4 py-3 text-sm rounded-[20px] border-2 border-[#e9ecef] whitespace-nowrap cursor-pointer transition-all duration-300 font-medium text-center inline-flex items-center justify-center h-10 min-w-[5rem] max-w-[12rem] bg-white text-black font-serif
                    md:px-8 md:py-4 md:text-base md:rounded-[25px] md:border-none md:h-auto md:min-w-[100px] md:max-w-[140px]
                    hover:bg-[#e9ecef] hover:-translate-y-px 
                    ${isSelected ? '!bg-black !text-white !border-black shadow-none' : ''}
                    ${isDisabled ? '!opacity-50 !cursor-not-allowed !bg-[#f5f5f5] !text-[#999] hover:!transform-none hover:!bg-[#f5f5f5]' : ''}
                  `}
                  onClick={() => !isDisabled && onToggleInterest(interest)}
                  disabled={isDisabled}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.4 + (index + 10) * 0.1 }}
                  whileHover={!isDisabled ? { scale: 1.05 } : {}}
                  whileTap={!isDisabled ? { scale: 0.95 } : {}}
                >
                  {interest}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        <motion.div 
           className="absolute bottom-20 right-8 flex justify-end items-end gap-2.5 
            md:static md:mt-12 md:w-full md:px-8 md:justify-end sm:static sm:mt-12 sm:px-4 sm:justify-end"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <motion.button
            type="button"
            className="min-w-[70px] px-5 py-2.5 text-sm flex items-center justify-center bg-transparent text-black border border-black rounded-[5px] font-serif font-light cursor-pointer transition-all hover:bg-[#e9ecef] hover:-translate-y-px hover:shadow-sm md:min-w-[90px] md:px-6 md:py-3"
            onClick={onBack}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Back
          </motion.button>
          <motion.button
            type="submit"
            className="min-w-[70px] h-[36px] px-2.5 text-sm flex items-center justify-center bg-black text-white border-none rounded-[5px] font-sans font-light cursor-pointer transition-all hover:bg-[#333] hover:-translate-y-px hover:shadow-sm md:min-w-[90px] md:h-[42px] md:px-6"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Next
          </motion.button>
        </motion.div>
      </motion.form>
    </>
  );
};

export default InterestsForm;
