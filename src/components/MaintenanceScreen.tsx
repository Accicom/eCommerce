import { Wrench, Clock, Phone, MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface MaintenanceScreenProps {
  title?: string;
  message?: string;
  endTime?: string | null;
}

export default function MaintenanceScreen({
  title = 'Estamos actualizando nuestro catálogo',
  message = 'Estamos trabajando en actualizar nuestros productos y precios para ofrecerte la mejor experiencia. Por favor, vuelve pronto.',
  endTime = null
}: MaintenanceScreenProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (!endTime) return;

    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const distance = end - now;

      if (distance < 0) {
        setTimeRemaining('Pronto');
        return;
      }

      const hours = Math.floor(distance / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else {
        setTimeRemaining(`${minutes} minutos`);
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 60000);

    return () => clearInterval(interval);
  }, [endTime]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center">
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
            <div className="relative bg-blue-600 rounded-full p-6">
              <Wrench className="h-16 w-16 text-white animate-[spin_3s_ease-in-out_infinite]" />
            </div>
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          {title}
        </h1>

        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          {message}
        </p>

        {endTime && timeRemaining && (
          <div className="bg-blue-50 rounded-lg p-6 mb-8 border border-blue-200">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Tiempo estimado de finalización
              </span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{timeRemaining}</p>
          </div>
        )}

        <div className="border-t border-gray-200 pt-8 mt-8">
          <p className="text-gray-700 font-medium mb-4">
            ¿Necesitas ayuda?
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://wa.me/5493513486125"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <MessageCircle className="h-5 w-5" />
              WhatsApp
            </a>

          </div>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>Gracias por tu paciencia y comprensión</p>
        </div>
      </div>
    </div>
  );
}
