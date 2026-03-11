import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Image, LogOut, Tag, Mail, MessageSquare, ShoppingCart, Users, MapPin, TestTube, Bell, Layers, Wrench, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function Dashboard() {
  const navigate = useNavigate();
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    checkAuth();
    checkMaintenanceMode();
  }, [navigate]);

  const checkMaintenanceMode = async () => {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('maintenance_mode')
        .maybeSingle();

      if (data) {
        setMaintenanceMode(data.maintenance_mode);
      }
    } catch (error) {
      console.error('Error checking maintenance mode:', error);
    }
  };

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
        {maintenanceMode && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0" />
              <div>
                <p className="text-red-900 font-semibold">Modo de Mantenimiento Activo</p>
                <p className="text-red-700 text-sm mt-1">
                  El catálogo está bloqueado. Los usuarios están viendo la pantalla de mantenimiento.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            onClick={() => navigate('/admin/maintenance')}
            className={`rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer ${
              maintenanceMode ? 'bg-red-50 border-2 border-red-500' : 'bg-white'
            }`}
          >
            <div className="flex items-center mb-4">
              <Wrench className={`h-8 w-8 ${maintenanceMode ? 'text-red-600' : 'text-blue-600'}`} />
              <h2 className="text-xl font-semibold text-gray-800 ml-3">
                Modo de Mantenimiento
              </h2>
            </div>
            <p className="text-gray-600">
              Controla el acceso al catálogo durante actualizaciones de productos.
            </p>
            {maintenanceMode && (
              <div className="mt-3 text-red-600 font-semibold text-sm">
                ⚠ ACTIVO - Catálogo bloqueado
              </div>
            )}
          </div>

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
            onClick={() => navigate('/admin/info-banners')}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-center mb-4">
              <Bell className="h-8 w-8 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800 ml-3">
                Banners Informativos
              </h2>
            </div>
            <p className="text-gray-600">
              Gestiona los anuncios informativos que aparecen arriba del header.
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
            onClick={() => navigate('/admin/testing')}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-center mb-4">
              <TestTube className="h-8 w-8 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800 ml-3">
                Pruebas de Funcionamiento
              </h2>
            </div>
            <p className="text-gray-600">
              Herramientas de diagnóstico para verificar el funcionamiento del sistema.
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

          <div
            onClick={() => navigate('/admin/catalog-clients')}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-center mb-4">
              <Users className="h-8 w-8 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800 ml-3">
                Clientes del Catálogo
              </h2>
            </div>
            <p className="text-gray-600">
              Gestiona los clientes con acceso al catálogo y leads interesados.
            </p>
          </div>

          <div
            onClick={() => navigate('/admin/showcase-groups')}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-center mb-4">
              <Layers className="h-8 w-8 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800 ml-3">
                Grupos de Exhibición
              </h2>
            </div>
            <p className="text-gray-600">
              Crea grupos de productos por categoría para mostrar en la página principal.
            </p>
          </div>

          <div
            onClick={() => navigate('/admin/branches')}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-center mb-4">
              <MapPin className="h-8 w-8 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800 ml-3">
                Gestión de Sucursales
              </h2>
            </div>
            <p className="text-gray-600">
              Administra la información y ubicación de las sucursales.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}