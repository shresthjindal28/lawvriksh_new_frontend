'use client';

import { motion } from 'framer-motion';
import { UserProfile } from '@/types';
import '../../styles/user-styles/profile-form.css';

const formItemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, delay },
  }),
};

interface ProfileUpdateFormProps {
  editableUser: UserProfile;
  interestsString: string;
  isUploading: boolean;
  memberSince?: string;
  onFieldChange: (field: keyof UserProfile, value: string) => void;
  onInterestsChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

const ProfileUpdateForm = ({
  editableUser,
  interestsString,
  isUploading,
  memberSince,
  onFieldChange,
  onInterestsChange,
  onSubmit,
  onCancel,
}: ProfileUpdateFormProps) => {
  return (
    <motion.form
      onSubmit={onSubmit}
      initial="hidden"
      animate="visible"
      className="profile-edit-form"
    >
      <div className="form-sections">
        {/* Basic Information Section */}
        <div className="form-section">
          <div className="section-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="section-icon">
              <path
                d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="12"
                cy="7"
                r="4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <h4 className="form-section-title">Basic Information</h4>
          </div>

          <div className="form-grid">
            {/* Name */}
            <motion.div className="form-field" custom={0.1} variants={formItemVariants}>
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                value={editableUser.name || ''}
                placeholder="Enter your full name"
                onChange={(e) => onFieldChange('name', e.target.value)}
              />
            </motion.div>

            {/* Email */}
            <motion.div className="form-field" custom={0.15} variants={formItemVariants}>
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={editableUser.email || ''}
                placeholder="your.email@example.com"
                onChange={(e) => onFieldChange('email', e.target.value)}
              />
            </motion.div>

            {/* Profession */}
            <motion.div className="form-field full-width" custom={0.2} variants={formItemVariants}>
              <label htmlFor="profession">Profession</label>
              <input
                type="text"
                id="profession"
                value={editableUser.profession || ''}
                placeholder="e.g., Legal Counsel, Attorney, Paralegal"
                onChange={(e) => onFieldChange('profession', e.target.value)}
              />
            </motion.div>
          </div>
        </div>

        {/* Professional Details Section */}
        <div className="form-section">
          <div className="section-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="section-icon">
              <path
                d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <h4 className="form-section-title">Professional Details</h4>
          </div>

          {/* Interests */}
          <motion.div className="form-field full-width" custom={0.3} variants={formItemVariants}>
            <label htmlFor="interests">
              Areas of Interest
              <span className="required-badge">Required</span>
            </label>
            <input
              type="text"
              id="interests"
              value={interestsString}
              placeholder="e.g., Legal Research, Contract Drafting, Regulatory Compliance"
              onChange={(e) => onInterestsChange(e.target.value)}
              required
            />
            <small className="field-hint">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M12 16v-4M12 8h.01"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              Separate multiple interests with commas
            </small>
          </motion.div>

          {/* Bio */}
          <motion.div className="form-field full-width" custom={0.4} variants={formItemVariants}>
            <label htmlFor="bio">
              Bio
              <span className="required-badge">Required</span>
            </label>
            <textarea
              id="bio"
              value={editableUser.bio || ''}
              placeholder="Tell us about yourself, your experience, and expertise..."
              onChange={(e) => onFieldChange('bio', e.target.value)}
              rows={5}
              required
            />
            <small className="field-hint character-count">
              {editableUser.bio?.length || 0} characters
            </small>
          </motion.div>
        </div>

        {/* Account Information Section - Read Only */}
        {memberSince && (
          <div className="form-section">
            <div className="section-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="section-icon">
                <rect
                  x="3"
                  y="4"
                  width="18"
                  height="18"
                  rx="2"
                  ry="2"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" />
                <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" />
                <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" />
              </svg>
              <h4 className="form-section-title">Account Information</h4>
            </div>

            <div className="form-grid">
              <motion.div className="form-field" custom={0.5} variants={formItemVariants}>
                <label>Member Since</label>
                <div
                  style={{
                    padding: '10px 12px',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    color: '#6b7280',
                    fontSize: '14px',
                  }}
                >
                  {memberSince}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <motion.div
        className="form-actions"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <button className="btn-cancel" type="button" onClick={onCancel} disabled={isUploading}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          Cancel
        </button>
        <button className="btn-save" type="submit" disabled={isUploading}>
          {isUploading ? (
            <>
              <div className="button-spinner"></div>
              Saving...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points="17 21 17 13 7 13 7 21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points="7 3 7 8 15 8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Save Changes
            </>
          )}
        </button>
      </motion.div>
    </motion.form>
  );
};

export default ProfileUpdateForm;
