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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        What should we call you?
      </motion.h2>
      <motion.p
        className="subtitle"
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

        <motion.div
          className="inputGroup NameInput"
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
          />
        </motion.div>

        <motion.div
          className="inputGroup"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          style={{ marginTop: '20px' }}
        >
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '10px' }}>
            <input
              type="checkbox"
              checked={showDpSetup}
              onChange={(e) => onShowDpSetupChange(e.target.checked)}
              style={{ width: 'auto', marginRight: '8px' }}
            />
            <span style={{ fontSize: '14px', color: '#4b5563' }}>
              Do you want to setup your DP?
            </span>
          </label>
        </motion.div>

        {showDpSetup && (
          <motion.div
            className="inputGroup"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            style={{ marginTop: '15px' }}
          >
            <div
              style={{
                border: '2px dashed #e5e7eb',
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center',
                backgroundColor: '#f9fafb',
              }}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="profile-image-upload"
              />
              <label
                htmlFor="profile-image-upload"
                style={{
                  cursor: 'pointer',
                  color: '#2563eb',
                  fontSize: '14px',
                  display: 'block',
                }}
              >
                {profileImage ? profileImage.name : 'Click to upload profile picture'}
              </label>
              {profileImage && (
                <div style={{ marginTop: '10px' }}>
                  <Image
                    src={URL.createObjectURL(profileImage)}
                    alt="Preview"
                    width={60}
                    height={60}
                    unoptimized
                    style={{
                      borderRadius: '50%',
                      objectFit: 'cover',
                      margin: '0 auto',
                    }}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}

        <motion.div className="formActions">
          <motion.button
            type="button"
            className="OnBackButton"
            onClick={onBack}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Back
          </motion.button>
          <motion.button
            type="submit"
            className=" NameButton"
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
