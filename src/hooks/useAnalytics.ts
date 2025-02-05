import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    gtag: (
      command: string,
      action: string,
      params?: {
        page_path?: string;
        event_category?: string;
        event_label?: string;
        value?: number;
        [key: string]: any;
      }
    ) => void;
  }
}

const GA_TRACKING_ID = 'G-T096TRJ4J9';

export const useAnalytics = () => {
  const location = useLocation();

  // Track page views
  useEffect(() => {
    if (typeof window.gtag !== 'undefined') {
      window.gtag('config', GA_TRACKING_ID, {
        page_path: location.pathname + location.search
      });
    }
  }, [location]);

  // Utility function to track custom events
  const trackEvent = (
    eventName: string,
    category?: string,
    label?: string,
    value?: number,
    additionalParams?: Record<string, any>
  ) => {
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', eventName, {
        event_category: category,
        event_label: label,
        value: value,
        ...additionalParams
      });
    }
  };

  return { trackEvent };
};