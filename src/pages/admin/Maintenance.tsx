import { useState, useEffect } from 'react';
import { ArrowLeft, Wrench, Save, AlertCircle, Eye, Power } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import MaintenanceScreen from '../../components/MaintenanceScreen';

interface SiteSettings {
  id: string;
  maintenance_mode: boolean;
  maintenance_title: string;
  maintenance_message: string;
  maintenance_end_time: string | null;
}

export default function Maintenance() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [formData, setFormData] = useState({
    maintenance_mode: false,
    maintenance_title: 'Estamos actualizando nuestro catálogo',
    maintenance_message: 'Estamos trabajando en actualizar nuestros productos y precios para ofrecerte la mejor experiencia. Por favor, vuelve pronto.',
    maintenance_end_time: ''
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data);
        setFormData({
          maintenance_mode: data.maintenance_mode,
          maintenance_title: data.maintenance_title,
          maintenance_message: data.maintenance_message,
          maintenance_end_time: data.maintenance_end_time
            ? new Date(data.maintenance_end_time).toISOString().slice(0, 16)
            : ''
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage({ type: 'error', text: 'Error al cargar la configuración' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const updateData: any = {
        maintenance_mode: formData.maintenance_mode,
        maintenance_title: formData.maintenance_title,
        maintenance_message: formData.maintenance_message,
        maintenance_end_time: formData.maintenance_end_time
          ? new Date(formData.maintenance_end_time).toISOString()
          : null
      };

      if (settings?.id) {
        const { error } = await supabase
          .from('site_settings')
          .update(updateData)
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert([updateData]);

        if (error) throw error;
      }

      setMessage({
        type: 'success',
        text: formData.maintenance_mode
          ? '¡Modo de mantenimiento activado!'
          : 'Configuración guardada correctamente'
      });

      await loadSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Error al guardar la configuración' });
    } finally {
      setSaving(false);
    }
  };

  const toggleMaintenanceMode = async () => {
    const newMode = !formData.maintenance_mode;
    setFormData({ ...formData, maintenance_mode: newMode });

    setSaving(true);
    try {
      if (settings?.id) {
        const { error } = await supabase
          .from('site_settings')
          .update({ maintenance_mode: newMode })
          .eq('id', settings.id);

        if (error) throw error;

        setMessage({
          type: 'success',
          text: newMode
            ? '¡Modo de mantenimiento activado! El catálogo está bloqueado.'
            : '¡Modo de mantenimiento desactivado! El catálogo está disponible.'
        });

        await loadSettings();
      }
    } catch (error) {
      console.error('Error toggling maintenance mode:', error);
      setMessage({ type: 'error', text: 'Error al cambiar el modo de mantenimiento' });
      setFormData({ ...formData, maintenance_mode: !newMode });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  if (showPreview) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowPreview(false)}
          className="absolute top-4 left-4 z-50 bg-white text-gray-800 px-4 py-2 rounded-lg shadow-lg hover:bg-gray-100 transition-colors flex items-center gap-2 font-medium"
        >
          <ArrowLeft className="h-5 w-5" />
          Cerrar Vista Previa
        </button>
        <MaintenanceScreen
          title={formData.maintenance_title}
          message={formData.maintenance_message}
          endTime={formData.maintenance_end_time || null}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Volver al Panel
        </button>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Wrench className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Modo de Mantenimiento</h1>
                <p className="text-gray-600 text-sm mt-1">
                  Controla el acceso al catálogo durante actualizaciones
                </p>
              </div>
            </div>
          </div>

          {formData.maintenance_mode && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
                <div>
                  <p className="text-red-900 font-semibold">¡Modo de Mantenimiento Activo!</p>
                  <p className="text-red-700 text-sm mt-1">
                    El catálogo está bloqueado. Los usuarios verán la pantalla de mantenimiento.
                  </p>
                </div>
              </div>
            </div>
          )}

          {message && (
            <div className={`p-4 rounded-lg mb-6 ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border-2 border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Power className={`h-8 w-8 mr-4 ${formData.maintenance_mode ? 'text-red-600' : 'text-green-600'}`} />
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Estado: {formData.maintenance_mode ? 'ACTIVO' : 'INACTIVO'}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {formData.maintenance_mode
                      ? 'El catálogo está bloqueado para usuarios'
                      : 'El catálogo está disponible normalmente'}
                  </p>
                </div>
              </div>

              <button
                onClick={toggleMaintenanceMode}
                disabled={saving}
                className={`px-8 py-4 rounded-lg font-bold text-white text-lg transition-all transform hover:scale-105 ${
                  formData.maintenance_mode
                    ? 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200'
                    : 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200'
                } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {saving ? 'Cambiando...' : formData.maintenance_mode ? 'DESACTIVAR' : 'ACTIVAR'}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título del Mensaje
              </label>
              <input
                type="text"
                value={formData.maintenance_title}
                onChange={(e) => setFormData({ ...formData, maintenance_title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Estamos actualizando nuestro catálogo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensaje para los Usuarios
              </label>
              <textarea
                value={formData.maintenance_message}
                onChange={(e) => setFormData({ ...formData, maintenance_message: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Estamos trabajando en actualizar nuestros productos..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tiempo Estimado de Finalización (Opcional)
              </label>
              <input
                type="datetime-local"
                value={formData.maintenance_end_time}
                onChange={(e) => setFormData({ ...formData, maintenance_end_time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                Si especificas una hora, se mostrará un contador regresivo a los usuarios
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2 font-medium"
              >
                <Save className="h-5 w-5" />
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>

              <button
                onClick={() => setShowPreview(true)}
                className="flex-1 bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <Eye className="h-5 w-5" />
                Vista Previa
              </button>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">💡 Consejos de Uso</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Activa el modo de mantenimiento antes de actualizar precios o hacer cambios masivos en el catálogo</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Personaliza el mensaje para informar a tus clientes sobre el tiempo estimado</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>El catálogo se bloqueará inmediatamente después de activar el modo</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Las rutas administrativas siempre permanecen accesibles para ti</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
