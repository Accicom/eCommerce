import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, CreditCard as Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type BannerSlide = Database['public']['Tables']['banner_slides']['Row'] & {
  mobile_image?: string;
};

export default function Banner() {
  const navigate = useNavigate();
  const [slides, setSlides] = useState<BannerSlide[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState<BannerSlide | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchSlides();
  }, [navigate]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/admin');
    }
  };

  const fetchSlides = async () => {
    try {
      const { data, error } = await supabase
        .from('banner_slides')
        .select('*')
        .order('order', { ascending: true });

      if (error) throw error;
      setSlides(data || []);
    } catch (error) {
      console.error('Error fetching slides:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const slideData = {
      title: formData.get('title') as string,
      subtitle: formData.get('subtitle') as string,
      image: formData.get('image') as string,
      mobile_image: formData.get('mobile_image') as string || null,
      order: currentSlide ? currentSlide.order : (slides.length + 1),
      show_text_overlay: formData.get('show_text_overlay') === 'on'
    };

    try {
      if (currentSlide) {
        const { error } = await supabase
          .from('banner_slides')
          .update(slideData)
          .eq('id', currentSlide.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('banner_slides')
          .insert([slideData]);
        
        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchSlides();
    } catch (error) {
      console.error('Error saving slide:', error);
    }
  };

  const handleDelete = async (slideId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta diapositiva?')) {
      try {
        const { error } = await supabase
          .from('banner_slides')
          .delete()
          .eq('id', slideId);

        if (error) throw error;
        fetchSlides();
      } catch (error) {
        console.error('Error deleting slide:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              Volver
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Gestión del Banner</h1>
          </div>
          <button
            onClick={() => {
              setCurrentSlide(null);
              setIsModalOpen(true);
            }}
            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nueva Diapositiva
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <div className="grid gap-6">
            {slides.map((slide) => (
              <div
                key={slide.id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="md:flex">
                  <div className="md:flex-shrink-0">
                    <div className="grid grid-cols-2 gap-2 p-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-2">Desktop</p>
                        <img
                          src={slide.image}
                          alt={`${slide.title} - Desktop`}
                          className="h-32 w-full object-cover rounded"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-2">Mobile</p>
                        <img
                          src={slide.mobile_image || slide.image}
                          alt={`${slide.title} - Mobile`}
                          className="h-32 w-full object-cover rounded"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="p-8 w-full">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">
                          {slide.title}
                        </h3>
                        <p className="text-gray-600">{slide.subtitle}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setCurrentSlide(slide);
                            setIsModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(slide.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal para agregar/editar diapositiva */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {currentSlide ? 'Editar Diapositiva' : 'Nueva Diapositiva'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título
                </label>
                <input
                  name="title"
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  defaultValue={currentSlide?.title}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subtítulo
                </label>
                <input
                  name="subtitle"
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  defaultValue={currentSlide?.subtitle}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL de la imagen (Desktop)
                </label>
                <input
                  name="image"
                  type="url"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  defaultValue={currentSlide?.image}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Tamaño recomendado: 1920x450 píxeles
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL de la imagen (Mobile)
                </label>
                <input
                  name="mobile_image"
                  type="url"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  defaultValue={currentSlide?.mobile_image}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Tamaño recomendado: 768x250 píxeles. Si no se proporciona, se usará la imagen de desktop.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="show_text_overlay"
                  id="show_text_overlay"
                  defaultChecked={currentSlide?.show_text_overlay ?? true}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="show_text_overlay" className="text-sm text-gray-700">
                  Mostrar texto superpuesto y sombreado
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Desactiva esta opción si tu imagen ya tiene texto o prefieres mostrarla sin sombreado
              </p>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {currentSlide ? 'Guardar Cambios' : 'Crear Diapositiva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}