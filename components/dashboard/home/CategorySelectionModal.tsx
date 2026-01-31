'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, BookOpen, GraduationCap } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

const categories: Category[] = [
  {
    id: 'research_paper',
    name: 'Research Paper',
    icon: <BookOpen size={32} color="#b8860b" />,
    description: 'Academic research documents',
  },
  {
    id: 'article',
    name: 'Article',
    icon: <FileText size={32} color="#b8860b" />,
    description: 'Blog posts and articles',
  },
  {
    id: 'assignment',
    name: 'College Assignment',
    icon: <GraduationCap size={32} color="#b8860b" />,
    description: 'Academic assignments',
  },
];

interface CategorySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (categoryId: string) => void;
}

export default function CategorySelectionModal({
  isOpen,
  onClose,
  onSelectCategory,
}: CategorySelectionModalProps) {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
          onClick={handleBackdropClick}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(2px)',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              width: '100%',
              maxWidth: '500px',
              padding: '24px',
              margin: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#111827',
                  margin: 0,
                }}
              >
                Select Document Type
              </h2>
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <X size={20} color="#6b7280" />
              </button>
            </div>

            {/* Subtitle */}
            <p
              style={{
                fontSize: '14px',
                color: '#6b7280',
                marginBottom: '24px',
              }}
            >
              Choose a document type to create from scratch
            </p>

            {/* Category Cards */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => onSelectCategory(category.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '10px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#b8860b';
                    e.currentTarget.style.backgroundColor = '#fefce8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '10px',
                      backgroundColor: '#fef9e7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {category.icon}
                  </div>
                  <div>
                    <h3
                      style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#111827',
                        margin: 0,
                        marginBottom: '4px',
                      }}
                    >
                      {category.name}
                    </h3>
                    <p
                      style={{
                        fontSize: '13px',
                        color: '#6b7280',
                        margin: 0,
                      }}
                    >
                      {category.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
