import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type PopupConfig = {
  id?: string;
  title: string;
  subtitle: string;
  discount_percentage: number;
  discount_code: string;
  button_text: string;
  terms_text: string;
  success_title: string;
  success_message: string;
  active: boolean;
};

const DEFAULT_CONFIG: PopupConfig = {
  title: '¡5% OFF en tu primera compra!',
  subtitle: 'Acceso anticipado a ofertas exclusivas',
  discount_percentage: 5,
  discount_code: 'BIENVENIDA',
  button_text: 'Obtener descuento',
  terms_text: 'Al suscribirte, aceptas nuestra política de privacidad y términos y condiciones',
  success_title: '¡Gracias por suscribirte!',
  success_message: 'Usa el código {code} para obtener un {discount}% de descuento en tu primera compra. También te hemos enviado esta información por correo.',
  active: true
};

export default function PopupManagement() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<PopupConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    checkAuth();
    fetchConfig();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/admin');
    }
  };

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('popup_config')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setConfig(data);
      } else {
        // Si no hay configuración, creamos una con los valores por defecto
        const { data: newConfig, error: insertError } = await supabase
          .from('popup_config')
          .insert([DEFAULT_CONFIG])
          .select()
          .single();

        if (insertError) throw insertError;
        if (newConfig) setConfig(newConfig);
      }
    } catch (error) {
      console.error('Error fetching popup config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async (newConfig: PopupConfig) => {
    setIsSaving(true);
    setSaveMessage('');

    try {
      const { error } = await supabase
        .from('popup_config')
        .upsert({ ...newConfig, id: config.id });

      if (error) throw error;

      setSaveMessage('Configuración guardada exitosamente');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error saving popup config:', error);
      setSaveMessage('Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await saveConfig(config);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleToggleActive = () => {
    setConfig(prev => ({
      ...prev,
      active: !prev.active
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              Volver
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Gestión del Pop-up</h1>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <label className="text-sm font-medium text-gray-700 mr-2">
                  Estado del Pop-up
                </label>
                <div
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    config.active ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                  onClick={handleToggleActive}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.active ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título
                </label>
                <input
                  type="text"
                  name="title"
                  value={config.title}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subtítulo
                </label>
                <input
                  type="text"
                  name="subtitle"
                  value={config.subtitle}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Porcentaje de descuento
                </label>
                <input
                  type="number"
                  name="discount_percentage"
                  value={config.discount_percentage}
                  onChange={handleChange}
                  min="1"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código de descuento
                </label>
                <input
                  type="text"
                  name="discount_code"
                  value={config.discount_code}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg uppercase"
                  required
                  pattern="[A-Z0-9]+"
                  title="Solo letras mayúsculas y números"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Texto del botón
                </label>
                <input
                  type="text"
                  name="button_text"
                  value={config.button_text}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Texto de términos y condiciones
              </label>
              <textarea
                name="terms_text"
                value={config.terms_text}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título de éxito
              </label>
              <input
                type="text"
                name="success_title"
                value={config.success_title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mensaje de éxito
              </label>
              <textarea
                name="success_message"
                value={config.success_message}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Usa {'{discount}'} para insertar el porcentaje de descuento y {'{code}'} para insertar el código
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Guardar cambios
                  </>
                )}
              </button>
            </div>

            {saveMessage && (
              <div className={`text-center p-2 rounded ${
                saveMessage.includes('error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
              }`}>
                {saveMessage}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}