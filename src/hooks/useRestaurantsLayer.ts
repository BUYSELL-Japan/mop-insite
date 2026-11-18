import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import type { Language } from './useLanguage';
import { genreLabel, type GenreLang } from '../lib/genreLabels';

/**
 * Restaurant layer (beta, 2026-11-18).
 *
 * The toggle button is always shown; the layer starts off, or on when the URL has
 * show_restaurants=1 (links from the MOP-SSG restaurant pages). restaurants_map.geojson is ~2.4 MB, so it
 * is fetched only when the layer is first switched on (never on initial load) and kept in memory:
 * switching off and on again does not fetch it again.
 * pin_id=<restaurant pin_id> centres the map on that shop at zoom 16 and opens its popup.
 *
 * Only approved shops (approved "1", which have an SSG page) with coordinates are drawn (the light
 * file holds only those; test records are not in it).
 */

// Light version for the map (~2.4 MB instead of ~18.5 MB): approved shops with coordinates only.
// Built by MOP-SSG pipeline/build_restaurants.py build-map; properties:
// id, name (Japanese), name_en, name_zh, name_ko, lat, lng, rating, rating_count, genre, address, slug,
// approved, ad_tier, mop_partner, partner_service
export const RESTAURANTS_GEOJSON_URL = 'https://s3geojsonnew.s3.ap-southeast-2.amazonaws.com/restaurants_map.geojson';

interface MapFileProps {
  id: string;
  name: string;
  name_en?: string | null;
  name_zh?: string | null;
  name_ko?: string | null;
  lat: number;
  lng: number;
  rating?: number | null;
  rating_count?: number | null;
  genre?: string | null;
  address?: string | null;
  slug: string;
  approved?: string;
  ad_tier?: 'basic' | 'premium' | null;
  mop_partner?: boolean | null;
  partner_service?: string | null;
  // not in the light file yet; read if they are added later
  partner_lp_url?: string | null;
  ad_coupon_text?: string | null;
  google_maps_url?: string | null;
}

const fromMapFile = (p: MapFileProps): RestaurantFeature => ({
  geometry: { type: 'Point', coordinates: [Number(p.lng), Number(p.lat)] },
  properties: {
    pin_id: p.id,
    slug: p.slug,
    title: p.name,
    title_ja: p.name,
    title_en: p.name_en,
    title_zh_tw: p.name_zh,
    title_ko: p.name_ko,
    address: p.address,
    genre: p.genre,
    rating: p.rating,
    review_count: p.rating_count,
    approved: p.approved,
    ad_tier: p.ad_tier,
    mop_partner: p.mop_partner,
    partner_lp_url: p.partner_lp_url,
    ad_coupon_text: p.ad_coupon_text,
    google_maps_url: p.google_maps_url,
  },
});
export const RESTAURANT_PIN_PREFIX = 'okr';

interface RestaurantProps {
  pin_id: string;
  slug: string;
  title: string;
  title_ja?: string | null;
  title_en?: string | null;
  title_zh_tw?: string | null;
  title_ko?: string | null;
  address?: string | null;
  'address_zh-tw'?: string | null;
  address_ko?: string | null;
  genre?: string | null;
  rating?: number | null;
  review_count?: number | null;
  approved?: string;
  source?: string;
  ad_tier?: 'basic' | 'premium' | null;
  mop_partner?: boolean | null;
  partner_lp_url?: string | null;
  ad_coupon_text?: string | null;
  google_maps_url?: string | null;
}

interface RestaurantFeature {
  geometry: { type: 'Point'; coordinates: [number, number] } | null;
  properties: RestaurantProps;
}

const TEXT: Record<Language, { toggle: string; details: string; directions: string; coupon: string; partnerPage: string }> = {
  en: { toggle: 'Restaurants', details: 'View details', directions: 'Get Directions', coupon: 'Coupon', partnerPage: 'Visit the shop page' },
  'zh-TW': { toggle: '餐廳', details: '查看詳情', directions: '路線導航', coupon: '優惠券', partnerPage: '前往店家頁面' },
  ko: { toggle: '음식점', details: '자세히 보기', directions: '길찾기', coupon: '쿠폰', partnerPage: '가게 페이지 보기' },
};

const params = new URLSearchParams(window.location.search);
const LAYER_REQUESTED = params.get('show_restaurants') === '1';
const REQUESTED_PIN = params.get('pin_id');

const escapeHtml = (text: string): string =>
  text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[c]!);

const safeHttpUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : null;
  } catch {
    return null;
  }
};

/** premium: gold large / basic: gold medium / partner: orange medium / general: blue medium */
const pinStyle = (p: RestaurantProps): { color: string; size: number } => {
  if (p.ad_tier === 'premium') return { color: '#d4a017', size: 34 };
  if (p.ad_tier === 'basic') return { color: '#d4a017', size: 26 };
  if (p.mop_partner) return { color: '#f97316', size: 26 };
  return { color: '#2563eb', size: 26 };
};

const iconCache = new Map<string, L.DivIcon>();
const pinIcon = (p: RestaurantProps): L.DivIcon => {
  const { color, size } = pinStyle(p);
  const key = `${color}-${size}`;
  let icon = iconCache.get(key);
  if (!icon) {
    icon = L.divIcon({
      className: '',
      html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;font-size:${Math.round(size * 0.5)}px;line-height:1">🍴</div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2],
    });
    iconCache.set(key, icon);
  }
  return icon;
};

// Same labels as the MOP-SSG restaurant pages (src/lib/genreLabels.ts is a copy of MOP-SSG's)
const GENRE_LANG: Record<Language, GenreLang> = { en: 'en', 'zh-TW': 'zh', ko: 'ko' };
const genreText = (code: string | null | undefined, language: Language): string =>
  genreLabel(code, GENRE_LANG[language] ?? 'en');

const ssgPath = (language: Language, slug: string): string => {
  const seg = language === 'zh-TW' ? 'zh' : language === 'ko' ? 'ko' : 'en';
  return `${window.location.origin}/${seg}/restaurant/${encodeURIComponent(slug)}`;
};

const localizedName = (p: RestaurantProps, language: Language): string =>
  (language === 'zh-TW' ? p.title_zh_tw : language === 'ko' ? p.title_ko : p.title_en) || p.title || p.title_ja || '';

const localizedAddress = (p: RestaurantProps, language: Language): string =>
  (language === 'zh-TW' ? p['address_zh-tw'] : language === 'ko' ? p.address_ko : null) || p.address || '';

/** google_maps_url when present (not in the light file yet), else a Google Maps directions link; null without coordinates */
const directionsUrl = (f: RestaurantFeature): string | null => {
  const own = safeHttpUrl(f.properties.google_maps_url);
  if (own) return own;
  const [lng, lat] = f.geometry?.coordinates ?? [];
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
};

const BUTTON_STYLE = 'flex:1;display:block;text-align:center;padding:8px 6px;border-radius:8px;font-weight:700;font-size:13px;text-decoration:none';

const popupHtml = (f: RestaurantFeature, language: Language): string => {
  const p = f.properties;
  const text = TEXT[language] ?? TEXT.en;
  const directions = f.geometry ? directionsUrl(f) : null;
  const isPartner = Boolean(p.mop_partner || p.ad_tier);
  const lpUrl = isPartner ? safeHttpUrl(p.partner_lp_url) : null;
  const lpIsImage = lpUrl ? /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(lpUrl) : false;
  const rating = typeof p.rating === 'number'
    ? `<span style="color:#f59e0b">★</span> ${p.rating.toFixed(1)}${typeof p.review_count === 'number' ? ` <span style="color:#6b7280">(${p.review_count})</span>` : ''}`
    : '';
  const genre = genreText(p.genre, language);
  const meta = [rating, genre && escapeHtml(genre)].filter(Boolean).join('&nbsp;&nbsp;');
  const address = localizedAddress(p, language);

  return `
    <div style="min-width:220px;max-width:280px">
      <h3 style="font-size:16px;font-weight:700;margin:0 0 4px">${escapeHtml(localizedName(p, language))}</h3>
      ${p.title_ja && p.title_ja !== localizedName(p, language)
        ? `<div style="font-size:12px;color:#6b7280;margin:-2px 0 4px">${escapeHtml(p.title_ja)}</div>` : ''}
      ${meta ? `<div style="font-size:13px;margin-bottom:4px">${meta}</div>` : ''}
      ${address ? `<div style="font-size:12px;color:#4b5563;margin-bottom:8px">${escapeHtml(address)}</div>` : ''}
      <div style="display:flex;gap:6px">
        <a href="${escapeHtml(ssgPath(language, p.slug))}" target="_blank" rel="noopener"
           style="${BUTTON_STYLE};background:#2563eb;border:1px solid #2563eb;color:#fff">
          ${escapeHtml(text.details)}</a>
        ${directions ? `<a href="${escapeHtml(directions)}" target="_blank" rel="nofollow noopener noreferrer"
           style="${BUTTON_STYLE};background:#fff;border:1px solid #9ca3af;color:#374151">
          ${escapeHtml(text.directions)}</a>` : ''}
      </div>
      ${lpUrl ? (lpIsImage
        ? `<a href="${escapeHtml(lpUrl)}" target="_blank" rel="noopener sponsored" style="display:block;margin-top:8px"><img src="${escapeHtml(lpUrl)}" alt="" loading="lazy" style="width:100%;max-height:140px;object-fit:cover;border-radius:8px" onerror="this.parentElement.style.display='none'"></a>`
        : `<a href="${escapeHtml(lpUrl)}" target="_blank" rel="noopener sponsored" style="display:block;margin-top:8px;text-align:center;padding:6px 12px;border-radius:8px;border:1px solid #f97316;color:#c2410c;font-size:13px;text-decoration:none">${escapeHtml(text.partnerPage)}</a>`) : ''}
      ${p.ad_tier === 'premium' && p.ad_coupon_text
        ? `<div style="margin-top:8px;padding:8px;border:2px dashed #d4a017;border-radius:8px;background:#fffbeb;font-size:13px"><strong>🎟️ ${escapeHtml(text.coupon)}</strong><br>${escapeHtml(p.ad_coupon_text)}</div>`
        : ''}
    </div>`;
};

export function useRestaurantsLayer(map: L.Map | null, language: Language) {
  const [enabled, setEnabled] = useState(LAYER_REQUESTED);
  const [features, setFeatures] = useState<RestaurantFeature[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const focusedRef = useRef(false);

  // Fetch once, the first time the layer is on
  useEffect(() => {
    if (!enabled || features || loading || error) return;
    setLoading(true);
    fetch(RESTAURANTS_GEOJSON_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`restaurants.geojson: HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        // The light file already holds only approved shops with coordinates; check anyway
        const list: RestaurantFeature[] = (data?.features ?? [])
          .map((f: { properties?: MapFileProps }) => f?.properties)
          .filter((p: MapFileProps | undefined): p is MapFileProps =>
            Boolean(p?.id && p.slug && Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lng)) &&
              String(p.approved) === '1'))
          .map(fromMapFile);
        setFeatures(list);
      })
      .catch((err) => {
        console.error('Failed to load restaurants:', err);
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => setLoading(false));
  }, [enabled, features, loading, error]);

  // Draw (and redraw on language change) while enabled
  useEffect(() => {
    if (!map || !enabled || !features) return;
    const cluster = L.markerClusterGroup({ chunkedLoading: true, showCoverageOnHover: false, maxClusterRadius: 50 });
    let target: L.Marker | null = null;
    const markers = features.map((f) => {
      const [lng, lat] = f.geometry!.coordinates;
      const marker = L.marker([lat, lng], {
        icon: pinIcon(f.properties),
        title: localizedName(f.properties, language),
        // ad tiers above general ones when pins overlap
        zIndexOffset: f.properties.ad_tier === 'premium' ? 1000 : f.properties.ad_tier || f.properties.mop_partner ? 500 : 0,
      });
      marker.bindPopup(() => popupHtml(f, language), { maxWidth: 300 });
      if (f.properties.pin_id === REQUESTED_PIN) target = marker;
      return marker;
    });
    cluster.addLayers(markers);
    map.addLayer(cluster);

    if (target && !focusedRef.current) {
      focusedRef.current = true;
      const marker: L.Marker = target;
      map.setView(marker.getLatLng(), 16);
      cluster.zoomToShowLayer(marker, () => marker.openPopup());
    }
    return () => {
      map.removeLayer(cluster);
    };
  }, [map, enabled, features, language]);

  return {
    enabled,
    toggle: () => {
      setError(null); // a failed fetch is retried the next time the layer is switched on
      setEnabled((v) => !v);
    },
    loading,
    error,
    label: (TEXT[language] ?? TEXT.en).toggle,
  };
}
