import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Image, LogOut, Tag, Mail, MessageSquare, ShoppingCart } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, [navigate]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/admin');
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      localStorage.removeItem('adminAuth');
      navigate('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-800">Panel de Administración</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-600 hover:text-gray-800"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            onClick={() => navigate('/admin/products')}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-center mb-4">
              <Package className="h-8 w-8 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800 ml-3">
                Gestión de Productos
              </h2>
            </div>
            <p className="text-gray-600">
              Administra el catálogo de productos, precios y categorías.
            </p>
          </div>

          <div
            onClick={() => navigate('/admin/categories')}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-center mb-4">
              <Tag className="h-8 w-8 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800 ml-3">
                Gestión de Categorías
              </h2>
            </div>
            <p className="text-gray-600">
              Administra las categorías disponibles para los productos.
            </p>
          </div>

          <div
            onClick={() => navigate('/admin/banner')}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-center mb-4">
              <Image className="h-8 w-8 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800 ml-3">
                Gestión del Banner
              </h2>
            </div>
            <p className="text-gray-600">
              Actualiza las imágenes y textos del banner principal.
            </p>
          </div>

          <div
            onClick={() => navigate('/admin/subscriptions')}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-center mb-4">
              <Mail className="h-8 w-8 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800 ml-3">
                Suscripciones
              </h2>
            </div>
            <p className="text-gray-600">
              Gestiona los suscriptores del newsletter y sus códigos de descuento.
            </p>
          </div>

          <div
            onClick={() => navigate('/admin/popup')}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-center mb-4">
              <MessageSquare className="h-8 w-8 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800 ml-3">
                Gestión del Pop-up
              </h2>
            </div>
            <p className="text-gray-600">
              Configura los mensajes y opciones del pop-up de suscripción.
            </p>
          </div>

          <div
            onClick={() => navigate('/admin/orders')}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-center mb-4">
              <ShoppingCart className="h-8 w-8 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800 ml-3">
                Órdenes y Carritos
              </h2>
            </div>
            <p className="text-gray-600">
              Visualiza órdenes completadas y carritos abandonados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}