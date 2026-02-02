'use client';

import { motion } from 'framer-motion';
import { UserProfile } from '@/types';

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
      className="w-full max-w-[1200px] mx-auto bg-white rounded-[10px] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] border border-gray-200 overflow-hidden md:border-none md:shadow-none md:rounded-0"
    >
      <div className="flex flex-col gap-0 p-8 w-full box-border md:p-5">
        {/* Basic Information Section */}
        <div className="flex flex-col gap-5 pb-8 mb-8 border-b border-[#13343514] relative last:border-b-0 last:pb-0 last:mb-0">
          <div className="flex items-center gap-[10px] mb-3">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              className="text-[#133435] shrink-0 opacity-80"
            >
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
            <h4 className="text-[#133435] font-[family-name:var(--font-instrument-sans),'Instrument_Sans',sans-serif] text-base font-semibold leading-normal m-0 tracking-[0.5px] uppercase">
              Basic Information
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-6 mt-2 w-full box-border md:grid-cols-1 md:gap-4">
            {/* Name */}
            <motion.div
              className="flex flex-col gap-2 w-full"
              custom={0.1}
              variants={formItemVariants}
            >
              <label
                htmlFor="name"
                className="font-[family-name:var(--font-instrument-sans),'Instrument_Sans',sans-serif] text-[13px] font-medium text-gray-700 m-[0_0_4px_0] flex items-center gap-2"
              >
                Full Name
              </label>
              <input
                type="text"
                id="name"
                value={editableUser.name || ''}
                placeholder="Enter your full name"
                onChange={(e) => onFieldChange('name', e.target.value)}
                className="w-full box-border px-[14px] py-[10px] border border-gray-200 rounded-lg font-[family-name:var(--font-instrument-sans),'Instrument_Sans',sans-serif] text-sm text-gray-900 bg-white transition-all duration-200 leading-normal hover:border-gray-300 focus:outline-none focus:border-gray-400 focus:shadow-[0_0_0_1px_#e5e7eb] placeholder:text-gray-400 placeholder:text-sm"
              />
            </motion.div>

            {/* Email */}
            <motion.div
              className="flex flex-col gap-2 w-full"
              custom={0.15}
              variants={formItemVariants}
            >
              <label
                htmlFor="email"
                className="font-[family-name:var(--font-instrument-sans),'Instrument_Sans',sans-serif] text-[13px] font-medium text-gray-700 m-[0_0_4px_0] flex items-center gap-2"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={editableUser.email || ''}
                placeholder="your.email@example.com"
                onChange={(e) => onFieldChange('email', e.target.value)}
                className="w-full box-border px-[14px] py-[10px] border border-gray-200 rounded-lg font-[family-name:var(--font-instrument-sans),'Instrument_Sans',sans-serif] text-sm text-gray-900 bg-white transition-all duration-200 leading-normal hover:border-gray-300 focus:outline-none focus:border-gray-400 focus:shadow-[0_0_0_1px_#e5e7eb] placeholder:text-gray-400 placeholder:text-sm"
              />
            </motion.div>

            {/* Profession */}
            <motion.div
              className="flex flex-col gap-2 w-full col-span-full"
              custom={0.2}
              variants={formItemVariants}
            >
              <label
                htmlFor="profession"
                className="font-[family-name:var(--font-instrument-sans),'Instrument_Sans',sans-serif] text-[13px] font-medium text-gray-700 m-[0_0_4px_0] flex items-center gap-2"
              >
                Profession
              </label>
              <input
                type="text"
                id="profession"
                value={editableUser.profession || ''}
                placeholder="e.g., Legal Counsel, Attorney, Paralegal"
                onChange={(e) => onFieldChange('profession', e.target.value)}
                className="w-full box-border px-[14px] py-[10px] border border-gray-200 rounded-lg font-[family-name:var(--font-instrument-sans),'Instrument_Sans',sans-serif] text-sm text-gray-900 bg-white transition-all duration-200 leading-normal hover:border-gray-300 focus:outline-none focus:border-gray-400 focus:shadow-[0_0_0_1px_#e5e7eb] placeholder:text-gray-400 placeholder:text-sm"
              />
            </motion.div>
          </div>
        </div>

        {/* Professional Details Section */}
        <div className="flex flex-col gap-5 pb-8 mb-8 border-b border-[#13343514] relative last:border-b-0 last:pb-0 last:mb-0">
          <div className="flex items-center gap-[10px] mb-3">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              className="text-[#133435] shrink-0 opacity-80"
            >
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
            <h4 className="text-[#133435] font-[family-name:var(--font-instrument-sans),'Instrument_Sans',sans-serif] text-base font-semibold leading-normal m-0 tracking-[0.5px] uppercase">
              Professional Details
            </h4>
          </div>

          {/* Interests */}
          <motion.div
            className="flex flex-col gap-2 w-full col-span-full"
            custom={0.3}
            variants={formItemVariants}
          >
            <label
              htmlFor="interests"
              className="font-[family-name:var(--font-instrument-sans),'Instrument_Sans',sans-serif] text-[13px] font-medium text-gray-700 m-[0_0_4px_0] flex items-center gap-2"
            >
              Areas of Interest
              <span className="text-[10px] font-semibold text-red-600 bg-red-100 px-[6px] py-[2px] rounded uppercase tracking-[0.5px]">
                Required
              </span>
            </label>
            <input
              type="text"
              id="interests"
              value={interestsString}
              placeholder="e.g., Legal Research, Contract Drafting, Regulatory Compliance"
              onChange={(e) => onInterestsChange(e.target.value)}
              required
              className="w-full box-border px-[14px] py-[10px] border border-gray-200 rounded-lg font-[family-name:var(--font-instrument-sans),'Instrument_Sans',sans-serif] text-sm text-gray-900 bg-white transition-all duration-200 leading-normal hover:border-gray-300 focus:outline-none focus:border-gray-400 focus:shadow-[0_0_0_1px_#e5e7eb] placeholder:text-gray-400 placeholder:text-sm"
            />
            <small className="font-[family-name:var(--font-instrument-sans),'Instrument_Sans',sans-serif] text-xs text-gray-500 mt-[6px] flex items-center gap-[6px]">
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
          <motion.div
            className="flex flex-col gap-2 w-full col-span-full"
            custom={0.4}
            variants={formItemVariants}
          >
            <label
              htmlFor="bio"
              className="font-[family-name:var(--font-instrument-sans),'Instrument_Sans',sans-serif] text-[13px] font-medium text-gray-700 m-[0_0_4px_0] flex items-center gap-2"
            >
              Bio
              <span className="text-[10px] font-semibold text-red-600 bg-red-100 px-[6px] py-[2px] rounded uppercase tracking-[0.5px]">
                Required
              </span>
            </label>
            <textarea
              id="bio"
              value={editableUser.bio || ''}
              placeholder="Tell us about yourself, your experience, and expertise..."
              onChange={(e) => onFieldChange('bio', e.target.value)}
              rows={5}
              required
              className="w-full box-border px-[14px] py-[10px] border border-gray-200 rounded-lg font-[family-name:var(--font-instrument-sans),'Instrument_Sans',sans-serif] text-sm text-gray-900 bg-white transition-all duration-200 leading-normal hover:border-gray-300 focus:outline-none focus:border-gray-400 focus:shadow-[0_0_0_1px_#e5e7eb] placeholder:text-gray-400 placeholder:text-sm min-h-[120px] resize-y"
            />
            <small className="font-[family-name:var(--font-instrument-sans),'Instrument_Sans',sans-serif] text-xs text-gray-500 mt-[6px] flex items-center gap-[6px]">
              {editableUser.bio?.length || 0} characters
            </small>
          </motion.div>
        </div>

        {/* Account Information Section - Read Only */}
        {memberSince && (
          <div className="flex flex-col gap-5 pb-8 mb-8 border-b border-[#13343514] relative last:border-b-0 last:pb-0 last:mb-0">
            <div className="flex items-center gap-[10px] mb-3">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                className="text-[#133435] shrink-0 opacity-80"
              >
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
              <h4 className="text-[#133435] font-[family-name:var(--font-instrument-sans),'Instrument_Sans',sans-serif] text-base font-semibold leading-normal m-0 tracking-[0.5px] uppercase">
                Account Information
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-6 mt-2 w-full box-border md:grid-cols-1 md:gap-4">
              <motion.div
                className="flex flex-col gap-2 w-full"
                custom={0.5}
                variants={formItemVariants}
              >
                <label className="font-[family-name:var(--font-instrument-sans),'Instrument_Sans',sans-serif] text-[13px] font-medium text-gray-700 m-[0_0_4px_0] flex items-center gap-2">
                  Member Since
                </label>
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
        className="flex justify-end gap-3 px-8 py-6 border-t border-gray-200 bg-white rounded-b-[10px] w-full box-border md:p-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <button
          className="px-4 py-2 rounded-md font-[family-name:var(--font-instrument-sans),'Instrument_Sans',sans-serif] text-sm font-medium cursor-pointer transition-all duration-200 border border-gray-200 flex items-center gap-2 justify-center bg-white text-gray-700 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          type="button"
          onClick={onCancel}
          disabled={isUploading}
        >
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
        <button
          className="px-4 py-2 rounded-md font-[family-name:var(--font-instrument-sans),'Instrument_Sans',sans-serif] text-sm font-medium cursor-pointer transition-all duration-200 border border-transparent flex items-center gap-2 justify-center bg-[#133435] text-white shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] hover:bg-[#0d2526] hover:-translate-y-[1px] hover:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          type="submit"
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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
