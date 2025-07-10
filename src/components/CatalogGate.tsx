import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MessageCircle } from 'lucide-react';

type CatalogGateProps = {
  onAccess: (clientData: any) => void;
};

export default function CatalogGate({ onAccess }: CatalogGateProps) {
  const [step, setStep] = useState<'initial' | 'verify' | 'lead'>('initial');
  const [dni, setDni] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [clientData, setClientData] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isLeadSubmitted, setIsLeadSubmitted] = useState(false);

  useEffect(() => {
    // Check if user was previously authenticated
    const savedClient = localStorage.getItem('catalog_client');
    if (savedClient) {
      const client = JSON.parse(savedClient);
      setClientData(client);
      updateLastSeen(client.id);
      onAccess(client);
    }

    // Fetch some products for the background
    fetchSampleProducts();
  }, []);

  const fetchSampleProducts = async () => {
    try {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('visible', true)
        .limit(8);
      
      if (data) setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const updateLastSeen = async (clientId: string) => {
    try {
      const { error } = await supabase
        .from('catalog_clients')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', clientId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating last seen:', error);
    }
  };

  const handleDniSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Check if DNI exists in catalog_clients
      const { data: client, error: clientError } = await supabase
        .from('catalog_clients')
        .select('*')
        .eq('dni', dni)
        .single();

      if (clientError && clientError.code !== 'PGRST116') {
        throw clientError;
      }

      if (client) {
        setClientData(client);
        setStep('verify');
      } else {
        // DNI not found, go to email collection step
        setStep('lead');
      }
    } catch (error) {
      console.error('Error checking DNI:', error);
      setError('Error al verificar el documento. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAsClient = async () => {
    if (clientData) {
      await updateLastSeen(clientData.id);
      localStorage.setItem('catalog_client', JSON.stringify(clientData));
      onAccess(clientData);
    }
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Create client directly with DNI and email
      const { data: newClient, error: clientError } = await supabase
        .from('catalog_clients')
        .insert([{ 
          dni, 
          email,
          name: null // Explicitly set name as null
        }])
        .select()
        .single();

      if (clientError) throw clientError;

      // Also create a lead record for tracking
      const { error: leadError } = await supabase
        .from('catalog_leads')
        .insert([{ 
          dni, 
          email,
          status: 'approved' // Automatically approved
        }]);

      if (leadError) throw leadError;

      // Set client data and grant access immediately
      setClientData(newClient);
      await updateLastSeen(newClient.id);
      localStorage.setItem('catalog_client', JSON.stringify(newClient));
      onAccess(newClient);
      
    } catch (error) {
      console.error('Error saving lead:', error);
      if (error.code === '23505') {
        // Duplicate key error - DNI or email already exists
        if (error.message.includes('dni')) {
          setError('Este DNI ya está registrado en el sistema.');
        } else if (error.message.includes('email')) {
          setError('Este email ya está registrado en el sistema.');
        } else {
          setError('Los datos ya están registrados en el sistema.');
        }
      } else {
        setError('Error al procesar sus datos. Por favor, intente nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppClick = () => {
    window.open('https://wa.me/5493513486125', '_blank');
  };

  const renderForm = () => {
    if (step === 'initial') {
      return (
        <div className="max-w-md w-full bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-blue-600">10%</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              ¡Acceso Exclusivo!
            </h2>
            <p className="text-gray-600">
              Si recibiste un mensaje para acceder al catálogo, ingresa tu número de documento
            </p>
          </div>

          <form onSubmit={handleDniSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Documento
              </label>
              <input
                type="text"
                value={dni}
                onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ingresa tu DNI"
                maxLength={8}
                required
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Verificando...' : 'Continuar'}
            </button>
          </form>
        </div>
      );
    }

    if (step === 'verify') {
      return (
        <div className="max-w-md w-full bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Verificar Identidad
            </h2>
            <p className="text-gray-600 mb-6">
              ¿Es correcto tu DNI {clientData?.dni}?
            </p>

            <div className="space-y-4">
              <button
                onClick={handleContinueAsClient}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sí, continuar
              </button>

              <button
                onClick={() => {
                  setStep('initial');
                  setDni('');
                  setClientData(null);
                }}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
              >
                No, corregir DNI
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-md w-full bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Completa tu registro
          </h2>
          <p className="text-gray-600 mb-8">
            Para acceder al catálogo, necesitamos tu correo electrónico
          </p>
          <form onSubmit={handleLeadSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="tu@email.com"
                required
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Procesando...' : 'Acceder al Catálogo'}
            </button>
          </form>
          
          <div className="text-center">
            <p className="text-xs text-gray-500 mt-4">
              Al registrarte, tendrás acceso inmediato al catálogo completo
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen relative">
      {/* Blurred background with sample products */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 blur-sm opacity-50">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg p-4">
              <div className="aspect-square relative">
                <img
                  src={product.image}
                  alt={product.name}
                  className="absolute inset-0 w-full h-full object-cover rounded-lg"
                />
              </div>
              <div className="mt-2">
                <h3 className="font-semibold text-gray-800 truncate">{product.name}</h3>
                <p className="text-gray-600">${product.price}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Form overlay */}
      <div className="min-h-screen flex items-center justify-center relative z-10 px-4">
        {renderForm()}
      </div>
    </div>
  );
}