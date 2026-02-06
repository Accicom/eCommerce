import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Banner {
  id: string;
  message: string;
  background_color: string;
  text_color: string;
  active: boolean;
}

export default function InfoBanner() {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [loading, setLoading] = useState(true);
  const [bannerHeight, setBannerHeight] = useState(0);
  const bannerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const isPublicPage = !location.pathname.startsWith('/admin');

  useEffect(() => {
    fetchActiveBanner();
    const timer = setInterval(fetchActiveBanner, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (bannerRef.current) {
      setBannerHeight(bannerRef.current.offsetHeight);
    }
  }, [banner, isPublicPage]);

  const fetchActiveBanner = async () => {
    try {
      const { data, error } = await supabase
        .from('info_banners')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching banner:', error);
        return;
      }

      setBanner(data);
    } catch (error) {
      console.error('Error in fetchActiveBanner:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !banner) return null;

  const bannerStyles: React.CSSProperties = {
    backgroundColor: banner.background_color,
    color: banner.text_color,
    width: '100%',
    padding: '16px',
    textAlign: 'center',
    fontSize: '16px',
    fontWeight: 600,
    wordBreak: 'break-word',
    lineHeight: '1.5',
  };

  if (!isPublicPage) {
    return <div style={bannerStyles}>{banner.message}</div>;
  }

  return (
    <>
      <div
        ref={bannerRef}
        style={{
          ...bannerStyles,
          position: 'fixed',
          top: '64px',
          left: 0,
          zIndex: 49,
        }}
      >
        {banner.message}
      </div>
      <div style={{ height: bannerHeight }} />
    </>
  );
}
