import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Download } from 'lucide-react';
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
};

type AbandonedCart = {
  id: string;
  user_email: string | null;
  cart_data: any[];
  total_amount: number;
  status: string;
  created_at: string;
};

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [abandonedCarts, setAbandonedCarts] = useState<AbandonedCart[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'abandoned'>('orders');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

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
      // Fetch completed orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('completed_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;
      setOrders(ordersData || []);

      // Fetch abandoned carts
      const { data: cartsData, error: cartsError } = await supabase
        .from('abandoned_carts')
        .select('*')
        .order('created_at', { ascending: false });

      if (cartsError) throw cartsError;
      setAbandonedCarts(cartsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredData = activeTab === 'orders'
    ? orders.filter(order =>
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.user_email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      )
    : abandonedCarts.filter(cart =>
        (cart.user_email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );

  const downloadCSV = () => {
    const data = activeTab === 'orders' ? orders : abandonedCarts;
    const headers = activeTab === 'orders'
      ? ['Número de Orden', 'Email', 'Total', 'Estado', 'Fecha']
      : ['Email', 'Total', 'Estado', 'Fecha'];

    const csvData = data.map(item => {
      if (activeTab === 'orders') {
        return [
          item.order_number,
          item.user_email || 'N/A',
          formatPrice(item.total_amount),
          item.status,
          new Date(item.created_at).toLocaleDateString()
        ];
      }
      return [
        item.user_email || 'N/A',
        formatPrice(item.total_amount),
        item.status,
        new Date(item.created_at).toLocaleDateString()
      ];
    });

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            <h1 className="text-2xl font-bold text-gray-800">
              {activeTab === 'orders' ? 'Órdenes Completadas' : 'Carritos Abandonados'}
            </h1>
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
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-4 py-2 rounded-lg ${
                  activeTab === 'orders'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Órdenes Completadas
              </button>
              <button
                onClick={() => setActiveTab('abandoned')}
                className={`px-4 py-2 rounded-lg ${
                  activeTab === 'abandoned'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Carritos Abandonados
              </button>
            </div>
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder={activeTab === 'orders' ? "Buscar por número de orden o email..." : "Buscar por email..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {activeTab === 'orders' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Número de Orden
                      </th>
                    )}
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
                  {filteredData.map((item) => (
                    <tr key={item.id}>
                      {activeTab === 'orders' && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {(item as Order).order_number}
                          </span>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.user_email || 'No disponible'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <ul className="list-disc list-inside">
                          {(activeTab === 'orders' ? (item as Order).order_data : (item as AbandonedCart).cart_data)
                            .map((product: any, index: number) => (
                              <li key={index}>
                                {product.product_name} (x{product.quantity})
                              </li>
                            ))}
                        </ul>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${formatPrice(item.total_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(item.created_at).toLocaleDateString()}
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