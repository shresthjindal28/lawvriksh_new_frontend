'use client';
import { motion } from 'framer-motion';
import '@/styles/creator-styles/creator-form.css';
interface CreatorApplicationFormProps {
  title: string;
  fieldName: string;
  feild: string;
  error: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  eligible: boolean;
  displayMessage: string;
  buttonText?: string;
}

const CreatorApplicationForm = ({
  title,
  fieldName,
  feild,
  error,
  onChange,
  onSubmit,
  onBack,
  eligible,
  displayMessage,
  buttonText,
}: CreatorApplicationFormProps) => {
  // Generate a list of years for the dropdown
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  return (
    <>
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Enter your {title}
      </motion.h2>
      <motion.p
        className="subtitle"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        This helps us to understand your background and expertise.
      </motion.p>

      <motion.form
        onSubmit={onSubmit}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {error && (
          <div className="errorMessageContainer">
            <motion.p
              className="errorMessage"
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
          <motion.p
            className="displayMessage"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            {displayMessage}
          </motion.p>
        )}

        <motion.div
          className="inputGroup NameInput"
          initial={{ opacity: 0, x: -20, height: 0 }}
          animate={{ opacity: 1, x: 0, height: 'auto' }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {fieldName === 'yearOfPassing' ? (
            <motion.select
              id={fieldName}
              name={fieldName}
              value={feild}
              onChange={onChange}
              required
              whileFocus={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className=""
            >
              <option value="" disabled>
                Select a year
              </option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </motion.select>
          ) : (
            <motion.input
              type="text"
              id={fieldName}
              name={fieldName}
              placeholder={`Enter your ${title}`}
              value={feild}
              onChange={onChange}
              required
              whileFocus={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            />
          )}
        </motion.div>

        <motion.div className="formActions">
          <motion.button
            type="button"
            onClick={onBack}
            className=" OnBackButton"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            Cancel
          </motion.button>

          <motion.button
            type="submit"
            disabled={!eligible}
            className={` ${!eligible ? ' NameButton disabled' : 'NameButton'}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {buttonText || 'Next'}
          </motion.button>
        </motion.div>
      </motion.form>
    </>
  );
};

export default CreatorApplicationForm;
