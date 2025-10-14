import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ProductCard from './ProductCard';
import type { Database } from '../lib/database.types';

type Product = Database['public']['Tables']['products']['Row'];

export default function ProductCarousel() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [currentStartIndex, setCurrentStartIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Número de productos visibles por vez
  const productsVisible = 4; // Siempre 4 en desktop, se ajusta con CSS en mobile

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('featured', true)
        .eq('visible', true)
        .order('created_at', { ascending: false })
        .limit(20); // Más productos para mejor navegación

      if (error) throw error;
      setFeaturedProducts(data || []);
    } catch (error) {
      console.error('Error fetching featured products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const nextSlide = () => {
    setCurrentStartIndex(prev => 
      prev + 1 >= featuredProducts.length ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    setCurrentStartIndex(prev => 
      prev === 0 ? featuredProducts.length - 1 : prev - 1
    );
  };

  // Auto-advance carousel
  useEffect(() => {
    if (featuredProducts.length > 1) {
      const timer = setInterval(nextSlide, 4000); // Cambia cada 4 segundos
      return () => clearInterval(timer);
    }
  }, [featuredProducts.length]);

  if (isLoading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </div>
      </section>
    );
  }

  if (featuredProducts.length === 0) {
    return null; // No mostrar la sección si no hay productos destacados
  }

  return (
    <section className="py-8 md:py-16 bg-blue-600">
      <div className="container mx-auto px-4">
        <div className="text-center mb-6 md:mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Productos Destacados
          </h2>
          <p className="text-sm md:text-base text-white/90">
            Descubre nuestros productos más populares con financiamiento flexible
          </p>
        </div>

        <div className="relative">
          {/* Botones de navegación - Solo en desktop */}
          {featuredProducts.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow"
                aria-label="Producto anterior"
              >
                <ChevronLeft className="h-6 w-6 text-gray-600" />
              </button>
              <button
                onClick={nextSlide}
                className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow"
                aria-label="Siguiente producto"
              >
                <ChevronRight className="h-6 w-6 text-gray-600" />
              </button>
            </>
          )}

          {/* Carrusel de productos */}
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out gap-4"
              style={{
                transform: `translateX(-${currentStartIndex * (100 / productsVisible + 1)}%)`
              }}
            >
              {featuredProducts.map((product, index) => (
                <div key={product.id} className="flex-shrink-0 w-1/2 md:w-1/4">
                  <ProductCard
                    product={product}
                    variant="minimal"
                    isFeatured={true}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Indicadores de posición */}
          {featuredProducts.length > 1 && (
            <div className="flex justify-center mt-8 space-x-2">
              {featuredProducts.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStartIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    currentStartIndex === index
                      ? 'bg-blue-600'
                      : 'bg-gray-300'
                  }`}
                  aria-label={`Ir al producto ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </section>
  );
}