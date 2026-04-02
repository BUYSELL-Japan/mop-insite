import React, { useState, useEffect, useRef } from 'react';
import { X, Trash2, MapPin } from 'lucide-react';
import { Location } from '../types/location';
import { useWindowSize } from '../hooks/useWindowSize';
import { deleteFavorite } from '../utils/auth';
import { sendPinClickEvent, sendAffiliateLinkClickEvent } from '../utils/gtm';
import { useLanguage, Language } from '../hooks/useLanguage';
import { CATEGORIES } from '../types/location';

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: Location[];
  onFavoritesChange?: () => Promise<void>;
  onLocationSelect?: (location: Location) => void;
  onCategoryAutoSelect?: (categoryId: string) => void;
}

export default function FavoritesModal({
  isOpen,
  onClose,
  favorites,
  onFavoritesChange,
  onLocationSelect,
  onCategoryAutoSelect
}: FavoritesModalProps) {
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const { t, language } = useLanguage();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && onFavoritesChange) {
      onFavoritesChange();
    }
  }, [isOpen, onFavoritesChange]);

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

  const getDirectionsUrl = (lat: number, lng: number): string => {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  };

  const extractUrl = (description: string): string | null => {
    if (!description) return null;

    const cleanText = description
      .replace(/<[^>]+>/g, '')
      .replace(/&[^;]+;/g, '');

    // Language-specific URL extraction
    const fieldName = language === 'zh-TW' ? 'affiliate_link_tw' : 'affiliate_link';
    
    // First try to extract from specific field pattern
    const fieldRegex = new RegExp(`${fieldName}:\\s*(https?://[^\\s\\]]+)`, 'i');
    const fieldMatch = cleanText.match(fieldRegex);
    
    if (fieldMatch) {
      return fieldMatch[1];
    }
    
    // Fallback to general URL extraction
    const urlRegex = /(?:https?:\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)/i;
    const match = cleanText.match(urlRegex);

    if (!match) return null;

    let url = match[0];
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }

    return url;
  };

  const getButtonText = (categoryId: string): string => {
    switch (categoryId) {
      case "4":
        return "See Details";
      default:
        return "Book Now";
    }
  };

  const handleAffiliateLinkClick = (url: string, locationName: string, categoryId: string) => {
    const category = CATEGORIES[categoryId] || CATEGORIES["1"];
    const categoryName = t(category.nameKey);
    sendAffiliateLinkClickEvent(url, locationName, locationName, categoryName);
  };

  const handleDelete = async (pinId: string) => {
    try {
      setDeletingId(pinId);
      await deleteFavorite(pinId);
      setMessage('Favorite removed successfully');
      if (onFavoritesChange) {
        await onFavoritesChange();
      }
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage('Failed to remove favorite');
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setDeletingId(null);
    }
  };

  const handleImageClick = (location: Location) => {
    if (onLocationSelect) {
      console.log('Favorite clicked:', location.properties.title);
      sendPinClickEvent(location.properties.title);

      // Auto-select the category of the selected location
      if (onCategoryAutoSelect && location.properties.category_id) {
        onCategoryAutoSelect(location.properties.category_id);
      }

      onLocationSelect(location);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <div 
        ref={modalRef}
        className={`bg-white rounded-lg w-full mx-4 ${
          isMobile ? 'max-h-[85vh] my-auto' : 'max-w-2xl max-h-[80vh]'
        }`}
      >
        <div className="sticky top-0 bg-white z-10 px-4 py-3 border-b rounded-t-lg">
          <div className="flex justify-between items-center">
            <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold`}>Favorites</h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {message && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg z-[9999] bg-blue-600 text-white">
            {message}
          </div>
        )}

        <div className="overflow-y-auto px-4" style={{ maxHeight: 'calc(85vh - 57px)' }}>
          {favorites.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No favorites yet</p>
              <p className="text-sm mt-2">Start adding your favorite places!</p>
            </div>
          ) : (
            <div className="py-3 space-y-3">
              {favorites.map((location) => {
                const url = extractUrl(location.properties.description);
                const lat = location.geometry.coordinates[1];
                const lng = location.geometry.coordinates[0];
                const directionsUrl = getDirectionsUrl(lat, lng);
                const pinId = location.properties.pin_id;

                return (
                  <div 
                    key={pinId}
                    className="flex gap-3 bg-gray-50 rounded-lg overflow-hidden p-3 relative group"
                  >
                    <button
                      onClick={() => handleDelete(pinId)}
                      disabled={deletingId === pinId}
                      className={`absolute top-2 right-2 p-1.5 rounded-full transition-all ${
                        deletingId === pinId
                          ? 'bg-gray-200 cursor-not-allowed'
                          : 'bg-red-100 hover:bg-red-200 text-red-600'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {location.properties.pic && (
                      <button
                        onClick={() => handleImageClick(location)}
                        className={`relative flex-shrink-0 group/image ${isMobile ? 'w-24 h-24' : 'w-32 h-32'}`}
                      >
                        <img
                          src={location.properties.pic}
                          alt={location.properties.title}
                          className="w-full h-full object-cover rounded-lg transition-opacity group-hover/image:opacity-75"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity">
                          <div className="bg-black/50 rounded-full p-2">
                            <MapPin className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      </button>
                    )}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <h3 className={`font-semibold ${isMobile ? 'text-base mb-2' : 'text-lg mb-4'} pr-8`}>
                        {location.properties.title}
                      </h3>
                      <div className="flex gap-2">
                        {url && (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1"
                            onClick={() => handleAffiliateLinkClick(url, location.properties.title, location.properties.category_id || "1")}
                          >
                            <button className={`w-full px-3 ${isMobile ? 'py-1.5 text-xs' : 'py-2 text-sm'} text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-medium`}>
                              {getButtonText(location.properties.category_id || "1")}
                            </button>
                          </a>
                        )}
                        <a
                          href={directionsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1"
                        >
                          <button className={`w-full px-3 ${isMobile ? 'py-1.5 text-xs' : 'py-2 text-sm'} text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors font-medium`}>
                            Direction
                          </button>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}