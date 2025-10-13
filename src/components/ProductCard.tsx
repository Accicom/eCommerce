import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, MessageCircle } from 'lucide-react';
import { formatPrice } from '../utils/formatters';
import type { Database } from '../lib/database.types';

type Product = Database['public']['Tables']['products']['Row'];

interface ProductCardProps {
  product: Product;
  isFeatured?: boolean;
  variant?: 'full' | 'minimal';
  onWhatsAppClick?: (product: Product) => void;
}

export default function ProductCard({ product, isFeatured = false, variant = 'full', onWhatsAppClick }: ProductCardProps) {
  if (variant === 'minimal') {
    return (
      <Link to={`/producto/${product.code}`} className="block">
        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
          <div className="relative h-32 bg-gray-50 flex items-center justify-center">
            <div className="w-full h-full p-3 flex items-center justify-center">
              <img
                src={product.image}
                alt={product.name}
                className="max-w-full max-h-full object-contain"
              />
            </div>
            {isFeatured && (
              <span className="absolute top-1 right-1 bg-yellow-400 text-white px-1 py-0.5 rounded-full text-xs font-semibold">
                Destacado
              </span>
            )}
          </div>
          <div className="p-3 text-center">
            <h3 className="text-sm font-semibold text-gray-800 mb-1 line-clamp-2 min-h-[2.5rem]">
              {product.name}
            </h3>
            <p className="text-sm font-bold text-gray-800">${formatPrice(Number(product.price))}</p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <Link to={`/producto/${product.code}`} className="block">
        <div className="relative h-64 bg-gray-50 flex items-center justify-center">
          <div className="w-full h-full p-6 flex items-center justify-center">
            <img
              src={product.image}
              alt={product.name}
              className="max-w-full max-h-full object-contain"
            />
          </div>
          {isFeatured && (
            <span className="absolute top-2 right-2 bg-yellow-400 text-white px-2 py-1 rounded-full text-sm font-semibold">
              Destacado
            </span>
          )}
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-1 line-clamp-2 min-h-[3.5rem]">
            {product.name}
          </h3>
          {product.brand && (
            <p className="text-gray-600 text-sm mb-1">{product.brand}</p>
          )}
          <p className="text-gray-400 text-sm mb-1">Código: {product.code}</p>
          <p className="text-xl font-bold text-gray-800 mb-2">${formatPrice(Number(product.price))}</p>
          <div className="flex items-center text-green-600 text-sm mb-2">
            <Truck className="h-4 w-4 mr-1" />
            <span>Envío gratis</span>
          </div>
          <div className="flex items-center text-green-600 text-sm mb-2">
            <Truck className="h-4 w-4 mr-1" />
            <span>Envío gratis</span>
          </div>
          <div className="bg-blue-50 p-2 rounded-lg mb-2">
            <p className="text-blue-800 font-semibold text-center text-sm">
              ¡Hasta en 18 cuotas fijas!
            </p>
          </div>
        </div>
      </Link>
      {onWhatsAppClick && (
        <div className="px-4 pb-4">
          <button
            onClick={() => onWhatsAppClick(product)}
            className="w-full bg-green-600 text-white px-4 py-2 rounded-lg
            hover:bg-green-700 transition-colors flex items-center justify-center text-sm"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Me interesa
          </button>
        </div>
      )}
    </div>
  );
}