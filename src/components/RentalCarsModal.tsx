import React, { useRef, useEffect } from 'react';
import { X, Car } from 'lucide-react';
import { sendAffiliateLinkClickEvent } from '../utils/gtm';

interface RentalCarsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RentalCarsModal({ isOpen, onClose }: RentalCarsModalProps) {
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

  const handleRentalCarClick = () => {
    sendAffiliateLinkClickEvent(
      'https://www.anrdoezrs.net/click-101309942-10581071?url=https%3A%2F%2Fwww.expedia.com%2Fcarsearch%3Fdate1%3D5%252F13%252F2025%26date2%3D5%252F14%252F2025%26time1%3D1030AM%26time2%3D1030AM%26dpln%3D4279119%26locn%3DNaha%252C%2520Japan%2520%2528OKA%2529%26loc2%3D%26drid1%3D%26olat%3D26.206574%26olon%3D127.65113%26pickupCode%3DOKA%26aarpcr%3Doff%26useRewards%3D',
      'Rental Cars',
      'Rental Cars',
      'Rental Cars'
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-gray-700" />
            <h2 className="text-xl font-bold">Rental Cars</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="aspect-video rounded-lg overflow-hidden">
            <img
              src="https://d1inwaml4am0r3.cloudfront.net/downloaded_images/rental-car.jpg"
              alt="Rental Car in Okinawa"
              className="w-full h-full object-cover"
            />
          </div>

          <p className="text-gray-600">
            Need a car for your trip? Find the best rental deals easily and explore Okinawa at your own pace!
          </p>

          <a
            href="https://www.anrdoezrs.net/click-101309942-10581071?url=https%3A%2F%2Fwww.expedia.com%2Fcarsearch%3Fdate1%3D5%252F13%252F2025%26date2%3D5%252F14%252F2025%26time1%3D1030AM%26time2%3D1030AM%26dpln%3D4279119%26locn%3DNaha%252C%2520Japan%2520%2528OKA%2529%26loc2%3D%26drid1%3D%26olat%3D26.206574%26olon%3D127.65113%26pickupCode%3DOKA%26aarpcr%3Doff%26useRewards%3D"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full"
            onClick={handleRentalCarClick}
          >
            <button className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Find Rental Cars
            </button>
          </a>
        </div>
      </div>
    </div>
  );
}