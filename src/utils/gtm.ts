// GTM用のユーティリティ関数
export const sendGTMEvent = (eventName: string, data: Record<string, any>) => {
  // ブラウザ環境でのみ実行
  if (typeof window === 'undefined') {
    console.warn('GTM: Server-side environment, skipping event');
    return;
  }

  // dataLayerの初期化を確認
  if (!window.dataLayer) {
    window.dataLayer = [];
    console.warn('GTM: dataLayer was not initialized, creating new one');
  }

  // イベントデータを送信
  const eventData = {
    event: eventName,
    ...data
  };

  try {
    window.dataLayer.push(eventData);
    console.log('🎯 GTM Event Sent:', eventData);
  } catch (error) {
    console.error('❌ GTM Event Error:', error);
  }
};

// ピンクリックイベント専用関数
export const sendPinClickEvent = (pinName: string) => {
  console.log('📍 Sending pin click event for:', pinName);
  sendGTMEvent('pin_click', {
    pinName: pinName
  });
};

// アフィリエイトリンククリックイベント専用関数
export const sendAffiliateLinkClickEvent = (linkUrl: string, locationName: string, pinTitle: string, linkType: string) => {
  console.log('🔗 Sending affiliate link click event:', { linkUrl, locationName, pinTitle, linkType });
  sendGTMEvent('affiliate_link_click', {
    link_url: linkUrl,
    location_name: locationName,
    pin_title: pinTitle,
    link_type: linkType
  });
};

// Throttle utility
export const throttle = <T extends (...args: any[]) => void>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return function(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Debounce utility
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  return function(this: any, ...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

// Get current language
export const getCurrentLanguage = (): string => {
  if (typeof window === 'undefined') return 'en';
  return localStorage.getItem('language') || 'en';
};

// Get time of day
export const getTimeOfDay = (): string => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

// Get day type
export const getDayType = (): string => {
  const day = new Date().getDay();
  return day === 0 || day === 6 ? 'weekend' : 'weekday';
};

// Check if user is returning visitor
export const isReturningVisitor = (): boolean => {
  if (typeof window === 'undefined') return false;
  const visited = localStorage.getItem('hasVisited');
  if (!visited) {
    localStorage.setItem('hasVisited', 'true');
    localStorage.setItem('firstVisit', new Date().toISOString());
    return false;
  }
  return true;
};

// Get visit count
export const getVisitCount = (): number => {
  if (typeof window === 'undefined') return 0;
  const count = parseInt(localStorage.getItem('visitCount') || '0', 10);
  localStorage.setItem('visitCount', (count + 1).toString());
  return count + 1;
};

// 1. スクロール深度イベント
export const sendScrollDepthEvent = (depth: number, language: string) => {
  sendGTMEvent('scroll_depth', {
    depth_percentage: depth,
    language
  });
};

// 2. 外部リンククリックイベント
export const sendExternalLinkClickEvent = (url: string, linkText: string, language: string) => {
  sendGTMEvent('external_link_click', {
    link_url: url,
    link_text: linkText,
    language
  });
};

// 3. アクティブエンゲージメント時間イベント
export const sendEngagementTimeEvent = (seconds: number, language: string) => {
  sendGTMEvent('engagement_time', {
    engaged_seconds: seconds,
    language
  });
};

// 4. 検索結果イベント
export const sendSearchResultEvent = (query: string, resultCount: number, language: string) => {
  sendGTMEvent('search_result', {
    search_query: query,
    result_count: resultCount,
    language
  });
};

// 5. ページエンゲージメントパターン
export const sendPageEngagementEvent = (data: {
  timeToFirstScroll: number;
  timeToFirstInteraction: number;
  scrollSpeed: string;
  interactionCount: number;
  scrollStopCount: number;
  language: string;
}) => {
  sendGTMEvent('page_engagement', data);
};

// 6. コンテンツ読了率
export const sendContentReadabilityEvent = (data: {
  estimatedReadRate: number;
  scrollDepth: number;
  timeSpent: number;
  readingSpeed: string;
  language: string;
}) => {
  sendGTMEvent('content_readability', data);
};

// 7. ビューポート追跡（セクション表示）
export const sendViewportTrackingEvent = (data: {
  sectionName: string;
  visibilityTime: number;
  wasSkipped: boolean;
  language: string;
}) => {
  sendGTMEvent('viewport_tracking', data);
};

// 8. セッション行動パターン
export const sendSessionBehaviorEvent = (data: {
  pagesViewed: number;
  spotsViewed: string[];
  userIntent: string;
  language: string;
}) => {
  sendGTMEvent('session_behavior', data);
};

// 9. デバイス・環境コンテキスト
export const sendDeviceContextEvent = (language: string) => {
  sendGTMEvent('device_context', {
    time_of_day: getTimeOfDay(),
    day_type: getDayType(),
    is_returning: isReturningVisitor(),
    visit_count: getVisitCount(),
    language
  });
};

// 10. 長時間滞在ユーザートラッキング
export const sendLongStayEvent = (data: {
  stayDuration: number;
  copyCount: number;
  tabSwitchCount: number;
  language: string;
}) => {
  sendGTMEvent('long_stay_user', data);
};

// 11. 離脱意図検知
export const sendExitIntentEvent = (data: {
  scrollDepth: number;
  timeSinceLastAction: number;
  trigger: string;
  language: string;
}) => {
  sendGTMEvent('exit_intent', data);
};

// 12. インタラクション連鎖
export const sendInteractionChainEvent = (data: {
  actionSequence: string[];
  totalDuration: number;
  language: string;
}) => {
  sendGTMEvent('interaction_chain', data);
};