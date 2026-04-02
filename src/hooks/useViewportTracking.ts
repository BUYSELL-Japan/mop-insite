import { useEffect, useRef } from 'react';
import { useLanguage } from './useLanguage';
import { sendViewportTrackingEvent } from '../utils/gtm';

interface SectionData {
  name: string;
  startTime: number;
  wasVisible: boolean;
}

export const useViewportTracking = (enabled: boolean = true) => {
  const { language } = useLanguage();
  const sectionsData = useRef<Map<Element, SectionData>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Create Intersection Observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const element = entry.target;
          const sectionData = sectionsData.current.get(element);
          const sectionName = element.getAttribute('data-section-name') || 'unnamed-section';

          if (entry.isIntersecting) {
            // Section became visible
            if (!sectionData) {
              sectionsData.current.set(element, {
                name: sectionName,
                startTime: Date.now(),
                wasVisible: true
              });
            } else {
              sectionData.startTime = Date.now();
              sectionData.wasVisible = true;
            }
          } else {
            // Section left viewport
            if (sectionData && sectionData.wasVisible) {
              const visibilityTime = Math.floor((Date.now() - sectionData.startTime) / 1000);

              // Only send event if section was visible for at least 1 second
              if (visibilityTime >= 1) {
                sendViewportTrackingEvent({
                  sectionName: sectionData.name,
                  visibilityTime,
                  wasSkipped: false,
                  language
                });
              }
            }
          }
        });
      },
      {
        threshold: [0, 0.25, 0.5, 0.75, 1.0],
        rootMargin: '0px'
      }
    );

    // Observe all sections with data-section-name attribute
    const sections = document.querySelectorAll('[data-section-name]');
    sections.forEach((section) => {
      observerRef.current?.observe(section);
    });

    // Track skipped sections on page unload
    const handleBeforeUnload = () => {
      const allSections = document.querySelectorAll('[data-section-name]');
      allSections.forEach((section) => {
        const sectionData = sectionsData.current.get(section);
        const sectionName = section.getAttribute('data-section-name') || 'unnamed-section';

        // If section was never visible, mark as skipped
        if (!sectionData || !sectionData.wasVisible) {
          sendViewportTrackingEvent({
            sectionName,
            visibilityTime: 0,
            wasSkipped: true,
            language
          });
        }
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, language]);

  // Function to manually track a section
  const trackSection = (element: Element, sectionName: string) => {
    if (observerRef.current && element) {
      element.setAttribute('data-section-name', sectionName);
      observerRef.current.observe(element);
    }
  };

  return { trackSection };
};
