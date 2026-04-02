import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useWindowSize } from '../hooks/useWindowSize';
import { useLanguage } from '../hooks/useLanguage';

interface WeatherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WeatherModal({ isOpen, onClose }: WeatherModalProps) {
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const { language } = useLanguage();

  useEffect(() => {
    if (isOpen) {
      // Remove existing script if any
      const existingScript = document.getElementById('weatherwidget-io-js');
      if (existingScript) {
        existingScript.remove();
      }

      // Add new script
      const script = document.createElement('script');
      script.textContent = `!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0];if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src='https://weatherwidget.io/js/widget.min.js';fjs.parentNode.insertBefore(js,fjs);}}(document,'script','weatherwidget-io-js');`;
      document.body.appendChild(script);

      return () => {
        const scriptToRemove = document.getElementById('weatherwidget-io-js');
        if (scriptToRemove) {
          scriptToRemove.remove();
        }
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed z-[9999] animate-fade-in ${
        isMobile 
          ? 'inset-x-2 top-20 max-w-[320px] mx-auto' 
          : 'top-20 right-4'
      }`}
      style={{
        animation: 'fadeIn 0.2s ease-in-out',
      }}
    >
      <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${
        isMobile ? 'w-full h-[300px]' : 'w-[400px] h-[300px]'
      }`}>
        <div className="flex justify-between items-center p-1.5 border-b">
          <h2 className="text-sm font-semibold text-gray-700">Okinawa Weather</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        
        <div className="w-full h-[calc(100%-32px)]">
          {language === 'zh-TW' ? (
            <a
              className="weatherwidget-io"
              href="https://forecast7.com/en/26d21127d68/okinawa-prefecture/"
              data-label_1="OKINAWA"
              data-label_2="WEATHER"
              data-theme="orange"
            >
              OKINAWA WEATHER
            </a>
          ) : (
            <a
              className="weatherwidget-io"
              href="https://forecast7.com/en/26d21127d68/okinawa-prefecture/?unit=us"
              data-label_1="OKINAWA"
              data-label_2="WEATHER"
              data-theme="original"
            >
              OKINAWA WEATHER
            </a>
          )}
        </div>
      </div>
    </div>
  );
}