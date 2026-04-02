import React, { useEffect, useState } from 'react';
import { useWindowSize } from '../hooks/useWindowSize';

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const { width } = useWindowSize();
  const isMobile = width < 768;

  // デバイス別の画像URL（キャッシュバスターを追加）
  const timestamp = Date.now();
  const splashImage = isMobile 
    ? `https://s3geojsonnew.s3.ap-southeast-2.amazonaws.com/PWA%E3%82%A2%E3%82%A4%E3%82%B3%E3%83%B3/Splushphone9.6.webp?v=${timestamp}`
    : `https://s3geojsonnew.s3.ap-southeast-2.amazonaws.com/PWA%E3%82%A2%E3%82%A4%E3%82%B3%E3%83%B3/Splashtablet9.6.webp?v=${timestamp}`;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onFinish, 1000); // Increased fade-out duration to 1 second
    }, 3000); // Increased display time to 3 seconds

    return () => clearTimeout(timer);
  }, [onFinish]);

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 bg-white z-[9999] flex items-center justify-center transition-opacity duration-1000"
      style={{ opacity: isVisible ? 1 : 0 }}
    >
      <div className="w-full h-full relative">
        <img
          src={splashImage}
          alt="MOP Splash"
          className="w-full h-full object-cover object-center"
          onError={(e) => {
            // フォールバック画像
            const target = e.target as HTMLImageElement;
            target.src = "https://s3geojsonnew.s3.ap-southeast-2.amazonaws.com/PWAアイコン/mop192beta.png";
            target.className = "w-24 h-24 object-contain mx-auto mt-[50vh] transform -translate-y-12";
          }}
        />
      </div>
    </div>
  );
}