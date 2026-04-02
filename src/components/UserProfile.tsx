import React, { useState, useEffect, useRef } from 'react';
import { X, LogOut, Heart, Mail, Calendar } from 'lucide-react';
import { parseJwt } from '../utils/auth';
import { useWindowSize } from '../hooks/useWindowSize';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onOpenFavorites: () => void;
}

interface UserInfo {
  email?: string;
  name?: string;
  picture?: string;
  sub?: string;
  exp?: number;
}

export default function UserProfile({ 
  isOpen, 
  onClose, 
  onLogout, 
  onOpenFavorites
}: UserProfileProps) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const { width } = useWindowSize();
  const isMobile = width < 768;

  useEffect(() => {
    if (isOpen) {
      const idToken = localStorage.getItem('id_token');
      if (idToken) {
        const decoded = parseJwt(idToken);
        if (decoded) {
          setUserInfo(decoded);
        }
      }
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

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('id_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expiry');
    localStorage.removeItem('sub');
    onLogout();
    onClose();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getDisplayName = () => {
    if (!userInfo) return 'User';
    return userInfo.name || userInfo.email?.split('@')[0] || 'User';
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <div 
        ref={modalRef}
        className={`bg-white rounded-lg w-full mx-4 ${
          isMobile ? 'max-h-[90vh] my-auto' : 'max-w-md max-h-[80vh]'
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b rounded-t-lg">
          <div className="flex justify-between items-center">
            <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold`}>My Page</h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 73px)' }}>
          {/* Profile Section */}
          <div className="px-6 py-6 border-b">
            <div className="flex items-center gap-4">
              <div className="relative">
                {userInfo?.picture ? (
                  <img
                    src={userInfo.picture}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-lg">
                    {getInitials(getDisplayName())}
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {getDisplayName()}
                  </h3>
                  {userInfo?.email && (
                    <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                      <Mail className="w-3 h-3" />
                      <span>{userInfo.email}</span>
                    </div>
                  )}
                  {userInfo?.exp && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <Calendar className="w-3 h-3" />
                      <span>Member since {formatDate(userInfo.exp)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="px-6 py-4 space-y-1">
            <button
              onClick={() => {
                onOpenFavorites();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="p-2 bg-red-100 rounded-lg">
                <Heart className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Favorites</div>
                <div className="text-sm text-gray-500">Your saved places</div>
              </div>
            </button>

          </div>

          {/* Account Section */}
          <div className="px-6 py-4 border-t">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Account</h4>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50 rounded-lg transition-colors text-red-600"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>

          {/* App Info */}
          <div className="px-6 py-4 border-t">
            <div className="text-center text-xs text-gray-500">
              <p>MOP-Okinawa v1.0.1 (Beta)</p>
              <p className="mt-1">© 2024 MOP. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}