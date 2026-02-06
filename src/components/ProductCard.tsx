import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck, Heart } from 'lucide-react';
import { formatPrice } from '../utils/formatters';
import type { Database } from '../lib/database.types';

type Product = Database['public']['Tables']['products']['Row'];

interface ProductCardProps {
  product: Product;
  isFeatured?: boolean;
  variant?: 'full' | 'minimal';
  onWhatsAppClick?: (product: Product) => void;
}

export default function ProductCard({ product, isFeatured = false, variant = 'full' }: ProductCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);

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
            <p className="text-sm font-bold text-gray-800 mb-1">${formatPrice(Number(product.price))}</p>
            <div className="flex flex-col gap-1 text-xs">
              <div className="flex items-center justify-center gap-1 text-green-600 font-medium">
                <Truck className="h-3 w-3" />
                <span>Envío gratis</span>
              </div>
              <span className="text-gray-600 text-xs">Hasta 18 cuotas fijas con Crédito Accicom</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/producto/${product.code}`} className="block group">
      <div className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-shadow duration-300 overflow-hidden h-full flex flex-col">
        <div className="relative bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
          <div className="relative h-64 w-full flex items-center justify-center p-4 group-hover:scale-105 transition-transform duration-300">
            <img
              src={product.image}
              alt={product.name}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsFavorite(!isFavorite);
            }}
            className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all z-10"
          >
            <Heart
              className={`h-5 w-5 transition-colors ${
                isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'
              }`}
            />
          </button>

          {isFeatured && (
            <span className="absolute top-3 left-3 bg-yellow-400 text-white px-3 py-1 rounded-full text-xs font-bold">
              Destacado
            </span>
          )}
        </div>

        <div className="p-4 flex flex-col flex-grow">
          <h3 className="text-base font-semibold text-gray-800 mb-2 line-clamp-2 min-h-[3rem] group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>

          {product.brand && (
            <p className="text-gray-500 text-xs font-medium mb-2">{product.brand}</p>
          )}

          <div className="flex-grow"></div>

          <div className="space-y-3 mt-auto">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                ${formatPrice(Number(product.price))}
              </p>
              <div className="flex items-center text-green-600 text-xs font-medium mt-1">
                <Truck className="h-3.5 w-3.5 mr-1" />
                <span>Envío gratis</span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3">
              <p className="text-gray-600 text-xs leading-relaxed">
                <span className="font-semibold text-gray-800">Hasta 18 cuotas fijas</span> con Crédito Accicom
              </p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}