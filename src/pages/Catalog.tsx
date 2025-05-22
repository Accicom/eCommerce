import React, { useState, useEffect } from 'react';
import { MessageCircle, Search, Truck, ShoppingBag, Send, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import ReactPaginate from 'react-paginate';
import { supabase } from '../lib/supabase';
import { useAnalytics } from '../hooks/useAnalytics';
import { formatPrice } from '../utils/formatters';
import type { Database } from '../lib/database.types';
import NewsletterPopup from '../components/NewsletterPopup';
import CatalogGate from '../components/CatalogGate';

type Product = Database['public']['Tables']['products']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

const CatalogInstructions = () => (
  <div className="container mx-auto px-4 py-2">
    <div className="bg-white shadow-lg rounded-xl overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-4 py-2">
        <h2 className="text-base md:text-lg font-medium text-white/90 text-center">
          Proceso de compra simple y rápido
        </h2>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium">1</span>
              <h3 className="font-medium text-gray-900">Explora el catálogo</h3>
            </div>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
              <Send className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium">2</span>
              <h3 className="font-medium text-gray-900">Presiona "Me interesa"</h3>
            </div>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium">3</span>
              <h3 className="font-medium text-gray-900">Finaliza con un asesor</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default function Catalog() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [clientData, setClientData] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const { trackEvent } = useAnalytics();

  const productsPerPage = 12;

  useEffect(() => {
    if (hasAccess) {
      fetchProducts();
      fetchCategories();
    }
  }, [hasAccess]);

  useEffect(() => {
    // Reset to first page when filters change
    setCurrentPage(0);
  }, [searchTerm, selectedCategory]);

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
        .eq('visible', true)
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

  const pageCount = Math.ceil(filteredProducts.length / productsPerPage);
  const offset = currentPage * productsPerPage;
  const currentPageProducts = filteredProducts.slice(offset, offset + productsPerPage);

  const handleWhatsAppClick = async (product: Product) => {
    const message = `¡Hola! Me interesa el siguiente producto:\n\n${product.name}\nCódigo: ${product.code}\nPrecio: $${formatPrice(Number(product.price))}`;

    try {
      // Save as completed order
      const orderNumber = Math.floor(Math.random() * 1000000);
      const orderData = {
        order_number: `#${orderNumber}`,
        order_data: [{
          product_id: product.id,
          product_name: product.name,
          quantity: 1,
          price: product.price
        }],
        total_amount: product.price,
        whatsapp_message: message,
        client_id: clientData?.id || null
      };

      const { error } = await supabase
        .from('completed_orders')
        .insert([orderData]);

      if (error) throw error;

      // Track conversion event
      trackEvent('conversion', 'whatsapp', product.name, Number(product.price));
      
      // Open WhatsApp
      window.open(`https://wa.me/5493513486125?text=${encodeURIComponent(message)}`, '_blank');
    } catch (error) {
      console.error('Error saving order:', error);
    }
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

  const handleCatalogAccess = (data: any) => {
    setHasAccess(true);
    setClientData(data);
    trackEvent('catalog_access', 'authentication', data.name);
  };

  const handlePageChange = ({ selected }: { selected: number }) => {
    setCurrentPage(selected);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
          onClick={() => handleWhatsAppClick(product)}
          className="w-full bg-green-600 text-white px-4 py-2 rounded-lg
          hover:bg-green-700 transition-colors flex items-center justify-center text-sm"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Me interesa
        </button>
      </div>
    </div>
  );

  if (!hasAccess) {
    return <CatalogGate onAccess={handleCatalogAccess} />;
  }

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

      {/* Instructions Banner */}
      <CatalogInstructions />

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
          {currentPageProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Pagination */}
        {filteredProducts.length > productsPerPage && (
          <div className="mt-8">
            <ReactPaginate
              previousLabel="Anterior"
              nextLabel="Siguiente"
              pageCount={pageCount}
              onPageChange={handlePageChange}
              forcePage={currentPage}
              containerClassName="flex items-center justify-center gap-2"
              pageClassName="px-3 py-2 rounded-lg border hover:bg-gray-50 transition-colors"
              activeClassName="!bg-blue-600 !text-white !border-blue-600"
              previousClassName="px-3 py-2 rounded-lg border hover:bg-gray-50 transition-colors"
              nextClassName="px-3 py-2 rounded-lg border hover:bg-gray-50 transition-colors"
              disabledClassName="opacity-50 cursor-not-allowed hover:bg-transparent"
              breakLabel="..."
              breakClassName="px-3 py-2"
            />
          </div>
        )}
      </div>
    </div>
  );
}