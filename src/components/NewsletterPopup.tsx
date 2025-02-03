import React, { useState, useEffect } from 'react';
import { X, Mail } from 'lucide-react';
import { useAnalytics } from '../hooks/useAnalytics';
import { supabase } from '../lib/supabase';

type PopupConfig = {
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

export default function NewsletterPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [hasSubscribed, setHasSubscribed] = useState(false);
  const [config, setConfig] = useState<PopupConfig | null>(null);
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      // Get the most recently updated active configuration
      const { data, error } = await supabase
        .from('popup_config')
        .select('*')
        .eq('active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setConfig(data);
        // Solo mostrar el popup si está activo
        if (data.active) {
          initializePopupBehavior();
        }
      }
    } catch (error) {
      console.error('Error fetching popup config:', error);
    }
  };

  const initializePopupBehavior = () => {
    // Verificar si ya se mostró el popup anteriormente
    const hasSeenPopup = localStorage.getItem('newsletter_popup_seen');
    if (hasSeenPopup) return;

    // Variables para tracking de comportamiento
    let productViews = 0;
    let timeOnPage = 0;
    let isNearTop = false;
    let timer: NodeJS.Timeout;
    let shouldShow = false;

    // Incrementar vistas de productos cuando se navega a la página de detalle
    const handleProductView = () => {
      productViews++;
      if (productViews >= 2) shouldShow = true;
    };

    // Detectar cuando el usuario está cerca de la parte superior
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY < 100) {
        isNearTop = true;
        shouldShow = true;
      }
    };

    // Mostrar popup después de 30 segundos
    timer = setTimeout(() => {
      timeOnPage = 30;
      shouldShow = true;
    }, 30000);

    // Detectar scroll
    const handleScroll = () => {
      const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercentage > 30) shouldShow = true;
    };

    // Verificar condiciones cada segundo
    const checkConditions = setInterval(() => {
      if (shouldShow && !hasSeenPopup) {
        setIsVisible(true);
        trackEvent('newsletter_popup_shown', 'engagement', 'Newsletter Popup');
        clearInterval(checkConditions);
      }
    }, 1000);

    // Event listeners
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    document.addEventListener('product_view', handleProductView);

    return () => {
      clearTimeout(timer);
      clearInterval(checkConditions);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('product_view', handleProductView);
    };
  };

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('newsletter_popup_seen', 'true');
    trackEvent('newsletter_popup_closed', 'engagement', 'Newsletter Popup');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Por favor ingresa tu email');
      return;
    }

    try {
      const { error: insertError } = await supabase
        .from('newsletter_subscribers')
        .insert([
          {
            email,
            source: 'popup',
            discount_code: config?.discount_code
          }
        ]);

      if (insertError) {
        if (insertError.code === '23505') { // Unique violation
          setError('Este email ya está suscrito al newsletter');
        } else {
          throw insertError;
        }
        return;
      }

      setHasSubscribed(true);
      localStorage.setItem('newsletter_subscribed', 'true');
      trackEvent('newsletter_subscribed', 'engagement', 'Newsletter Popup');

      // Cerrar después de 10 segundos
      setTimeout(() => {
        setIsVisible(false);
        localStorage.setItem('newsletter_popup_seen', 'true');
      }, 10000);
    } catch (error) {
      console.error('Error al suscribirse:', error);
      setError('Hubo un error al suscribirte. Por favor intenta nuevamente.');
      trackEvent('newsletter_error', 'engagement', 'Newsletter Popup');
    }
  };

  if (!isVisible || !config) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        {!hasSubscribed ? (
          <>
            <div className="text-center mb-6">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {config.title}
              </h2>
              <p className="text-sm text-gray-500">
                {config.subtitle}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Tu correo electrónico"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                {error && (
                  <p className="mt-1 text-sm text-red-600">{error}</p>
                )}
              </div>

              <div className="text-xs text-gray-500">
                {config.terms_text}
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {config.button_text}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {config.success_title}
            </h2>
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-blue-800 mb-2">Tu código de descuento es:</p>
              <p className="text-xl font-mono font-bold text-blue-900">{config.discount_code}</p>
            </div>
            <p className="text-gray-600 text-sm">
              {config.success_message
                .replace('{discount}', config.discount_percentage.toString())
                .replace('{code}', config.discount_code)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}