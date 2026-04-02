import React, { useState, useEffect, useRef } from 'react';
import { X, Search } from 'lucide-react';
import { Location } from '../types/location';
import { useWindowSize } from '../hooks/useWindowSize';
import { useLanguage } from '../hooks/useLanguage';
import { sendPinClickEvent, sendSearchResultEvent } from '../utils/gtm';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: Location[];
  onLocationSelect: (location: Location) => void;
  onCategoryAutoSelect?: (categoryId: string) => void;
}

interface SearchResult extends Location {
  score: number;
}

export default function SearchModal({ isOpen, onClose, locations, onLocationSelect, onCategoryAutoSelect }: SearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const { language } = useLanguage();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const calculateScore = (location: Location, searchTerms: string[]): number => {
    let score = 0;
    // Use localized fields for search
    const title = (language === 'zh-TW' 
      ? (location.properties.title_zh_tw || location.properties.title)
      : location.properties.title)?.toLowerCase() || '';
    const address = (language === 'zh-TW'
      ? (location.properties['address_zh-tw'] || location.properties.address)
      : location.properties.address)?.toLowerCase() || '';
    const description = location.properties.description?.toLowerCase() || '';

    for (const term of searchTerms) {
      if (title === term) score += 100;
      else if (title.includes(term)) score += 50;
      if (address.includes(term)) score += 30;
      if (description.includes(term)) score += 20;

      if (title.startsWith(term)) score += 25;
      if (address.startsWith(term)) score += 15;
      
      const hiragana = term.replace(/[\u30a1-\u30f6]/g, ch =>
        String.fromCharCode(ch.charCodeAt(0) - 0x60)
      );
      const katakana = term.replace(/[\u3041-\u3096]/g, ch =>
        String.fromCharCode(ch.charCodeAt(0) + 0x60)
      );

      if (title.includes(hiragana) || title.includes(katakana)) score += 40;
      if (address.includes(hiragana) || address.includes(katakana)) score += 20;
      if (description.includes(hiragana) || description.includes(katakana)) score += 10;
    }

    return score;
  };

  useEffect(() => {
    if (searchTerm.length >= 1) {
      const searchTerms = searchTerm.toLowerCase().split(/\s+/).filter(Boolean);

      const results: SearchResult[] = locations
        .map(location => ({
          ...location,
          score: calculateScore(location, searchTerms)
        }))
        .filter(result => result.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      setSuggestions(results);

      sendSearchResultEvent(searchTerm, results.length, language);
    } else {
      setSuggestions([]);
    }
  }, [searchTerm, locations, language]);

  const handleLocationClick = (location: Location) => {
    console.log('Search result clicked:', location.properties.title);
    sendPinClickEvent(location.properties.title);

    // Auto-select the category of the selected location
    if (onCategoryAutoSelect && location.properties.category_id) {
      onCategoryAutoSelect(location.properties.category_id);
    }

    onLocationSelect(location);
    setSearchTerm('');
    setSuggestions([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed z-[9999] animate-fade-in ${
        isMobile 
          ? 'inset-x-2 top-20 max-w-[280px] mx-auto' 
          : 'top-20 right-4 w-[300px]'
      }`}
      style={{
        animation: 'fadeIn 0.2s ease-in-out',
      }}
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-lg overflow-hidden"
      >
        <div className="p-2 border-b">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search locations..."
              className="flex-1 text-sm outline-none"
            />
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {suggestions.length > 0 && (
          <div className="max-h-[300px] overflow-y-auto">
            {suggestions.map((location) => (
              <button
                key={location.properties.id}
                onClick={() => handleLocationClick(location)}
                className="w-full text-left p-2 hover:bg-gray-50 transition-colors border-b last:border-b-0"
              >
                <div className="text-sm font-medium text-gray-800 mb-0.5">
                  {location.properties.title || 'Untitled Location'}
                </div>
                <div className="text-xs text-gray-500 line-clamp-1">
                  {location.properties.address || 'No address available'}
                </div>
              </button>
            ))}
          </div>
        )}

        {searchTerm && suggestions.length === 0 && (
          <div className="p-3 text-center text-sm text-gray-500">
            No locations found
          </div>
        )}
      </div>
    </div>
  );
}