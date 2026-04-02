import { useEffect, useRef, useCallback } from 'react';
import { useLanguage } from './useLanguage';
import {
  throttle,
  debounce,
  sendScrollDepthEvent,
  sendEngagementTimeEvent,
  sendPageEngagementEvent,
  sendContentReadabilityEvent,
  sendSessionBehaviorEvent,
  sendDeviceContextEvent,
  sendLongStayEvent,
  sendExitIntentEvent,
  sendInteractionChainEvent,
  getCurrentLanguage
} from '../utils/gtm';

interface InteractionEvent {
  action: string;
  timestamp: number;
}

export const useAnalytics = () => {
  const { language } = useLanguage();

  // Refs for tracking state
  const scrollDepthTracked = useRef<Set<number>>(new Set());
  const pageLoadTime = useRef<number>(Date.now());
  const firstScrollTime = useRef<number | null>(null);
  const firstInteractionTime = useRef<number | null>(null);
  const lastActivityTime = useRef<number>(Date.now());
  const isActive = useRef<boolean>(true);
  const engagementStartTime = useRef<number>(Date.now());
  const totalEngagementTime = useRef<number>(0);
  const interactionCount = useRef<number>(0);
  const scrollStopCount = useRef<number>(0);
  const lastScrollPosition = useRef<number>(0);
  const scrollStartTime = useRef<number>(0);
  const scrollDistances = useRef<number[]>([]);
  const copyCount = useRef<number>(0);
  const tabSwitchCount = useRef<number>(0);
  const interactionChain = useRef<InteractionEvent[]>([]);
  const viewedSpots = useRef<Set<string>>(new Set());
  const longStayTracked = useRef<boolean>(false);

  // Track scroll depth (25%, 50%, 75%, 90%)
  const trackScrollDepth = useCallback(() => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPosition = window.scrollY;
    const scrollPercentage = (scrollPosition / scrollHeight) * 100;

    const depths = [25, 50, 75, 90];
    depths.forEach(depth => {
      if (scrollPercentage >= depth && !scrollDepthTracked.current.has(depth)) {
        scrollDepthTracked.current.add(depth);
        sendScrollDepthEvent(depth, language);
      }
    });

    // Track first scroll
    if (!firstScrollTime.current && scrollPosition > 0) {
      firstScrollTime.current = Date.now();
    }

    // Track scroll speed
    const currentTime = Date.now();
    if (scrollStartTime.current > 0) {
      const timeDiff = currentTime - scrollStartTime.current;
      const distanceDiff = Math.abs(scrollPosition - lastScrollPosition.current);
      if (timeDiff > 0) {
        scrollDistances.current.push(distanceDiff / timeDiff);
      }
    }

    lastScrollPosition.current = scrollPosition;
    scrollStartTime.current = currentTime;
    lastActivityTime.current = currentTime;
  }, [language]);

  // Track scroll stops
  const trackScrollStop = useCallback(() => {
    scrollStopCount.current += 1;
  }, []);

  // Calculate scroll speed
  const getScrollSpeed = (): string => {
    if (scrollDistances.current.length === 0) return 'none';
    const avgSpeed = scrollDistances.current.reduce((a, b) => a + b, 0) / scrollDistances.current.length;
    if (avgSpeed < 0.5) return 'slow';
    if (avgSpeed < 2) return 'normal';
    return 'fast';
  };

  // Track user interactions
  const trackInteraction = useCallback((action: string) => {
    const now = Date.now();

    if (!firstInteractionTime.current) {
      firstInteractionTime.current = now;
    }

    interactionCount.current += 1;
    lastActivityTime.current = now;

    // Add to interaction chain
    interactionChain.current.push({ action, timestamp: now });

    // Keep only last 20 interactions
    if (interactionChain.current.length > 20) {
      interactionChain.current.shift();
    }
  }, []);

  // Track engagement time
  const updateEngagementTime = useCallback(() => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityTime.current;

    // Stop tracking if inactive for 3 minutes
    if (timeSinceLastActivity > 180000) {
      if (isActive.current) {
        isActive.current = false;
        const sessionTime = Math.floor((now - engagementStartTime.current) / 1000);
        totalEngagementTime.current += sessionTime;
        sendEngagementTimeEvent(totalEngagementTime.current, language);
      }
    } else {
      if (!isActive.current) {
        isActive.current = true;
        engagementStartTime.current = now;
      }
    }
  }, [language]);

  // Send page engagement event
  const sendPageEngagement = useCallback(() => {
    if (firstScrollTime.current && firstInteractionTime.current) {
      const timeToFirstScroll = Math.floor((firstScrollTime.current - pageLoadTime.current) / 1000);
      const timeToFirstInteraction = Math.floor((firstInteractionTime.current - pageLoadTime.current) / 1000);

      sendPageEngagementEvent({
        timeToFirstScroll,
        timeToFirstInteraction,
        scrollSpeed: getScrollSpeed(),
        interactionCount: interactionCount.current,
        scrollStopCount: scrollStopCount.current,
        language
      });
    }
  }, [language]);

  // Send content readability event
  const sendContentReadability = useCallback(() => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPosition = window.scrollY;
    const scrollDepth = (scrollPosition / scrollHeight) * 100;
    const timeSpent = Math.floor((Date.now() - pageLoadTime.current) / 1000);

    // Estimate read rate based on scroll depth and time spent
    const estimatedReadRate = Math.min((scrollDepth / 100) * (timeSpent / 60), 100);

    let readingSpeed = 'normal';
    if (timeSpent > 0 && scrollDepth > 0) {
      const ratio = scrollDepth / timeSpent;
      if (ratio < 0.5) readingSpeed = 'slow';
      else if (ratio > 2) readingSpeed = 'fast';
    }

    sendContentReadabilityEvent({
      estimatedReadRate: Math.floor(estimatedReadRate),
      scrollDepth: Math.floor(scrollDepth),
      timeSpent,
      readingSpeed,
      language
    });
  }, [language]);

  // Track long stay users (60+ seconds)
  const trackLongStay = useCallback(() => {
    const timeSpent = Math.floor((Date.now() - pageLoadTime.current) / 1000);

    if (timeSpent >= 60 && !longStayTracked.current) {
      longStayTracked.current = true;
      sendLongStayEvent({
        stayDuration: timeSpent,
        copyCount: copyCount.current,
        tabSwitchCount: tabSwitchCount.current,
        language
      });
    }
  }, [language]);

  // Estimate user intent
  const estimateUserIntent = useCallback((): string => {
    const timeSpent = (Date.now() - pageLoadTime.current) / 1000;
    const spotsCount = viewedSpots.current.size;

    if (spotsCount >= 5 && timeSpent > 120) return 'comparing';
    if (spotsCount >= 3 && timeSpent > 60) return 'planning';
    return 'researching';
  }, []);

  // Send session behavior event
  const sendSessionBehavior = useCallback(() => {
    const spotsViewed = Array.from(viewedSpots.current).slice(0, 5);
    const userIntent = estimateUserIntent();

    sendSessionBehaviorEvent({
      pagesViewed: 1,
      spotsViewed,
      userIntent,
      language
    });
  }, [language, estimateUserIntent]);

  // Track exit intent
  const trackExitIntent = useCallback((trigger: string) => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPosition = window.scrollY;
    const scrollDepth = (scrollPosition / scrollHeight) * 100;
    const timeSinceLastAction = Date.now() - lastActivityTime.current;

    sendExitIntentEvent({
      scrollDepth: Math.floor(scrollDepth),
      timeSinceLastAction: Math.floor(timeSinceLastAction / 1000),
      trigger,
      language
    });
  }, [language]);

  // Send interaction chain event
  const sendInteractionChain = useCallback(() => {
    if (interactionChain.current.length > 0) {
      const actions = interactionChain.current.map(e => e.action);
      const totalDuration = Date.now() - (interactionChain.current[0]?.timestamp || Date.now());

      sendInteractionChainEvent({
        actionSequence: actions,
        totalDuration: Math.floor(totalDuration / 1000),
        language
      });
    }
  }, [language]);

  // Track spot views
  const trackSpotView = useCallback((spotName: string) => {
    viewedSpots.current.add(spotName);
  }, []);

  useEffect(() => {
    // Send device context on mount
    sendDeviceContextEvent(language);

    // Throttled scroll handler
    const handleScroll = throttle(() => {
      trackScrollDepth();
      trackInteraction('scroll');
    }, 100);

    // Debounced scroll stop handler
    const handleScrollStop = debounce(() => {
      trackScrollStop();
    }, 150);

    // Click handler
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      trackInteraction('click');

      // Track external links
      const link = target.closest('a');
      if (link && link.href) {
        const url = new URL(link.href, window.location.origin);
        if (url.hostname !== window.location.hostname) {
          trackInteraction('external_link_click');
        }
      }
    };

    // Mouse movement handler
    const handleMouseMove = throttle(() => {
      lastActivityTime.current = Date.now();
    }, 1000);

    // Exit intent handler (mouse leaving viewport)
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY < 0) {
        trackExitIntent('mouse_leave_top');
      }
    };

    // Copy handler
    const handleCopy = () => {
      copyCount.current += 1;
      trackInteraction('copy');
    };

    // Visibility change handler
    const handleVisibilityChange = () => {
      if (document.hidden) {
        tabSwitchCount.current += 1;
        trackInteraction('tab_switch');
      }
    };

    // Engagement time interval
    const engagementInterval = setInterval(() => {
      updateEngagementTime();
      trackLongStay();
    }, 10000);

    // Add event listeners
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('scroll', handleScrollStop);
    window.addEventListener('click', handleClick);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Send final events before unload
    const handleBeforeUnload = () => {
      sendPageEngagement();
      sendContentReadability();
      sendSessionBehavior();
      sendInteractionChain();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scroll', handleScrollStop);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(engagementInterval);

      // Send final events
      handleBeforeUnload();
    };
  }, [
    language,
    trackScrollDepth,
    trackScrollStop,
    trackInteraction,
    updateEngagementTime,
    trackLongStay,
    trackExitIntent,
    sendPageEngagement,
    sendContentReadability,
    sendSessionBehavior,
    sendInteractionChain
  ]);

  return {
    trackSpotView,
    trackInteraction
  };
};
