import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, ArrowUpDown, X as XIcon } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import ReactPaginate from 'react-paginate';
import { supabase } from '../lib/supabase';
import { useAnalytics } from '../hooks/useAnalytics';
import type { Database } from '../lib/database.types';
import NewsletterPopup from '../components/NewsletterPopup';
import ProductCard from '../components/ProductCard';
import ProductCarousel from '../components/ProductCarousel';
import ShowcaseGroups from '../components/ShowcaseGroups';
import Header from '../components/Header';

type Product = Database['public']['Tables']['products']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  const groupParam = searchParams.get('group');

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [sortOrder, setSortOrder] = useState<'none' | 'asc' | 'desc'>('none');
  const [activeFilterLabel, setActiveFilterLabel] = useState<string | null>(null);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const { trackEvent } = useAnalytics();

  const productsPerPage = 24;
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  const showFilteredProducts = !!categoryParam || !!groupParam || searchTerm.trim().length > 0;

  useEffect(() => {
    fetchCategories().then(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (categoryParam || groupParam) {
      fetchFilteredProducts();
    } else if (!searchTerm.trim()) {
      setProducts([]);
      setActiveFilterLabel(null);
    }
    setCurrentPage(0);
  }, [categoryParam, groupParam]);

  useEffect(() => {
    if (searchTerm.trim()) {
      fetchSearchResults();
    } else if (!categoryParam && !groupParam) {
      setProducts([]);
    }
    setCurrentPage(0);
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setCategoryDropdownOpen(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setSortDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const fetchFilteredProducts = async () => {
    setIsProductsLoading(true);
    try {
      let categoryNames: string[] = [];

      if (groupParam) {
        const { data: gcData } = await supabase
          .from('product_showcase_group_categories')
          .select('category_name')
          .eq('group_id', groupParam);

        if (gcData) {
          categoryNames = gcData.map(gc => gc.category_name);
        }

        const { data: groupData } = await supabase
          .from('product_showcase_groups')
          .select('title')
          .eq('id', groupParam)
          .maybeSingle();

        setActiveFilterLabel(groupData?.title || null);
      } else if (categoryParam) {
        categoryNames = [categoryParam];
        setActiveFilterLabel(categoryParam);
      }

      if (categoryNames.length > 0) {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('visible', true)
          .in('category', categoryNames)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProducts(data || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsProductsLoading(false);
    }
  };

  const fetchSearchResults = async () => {
    setIsProductsLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('visible', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
      setActiveFilterLabel(null);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsProductsLoading(false);
    }
  };

  const handleCategorySelect = (categoryName: string) => {
    setSearchParams({ category: categoryName });
    setSearchTerm('');
    setCategoryDropdownOpen(false);
    trackEvent('select_category', 'catalog', categoryName);
  };

  const handleClearFilter = () => {
    setSearchParams({});
    setSearchTerm('');
    setSortOrder('none');
    setActiveFilterLabel(null);
    setProducts([]);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (value.trim()) {
      setSearchParams({});
      trackEvent('search', 'catalog', value.trim());
    }
  };

  const handleSortSelect = (order: 'asc' | 'desc') => {
    setSortOrder(order);
    setSortDropdownOpen(false);
  };

  const handlePageChange = ({ selected }: { selected: number }) => {
    setCurrentPage(selected);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  let displayProducts = [...products];

  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase();
    displayProducts = displayProducts.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.code.toLowerCase().includes(term) ||
      (p.brand?.toLowerCase() || '').includes(term)
    );
  }

  if (sortOrder === 'asc') {
    displayProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
  } else if (sortOrder === 'desc') {
    displayProducts.sort((a, b) => (b.price || 0) - (a.price || 0));
  }

  const pageCount = Math.ceil(displayProducts.length / productsPerPage);
  const offset = currentPage * productsPerPage;
  const currentPageProducts = displayProducts.slice(offset, offset + productsPerPage);

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
      <Header categories={categories} />
      <NewsletterPopup />

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

      {!showFilteredProducts && <ProductCarousel />}

      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div ref={categoryDropdownRef} className="relative">
              <button
                onClick={() => { setCategoryDropdownOpen(!categoryDropdownOpen); setSortDropdownOpen(false); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                  categoryParam
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{categoryParam || 'Categoría'}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {categoryDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border max-h-72 overflow-y-auto w-56 z-40">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategorySelect(cat.name)}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors ${
                        categoryParam === cat.name ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div ref={sortDropdownRef} className="relative">
              <button
                onClick={() => { setSortDropdownOpen(!sortDropdownOpen); setCategoryDropdownOpen(false); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                  sortOrder !== 'none'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <ArrowUpDown className="w-4 h-4" />
                <span>{sortOrder === 'asc' ? 'Menor precio' : sortOrder === 'desc' ? 'Mayor precio' : 'Precio'}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${sortDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {sortDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border w-48 z-40">
                  <button
                    onClick={() => handleSortSelect('asc')}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors ${
                      sortOrder === 'asc' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                    }`}
                  >
                    Menor precio
                  </button>
                  <button
                    onClick={() => handleSortSelect('desc')}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors ${
                      sortOrder === 'desc' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                    }`}
                  >
                    Mayor precio
                  </button>
                </div>
              )}
            </div>

            {showFilteredProducts && (
              <button
                onClick={handleClearFilter}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors ml-auto"
              >
                <XIcon className="w-3.5 h-3.5" />
                {activeFilterLabel || 'Limpiar filtros'}
              </button>
            )}
          </div>
        </div>
      </div>

      {showFilteredProducts ? (
        <div className="container mx-auto px-4 py-8">
          {isProductsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : displayProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No se encontraron productos</p>
            </div>
          ) : (
            <>
              {activeFilterLabel && (
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">{activeFilterLabel}</h2>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                {currentPageProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    variant={window.innerWidth >= 768 ? 'full' : 'minimal'}
                  />
                ))}
              </div>
              {displayProducts.length > productsPerPage && (
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
            </>
          )}
        </div>
      ) : (
        <ShowcaseGroups />
      )}
    </div>
  );
}
