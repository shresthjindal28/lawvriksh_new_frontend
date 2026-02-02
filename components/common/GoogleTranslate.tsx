'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Languages } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '@/styles/common-styles/google-translate.css';
declare global {
  interface Window {
    __GOOGLE_TRANSLATION_CONFIG__?: {
      languages: { title: string; name: string }[];
      defaultLanguage: string;
    };
    google?: {
      translate?: {
        TranslateElement?: unknown;
      };
    };
  }
}

const languages = [
  { label: 'English', value: 'en' },
  { label: 'हिन्दी (Hindi)', value: 'hi' },
  { label: 'বাংলা (Bengali)', value: 'bn' },
  { label: 'తెలుగు (Telugu)', value: 'te' },
  { label: 'मराठी (Marathi)', value: 'mr' },
  { label: 'தமிழ் (Tamil)', value: 'ta' },
  { label: 'ગુજરાતી (Gujarati)', value: 'gu' },
  { label: 'ಕನ್ನಡ (Kannada)', value: 'kn' },
  { label: 'മലയാളം (Malayalam)', value: 'ml' },
  { label: 'ਪੰਜਾਬੀ (Punjabi)', value: 'pa' },
  { label: 'ଓଡ଼ିଆ (Odia)', value: 'or' },
  { label: 'অসমীয়া (Assamese)', value: 'as' },
  { label: 'اردو (Urdu)', value: 'ur' },
  { label: 'Español (Spanish)', value: 'es' },
  { label: 'Français (French)', value: 'fr' },
  { label: 'Deutsch (German)', value: 'de' },
  { label: '中文 (Chinese)', value: 'zh-CN' },
  { label: '日本語 (Japanese)', value: 'ja' },
  { label: '한국어 (Korean)', value: 'ko' },
  { label: 'العربية (Arabic)', value: 'ar' },
];

const COOKIE_NAME = 'googtrans';

// Helper to get cookie
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

// Helper to delete cookie - handles all domain variations
function deleteCookie(name: string) {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');

  // Delete cookie without domain (current path)
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;

  // Delete cookie for exact hostname (e.g., app.lawvriksh.com)
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${hostname}`;

  // Delete cookie for subdomain with dot (e.g., .app.lawvriksh.com)
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${hostname}`;

  // Delete cookie for parent domain (e.g., .lawvriksh.com) - important for production
  if (parts.length > 2) {
    const parentDomain = '.' + parts.slice(-2).join('.');
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${parentDomain}`;
  }

  // Also try without the dot prefix for parent domain
  if (parts.length > 2) {
    const parentDomain = parts.slice(-2).join('.');
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${parentDomain}`;
  }
}

interface GoogleTranslateProps {
  isCollapsed?: boolean;
  dropdownPosition?: 'top' | 'right' | 'bottom';
}

export function GoogleTranslate({ isCollapsed = false, dropdownPosition }: GoogleTranslateProps) {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isGoogleTranslateReady, setIsGoogleTranslateReady] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get current language from cookie
  const getCurrentLanguageFromCookie = useCallback(() => {
    const googtrans = getCookie(COOKIE_NAME);
    if (googtrans) {
      const parts = googtrans.split('/');
      if (parts.length >= 3) {
        return parts[2];
      }
    }
    return 'en';
  }, []);

  // Check if Google Translate combo is ready
  useEffect(() => {
    const checkGoogleTranslate = () => {
      const combo = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      if (combo) {
        setIsGoogleTranslateReady(true);
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
        }

        // Apply saved language if different from English
        const savedLang = getCurrentLanguageFromCookie();
        if (savedLang && savedLang !== 'en') {
          setTimeout(() => {
            const comboElement = document.querySelector('.goog-te-combo') as HTMLSelectElement;
            if (comboElement && comboElement.value !== savedLang) {
              comboElement.value = savedLang;
              comboElement.dispatchEvent(new Event('change'));
            }
          }, 100);
        }
      }
    };

    checkGoogleTranslate();
    checkIntervalRef.current = setInterval(checkGoogleTranslate, 500);

    const lang = getCurrentLanguageFromCookie();
    setTimeout(() => setCurrentLanguage(lang), 0);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [getCurrentLanguageFromCookie]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageSelect = (langCode: string) => {
    setCurrentLanguage(langCode);
    setIsDropdownOpen(false);

    const googleCombo = document.querySelector('.goog-te-combo') as HTMLSelectElement;

    if (langCode === 'en') {
      // First, delete all existing googtrans cookies from all possible domains
      // This is critical for production where cookies might be on parent domain
      deleteCookie(COOKIE_NAME);

      // Additional comprehensive deletion for all possible cookie variations
      const hostname = window.location.hostname;
      const parts = hostname.split('.');

      // Build list of all possible domains where cookies might exist
      const domainsToClear: string[] = [
        '', // no domain (current path only)
        hostname, // exact hostname (e.g., app.lawvriksh.com)
        `.${hostname}`, // with dot prefix (e.g., .app.lawvriksh.com)
      ];

      // Add parent domain variations (e.g., .lawvriksh.com) - critical for production
      if (parts.length > 2) {
        const parentDomain = '.' + parts.slice(-2).join('.');
        const parentDomainNoDot = parts.slice(-2).join('.');
        domainsToClear.push(parentDomain); // .lawvriksh.com
        domainsToClear.push(parentDomainNoDot); // lawvriksh.com
      }

      // Delete cookies for all domain variations with different path and attribute combinations
      const expiration = 'expires=Thu, 01 Jan 1970 00:00:00 UTC';
      domainsToClear.forEach((domain) => {
        const domainAttr = domain ? `; domain=${domain}` : '';

        // Try different combinations to ensure deletion works
        // Standard deletion
        document.cookie = `${COOKIE_NAME}=; ${expiration}; path=/${domainAttr}`;
        // With Secure flag (if cookie was set with Secure)
        document.cookie = `${COOKIE_NAME}=; ${expiration}; path=/; Secure${domainAttr}`;
        // With SameSite=Lax (if cookie was set with SameSite)
        document.cookie = `${COOKIE_NAME}=; ${expiration}; path=/; SameSite=Lax${domainAttr}`;
        // With both Secure and SameSite
        document.cookie = `${COOKIE_NAME}=; ${expiration}; path=/; Secure; SameSite=Lax${domainAttr}`;
        // Also try with SameSite=None (for cross-site cookies)
        document.cookie = `${COOKIE_NAME}=; ${expiration}; path=/; Secure; SameSite=None${domainAttr}`;
      });

      // Set Google Translate combo to English if available
      if (googleCombo) {
        googleCombo.value = 'en';
        googleCombo.dispatchEvent(new Event('change'));
      }

      // Small delay to ensure cookies are deleted before reload
      setTimeout(() => {
        window.location.reload();
      }, 150);
      return;
    }

    // Trigger translation via the Google combo
    if (googleCombo) {
      googleCombo.value = langCode;
      googleCombo.dispatchEvent(new Event('change'));
    } else {
      // Set cookie for Google Translate - defer to next tick
      const cookieValue = `${COOKIE_NAME}=/auto/${langCode}; path=/`;
      setTimeout(() => {
        document.cookie = cookieValue;
        window.location.reload();
      }, 0);
    }
  };

  const getCurrentLanguageLabel = () => {
    const lang = languages.find((l) => l.value === currentLanguage);
    return lang?.label.split(' ')[0] || 'English';
  };

  return (
    <div className="google-translate-wrapper" ref={dropdownRef}>
      {/* Trigger button */}
      <motion.button
        type="button"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={`google-translate-btn notranslate ${isCollapsed ? 'justify-center' : ''}`}
        title={isCollapsed ? `Translate: ${getCurrentLanguageLabel()}` : undefined}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Languages className="google-translate-icon" />
        {!isCollapsed && (
          <motion.span
            className="google-translate-text"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
          >
            {getCurrentLanguageLabel()}
          </motion.span>
        )}
        {!isCollapsed && (
          <svg
            className={`google-translate-chevron ${isDropdownOpen ? 'rotate' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </motion.button>

      {/* Dropdown menu */}
      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`google-translate-dropdown ${
              isCollapsed ? 'position-right' : 'position-top'
            }`}
          >
            {languages.map((lang) => (
              <button
                key={lang.value}
                type="button"
                onClick={() => handleLanguageSelect(lang.value)}
                className={`google-translate-item notranslate ${
                  currentLanguage === lang.value ? 'active' : ''
                }`}
              >
                {lang.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default GoogleTranslate;
