'use client';
import { motion } from 'framer-motion';
import { professions } from '@/lib/constants/user-setup';

interface ProfessionFormProps {
  selectedProfession: string;
  error: string;
  onProfessionChange: (profession: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  isLoading: boolean;
}

const ProfessionForm = ({
  selectedProfession,
  error,
  onProfessionChange,
  onSubmit,
  onBack,
  isLoading,
}: ProfessionFormProps) => {
  return (
    <>
      <motion.h2
        className="font-serif text-[clamp(2rem,4vh,3rem)] font-light mb-4 mt-0 text-black text-center leading-tight md:text-[3rem]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        And, What Do You Do?
      </motion.h2>
      <motion.p
        className="text-center text-[#666] mb-8 text-sm sm:text-base font-sans max-w-[90%] mx-auto leading-relaxed md:text-[0.9rem] md:mb-12"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        Are you a practicing lawyer, a law student, or a paralegal? Selecting your profession helps
        us build a better community for everyone.
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
          className="flex flex-col gap-8 my-8 px-4 w-full
          md:flex-row md:justify-center md:items-center md:-translate-y-8 md:gap-8 md:max-w-[550px] md:mx-auto md:p-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {professions.map((profession, index) => (
            <motion.div
              key={profession.id}
              className={`
                relative w-full h-[200px] min-w-[280px] max-w-[320px] mx-auto border-3 border-[#e9ecef] rounded-[20px] text-center cursor-pointer p-1 overflow-hidden bg-cover bg-center bg-no-repeat transition-all duration-300
                md:w-auto md:h-auto md:min-w-[220px] md:max-w-[250px] md:min-h-[300px] md:shadow-sm hover:md:shadow-md
                ${selectedProfession === profession.id ? '!border-[#d4af37] shadow-[0_4px_12px_rgba(212,175,55,0.3)]' : ''}
              `}
              onClick={() =>
                onProfessionChange(selectedProfession === profession.id ? '' : profession.id)
              }
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                backgroundImage: `url(${profession.image})`,
              }}
            >
              {/* Gradient overlay for desktop cards (implied by previous CSS linear-gradient::before) */}
              <div className="hidden md:block absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/90 z-10 pointer-events-none" />

              <div
                className="
                absolute bottom-[-7%] left-1/2 -translate-x-1/2 w-full bg-white p-4 pb-4 z-20 block
                md:bottom-0 md:bg-transparent md:flex md:items-end md:justify-center md:h-full md:p-0
              "
              >
                <div
                  className="
                    font-serif text-base font-semibold text-[#333] px-3 py-2
                    md:font-light md:text-[1.05rem] md:w-full md:m-0 md:bg-gradient-to-b md:from-transparent md:to-white/40 md:p-3 md:rounded-b-xl md:shadow-sm
                "
                >
                  {profession.title}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="absolute bottom-[-4rem] right-4 flex justify-end items-center gap-2.5 
           md:static md:w-full md:justify-center md:mt-4
           sm:static sm:mt-12 sm:px-4 sm:justify-end"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <motion.button
            type="submit"
            className={`
                min-w-[70px] h-[36px] px-4 text-sm flex items-center justify-center bg-black text-white border-none rounded-[5px] font-sans font-light cursor-pointer transition-all hover:bg-[#333] hover:-translate-y-px hover:shadow-sm 
                md:min-w-[90px] md:h-[42px]
                ${isLoading || !selectedProfession ? '!bg-[#464545] !cursor-not-allowed' : ''}
            `}
            disabled={!selectedProfession || isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Finish
          </motion.button>
        </motion.div>
      </motion.form>
    </>
  );
};

export default ProfessionForm;
