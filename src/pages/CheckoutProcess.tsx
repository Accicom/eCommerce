import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle, CheckCircle, ShoppingBag, User, CreditCard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatPrice } from '../utils/formatters';
import type { Database } from '../lib/database.types';

type Product = Database['public']['Tables']['products']['Row'];
type CatalogClient = Database['public']['Tables']['catalog_clients']['Row'];

type Step = 'dni' | 'new_client' | 'confirm_identity' | 'payment_terms' | 'success' | 'not_eligible';

const STEPS_ORDER: Step[] = ['dni', 'confirm_identity', 'payment_terms', 'success'];

function getStepIndex(step: Step) {
  if (step === 'new_client') return 0;
  if (step === 'not_eligible') return 1;
  return STEPS_ORDER.indexOf(step);
}

function StepIndicator({ currentStep }: { currentStep: Step }) {
  const labels = ['Identificaci\u00f3n', 'Verificaci\u00f3n', 'Pago', 'Confirmaci\u00f3n'];
  const idx = getStepIndex(currentStep);

  return (
    <div className="flex items-center justify-center mb-8">
      {labels.map((label, i) => (
        <React.Fragment key={label}>
          <div className="flex flex-col items-center">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                i <= idx
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {i < idx ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                i + 1
              )}
            </div>
            <span className={`text-xs mt-1 hidden sm:block ${i <= idx ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
              {label}
            </span>
          </div>
          {i < labels.length - 1 && (
            <div className={`w-12 sm:w-20 h-0.5 mx-1 sm:mx-2 ${i < idx ? 'bg-blue-600' : 'bg-gray-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function CheckoutProcess() {
  const { code } = useParams();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('dni');
  const [product, setProduct] = useState<Product | null>(null);
  const [client, setClient] = useState<CatalogClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dni, setDni] = useState('');
  const [dniError, setDniError] = useState<string | null>(null);

  const [newClient, setNewClient] = useState({ name: '', apellido: '', celular: '', email: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [paymentTerms, setPaymentTerms] = useState<number | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchProduct();
  }, [code]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('code', code)
        .maybeSingle();

      if (error) throw error;
      setProduct(data);
    } catch (err) {
      console.error('Error fetching product:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDniSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDniError(null);

    if (!dni.match(/^\d{7,8}$/)) {
      setDniError('El DNI debe tener 7 u 8 d\u00edgitos');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('catalog_clients')
        .select('*')
        .eq('dni', dni)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setClient(data);
        setStep('confirm_identity');
      } else {
        setStep('new_client');
      }
    } catch (err) {
      console.error('Error checking DNI:', err);
      setDniError('Error al verificar el documento. Intent\u00e1 nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!newClient.name.trim()) errors.name = 'Requerido';
    if (!newClient.apellido.trim()) errors.apellido = 'Requerido';
    if (!newClient.celular.trim()) errors.celular = 'Requerido';
    if (!newClient.email.trim()) errors.email = 'Requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newClient.email)) errors.email = 'Email inv\u00e1lido';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { data: created, error: insertErr } = await supabase
        .from('catalog_clients')
        .insert([{
          dni,
          name: `${newClient.name.trim()} ${newClient.apellido.trim()}`,
          celular: newClient.celular.trim(),
          email: newClient.email.trim(),
          oferta_maxima: 0,
        }])
        .select()
        .single();

      if (insertErr) throw insertErr;

      setClient(created);
      setStep('confirm_identity');
    } catch (err: any) {
      if (err?.code === '23505') {
        setError('Este DNI ya est\u00e1 registrado en el sistema.');
      } else {
        setError('Error al crear el registro. Intent\u00e1 nuevamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmIdentity = async () => {
    if (!client || !product) return;

    const oferta = Number(client.oferta_maxima) || 0;
    const precio = Number(product.price);

    if (oferta >= precio) {
      setStep('payment_terms');
    } else {
      setStep('not_eligible');
      await savePurchaseIntent(oferta);
    }
  };

  const savePurchaseIntent = async (clientOffer: number) => {
    if (!client || !product) return;

    try {
      await supabase
        .from('purchase_intents')
        .insert([{
          client_id: client.id,
          product_id: product.id,
          product_name: product.name,
          product_code: product.code,
          product_price: product.price,
          client_offer: clientOffer,
          client_name: client.name,
          client_dni: client.dni,
          client_email: client.email,
          client_phone: client.celular,
          status: 'pending',
        }]);

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-intent-notification`;
      await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientName: client.name,
          clientDni: client.dni,
          clientEmail: client.email,
          clientPhone: client.celular,
          productName: product.name,
          productCode: product.code,
          productPrice: Number(product.price),
          clientOffer: clientOffer,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (err) {
      console.error('Error saving purchase intent:', err);
    }
  };

  const handleFinalizeOrder = async () => {
    if (!client || !product || !paymentTerms) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const orderNumber = Math.floor(Math.random() * 1000000);

      const { error: orderErr } = await supabase
        .from('completed_orders')
        .insert([{
          order_number: `#${orderNumber}`,
          order_data: [{
            product_id: product.id,
            product_name: product.name,
            quantity: 1,
            price: product.price,
            payment_terms: paymentTerms,
          }],
          total_amount: product.price,
          whatsapp_message: `Orden desde marketplace - ${product.name} - ${paymentTerms} cuotas`,
          client_id: client.id,
        }]);

      if (orderErr) throw orderErr;

      try {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-purchase-notification`;
        await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientName: client.name,
            clientDni: client.dni,
            clientEmail: client.email,
            clientPhone: client.celular,
            productName: product.name,
            productCode: product.code,
            productPrice: product.price,
            paymentTerms,
            orderNumber,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (emailErr) {
        console.error('Error sending notification:', emailErr);
      }

      setStep('success');
    } catch (err) {
      console.error('Error finalizing order:', err);
      setError('Error al procesar la orden. Intent\u00e1 nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="container mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Producto no encontrado</h2>
          <Link to="/catalogo" className="text-blue-600 hover:text-blue-800 font-medium">
            {'Volver al cat\u00e1logo'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-16">
      <div className="container mx-auto px-4 max-w-5xl">
        <button
          onClick={() => navigate(`/producto/${product.code}`)}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6 font-medium"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver al producto
        </button>

        <StepIndicator currentStep={step} />

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {step === 'dni' && (
                <div className="max-w-sm mx-auto">
                  <div className="text-center mb-8">
                    <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="h-7 w-7 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-1">{'Identificaci\u00f3n'}</h2>
                    <p className="text-gray-500 text-sm">{'Ingres\u00e1 tu documento para continuar'}</p>
                  </div>
                  <form onSubmit={handleDniSubmit} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">DNI</label>
                      <input
                        type="text"
                        value={dni}
                        onChange={(e) => { setDni(e.target.value.replace(/\D/g, '')); setDniError(null); }}
                        placeholder="Ej: 12345678"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg tracking-wider"
                        maxLength={8}
                        autoFocus
                      />
                      {dniError && <p className="text-red-600 text-sm mt-1.5">{dniError}</p>}
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting || dni.length < 7}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Verificando...' : 'Continuar'}
                    </button>
                  </form>
                </div>
              )}

              {step === 'new_client' && (
                <div>
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-1">Completar datos</h2>
                    <p className="text-gray-500 text-sm">{'No encontramos tu DNI. Complet\u00e1 tus datos para continuar.'}</p>
                  </div>
                  <form onSubmit={handleNewClientSubmit} className="space-y-4 max-w-md mx-auto">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                        <input
                          type="text"
                          value={newClient.name}
                          onChange={(e) => { setNewClient({ ...newClient, name: e.target.value }); setFormErrors({ ...formErrors, name: '' }); }}
                          className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.name ? 'border-red-400' : 'border-gray-300'}`}
                        />
                        {formErrors.name && <p className="text-red-600 text-xs mt-1">{formErrors.name}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                        <input
                          type="text"
                          value={newClient.apellido}
                          onChange={(e) => { setNewClient({ ...newClient, apellido: e.target.value }); setFormErrors({ ...formErrors, apellido: '' }); }}
                          className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.apellido ? 'border-red-400' : 'border-gray-300'}`}
                        />
                        {formErrors.apellido && <p className="text-red-600 text-xs mt-1">{formErrors.apellido}</p>}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Celular</label>
                      <input
                        type="tel"
                        value={newClient.celular}
                        onChange={(e) => { setNewClient({ ...newClient, celular: e.target.value }); setFormErrors({ ...formErrors, celular: '' }); }}
                        placeholder="Ej: 3511234567"
                        className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.celular ? 'border-red-400' : 'border-gray-300'}`}
                      />
                      {formErrors.celular && <p className="text-red-600 text-xs mt-1">{formErrors.celular}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{'Correo electr\u00f3nico'}</label>
                      <input
                        type="email"
                        value={newClient.email}
                        onChange={(e) => { setNewClient({ ...newClient, email: e.target.value }); setFormErrors({ ...formErrors, email: '' }); }}
                        placeholder="tu@email.com"
                        className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.email ? 'border-red-400' : 'border-gray-300'}`}
                      />
                      {formErrors.email && <p className="text-red-600 text-xs mt-1">{formErrors.email}</p>}
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
                    >
                      {isSubmitting ? 'Registrando...' : 'Registrarme y continuar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setStep('dni'); setDni(''); }}
                      className="w-full text-gray-500 hover:text-gray-700 text-sm py-2"
                    >
                      Volver
                    </button>
                  </form>
                </div>
              )}

              {step === 'confirm_identity' && client && (
                <div className="max-w-sm mx-auto text-center">
                  <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="h-7 w-7 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-6">Confirmar identidad</h2>
                  <div className="p-5 bg-blue-50 border border-blue-200 rounded-xl mb-6">
                    <p className="text-gray-800 text-lg">
                      {'\u00bfUsted es '}<span className="font-bold">{client.name}</span>{'?'}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleConfirmIdentity}
                      className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                    >
                      {'S\u00ed, soy yo'}
                    </button>
                    <button
                      onClick={() => { setClient(null); setDni(''); setStep('dni'); }}
                      className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                    >
                      No, corregir
                    </button>
                  </div>
                </div>
              )}

              {step === 'payment_terms' && (
                <div className="max-w-md mx-auto">
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CreditCard className="h-7 w-7 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-1">Plazo de pago</h2>
                    <p className="text-gray-500 text-sm">{'Seleccion\u00e1 la cantidad de cuotas que prefer\u00eds'}</p>
                  </div>
                  <div className="space-y-3 mb-8">
                    {[6, 9, 12, 15, 18].map((term) => (
                      <button
                        key={term}
                        onClick={() => setPaymentTerms(term)}
                        className={`w-full p-4 text-left border-2 rounded-xl transition-all flex items-center justify-between ${
                          paymentTerms === term
                            ? 'border-blue-600 bg-blue-50 shadow-sm'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                        }`}
                      >
                        <span className="font-bold text-lg text-gray-800">{term} cuotas</span>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          paymentTerms === term ? 'border-blue-600' : 'border-gray-300'
                        }`}>
                          {paymentTerms === term && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                        </div>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleFinalizeOrder}
                    disabled={!paymentTerms || isSubmitting}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Procesando...' : 'Finalizar orden'}
                  </button>
                </div>
              )}

              {step === 'not_eligible' && (
                <div className="max-w-sm mx-auto text-center py-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-5">
                    <CheckCircle className="h-8 w-8 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-3">Solicitud recibida</h2>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    Estamos evaluando tu solicitud de compra. En breve, un asesor se va a comunicar con vos para darte una respuesta.
                  </p>
                  <p className="text-gray-500 text-sm mb-8">
                    Registramos tu interes y te contactaremos a la brevedad.
                  </p>
                  <Link
                    to="/catalogo"
                    className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    Seguir viendo productos
                  </Link>
                </div>
              )}

              {step === 'success' && (
                <div className="max-w-sm mx-auto text-center py-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-3">Orden registrada</h2>
                  <p className="text-gray-600 mb-8 leading-relaxed">
                    Tu solicitud de compra fue registrada correctamente. Nos pondremos en contacto con vos a la brevedad.
                  </p>
                  <Link
                    to="/catalogo"
                    className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    {'Volver al cat\u00e1logo'}
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sticky top-24">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                <ShoppingBag className="h-5 w-5 text-gray-600" />
                <h3 className="font-bold text-gray-800">Resumen</h3>
              </div>
              <div className="flex justify-center mb-4">
                <div className="h-28 w-28 bg-gray-50 rounded-lg flex items-center justify-center p-2">
                  <img src={product.image} alt={product.name} className="max-w-full max-h-full object-contain" />
                </div>
              </div>
              <h4 className="font-semibold text-gray-800 text-sm mb-1 line-clamp-2">{product.name}</h4>
              {product.brand && <p className="text-xs text-gray-500 mb-1">{product.brand}</p>}
              <p className="text-xs text-gray-400 mb-3">{'C\u00f3d: '}{product.code}</p>
              <div className="border-t border-gray-100 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total</span>
                  <span className="text-2xl font-bold text-gray-900">${formatPrice(Number(product.price))}</span>
                </div>
                {paymentTerms && (
                  <p className="text-xs text-gray-500 text-right mt-1">
                    en {paymentTerms} cuotas
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
