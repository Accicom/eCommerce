import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ProductCard from './ProductCard';
import type { Database } from '../lib/database.types';

type Product = Database['public']['Tables']['products']['Row'];

interface GroupWithProducts {
  id: string;
  title: string;
  display_order: number;
  categoryNames: string[];
  products: Product[];
}

function ShowcaseRow({ group }: { group: GroupWithProducts }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll, { passive: true });
      window.addEventListener('resize', checkScroll);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [group.products]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector(':scope > div')?.clientWidth || 280;
    const amount = direction === 'left' ? -(cardWidth * 2) : (cardWidth * 2);
    el.scrollBy({ left: amount, behavior: 'smooth' });
  };

  if (group.products.length === 0) return null;

  return (
    <section className="py-6 md:py-10">
      <div className="container mx-auto px-4">
        <div className="flex items-baseline gap-4 mb-5">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            {group.title}
          </h2>
          <Link
            to={`/catalogo?group=${group.id}`}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap"
          >
            Ver todo
          </Link>
        </div>

        <div className="relative group/showcase">
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all opacity-0 group-hover/showcase:opacity-100"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
          )}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all opacity-0 group-hover/showcase:opacity-100"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          )}

          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1"
          >
            {group.products.map(product => (
              <div
                key={product.id}
                className="flex-shrink-0 w-[45%] sm:w-[30%] md:w-[23%] lg:w-[23%]"
              >
                <ProductCard product={product} variant="full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ShowcaseGroups() {
  const [groups, setGroups] = useState<GroupWithProducts[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadShowcaseGroups();
  }, []);

  const loadShowcaseGroups = async () => {
    try {
      const { data: groupsData, error: groupsError } = await supabase
        .from('product_showcase_groups')
        .select('id, title, display_order')
        .eq('active', true)
        .order('display_order', { ascending: true });

      if (groupsError || !groupsData || groupsData.length === 0) {
        setGroups([]);
        setIsLoading(false);
        return;
      }

      const groupIds = groupsData.map(g => g.id);

      const { data: gcData, error: gcError } = await supabase
        .from('product_showcase_group_categories')
        .select('group_id, category_name')
        .in('group_id', groupIds);

      const categoryMap: Record<string, string[]> = {};

      if (!gcError && gcData && gcData.length > 0) {
        gcData.forEach(gc => {
          if (!categoryMap[gc.group_id]) categoryMap[gc.group_id] = [];
          categoryMap[gc.group_id].push(gc.category_name);
        });
      }

      const allCategoryNames = [...new Set(Object.values(categoryMap).flat())];

      let productsByCategory: Record<string, Product[]> = {};

      if (allCategoryNames.length > 0) {
        const batchSize = 50;
        const allProducts: Product[] = [];

        for (let i = 0; i < allCategoryNames.length; i += batchSize) {
          const batch = allCategoryNames.slice(i, i + batchSize);
          const { data: products } = await supabase
            .from('products')
            .select('*')
            .eq('visible', true)
            .in('category', batch)
            .order('created_at', { ascending: false })
            .limit(1000);

          if (products) allProducts.push(...products);
        }

        allProducts.forEach(p => {
          if (!productsByCategory[p.category]) productsByCategory[p.category] = [];
          productsByCategory[p.category].push(p);
        });
      }

      const result: GroupWithProducts[] = [];

      for (const g of groupsData) {
        const catNames = categoryMap[g.id] || [];
        const groupProducts: Product[] = [];
        const seen = new Set<string>();

        for (const name of catNames) {
          for (const p of (productsByCategory[name] || [])) {
            if (!seen.has(p.id)) {
              seen.add(p.id);
              groupProducts.push(p);
            }
          }
        }

        if (groupProducts.length > 0) {
          result.push({
            id: g.id,
            title: g.title,
            display_order: g.display_order,
            categoryNames: catNames,
            products: groupProducts.slice(0, 20),
          });
        }
      }

      setGroups(result);
    } catch (error) {
      console.error('ShowcaseGroups error:', error);
      setGroups([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || groups.length === 0) return null;

  return (
    <div>
      {groups.map(group => (
        <ShowcaseRow key={group.id} group={group} />
      ))}
    </div>
  );
}
