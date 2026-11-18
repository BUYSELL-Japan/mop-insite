import React, { useEffect, useMemo, useRef, useState } from 'react';

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

// Shown on the first visit only (App.tsx, mop_splash_shown). It closes SHOW_AFTER_LOAD_MS after the image
// has loaded, and never later than MAX_MS. (Before 2026-11-18 it always took 3 s plus a blank 1 s.)
const SHOW_AFTER_LOAD_MS = 1500;
const MAX_MS = 3000;

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [loaded, setLoaded] = useState(false);
  // マウント時の現在月で決定（S3側は max-age=1年なのでキャッシュバスターは付けない）
  const splashImage = useMemo(() => seasonImageForMonth(new Date().getMonth() + 1), []);
  // App passes a new onFinish on every render; keep the latest in a ref so re-renders don't restart the timers
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;

  useEffect(() => {
    const timer = setTimeout(() => finishRef.current(), MAX_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const timer = setTimeout(() => finishRef.current(), SHOW_AFTER_LOAD_MS);
    return () => clearTimeout(timer);
  }, [loaded]);

  return (
    <div className="fixed inset-0 bg-white z-[9999] flex items-center justify-center">
      <div className="w-full h-full relative">
        <img
          src={splashImage}
          alt="MOP Splash"
          className="w-full h-full object-cover object-center"
          onLoad={() => setLoaded(true)}
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