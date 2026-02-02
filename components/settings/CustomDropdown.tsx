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
    <div className="flex flex-col gap-[0.6rem] relative overflow-visible" ref={dropdownRef}>
      <label className="font-medium text-slate-900 text-[0.95rem]">{label}</label>
      <div className="relative w-full z-[100]">
        <button
          type="button"
          className="flex items-center justify-between w-full px-4 py-3 bg-white border-[1.5px] border-gray-300 rounded-[10px] text-[0.95rem] font-medium text-slate-900 cursor-pointer transition-all duration-200 hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10 md:px-[0.85rem] md:py-[0.65rem] md:text-[0.9rem]"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="flex-1 text-left">{selectedOption?.label || 'Select...'}</span>
          <ChevronDown
            size={20}
            className={`transition-transform duration-200 text-gray-500 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen && (
          <div className="absolute top-[calc(100%+0.5rem)] left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] z-[9999] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-[280px] overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`flex items-center justify-between w-full px-4 py-3 bg-white border-0 border-b border-gray-100 text-[0.9375rem] font-medium text-gray-800 text-left cursor-pointer transition-colors duration-150 last:border-b-0 hover:bg-gray-50 md:px-[0.85rem] md:py-[0.65rem] md:text-[0.875rem] ${
                  option.value === value ? 'bg-blue-100 text-blue-800 font-semibold hover:bg-blue-100' : ''
                }`}
                onClick={() => handleOptionClick(option.value)}
              >
                <span>{option.label}</span>
                {option.value === value && <Check size={18} className="text-blue-500 shrink-0" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
