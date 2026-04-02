import React, { useRef, useEffect } from 'react';
import { X, Facebook } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Feedback</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center">
          <a
            href="https://www.facebook.com/groups/1078308214094194"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block"
          >
            <div className="animate-[shake_0.5s_ease-in-out] relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#1877F2] to-[#0C63D4] p-4 shadow-lg">
                <div className="w-full h-full bg-white rounded-xl flex items-center justify-center">
                  <Facebook className="w-10 h-10 text-[#1877F2]" />
                </div>
              </div>
              <div className="absolute -bottom-1 inset-x-0 h-3 bg-gradient-to-t from-black/10 to-transparent rounded-full blur-sm"></div>
            </div>
          </a>
          
          <div className="mt-6 space-y-2 text-gray-700">
            <p className="font-medium">💬 Have feedback or ideas for MOP?</p>
            <p className="text-sm">
              Join our Okinawa Travel Community on Facebook! Share your thoughts, suggestions, and travel experiences with other explorers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}