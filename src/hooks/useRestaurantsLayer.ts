import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import type { Language } from './useLanguage';

/**
 * Restaurant layer (beta, 2026-11-18).
 *
 * Enabled only by the URL parameter show_restaurants=1 (links from the MOP-SSG restaurant pages):
 * without it nothing is fetched and the toggle button is not shown. restaurants.geojson is ~18 MB,
 * so it is fetched once and only when the layer is first switched on.
 * pin_id=<restaurant pin_id> centres the map on that shop at zoom 16 and opens its popup.
 *
 * Only approved shops (approved "1", which have an SSG page) with coordinates are drawn; the five
 * test records (source "test") are skipped.
 */

export const RESTAURANTS_GEOJSON_URL = 'https://s3geojsonnew.s3.ap-southeast-2.amazonaws.com/restaurants.geojson';
export const RESTAURANT_PIN_PREFIX = 'okr';

interface RestaurantProps {
  pin_id: string;
  slug: string;
  title: string;
  title_ja?: string | null;
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
}

interface RestaurantFeature {
  geometry: { type: 'Point'; coordinates: [number, number] } | null;
  properties: RestaurantProps;
}

const TEXT: Record<Language, { toggle: string; details: string; coupon: string; partnerPage: string }> = {
  en: { toggle: 'Restaurants', details: 'View details', coupon: 'Coupon', partnerPage: 'Visit the shop page' },
  'zh-TW': { toggle: '餐廳', details: '查看詳情', coupon: '優惠券', partnerPage: '前往店家頁面' },
  ko: { toggle: '음식점', details: '자세히 보기', coupon: '쿠폰', partnerPage: '가게 페이지 보기' },
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

const genreLabel = (code: string | null | undefined): string =>
  (code || '').split('_').filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');

const ssgPath = (language: Language, slug: string): string => {
  const seg = language === 'zh-TW' ? 'zh' : language === 'ko' ? 'ko' : 'en';
  return `${window.location.origin}/${seg}/restaurant/${encodeURIComponent(slug)}`;
};

const localizedName = (p: RestaurantProps, language: Language): string =>
  (language === 'zh-TW' ? p.title_zh_tw : language === 'ko' ? p.title_ko : null) || p.title || p.title_ja || '';

const localizedAddress = (p: RestaurantProps, language: Language): string =>
  (language === 'zh-TW' ? p['address_zh-tw'] : language === 'ko' ? p.address_ko : null) || p.address || '';

const popupHtml = (p: RestaurantProps, language: Language): string => {
  const text = TEXT[language] ?? TEXT.en;
  const isPartner = Boolean(p.mop_partner || p.ad_tier);
  const lpUrl = isPartner ? safeHttpUrl(p.partner_lp_url) : null;
  const lpIsImage = lpUrl ? /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(lpUrl) : false;
  const rating = typeof p.rating === 'number'
    ? `<span style="color:#f59e0b">★</span> ${p.rating.toFixed(1)}${typeof p.review_count === 'number' ? ` <span style="color:#6b7280">(${p.review_count})</span>` : ''}`
    : '';
  const genre = genreLabel(p.genre);
  const meta = [rating, genre && escapeHtml(genre)].filter(Boolean).join('&nbsp;&nbsp;');
  const address = localizedAddress(p, language);

  return `
    <div style="min-width:220px;max-width:280px">
      <h3 style="font-size:16px;font-weight:700;margin:0 0 4px">${escapeHtml(localizedName(p, language))}</h3>
      ${meta ? `<div style="font-size:13px;margin-bottom:4px">${meta}</div>` : ''}
      ${address ? `<div style="font-size:12px;color:#4b5563;margin-bottom:8px">${escapeHtml(address)}</div>` : ''}
      <a href="${escapeHtml(ssgPath(language, p.slug))}" target="_blank" rel="noopener"
         style="display:block;text-align:center;padding:8px 12px;border-radius:8px;background:#f97316;color:#fff;font-weight:700;font-size:13px;text-decoration:none">
        ${escapeHtml(text.details)}</a>
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
    if (!LAYER_REQUESTED || !enabled || features || loading || error) return;
    setLoading(true);
    fetch(RESTAURANTS_GEOJSON_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`restaurants.geojson: HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const list: RestaurantFeature[] = (data?.features ?? []).filter(
          (f: RestaurantFeature) =>
            f?.geometry?.type === 'Point' &&
            f.properties?.slug &&
            String(f.properties.approved) === '1' &&
            f.properties.source !== 'test'
        );
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
      marker.bindPopup(() => popupHtml(f.properties, language), { maxWidth: 300 });
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
    available: LAYER_REQUESTED,
    enabled,
    toggle: () => setEnabled((v) => !v),
    loading,
    error,
    label: (TEXT[language] ?? TEXT.en).toggle,
  };
}
