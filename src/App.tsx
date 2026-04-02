import React, { useState, useRef, useEffect } from 'react';
import Map from './components/Map';
import CategoryFilter from './components/CategoryFilter';
import WeatherModal from './components/WeatherModal';
import SearchModal from './components/SearchModal';
import Settings from './components/Settings';
import FeedbackModal from './components/FeedbackModal';
import FavoritesModal from './components/FavoritesModal';
import RentalCarsModal from './components/RentalCarsModal';
import SplashScreen from './components/SplashScreen';
import WelcomeModal from './components/WelcomeModal';
import UserProfile from './components/UserProfile';
import LanguageSelector from './components/LanguageSelector';
import { MapPin, Cloud, Search, Settings as SettingsIcon, MessageCircle, Heart, LogIn, Car, User } from 'lucide-react';
import { Book } from 'lucide-react';
import { useLanguage } from './hooks/useLanguage';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useWindowSize } from './hooks/useWindowSize';
import { useAnalytics } from './hooks/useAnalytics';
import { useViewportTracking } from './hooks/useViewportTracking';
import { Location } from './types/location';
import { validateEnv } from './utils/envValidation';
import { exchangeCodeForTokens, parseJwt, getFavorites, checkAndRefreshTokens } from './utils/auth';

const LOGIN_URL = `https://ap-southeast-2usngbi9wi.auth.ap-southeast-2.amazoncognito.com/login?client_id=12nf22nqg8mpcq1q77nm5uqbls&response_type=code&scope=email+openid&redirect_uri=${encodeURIComponent(window.location.origin)}`;

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [hasSeenWelcome, setHasSeenWelcome] = useLocalStorage('hasSeenWelcome', false);
  const { t, language, changeLanguage } = useLanguage();
  const env = validateEnv();

  const { trackSpotView } = useAnalytics();
  useViewportTracking(true);
  const [geojsonUrl] = useLocalStorage('geojsonUrl', env.VITE_GEOJSON_URL);
  const [selectedCategories, setSelectedCategories] = useLocalStorage('selectedCategories', ['1', '9']);
  const [showMarkerTitles, setShowMarkerTitles] = useLocalStorage('showMarkerTitles', true);
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isRentalCarsOpen, setIsRentalCarsOpen] = useState(false);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const mapRef = useRef<any>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [favorites, setFavorites] = useState<Location[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [pendingLocationOpen, setPendingLocationOpen] = useState<Location | null>(null);

  const refreshFavorites = async () => {
    if (isAuthenticated && locations.length > 0) {
      try {
        const favoritePinIds = await getFavorites();
        const favoriteLocations = locations.filter(location => 
          favoritePinIds.includes(location.properties.pin_id)
        );
        setFavorites(favoriteLocations);
        return favoritePinIds;
      } catch (error) {
        console.error('Error refreshing favorites:', error);
        return [];
      }
    }
    return [];
  };

  // Handle URL query parameters for pin_id only
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pinId = urlParams.get('pin_id');

    // Store pin_id for later use after locations are loaded
    if (pinId) {
      sessionStorage.setItem('pending_pin_id', pinId);
    }
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      exchangeCodeForTokens(code)
        .then(tokens => {
          localStorage.setItem('access_token', tokens.access_token);
          localStorage.setItem('id_token', tokens.id_token);
          localStorage.setItem('refresh_token', tokens.refresh_token);
          localStorage.setItem('token_expiry', (Date.now() + tokens.expires_in * 1000).toString());
          
          const decodedToken = parseJwt(tokens.id_token);
          if (decodedToken?.sub) {
            localStorage.setItem('sub', decodedToken.sub);
            setUserInfo(decodedToken);
          }
          
          setIsAuthenticated(true);
          
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        })
        .catch(error => {
          console.error('Authentication error:', error);
        });
    } else {
      const checkAuth = async () => {
        const isValid = await checkAndRefreshTokens();
        setIsAuthenticated(isValid);
        
        if (isValid) {
          const idToken = localStorage.getItem('id_token');
          if (idToken) {
            const decodedToken = parseJwt(idToken);
            setUserInfo(decodedToken);
          }
        }
      };
      checkAuth();
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && locations.length > 0) {
      refreshFavorites();
    }
  }, [isAuthenticated, locations]);

  // Handle pin_id navigation after locations are loaded
  useEffect(() => {
    const pendingPinId = sessionStorage.getItem('pending_pin_id');
    if (pendingPinId && locations.length > 0) {
      const targetLocation = locations.find(
        loc => loc.properties.pin_id === pendingPinId || loc.properties.item_id === pendingPinId
      );

      if (targetLocation) {
        // Auto-select the category if needed
        const categoryId = targetLocation.properties.category_id;
        if (!selectedCategories.includes(categoryId)) {
          handleCategoryAutoSelect(categoryId);
        }

        // Navigate to the location
        setTimeout(() => {
          handleLocationSelect(targetLocation);
        }, 500);

        // Clear the pending pin_id
        sessionStorage.removeItem('pending_pin_id');
      }
    }
  }, [locations, selectedCategories]);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      }
      return [...prev, categoryId];
    });
  };

  const handleLocationSelect = (location: Location) => {
    console.log('Location selected programmatically:', location.properties.title);

    trackSpotView(location.properties.title);

    const categoryId = location.properties.category_id;
    const isCategorySelected = selectedCategories.includes(categoryId);

    if (!isCategorySelected) {
      setPendingLocationOpen(location);
    }

    if (mapRef.current) {
      const { current: map } = mapRef;
      map.flyTo(
        [location.geometry.coordinates[1], location.geometry.coordinates[0]],
        16,
        {
          duration: 1.5,
        }
      );

      if (isCategorySelected) {
        setTimeout(() => {
          map.openPopup(
            [location.geometry.coordinates[1], location.geometry.coordinates[0]]
          );
        }, 1600);
      }
    }
  };

  const handleCategoryAutoSelect = (categoryId: string) => {
    setSelectedCategories((prev) => {
      if (!prev.includes(categoryId)) {
        return [...prev, categoryId];
      }
      return prev;
    });
  };

  // Effect to open popup after category is auto-selected and map is re-rendered
  useEffect(() => {
    if (pendingLocationOpen && mapRef.current) {
      const categoryId = pendingLocationOpen.properties.category_id;
      const isCategoryNowSelected = selectedCategories.includes(categoryId);

      if (isCategoryNowSelected) {
        // Category is now selected, wait for map to re-render and open popup
        const timer = setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.openPopup(
              [pendingLocationOpen.geometry.coordinates[1], pendingLocationOpen.geometry.coordinates[0]]
            );
          }
          setPendingLocationOpen(null);
        }, 500);

        return () => clearTimeout(timer);
      }
    }
  }, [selectedCategories, pendingLocationOpen]);

  const handleWelcomeClose = () => {
    setHasSeenWelcome(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserInfo(null);
    setFavorites([]);
  };

  const getDisplayName = () => {
    if (!userInfo) return '';
    return userInfo.name || userInfo.email?.split('@')[0] || 'User';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#aad3df]">
      <div className="p-3 md:p-6 relative z-[9999]">
        <div className="mb-3">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-6 h-6 md:w-8 md:h-8 text-red-600" />
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{t('header.title')}</h1>
            </div>
            
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <button
                  onClick={() => setIsUserProfileOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-white/30 hover:bg-white/95 transition-colors"
                >
                  {userInfo?.picture ? (
                    <img
                      src={userInfo.picture}
                      alt="Profile"
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                      {getInitials(getDisplayName())}
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                    {getDisplayName()}
                  </span>
                  <User className="w-4 h-4 text-gray-500 sm:hidden" />
                </button>
              ) : (
                <a
                  href={LOGIN_URL}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-400 text-white rounded-lg shadow-sm hover:bg-blue-500 transition-colors whitespace-nowrap text-xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{t('header.login')}</span>
                </a>
              )}
              
              <LanguageSelector />
            </div>
          </div>
          
          <div className={`${isMobile ? 'overflow-x-auto hide-scrollbar' : ''} -mx-3 md:-mx-6 px-3 md:px-6`}>
            <div 
              ref={scrollContainerRef}
              className={`flex gap-2 ${isMobile ? 'w-max pb-2 snap-x snap-mandatory' : 'flex-wrap'}`}
            >
              <div className={`${isMobile ? 'snap-center' : ''}`}>
                <CategoryFilter
                  selectedCategories={selectedCategories}
                  onCategoryToggle={handleCategoryToggle}
                  isMobile={isMobile}
                />
              </div>
              
              <div className={`${isMobile ? 'snap-center' : ''}`}>
                <button
                  className="flex items-center gap-1.5 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-white/30 hover:bg-white/95 transition-colors whitespace-nowrap text-sm min-h-[36px]"
                  onClick={() => setIsWeatherModalOpen(!isWeatherModalOpen)}
                >
                  <Cloud className="w-4 h-4 text-gray-500" />
                  <span>{t('nav.weather')}</span>
                </button>
              </div>

              <div className={`${isMobile ? 'snap-center' : ''}`}>
                <button
                  className="flex items-center gap-1.5 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-white/30 hover:bg-white/95 transition-colors whitespace-nowrap text-sm min-h-[36px]"
                  onClick={() => setIsFavoritesOpen(true)}
                >
                  <Heart className="w-4 h-4 text-gray-500" />
                  <span>{t('nav.favorites')}</span>
                </button>
              </div>

              <div className={`${isMobile ? 'snap-center' : ''}`}>
                <a
                  href={language === 'zh-TW' ? `${window.location.origin}/zh/guidebook/` : `${window.location.origin}/en/guidebook/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-white/30 hover:bg-white/95 transition-colors whitespace-nowrap text-sm min-h-[36px]"
                >
                  <Book className="w-4 h-4 text-gray-500" />
                  <span>{t('action.guideBook')}</span>
                </a>
              </div>

              <div className={`${isMobile ? 'snap-center' : ''}`}>
                <button
                  className="flex items-center gap-1.5 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-white/30 hover:bg-white/95 transition-colors whitespace-nowrap text-sm min-h-[36px]"
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                >
                  <Search className="w-4 h-4 text-gray-500" />
                  <span>{t('nav.search')}</span>
                </button>
              </div>

              <div className={`${isMobile ? 'snap-center' : ''}`}>
                <button
                  className="flex items-center gap-1.5 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-white/30 hover:bg-white/95 transition-colors whitespace-nowrap text-sm min-h-[36px]"
                  onClick={() => setIsFeedbackOpen(true)}
                >
                  <MessageCircle className="w-4 h-4 text-gray-500" />
                  <span>{t('nav.feedback')}</span>
                </button>
              </div>

              <div className={`${isMobile ? 'snap-center' : ''}`}>
                <button
                  className="flex items-center gap-1.5 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-white/30 hover:bg-white/95 transition-colors whitespace-nowrap text-sm min-h-[36px]"
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                >
                  <SettingsIcon className="w-4 h-4 text-gray-500" />
                  <span>{t('nav.settings')}</span>
                </button>
              </div>

              <div className={`${isMobile ? 'snap-center' : ''}`}>
                <button
                  className="flex items-center gap-1.5 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-white/30 hover:bg-white/95 transition-colors whitespace-nowrap text-sm min-h-[36px]"
                  onClick={() => setIsRentalCarsOpen(true)}
                >
                  <Car className="w-4 h-4 text-gray-500" />
                  <span>{t('nav.rentalCars')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <Map 
          ref={mapRef}
          geojsonUrl={geojsonUrl}
          selectedCategories={selectedCategories}
          onLocationsLoad={setLocations}
          showMarkerTitles={showMarkerTitles}
          onFavoritesChange={refreshFavorites}
        />
      </div>

      <WelcomeModal
        isOpen={!hasSeenWelcome}
        onClose={handleWelcomeClose}
      />

      <WeatherModal
        isOpen={isWeatherModalOpen}
        onClose={() => setIsWeatherModalOpen(false)}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        locations={locations}
        onLocationSelect={handleLocationSelect}
        onCategoryAutoSelect={handleCategoryAutoSelect}
      />

      <Settings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        showMarkerTitles={showMarkerTitles}
        onToggleMarkerTitles={setShowMarkerTitles}
      />

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />

      <FavoritesModal
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
        favorites={favorites}
        onFavoritesChange={refreshFavorites}
        onLocationSelect={handleLocationSelect}
        onCategoryAutoSelect={handleCategoryAutoSelect}
      />

      <RentalCarsModal
        isOpen={isRentalCarsOpen}
        onClose={() => setIsRentalCarsOpen(false)}
      />

      <UserProfile
        isOpen={isUserProfileOpen}
        onClose={() => setIsUserProfileOpen(false)}
        onLogout={handleLogout}
        onOpenFavorites={() => setIsFavoritesOpen(true)}
      />

    </div>
  );
}

export default App;