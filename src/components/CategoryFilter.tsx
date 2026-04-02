import React, { useState, useRef, useEffect } from 'react';
import { Filter, X } from 'lucide-react';
import { CATEGORIES } from '../types/location';
import { useLanguage } from '../hooks/useLanguage';

interface CategoryFilterProps {
  selectedCategories: string[];
  onCategoryToggle: (categoryId: string) => void;
  isMobile: boolean;
}

export default function CategoryFilter({ selectedCategories, onCategoryToggle, isMobile }: CategoryFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
  const selectedCount = selectedCategories.length;
  const totalCategories = Object.keys(CATEGORIES).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-white/30 hover:bg-white/95 transition-colors whitespace-nowrap text-sm min-h-[36px]"
      >
        <Filter className="w-4 h-4 text-gray-500" />
        <div className="flex items-center gap-1">
          <span className="font-medium">{t('nav.filter')}</span>
          <span className="text-xs text-gray-500">
            ({selectedCount}/{totalCategories})
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div 
            ref={modalRef}
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-500" />
                <h3 className="text-xl font-bold">{t('nav.filter')}</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {Object.entries(CATEGORIES).map(([id, category]) => (
                <label
                  key={id}
                  className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors"
                >
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(id)}
                      onChange={() => onCategoryToggle(id)}
                      className="w-5 h-5 border-2 rounded text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <div 
                      className="w-4 h-4 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: category.color }} 
                    />
                    <span className="text-base font-medium text-gray-700">
                      {t(category.nameKey)}
                    </span>
                  </div>
                  <div className="w-5 h-5 relative">
                    <img 
                      src={category.markerUrl}
                      alt={category.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}