import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Truck, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatPrice } from '../utils/formatters';
import { useAnalytics } from '../hooks/useAnalytics';
import type { Database } from '../lib/database.types';

type Product = Database['public']['Tables']['products']['Row'];

export default function ProductDetail() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchProduct();
  }, [code]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('code', code)
        .single();

      if (error) throw error;
      setProduct(data);
      
      // Track product view
      if (data) {
        trackEvent('view_item', 'ecommerce', data.name, Number(data.price));
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyClick = () => {
    if (!product) return;
    navigate(`/checkout/${product.code}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 pt-20">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-100 pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Producto no encontrado
            </h2>
            <p className="text-gray-600">
              El producto que estás buscando no existe o no está disponible.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pt-20">
      <div className="container mx-auto px-4 py-8">
        <Link
          to="/catalogo"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Volver al catálogo
        </Link>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="md:flex">
            <div className="md:w-1/2 bg-gray-50">
              <div className="relative h-[400px] md:h-[500px]">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-contain p-8"
                />
              </div>
            </div>
            <div className="md:w-1/2 p-6 md:p-8">
              <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                  {product.name}
                </h1>
                <p className="text-gray-500">Código: {product.code}</p>
              </div>

              <div className="mb-6">
                <p className="text-3xl md:text-4xl font-bold text-gray-800">
                  ${formatPrice(Number(product.price))}
                </p>
                <div className="mt-2 flex items-center text-green-600">
                  <Truck className="h-5 w-5 mr-2" />
                  <span>Envío gratis</span>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
                <p className="text-gray-700 text-center text-sm leading-relaxed">
                  <span className="font-semibold">Hasta 18 cuotas fijas</span> con Crédito Accicom
                </p>
              </div>

              <button
                onClick={handleBuyClick}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg
                hover:bg-blue-700 transition-colors font-semibold text-lg"
              >
                Comprar
              </button>
            </div>
          </div>
        </div>

        {product.description && (
          <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Descripción
            </h2>
            <p className="text-gray-600 whitespace-pre-line">
              {product.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}