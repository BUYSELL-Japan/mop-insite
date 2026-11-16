import React, { useRef, useEffect } from 'react';
import { X, Car } from 'lucide-react';
import { sendAffiliateLinkClickEvent } from '../utils/gtm';

// Expedia car search at Naha Airport via CJ. Pickup is two weeks from today (one-day rental),
// so the link never opens a search for dates in the past.
const CJ_CLICK_URL = 'https://www.anrdoezrs.net/click-101309942-10581071';

const formatUsDate = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
// encodeURIComponent leaves ( ) as is; Expedia's own links have them encoded
const encode = (v: string) =>
  encodeURIComponent(v).replace(/[()]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());

export function buildRentalCarUrl(now: Date = new Date(), daysAhead = 14): string {
  const pickup = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysAhead);
  const dropoff = new Date(pickup.getFullYear(), pickup.getMonth(), pickup.getDate() + 1);
  const params: [string, string][] = [
    ['date1', formatUsDate(pickup)], ['date2', formatUsDate(dropoff)],
    ['time1', '1030AM'], ['time2', '1030AM'],
    ['dpln', '4279119'], ['locn', 'Naha, Japan (OKA)'], ['loc2', ''], ['drid1', ''],
    ['olat', '26.206574'], ['olon', '127.65113'], ['pickupCode', 'OKA'], ['aarpcr', 'off'], ['useRewards', ''],
  ];
  const expediaUrl = 'https://www.expedia.com/carsearch?' + params.map(([k, v]) => `${k}=${encode(v)}`).join('&');
  return `${CJ_CLICK_URL}?url=${encode(expediaUrl)}`;
}

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

  const rentalCarUrl = buildRentalCarUrl();

  const handleRentalCarClick = () => {
    sendAffiliateLinkClickEvent(
      rentalCarUrl,
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
            href={rentalCarUrl}
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