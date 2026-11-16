import { useState, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

export type Language = 'en' | 'zh-TW' | 'ko';

export interface Translations {
  [key: string]: {
    en: string;
    'zh-TW': string;
    ko: string;
  };
}

export const translations: Translations = {
  // Header
  'header.title': {
    en: 'MOP Okinawa',
    'zh-TW': 'MOP 沖繩',
    ko: 'MOP 오키나와'
  },
  'header.login': {
    en: 'Log in / Sign up',
    'zh-TW': '登入 / 註冊',
    ko: '로그인 / 회원가입'
  },
  
  // Navigation buttons
  'nav.weather': {
    en: 'Weather',
    'zh-TW': '天氣',
    ko: '날씨'
  },
  'nav.favorites': {
    en: 'Favorites',
    'zh-TW': '我的最愛',
    ko: '즐겨찾기'
  },
  'nav.search': {
    en: 'Search',
    'zh-TW': '搜尋',
    ko: '검색'
  },
  'nav.feedback': {
    en: 'Feedback',
    'zh-TW': '意見回饋',
    ko: '피드백'
  },
  'nav.settings': {
    en: 'Settings',
    'zh-TW': '設定',
    ko: '설정'
  },
  'nav.rentalCars': {
    en: 'Rental Cars',
    'zh-TW': '租車',
    ko: '렌터카'
  },
  'nav.filter': {
    en: 'Filter',
    'zh-TW': '篩選',
    ko: '필터'
  },
  
  // Categories
  'category.touristAttractions': {
    en: 'Tourist Attractions',
    'zh-TW': '觀光景點',
    ko: '관광지'
  },
  'category.activity': {
    en: 'Activity',
    'zh-TW': '活動',
    ko: '액티비티'
  },
  'category.hotels': {
    en: 'Hotels',
    'zh-TW': '飯店',
    ko: '호텔'
  },
  'category.restaurant': {
    en: 'Restaurant',
    'zh-TW': '餐廳',
    ko: '음식점'
  },
  'category.beaches': {
    en: 'Beaches',
    'zh-TW': '海灘',
    ko: '해변'
  },
  'category.hospitals': {
    en: 'Hospitals',
    'zh-TW': '醫院',
    ko: '병원'
  },
  'category.nahaAirport': {
    en: 'Naha Airport',
    'zh-TW': '那霸機場',
    ko: '나하 공항'
  },
  
  // Common actions
  'action.close': {
    en: 'Close',
    'zh-TW': '關閉',
    ko: '닫기'
  },
  'action.bookNow': {
    en: 'See Plans',
    'zh-TW': '查看詳情',
    ko: '플랜 보기'
  },
  'action.details': {
    en: 'Details',
    'zh-TW': '詳細資訊',
    ko: '상세 정보'
  },
  'action.seeDetails': {
    en: 'See Details',
    'zh-TW': '查看詳情',
    ko: '자세히 보기'
  },
  'action.direction': {
    en: 'Direction',
    'zh-TW': '路線',
    ko: '길찾기'
  },
  'action.guideBook': {
    en: 'Guide Book',
    'zh-TW': '旅遊指南',
    ko: '가이드북'
  },
  'action.guidebookButton': {
    en: 'Guidebook',
    'zh-TW': '旅遊指南',
    ko: '가이드북'
  },
  
  // Messages
  'message.loadingData': {
    en: 'Loading data...',
    'zh-TW': '載入資料中...',
    ko: '데이터를 불러오는 중...'
  },
  'message.addedToFavorites': {
    en: 'Added to favorites!',
    'zh-TW': '已加入收藏！',
    ko: '즐겨찾기에 추가했습니다!'
  },
  'message.removedFromFavorites': {
    en: 'Removed from favorites',
    'zh-TW': '已從收藏中移除',
    ko: '즐겨찾기에서 삭제했습니다'
  },
  'message.loginToAddFavorites': {
    en: 'Please log in to add favorites',
    'zh-TW': '請登入以新增收藏',
    ko: '즐겨찾기에 추가하려면 로그인해 주세요'
  },
  
  // Language names
  'language.english': {
    en: 'English',
    'zh-TW': 'English',
    ko: 'English'
  },
  'language.traditionalChinese': {
    en: '繁體中文',
    'zh-TW': '繁體中文',
    ko: '繁體中文'
  },
  
  // Settings
  'settings.title': {
    en: 'Settings',
    'zh-TW': '設定',
    ko: '설정'
  },
  'settings.showMarkerTitles': {
    en: 'Show Marker Titles',
    'zh-TW': '顯示標記標題',
    ko: '마커 이름 표시'
  },
  'settings.showMarkerTitlesDescription': {
    en: 'Display location names above map markers',
    'zh-TW': '在地圖標記上方顯示地點名稱',
    ko: '지도 마커 위에 장소 이름을 표시합니다'
  },
  'settings.termsOfUse': {
    en: 'Terms of Use',
    'zh-TW': '服務條款',
    ko: '이용약관'
  },

  // Welcome Modal
  'welcome.title': {
    en: 'Make Your Okinawa Trip More Free',
    'zh-TW': '讓沖繩之旅更自由',
    ko: '오키나와 여행을 더 자유롭게'
  },
  'welcome.description': {
    en: 'MOP is a guide map application that supports tourism in Okinawa. You can easily find information on sightseeing spots, hotels, and activities, and make reservations or purchases on the spot. MOP will provide comprehensive assistance for your trip to Okinawa.',
    'zh-TW': 'MOP是一款支援沖繩觀光的導覽地圖應用程式。您可以輕鬆地找到觀光景點、飯店和活動的資訊，並當場進行預約或購買。MOP將為您的沖繩之旅提供全面的協助。',
    ko: 'MOP는 오키나와 관광을 돕는 가이드 지도 앱입니다. 관광 명소, 호텔, 액티비티 정보를 쉽게 찾고, 그 자리에서 예약하거나 구매할 수 있습니다. MOP가 여러분의 오키나와 여행을 든든하게 도와드립니다.'
  },
  'language.korean': {
    en: '한국어',
    'zh-TW': '한국어',
    ko: '한국어'
  },
  'message.favoritesUpdateFailed': {
    en: 'Failed to update favorites',
    'zh-TW': '無法更新收藏',
    ko: '즐겨찾기를 업데이트하지 못했습니다'
  },
  'favorites.add': {
    en: 'Add to favorites',
    'zh-TW': '加入收藏',
    ko: '즐겨찾기에 추가'
  },
  'favorites.remove': {
    en: 'Remove from favorites',
    'zh-TW': '從收藏中移除',
    ko: '즐겨찾기에서 삭제'
  },
  'favorites.empty': {
    en: 'No favorites yet',
    'zh-TW': '尚無收藏',
    ko: '아직 즐겨찾기가 없습니다'
  },
  'favorites.emptyHint': {
    en: 'Start adding your favorite places!',
    'zh-TW': '開始收藏您喜愛的地點吧！',
    ko: '마음에 드는 장소를 추가해 보세요!'
  },
  'feedback.heading': {
    en: '💬 Have feedback or ideas for MOP?',
    'zh-TW': '💬 對 MOP 有任何意見或想法嗎？',
    ko: '💬 MOP에 대한 의견이나 아이디어가 있으신가요?'
  },
  'feedback.body': {
    en: 'Join our Okinawa Travel Community on Facebook! Share your thoughts, suggestions, and travel experiences with other explorers.',
    'zh-TW': '歡迎加入我們在 Facebook 的沖繩旅遊社團！與其他旅人分享您的想法、建議與旅遊經驗。',
    ko: 'Facebook의 오키나와 여행 커뮤니티에 참여해 보세요! 다른 여행자들과 생각, 제안, 여행 경험을 나눌 수 있습니다.'
  },
  'rentalCars.description': {
    en: 'Need a car for your trip? Find the best rental deals easily and explore Okinawa at your own pace!',
    'zh-TW': '旅途中需要用車嗎？輕鬆找到最划算的租車方案，依照自己的步調探索沖繩！',
    ko: '여행 중에 차가 필요하신가요? 렌터카 특가를 쉽게 찾고 나만의 속도로 오키나와를 둘러보세요!'
  },
  'rentalCars.button': {
    en: 'Find Rental Cars',
    'zh-TW': '搜尋租車',
    ko: '렌터카 찾기'
  },
  'search.placeholder': {
    en: 'Search locations...',
    'zh-TW': '搜尋地點...',
    ko: '장소 검색...'
  },
  'weather.title': {
    en: 'Okinawa Weather',
    'zh-TW': '沖繩天氣',
    ko: '오키나와 날씨'
  },
  'profile.title': {
    en: 'My Page',
    'zh-TW': '我的頁面',
    ko: '마이페이지'
  },
  'profile.favoritesDescription': {
    en: 'Your saved places',
    'zh-TW': '已收藏的地點',
    ko: '저장한 장소'
  },
  'profile.account': {
    en: 'Account',
    'zh-TW': '帳戶',
    ko: '계정'
  },
  'profile.signOut': {
    en: 'Sign Out',
    'zh-TW': '登出',
    ko: '로그아웃'
  },
  'map.currentLocation': {
    en: 'Current Location',
    'zh-TW': '目前位置',
    ko: '현재 위치'
  },
  'map.moveToCurrentLocation': {
    en: 'Move to current location',
    'zh-TW': '移動到目前位置',
    ko: '현재 위치로 이동'
  },
  'map.moveToCenter': {
    en: 'Move to center of Okinawa',
    'zh-TW': '移動到沖繩中心',
    ko: '오키나와 중심으로 이동'
  }
};

// Detect browser language
const detectBrowserLanguage = (): Language => {
  const browserLang = navigator.language || navigator.languages?.[0];
  if (browserLang?.startsWith('zh')) {
    return 'zh-TW';
  }
  if (browserLang?.startsWith('ko')) {
    return 'ko';
  }
  return 'en';
};

// ?lang= from links into the map (SSG spot / restaurant pages, guidebook): en, zh, zh-TW, ko
export const parseLanguageParam = (value: string | null): Language | null => {
  const v = value?.trim().toLowerCase();
  if (v === 'en') return 'en';
  if (v === 'zh' || v === 'zh-tw') return 'zh-TW';
  if (v === 'ko') return 'ko';
  return null;
};

// Read once at load: the link's language wins over the saved choice and becomes the saved choice.
// `lang` is then removed from the address bar so a later reload keeps the user's own switch.
const urlLanguage: Language | null = (() => {
  if (typeof window === 'undefined') return null;
  const url = new URL(window.location.href);
  const lang = parseLanguageParam(url.searchParams.get('lang'));
  if (url.searchParams.has('lang')) {
    url.searchParams.delete('lang');
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
  }
  if (lang) {
    try {
      window.localStorage.setItem('language', JSON.stringify(lang));
    } catch {
      // storage unavailable: the language still applies through the initial value
    }
  }
  return lang;
})();

const initialLanguage = (): Language => urlLanguage || detectBrowserLanguage();

// Create a global state for language changes
let globalLanguageState: Language = initialLanguage();
const languageListeners: Set<() => void> = new Set();

export function useLanguage() {
  const [storedLanguage, setStoredLanguage] = useLocalStorage<Language>('language', initialLanguage());
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