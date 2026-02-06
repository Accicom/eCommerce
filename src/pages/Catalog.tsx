import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import ReactPaginate from 'react-paginate';
import { supabase } from '../lib/supabase';
import { useAnalytics } from '../hooks/useAnalytics';
import type { Database } from '../lib/database.types';
import NewsletterPopup from '../components/NewsletterPopup';
import ProductCard from '../components/ProductCard';
import ProductCarousel from '../components/ProductCarousel';
import Header from '../components/Header';

type Product = Database['public']['Tables']['products']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

export default function Catalog() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const { trackEvent } = useAnalytics();

  const productsPerPage = 24;

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

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

  const handlePageChange = ({ selected }: { selected: number }) => {
    setCurrentPage(selected);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  return (
    <div className="min-h-screen bg-gray-100">
      <Header
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={handleCategorySelect}
      />
      <NewsletterPopup />

      {/* Search Bar */}
      <div className="pt-16 bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-2 pl-10 pr-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Carousel */}
      <ProductCarousel />

      {/* Desktop Categories */}
      <div className="hidden md:block container mx-auto px-4 py-8">
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
          {currentPageProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              variant={window.innerWidth >= 768 ? 'full' : 'minimal'}
            />
          ))}
        </div>

        {/* Pagination */}
        {filteredProducts.length > productsPerPage && (
          <div className="mt-8 overflow-x-auto pb-4">
            <ReactPaginate
              previousLabel="Anterior"
              nextLabel="Siguiente"
              pageCount={pageCount}
              onPageChange={handlePageChange}
              forcePage={currentPage}
              containerClassName="flex items-center justify-center gap-2 min-w-max px-4"
              pageClassName="px-2 md:px-3 py-2 rounded-lg border hover:bg-gray-50 transition-colors text-sm"
              activeClassName="!bg-blue-600 !text-white !border-blue-600"
              previousClassName="px-2 md:px-3 py-2 rounded-lg border hover:bg-gray-50 transition-colors text-sm whitespace-nowrap"
              nextClassName="px-2 md:px-3 py-2 rounded-lg border hover:bg-gray-50 transition-colors text-sm whitespace-nowrap"
              disabledClassName="opacity-50 cursor-not-allowed hover:bg-transparent"
              breakLabel="..."
              breakClassName="px-2 py-2 text-sm"
            />
          </div>
        )}
      </div>
    </div>
  );
}