import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type BannerSlide = Database['public']['Tables']['banner_slides']['Row'] & {
  mobile_image?: string;
};

// Default slide to show when there's an error or no slides
const DEFAULT_SLIDE = {
  id: 'default',
  title: 'Bienvenido a Accicom',
  subtitle: 'Tu solución financiera al alcance de un clic',
  image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80',
  mobile_image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80',
  order: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

export default function Banner() {
  const [slides, setSlides] = useState<BannerSlide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSlides();
  }, []);

  useEffect(() => {
    if (slides.length > 0) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [slides.length]);

  const fetchSlides = async () => {
    try {
      const { data, error } = await supabase
        .from('banner_slides')
        .select('*')
        .order('order', { ascending: true });

      if (error) throw error;
      
      // If we have slides, use them; otherwise use the default slide
      if (data && data.length > 0) {
        setSlides(data);
        setError(null);
      } else {
        setSlides([DEFAULT_SLIDE]);
        setError('No slides available');
      }
    } catch (error) {
      console.error('Error fetching slides:', error);
      setError('Error loading banner');
      setSlides([DEFAULT_SLIDE]); // Use default slide on error
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="relative h-[250px] md:h-[450px] mt-16 bg-gray-100 animate-pulse">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // Always show something, either real slides or the default slide
  return (
    <div className="relative h-[250px] md:h-[450px] mt-16">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            currentSlide === index ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <picture>
            {/* Mobile image */}
            <source
              media="(max-width: 768px)"
              srcSet={slide.mobile_image || slide.image}
            />
            {/* Desktop image */}
            <img
              src={slide.image}
              alt={slide.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </picture>
          <div className="absolute inset-0 bg-black bg-opacity-50" />
          <div className="relative h-full flex items-center justify-center text-center">
            <div className="max-w-4xl px-4">
              <h2 className="text-2xl md:text-5xl font-bold text-white mb-2 md:mb-4">
                {slide.title}
              </h2>
              <p className="text-base md:text-2xl text-white">
                {slide.subtitle}
              </p>
            </div>
          </div>
        </div>
      ))}
      
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${
                currentSlide === index ? 'bg-blue-600' : 'bg-white'
              }`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}