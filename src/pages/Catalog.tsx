import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, X, Search, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import { useAnalytics } from '../hooks/useAnalytics';
import { formatPrice } from '../utils/formatters';
import type { Database } from '../lib/database.types';
import NewsletterPopup from '../components/NewsletterPopup';

type Product = Database['public']['Tables']['products']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

export default function Catalog() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { addToCart } = useCart();
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('visible', true) // Only fetch visible products
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
      setFeaturedProducts(data.filter(product => product.featured) || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.brand?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? product.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    addToCart(product);
    trackEvent('add_to_cart', 'ecommerce', product.name, Number(product.price));
  };

  const handleCategorySelect = (categoryName: string | null) => {
    setSelectedCategory(categoryName);
    if (categoryName) {
      trackEvent('select_category', 'catalog', categoryName);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (value.trim()) {
      trackEvent('search', 'catalog', value.trim());
    }
  };

  const ProductCard = ({ product, isFeatured = false }: { product: Product, isFeatured?: boolean }) => (
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
          <div className="bg-blue-50 p-2 rounded-lg mb-2">
            <p className="text-blue-800 font-semibold text-center text-sm">
              ¡Hasta en 18 cuotas fijas!
            </p>
          </div>
        </div>
      </Link>
      <div className="px-4 pb-4">
        <button
          onClick={(e) => handleAddToCart(e, product)}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg
          hover:bg-blue-700 transition-colors flex items-center justify-center text-sm"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Agregar al carrito
        </button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 pt-20">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pt-20">
      <NewsletterPopup />
      {/* Search Bar */}
      <div className="container mx-auto px-4 py-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por nombre, código o marca..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-4 py-2 pl-10 pr-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </div>

      {/* Featured Products */}
      {featuredProducts.length > 0 && !searchTerm && !selectedCategory && (
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Destacados del Mes</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {featuredProducts.slice(0, 4).map(product => (
              <ProductCard key={product.id} product={product} isFeatured={true} />
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Categorías</h2>
        <div className="flex flex-wrap gap-4">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => handleCategorySelect(category.name)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                selectedCategory === category.name
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-blue-50'
              }`}
            >
              <span>{category.name}</span>
            </button>
          ))}
          {selectedCategory && (
            <button
              onClick={() => handleCategorySelect(null)}
              className="px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors"
            >
              Ver todos
            </button>
          )}
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}