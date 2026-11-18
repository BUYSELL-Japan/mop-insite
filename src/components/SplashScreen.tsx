import React, { useEffect, useMemo, useState } from 'react';

const SEASON_BG_BASE = 'https://s3geojsonnew.s3.ap-southeast-2.amazonaws.com/bg';

// 月(1〜12) → 季節別トップ画像
const seasonImageForMonth = (month: number): string => {
  if (month >= 3 && month <= 5) return `${SEASON_BG_BASE}/season-spring.jpg`;
  if (month >= 6 && month <= 9) return `${SEASON_BG_BASE}/season-summer.jpg`;
  if (month >= 10 && month <= 11) return `${SEASON_BG_BASE}/season-autumn.jpg`;
  return `${SEASON_BG_BASE}/season-winter.jpg`; // 12〜2月
};

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  // マウント時の現在月で決定（S3側は max-age=1年なのでキャッシュバスターは付けない）
  const splashImage = useMemo(() => seasonImageForMonth(new Date().getMonth() + 1), []);

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