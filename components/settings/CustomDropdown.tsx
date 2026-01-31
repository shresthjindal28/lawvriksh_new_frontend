'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface DropdownOption {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
}

export default function CustomDropdown({ label, value, options, onChange }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className="custom-dropdown-wrapper" ref={dropdownRef}>
      <label className="custom-dropdown-label">{label}</label>
      <div className="custom-dropdown">
        <button
          type="button"
          className="custom-dropdown-trigger"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="custom-dropdown-value">{selectedOption?.label || 'Select...'}</span>
          <ChevronDown
            size={20}
            className={`custom-dropdown-icon ${isOpen ? 'custom-dropdown-icon--open' : ''}`}
          />
        </button>

        {isOpen && (
          <div className="custom-dropdown-menu">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`custom-dropdown-option ${
                  option.value === value ? 'custom-dropdown-option--selected' : ''
                }`}
                onClick={() => handleOptionClick(option.value)}
              >
                <span>{option.label}</span>
                {option.value === value && <Check size={18} className="custom-dropdown-check" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
