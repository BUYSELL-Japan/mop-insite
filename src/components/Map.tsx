import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import { Icon, LatLng, DivIcon } from 'leaflet';
import { GeoJSONData, Location, CATEGORIES } from '../types/location';
import { normalizeCategory } from '../utils/categoryNormalizer';
import { useWindowSize } from '../hooks/useWindowSize';
import { useLanguage } from '../hooks/useLanguage';
import { AlertTriangle, Crosshair, MapPin } from 'lucide-react';
import { createGeoJsonUrl } from '../utils/envValidation';
import { addToFavorites, deleteFavorite, getFavorites } from '../utils/auth';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { sendPinClickEvent, sendAffiliateLinkClickEvent, sendExternalLinkClickEvent, getCurrentLanguage } from '../utils/gtm';
import 'leaflet/dist/leaflet.css';
import 'leaflet-rotatedmarker';

const CENTER_COORDS: [number, number] = [26.4377575, 128.0118961];
const DEFAULT_ZOOM = 9;

const createIcon = (categoryId: string) => {
  const categoryData = CATEGORIES[categoryId] || CATEGORIES["1"];
  return new Icon({
    iconUrl: categoryData.markerUrl,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

const userLocationIcon = new DivIcon({
  className: '',
  html: `
    <div class="relative flex items-center justify-center">
      <div class="absolute w-12 h-12 bg-red-500 rounded-full opacity-20 animate-ping"></div>
      <div class="absolute w-12 h-12 bg-red-500 rounded-full opacity-30 animate-pulse"></div>
      <div class="relative w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg"></div>
    </div>
  `,
  iconSize: [48, 48],
  iconAnchor: [24, 24],
});

function MapController({ onGetMap }: { onGetMap: (map: any) => void }) {
  const map = useMap();
  
  useEffect(() => {
    onGetMap(map);
  }, [map, onGetMap]);
  
  return null;
}

interface MapProps {
  geojsonUrl: string;
  selectedCategories: string[];
  onLocationsLoad?: (locations: Location[]) => void;
  showMarkerTitles: boolean;
  onFavoritesChange?: () => Promise<void>;
}

interface MapRef {
  flyTo: (latLng: [number, number], zoom: number, options?: any) => void;
  openPopup: (latLng: [number, number]) => void;
}

const Map = forwardRef<MapRef, MapProps>(({ 
  geojsonUrl, 
  selectedCategories, 
  onLocationsLoad, 
  showMarkerTitles,
  onFavoritesChange 
}, ref) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const [map, setMap] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [favoriteStatus, setFavoriteStatus] = useState<{ [key: string]: boolean }>({});
  const [favoriteMessage, setFavoriteMessage] = useState<string | null>(null);
  const [animatingFavorite, setAnimatingFavorite] = useState<string | null>(null);
  const messageTimeoutRef = useRef<number>();
  const { t, language } = useLanguage();

  // ポップアップ開封時のイベントハンドラー
  const handlePopupOpen = (location: Location) => {
    console.log('Popup opened for:', location.properties.title);
    sendPinClickEvent(location.properties.title);
  };
  useEffect(() => {
    const syncFavoriteStatus = async () => {
      try {
        const favoritePinIds = await getFavorites();
        const newFavoriteStatus: { [key: string]: boolean } = {};
        
        locations.forEach(location => {
          const pinId = location.properties.pin_id;
          if (pinId) {
            newFavoriteStatus[pinId] = favoritePinIds.includes(pinId);
          }
        });
        
        setFavoriteStatus(newFavoriteStatus);
      } catch (error) {
        console.error('Error syncing favorite status:', error);
      }
    };

    if (locations.length > 0) {
      syncFavoriteStatus();
    }
  }, [locations]);

  const showMessage = (message: string) => {
    setFavoriteMessage(message);
    if (messageTimeoutRef.current) {
      window.clearTimeout(messageTimeoutRef.current);
    }
    messageTimeoutRef.current = window.setTimeout(() => {
      setFavoriteMessage(null);
    }, 3000);
  };

  useImperativeHandle(ref, () => ({
    flyTo: (latLng: [number, number], zoom: number, options?: any) => {
      if (map) {
        map.flyTo(latLng, zoom, options);
      }
    },
    openPopup: (latLng: [number, number]) => {
      if (map) {
        const targetMarker = filteredLocations.find(
          loc => 
            loc.geometry.coordinates[1] === latLng[0] && 
            loc.geometry.coordinates[0] === latLng[1]
        );
        
        if (targetMarker) {
          // プログラム的にポップアップを開く時もイベントを送信
          handlePopupOpen(targetMarker);
          const popup = new LatLng(latLng[0], latLng[1]);
          map.openPopup(
            createPopupContent(targetMarker),
            popup
          );
        }
      }
    }
  }));

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const url = createGeoJsonUrl(geojsonUrl);
        
        console.log('Fetching GeoJSON data:', {
          originalUrl: geojsonUrl,
          finalUrl: url.toString(),
          timestamp: new Date().toISOString()
        });

        const response = await fetch(url.toString(), {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Surrogate-Control': 'no-store'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to load data (${response.status}): ${response.statusText}`);
        }

        const data: GeoJSONData = await response.json();
        
        if (!data?.features?.length) {
          throw new Error('Invalid GeoJSON format: No features found');
        }

        const normalizedLocations = data.features.map(location => normalizeCategory(location, language));
        setLocations(normalizedLocations);
        if (onLocationsLoad) {
          onLocationsLoad(normalizedLocations);
        }
      } catch (err) {
        console.error('Error fetching locations:', {
          error: err instanceof Error ? err.message : 'Unknown error',
          url: geojsonUrl
        });
        setError(err instanceof Error ? err.message : 'Failed to load data');
        setLocations([]);
      } finally {
        setLoading(false);
      }
    };

    if (geojsonUrl) {
      fetchLocations();
    }
  }, [geojsonUrl, onLocationsLoad, language]);

  useEffect(() => {
    setFilteredLocations(
      locations.filter(location => 
        selectedCategories.includes(location.properties.category_id || "1")
      )
    );
  }, [locations, selectedCategories]);

  const moveToCurrentLocation = () => {
    if (!map) return;

    if (!navigator.geolocation) {
      setLocationError('Your browser does not support geolocation');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        map.flyTo([latitude, longitude], 16);
        setLocationError(null);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationError('Failed to get your location');
        setUserLocation(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  };

  const moveToCenter = () => {
    if (map) {
      map.flyTo(CENTER_COORDS, DEFAULT_ZOOM);
    }
  };

  const getDirectionsUrl = (lat: number, lng: number): string => {
    // 常に新しいタブで開き、現在地からのルートをGoogleマップ側で計算させる
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  };

  const normalizeMopUrl = (url: string): string => {
    if (!url) return url;
    try {
      // ドメイン部分を現在の環境に合わせて動的に置換
      const currentOrigin = window.location.origin;
      return url
        .replace(/^https?:\/\/(?:www\.)?mop-okinawa\.com/g, currentOrigin)
        .replace(/^https?:\/\/(?:www\.)?mop-insite\.com/g, currentOrigin);
    } catch (e) {
      console.error('URL normalization error:', e);
      return url;
    }
  };

  const extractUrl = (description: string): string | null => {
    if (!description) return null;

    const cleanText = description
      .replace(/<[^>]+>/g, '')
      .replace(/&[^;]+;/g, '');

    // Language-specific URL extraction
    const fieldName = language === 'zh-TW' ? 'affiliate_link_tw' : 'affiliate_link';
    
    // First try to extract from specific field pattern
    const fieldRegex = new RegExp(`${fieldName}:\\s*(https?://[^\\s\\]]+)`, 'i');
    const fieldMatch = cleanText.match(fieldRegex);
    
    if (fieldMatch) {
      return fieldMatch[1];
    }
    
    // Fallback to general URL extraction
    const urlRegex = /(?:https?:\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)/i;
    const match = cleanText.match(urlRegex);

    if (!match) return null;

    let url = match[0];
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }

    return url;
  };

  const escapeHtml = (text: string): string => {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  };

  const unescapeHtml = (text: string): string => {
    const map: { [key: string]: string } = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#039;': "'"
    };
    return text.replace(/&amp;|&lt;|&gt;|&quot;|&#039;/g, (m) => map[m]);
  };

  const getLocalizedDescription = (location: Location): string => {
    const props = location.properties;

    // Get description based on current language
    switch (language) {
      case 'ja':
        return props.description_ja || props.description || '';
      case 'zh-TW':
        return props.description_zh_tw || props.description || '';
      case 'ko':
        return props.description_ko || props.description || '';
      case 'en':
      default:
        return props.description_en || props.description || '';
    }
  };

  const getCleanDescription = (description: string): string => {
    if (!description) return '';

    // Convert URLs to clickable links
    let processed = description
      .replace(/<[^>]+>/g, '') // Remove HTML tags
      .replace(/&[^;]+;/g, '') // Remove HTML entities
      .replace(/\[.*?\]/g, '') // Remove square brackets content
      .replace(/［.*?］/g, '') // Remove full-width square brackets content
      .replace(/【.*?】/g, ''); // Remove 【】 brackets content

    // Convert URLs to HTML links
    processed = processed.replace(
      /\b(https?:\/\/[^\s]+)\b/gi,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline break-all">$1</a>'
    );

    return processed
      .replace(/\s+/g, ' ')
      .trim();
  };

  const getButtonText = (categoryId: string): string => {
    switch (categoryId) {
      case "4":
        return t('action.seeDetails');
      default:
        return t('action.bookNow');
    }
  };

  const handleFavoriteClick = async (pinId: string) => {
    const idToken = localStorage.getItem('id_token');
    if (!idToken) {
      showMessage('Please log in to add favorites');
      return;
    }

    try {
      const isFavorite = favoriteStatus[pinId];
      if (isFavorite) {
        await deleteFavorite(pinId);
        setFavoriteStatus(prev => ({ ...prev, [pinId]: false }));
        showMessage(t('message.removedFromFavorites'));
      } else {
        await addToFavorites(pinId);
        setFavoriteStatus(prev => ({ ...prev, [pinId]: true }));
        showMessage(t('message.addedToFavorites'));
        setAnimatingFavorite(pinId);
        setTimeout(() => setAnimatingFavorite(null), 300);
      }
      
      if (onFavoritesChange) {
        await onFavoritesChange();
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'User not authenticated') {
        showMessage(t('message.loginToAddFavorites'));
      } else {
        showMessage('Failed to update favorites');
      }
    }
  };

  const createPopupContent = (location: Location) => {
    const categoryId = location.properties.category_id || "1";
    const category = CATEGORIES[categoryId];
    const categoryName = t(category.nameKey); // Get localized category name

    // Get localized description based on current language
    const description = getLocalizedDescription(location);

    // Get affiliate link directly from properties based on language
    const url = language === 'zh-TW'
      ? (location.properties.affiliate_link_tw || location.properties.affiliate_link)
      : location.properties.affiliate_link;

    // Get guidebook URL based on language and normalize it
    const rawGuidebookUrl = language === 'zh-TW'
      ? location.properties.guidebook_url_tw
      : location.properties.guidebook_url_en;
    const guidebookUrl = normalizeMopUrl(rawGuidebookUrl || '');

    const cleanDescription = getCleanDescription(description);
    const lat = location.geometry.coordinates[1];
    const lng = location.geometry.coordinates[0];
    const directionsUrl = getDirectionsUrl(lat, lng);
    const imageUrl = location.properties.pic;
    const pinId = location.properties.pin_id;
    const isAnimating = animatingFavorite === pinId;
    const isFavorite = favoriteStatus[pinId] || false;

    return `
      <div class="${isMobile ? 'p-2 max-w-[240px]' : 'p-3 max-w-[360px]'}">
        <h3 class="${isMobile ? 'text-base' : 'text-lg'} font-bold mb-2">
          ${location.properties.title}
        </h3>
        <div class="flex items-center gap-1.5 mb-2 bg-gray-50 p-1.5 rounded">
          <div class="w-3 h-4 relative">
            <img 
              src="${category.markerUrl}"
              alt="${category.name}"
              class="w-full h-full object-contain"
            />
          </div>
          <span 
            class="${isMobile ? 'text-sm' : 'text-base'} font-medium text-gray-900"
          >
            ${categoryName}
          </span>
        </div>
        ${imageUrl ? `
          <div class="relative w-full ${isMobile ? 'h-36' : 'h-48'} mb-3 overflow-hidden rounded-lg">
            <button 
              class="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white/95 transition-colors z-10 favorite-button ${isAnimating ? 'animate' : ''}"
              data-pin-id="${pinId}"
              data-is-favorite="${isFavorite}"
              aria-label="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="${isFavorite ? '#fbbf24' : 'none'}" stroke="${isFavorite ? '#fbbf24' : 'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </button>
            <img 
              src="${imageUrl}"
              alt="${location.properties.title}"
              class="w-full h-full object-cover"
              onerror="this.parentElement.style.display='none'"
            />
          </div>
        ` : ''}
        <p class="${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 mb-2">
          ${location.properties.address}
        </p>
        <div class="${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 mb-3 max-h-[200px] overflow-y-auto">
          ${cleanDescription}
        </div>
        <div class="grid ${guidebookUrl ? 'grid-cols-3' : 'grid-cols-2'} gap-2">
          ${url ? `
            <button
              type="button"
              class="w-full px-3 py-2 text-white font-bold bg-blue-600 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors ${isMobile ? 'text-xs' : 'text-sm'} affiliate-link-button shadow-sm"
              data-affiliate-url="${escapeHtml(url)}"
              data-location-name="${escapeHtml(location.properties.title)}"
              data-pin-title="${escapeHtml(location.properties.title)}"
              data-link-type="${escapeHtml(categoryName)}"
            >
              ${getButtonText(categoryId)}
            </button>
          ` : '<div></div>'}
          ${guidebookUrl ? `
            <button
              type="button"
              class="w-full px-3 py-2 text-white font-bold bg-purple-600 rounded-lg hover:bg-purple-700 active:bg-purple-800 transition-colors ${isMobile ? 'text-xs' : 'text-sm'} text-center flex items-center justify-center shadow-sm guidebook-link-button"
              data-guidebook-url="${escapeHtml(guidebookUrl)}"
              data-location-name="${escapeHtml(location.properties.title)}"
            >
              ${t('action.guidebookButton')}
            </button>
          ` : ''}
          <button
            type="button"
            class="w-full px-3 py-2 text-white font-bold bg-green-600 rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors ${isMobile ? 'text-xs' : 'text-sm'} text-center flex items-center justify-center shadow-sm directions-link-button"
            data-directions-url="${escapeHtml(directionsUrl)}"
          >
            ${t('action.direction')}
          </button>
        </div>
      </div>
    `;
  };

  useEffect(() => {
    const handleClick = async (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // アフィリエイトリンクボタン
      const affiliateLinkButton = target.closest('.affiliate-link-button');
      if (affiliateLinkButton) {
        e.preventDefault();
        e.stopPropagation();
        const linkUrl = affiliateLinkButton.getAttribute('data-affiliate-url');
        const locationName = affiliateLinkButton.getAttribute('data-location-name');
        const pinTitle = affiliateLinkButton.getAttribute('data-pin-title');
        const linkType = affiliateLinkButton.getAttribute('data-link-type');

        if (linkUrl && locationName && pinTitle && linkType) {
          const decodedUrl = unescapeHtml(linkUrl);
          const decodedLocationName = unescapeHtml(locationName);
          const decodedPinTitle = unescapeHtml(pinTitle);
          const decodedLinkType = unescapeHtml(linkType);

          console.log('🔗 Sending affiliate link click event:', {
            linkUrl: decodedUrl,
            locationName: decodedLocationName,
            pinTitle: decodedPinTitle,
            linkType: decodedLinkType
          });
          sendAffiliateLinkClickEvent(decodedUrl, decodedLocationName, decodedPinTitle, decodedLinkType);

          setTimeout(() => {
            window.open(decodedUrl, '_blank', 'noopener,noreferrer');
          }, 100);
        }
        return;
      }

      // ガイドブックボタン（新タブで安全に開く）
      const guidebookButton = target.closest('.guidebook-link-button');
      if (guidebookButton) {
        e.preventDefault();
        e.stopPropagation();
        const guidebookUrl = guidebookButton.getAttribute('data-guidebook-url');
        const locationName = guidebookButton.getAttribute('data-location-name');
        if (guidebookUrl) {
          const decodedUrl = unescapeHtml(guidebookUrl);
          const decodedName = unescapeHtml(locationName || '');
          sendExternalLinkClickEvent(decodedUrl, decodedName, getCurrentLanguage());
          window.open(decodedUrl, '_blank', 'noopener,noreferrer');
        }
        return;
      }

      // 経路案内ボタン（新タブで安全に開く）
      const directionsButton = target.closest('.directions-link-button');
      if (directionsButton) {
        e.preventDefault();
        e.stopPropagation();
        const directionsUrl = directionsButton.getAttribute('data-directions-url');
        if (directionsUrl) {
          const decodedUrl = unescapeHtml(directionsUrl);
          sendExternalLinkClickEvent(decodedUrl, 'Get Directions', getCurrentLanguage());
          window.open(decodedUrl, '_blank', 'noopener,noreferrer');
        }
        return;
      }

      // お気に入りボタン
      const favoriteButton = target.closest('.favorite-button');
      if (favoriteButton) {
        const pinId = favoriteButton.getAttribute('data-pin-id');
        if (pinId) {
          await handleFavoriteClick(pinId);
        }
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [favoriteStatus, animatingFavorite, t]);

  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        window.clearTimeout(messageTimeoutRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-180px)] bg-gray-100">
        <div className="text-xl text-gray-600">{t('message.loadingData')}</div>
      </div>
    );
  }

  return (
    <>
      {favoriteMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg z-[9999] bg-blue-600 text-white">
          {favoriteMessage}
        </div>
      )}
      
      {error && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
            <p className="text-sm text-yellow-700">
              {error}
              {locations.length > 0 && (
                <span className="block mt-1">
                  *Some data is still available
                </span>
              )}
            </p>
          </div>
        </div>
      )}
      
      {locationError && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
            <p className="text-sm text-yellow-700">{locationError}</p>
          </div>
        </div>
      )}
      
      <div className="relative">
        <MapContainer
          center={CENTER_COORDS}
          zoom={DEFAULT_ZOOM}
          scrollWheelZoom={true}
          zoomControl={false}
          className="h-[calc(100vh-180px)] w-full"
          style={{ zIndex: 1 }}
          minZoom={2}
          maxZoom={18}
          attributionControl={true}
        >
          <MapController onGetMap={setMap} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {userLocation && (
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={userLocationIcon}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="text-sm font-semibold mb-1">Current Location</h3>
                </div>
              </Popup>
            </Marker>
          )}

          {filteredLocations.map((location, index) => {
            const categoryId = location.properties.category_id || "1";
            
            return (
              <Marker
                key={`${location.properties.id}-${index}`}
                position={[
                  location.geometry.coordinates[1],
                  location.geometry.coordinates[0]
                ]}
                icon={createIcon(categoryId)}
                eventHandlers={{
                  click: () => {
                    console.log('Marker clicked:', location.properties.title);
                    handlePopupOpen(location);
                  }
                }}
              >
                {showMarkerTitles && (
                  <Tooltip 
                    permanent
                    direction="top"
                    offset={[0, -45]}
                    className="bg-white px-2 py-1 rounded shadow-md border border-gray-200 text-xs"
                    opacity={0.9}
                  >
                    {location.properties.title}
                  </Tooltip>
                )}
                <Popup 
                  maxWidth={isMobile ? 260 : 380}
                  minWidth={isMobile ? 240 : 360}
                  className="custom-popup"
                  autoPanPadding={[50, 50]}
                >
                  <div dangerouslySetInnerHTML={{ __html: createPopupContent(location) }} />
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        <div className="absolute top-4 right-4 z-[999] flex flex-col gap-2">
          <button
            onClick={moveToCurrentLocation}
            className="p-2.5 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
            title="Move to current location"
          >
            <Crosshair className="w-5 h-5 text-gray-700" />
          </button>
          
          <button
            onClick={moveToCenter}
            className="p-2.5 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
            title="Move to center of Okinawa"
          >
            <MapPin className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>
    </>
  );
});

Map.displayName = 'Map';

export default Map;