import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Download, AlertTriangle, Check, Phone } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatPrice } from '../../utils/formatters';

type Order = {
  id: string;
  order_number: string;
  user_email: string | null;
  order_data: any[];
  total_amount: number;
  status: string;
  created_at: string;
  whatsapp_message: string;
  client_id: string | null;
  client?: {
    name: string;
    dni: string;
  };
};

type PurchaseIntent = {
  id: string;
  client_id: string | null;
  product_name: string;
  product_code: string;
  product_price: number;
  client_offer: number;
  client_name: string | null;
  client_dni: string;
  client_email: string | null;
  client_phone: string | null;
  status: string;
  notes: string | null;
  created_at: string;
};

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [intents, setIntents] = useState<PurchaseIntent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'intents'>('orders');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    fetchData();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/admin');
    }
  };

  const fetchData = async () => {
    try {
      const [ordersRes, intentsRes] = await Promise.all([
        supabase
          .from('completed_orders')
          .select(`
            *,
            client:client_id (
              name,
              dni
            )
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('purchase_intents')
          .select('*')
          .order('created_at', { ascending: false }),
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (intentsRes.error) throw intentsRes.error;

      setOrders(ordersRes.data || []);
      setIntents(intentsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateIntentStatus = async (intentId: string, newStatus: string) => {
    setUpdatingId(intentId);
    try {
      const { error } = await supabase
        .from('purchase_intents')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', intentId);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error updating intent:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter(order =>
    order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.user_email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (order.client?.name.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (order.client?.dni || '').includes(searchTerm)
  );

  const filteredIntents = intents.filter(intent =>
    (intent.client_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    intent.client_dni.includes(searchTerm) ||
    intent.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (intent.client_email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const pendingIntentsCount = intents.filter(i => i.status === 'pending').length;

  const downloadCSV = () => {
    if (activeTab === 'orders') {
      const headers = ['Numero de Orden', 'Cliente', 'DNI', 'Email', 'Productos', 'Total', 'Fecha'];
      const csvData = filteredOrders.map(order => [
        order.order_number,
        order.client?.name || 'N/A',
        order.client?.dni || 'N/A',
        order.user_email || 'N/A',
        order.order_data.map(item => `${item.product_name} (x${item.quantity})`).join('; '),
        formatPrice(order.total_amount),
        new Date(order.created_at).toLocaleDateString()
      ]);

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.setAttribute('href', URL.createObjectURL(blob));
      link.setAttribute('download', `ordenes_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const headers = ['Cliente', 'DNI', 'Email', 'Celular', 'Producto', 'Precio Producto', 'Oferta Cliente', 'Estado', 'Fecha'];
      const csvData = filteredIntents.map(intent => [
        intent.client_name || 'Sin nombre',
        intent.client_dni,
        intent.client_email || '',
        intent.client_phone || '',
        intent.product_name,
        formatPrice(intent.product_price),
        formatPrice(intent.client_offer),
        intent.status === 'pending' ? 'Pendiente' : intent.status === 'contacted' ? 'Contactado' : 'Resuelto',
        new Date(intent.created_at).toLocaleDateString()
      ]);

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.setAttribute('href', URL.createObjectURL(blob));
      link.setAttribute('download', `intenciones_compra_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">Pendiente</span>;
      case 'contacted':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Contactado</span>;
      case 'resolved':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Resuelto</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              Volver
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Ordenes y Carritos</h1>
          </div>
          <button
            onClick={downloadCSV}
            className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-5 w-5 mr-2" />
            Exportar CSV
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={activeTab === 'orders' ? 'Buscar por numero de orden, cliente o DNI...' : 'Buscar por nombre, DNI, producto o email...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => { setActiveTab('orders'); setSearchTerm(''); }}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'orders'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Ordenes ({orders.length})
              </button>
              <button
                onClick={() => { setActiveTab('intents'); setSearchTerm(''); }}
                className={`px-4 py-2 rounded-lg transition-colors relative ${
                  activeTab === 'intents'
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Intenciones de Compra ({intents.length})
                {pendingIntentsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {pendingIntentsCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : activeTab === 'orders' ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Numero de Orden
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      DNI
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Productos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        No se encontraron ordenes
                      </td>
                    </tr>
                  ) : filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {order.order_number}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.client?.name || 'Cliente sin nombre'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.client?.dni || 'No disponible'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.user_email || 'No disponible'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <ul className="list-disc list-inside">
                          {order.order_data.map((product: any, index: number) => (
                            <li key={index}>
                              {product.product_name} (x{product.quantity})
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${formatPrice(order.total_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Oferta Cliente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredIntents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                        No se encontraron intenciones de compra
                      </td>
                    </tr>
                  ) : filteredIntents.map((intent) => (
                    <tr key={intent.id} className={intent.status === 'pending' ? 'bg-amber-50' : ''}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {intent.client_name || 'Sin nombre'}
                        </div>
                        <div className="text-xs text-gray-500">DNI: {intent.client_dni}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{intent.client_email || '-'}</div>
                        <div className="text-xs text-gray-400">{intent.client_phone || '-'}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{intent.product_name}</div>
                        <div className="text-xs text-gray-500">Cod: {intent.product_code}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        ${formatPrice(intent.product_price)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                        ${formatPrice(intent.client_offer)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {getStatusBadge(intent.status)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(intent.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          {intent.status === 'pending' && (
                            <button
                              onClick={() => updateIntentStatus(intent.id, 'contacted')}
                              disabled={updatingId === intent.id}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Marcar como contactado"
                            >
                              <Phone className="h-4 w-4" />
                            </button>
                          )}
                          {intent.status !== 'resolved' && (
                            <button
                              onClick={() => updateIntentStatus(intent.id, 'resolved')}
                              disabled={updatingId === intent.id}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Marcar como resuelto"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
