import { useState, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

export type Language = 'en' | 'zh-TW';

export interface Translations {
  [key: string]: {
    en: string;
    'zh-TW': string;
  };
}

export const translations: Translations = {
  // Header
  'header.title': {
    en: 'MOP Okinawa',
    'zh-TW': 'MOP 沖繩'
  },
  'header.login': {
    en: 'Log in / Sign up',
    'zh-TW': '登入 / 註冊'
  },
  
  // Navigation buttons
  'nav.weather': {
    en: 'Weather',
    'zh-TW': '天氣'
  },
  'nav.favorites': {
    en: 'Favorites',
    'zh-TW': '我的最愛'
  },
  'nav.search': {
    en: 'Search',
    'zh-TW': '搜尋'
  },
  'nav.feedback': {
    en: 'Feedback',
    'zh-TW': '意見回饋'
  },
  'nav.settings': {
    en: 'Settings',
    'zh-TW': '設定'
  },
  'nav.rentalCars': {
    en: 'Rental Cars',
    'zh-TW': '租車'
  },
  'nav.filter': {
    en: 'Filter',
    'zh-TW': '篩選'
  },
  
  // Categories
  'category.touristAttractions': {
    en: 'Tourist Attractions',
    'zh-TW': '觀光景點'
  },
  'category.activity': {
    en: 'Activity',
    'zh-TW': '活動'
  },
  'category.hotels': {
    en: 'Hotels',
    'zh-TW': '飯店'
  },
  'category.restaurant': {
    en: 'Restaurant',
    'zh-TW': '餐廳'
  },
  'category.beaches': {
    en: 'Beaches',
    'zh-TW': '海灘'
  },
  'category.hospitals': {
    en: 'Hospitals',
    'zh-TW': '醫院'
  },
  'category.nahaAirport': {
    en: 'Naha Airport',
    'zh-TW': '那霸機場'
  },
  
  // Common actions
  'action.close': {
    en: 'Close',
    'zh-TW': '關閉'
  },
  'action.bookNow': {
    en: 'See Plans',
    'zh-TW': '查看詳情'
  },
  'action.details': {
    en: 'Details',
    'zh-TW': '詳細資訊'
  },
  'action.seeDetails': {
    en: 'See Details',
    'zh-TW': '查看詳情'
  },
  'action.direction': {
    en: 'Direction',
    'zh-TW': '路線'
  },
  'action.guideBook': {
    en: 'Guide Book',
    'zh-TW': '旅遊指南'
  },
  'action.guidebookButton': {
    en: 'Guidebook',
    'zh-TW': '旅遊指南'
  },
  
  // Messages
  'message.loadingData': {
    en: 'Loading data...',
    'zh-TW': '載入資料中...'
  },
  'message.addedToFavorites': {
    en: 'Added to favorites!',
    'zh-TW': '已加入收藏！'
  },
  'message.removedFromFavorites': {
    en: 'Removed from favorites',
    'zh-TW': '已從收藏中移除'
  },
  'message.loginToAddFavorites': {
    en: 'Please log in to add favorites',
    'zh-TW': '請登入以新增收藏'
  },
  
  // Language names
  'language.english': {
    en: 'English',
    'zh-TW': 'English'
  },
  'language.traditionalChinese': {
    en: '繁體中文',
    'zh-TW': '繁體中文'
  },
  
  // Settings
  'settings.title': {
    en: 'Settings',
    'zh-TW': '設定'
  },
  'settings.showMarkerTitles': {
    en: 'Show Marker Titles',
    'zh-TW': '顯示標記標題'
  },
  'settings.showMarkerTitlesDescription': {
    en: 'Display location names above map markers',
    'zh-TW': '在地圖標記上方顯示地點名稱'
  },
  'settings.termsOfUse': {
    en: 'Terms of Use',
    'zh-TW': '服務條款'
  },

  // Welcome Modal
  'welcome.title': {
    en: 'Make Your Okinawa Trip More Free',
    'zh-TW': '讓沖繩之旅更自由'
  },
  'welcome.description': {
    en: 'MOP is a guide map application that supports tourism in Okinawa. You can easily find information on sightseeing spots, hotels, and activities, and make reservations or purchases on the spot. MOP will provide comprehensive assistance for your trip to Okinawa.',
    'zh-TW': 'MOP是一款支援沖繩觀光的導覽地圖應用程式。您可以輕鬆地找到觀光景點、飯店和活動的資訊，並當場進行預約或購買。MOP將為您的沖繩之旅提供全面的協助。'
  }
};

// Detect browser language
const detectBrowserLanguage = (): Language => {
  const browserLang = navigator.language || navigator.languages?.[0];
  if (browserLang?.startsWith('zh')) {
    return 'zh-TW';
  }
  return 'en';
};

// Create a global state for language changes
let globalLanguageState: Language = detectBrowserLanguage();
const languageListeners: Set<() => void> = new Set();

export function useLanguage() {
  const [storedLanguage, setStoredLanguage] = useLocalStorage<Language>('language', detectBrowserLanguage());
  const [currentLanguage, setCurrentLanguage] = useState<Language>(storedLanguage);

  // Initialize global state
  useEffect(() => {
    globalLanguageState = storedLanguage;
    setCurrentLanguage(storedLanguage);
  }, [storedLanguage]);

  // Subscribe to global language changes
  useEffect(() => {
    const listener = () => {
      setCurrentLanguage(globalLanguageState);
    };
    
    languageListeners.add(listener);
    
    return () => {
      languageListeners.delete(listener);
    };
  }, []);

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    return translation[currentLanguage] || translation.en || key;
  };

  const changeLanguage = (newLanguage: Language) => {
    globalLanguageState = newLanguage;
    setStoredLanguage(newLanguage);
    setCurrentLanguage(newLanguage);
    
    // Notify all listeners
    languageListeners.forEach(listener => listener());
  };

  return {
    language: currentLanguage,
    changeLanguage,
    t
  };
}