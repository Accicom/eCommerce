import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, Search, Download, UserPlus, Upload, FileSpreadsheet } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { read, utils } from 'xlsx';
import type { Database } from '../../lib/database.types';

type Client = Database['public']['Tables']['catalog_clients']['Row'];
type Lead = Database['public']['Tables']['catalog_leads']['Row'];

type ImportMode = 'single' | 'bulk';

export default function CatalogClients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'clients' | 'leads'>('clients');
  const [importMode, setImportMode] = useState<ImportMode>('single');
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);

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
      // Fetch clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('catalog_clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientsError) throw clientsError;
      setClients(clientsData || []);

      // Fetch leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('catalog_leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (leadsError) throw leadsError;
      setLeads(leadsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const clientData = {
      name: formData.get('name') as string,
      dni: formData.get('dni') as string,
      cuit: formData.get('cuit') as string || null,
      celular: formData.get('celular') as string || null,
      email: formData.get('email') as string || null,
    };

    try {
      if (currentClient) {
        const { error } = await supabase
          .from('catalog_clients')
          .update(clientData)
          .eq('id', currentClient.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('catalog_clients')
          .insert([clientData]);
        
        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving client:', error);
    }
  };

  const handleDelete = async (clientId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
      try {
        const { error } = await supabase
          .from('catalog_clients')
          .delete()
          .eq('id', clientId);

        if (error) throw error;
        fetchData();
      } catch (error) {
        console.error('Error deleting client:', error);
      }
    }
  };

  const handleApproveLead = async (lead: Lead) => {
    if (!lead.dni) {
      alert('Este lead no tiene DNI registrado');
      return;
    }

    setCurrentClient({
      id: '',
      name: '',
      dni: lead.dni,
      email: lead.email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setIsModalOpen(true);
  };

  const handleRejectLead = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from('catalog_leads')
        .update({ status: 'rejected' })
        .eq('id', leadId);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error rejecting lead:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportErrors([]);
    const errors: string[] = [];

    try {
      const data = await file.arrayBuffer();
      const workbook = read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json(worksheet);

      // Validar y procesar cada fila
      const validClients = [];
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i] as any;
        const rowNumber = i + 2; // +2 porque la fila 1 es el encabezado

        // Validar campos requeridos
        if (!row.name) {
          errors.push(`Fila ${rowNumber}: Falta el nombre del cliente`);
          continue;
        }
        if (!row.dni || !/^\d{7,8}$/.test(row.dni.toString())) {
          errors.push(`Fila ${rowNumber}: DNI inválido (debe tener 7 u 8 dígitos)`);
          continue;
        }

        // Validar CUIT si está presente
        if (row.cuit && !/^\d{11}$/.test(row.cuit.toString())) {
          errors.push(`Fila ${rowNumber}: CUIT inválido (debe tener 11 dígitos)`);
          continue;
        }

        // Validar email si está presente
        if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
          errors.push(`Fila ${rowNumber}: Email inválido`);
          continue;
        }

        validClients.push({
          name: row.name.toString(),
          dni: row.dni.toString(),
          cuit: row.cuit?.toString() || null,
          celular: row.celular?.toString() || null,
          email: row.email?.toString() || null,
        });
      }

      if (validClients.length > 0) {
        const { error } = await supabase
          .from('catalog_clients')
          .insert(validClients);

        if (error) {
          if (error.code === '23505') { // Código duplicado
            errors.push('Algunos clientes no se pudieron importar porque sus DNIs o CUITs ya existen');
          } else {
            throw error;
          }
        }

        fetchData();
      }
    } catch (error) {
      console.error('Error importing clients:', error);
      errors.push('Error al procesar el archivo. Por favor, verifica el formato.');
    } finally {
      setImportErrors(errors);
      setIsImporting(false);
      e.target.value = ''; // Limpiar input
    }
  };

  const downloadCSV = () => {
    const data = activeTab === 'clients' ? clients : leads;
    const headers = activeTab === 'clients' 
      ? ['Nombre', 'DNI', 'CUIT', 'Celular', 'Email', 'Fecha de registro']
      : ['DNI', 'Email', 'Estado', 'Último intento', 'Fecha de registro'];

    const csvData = data.map(item => {
      if (activeTab === 'clients') {
        const client = item as Client;
        return [
          client.name,
          client.dni,
          client.cuit || '',
          client.celular || '',
          client.email || '',
          new Date(client.created_at).toLocaleDateString()
        ];
      } else {
        const lead = item as Lead;
        return [
          lead.dni || '',
          lead.email,
          lead.status,
          new Date(lead.last_attempt).toLocaleDateString(),
          new Date(lead.created_at).toLocaleDateString()
        ];
      }
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

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.dni.includes(searchTerm) ||
    (client.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const filteredLeads = leads.filter(lead =>
    (lead.dni || '').includes(searchTerm) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <h1 className="text-2xl font-bold text-gray-800">Gestión de Clientes del Catálogo</h1>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => {
                setImportMode('single');
                setCurrentClient(null);
                setIsModalOpen(true);
              }}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                importMode === 'single'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-blue-50'
              }`}
            >
              <Plus className="h-5 w-5 mr-2" />
              Carga Individual
            </button>
            <button
              onClick={() => {
                setImportMode('bulk');
                setCurrentClient(null);
                setIsModalOpen(true);
              }}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                importMode === 'bulk'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-blue-50'
              }`}
            >
              <FileSpreadsheet className="h-5 w-5 mr-2" />
              Carga Masiva
            </button>
            <button
              onClick={downloadCSV}
              className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-5 w-5 mr-2" />
              Exportar CSV
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Buscar por nombre, DNI o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('clients')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'clients'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Clientes
              </button>
              <button
                onClick={() => setActiveTab('leads')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'leads'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Leads
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {activeTab === 'clients' ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      DNI
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CUIT
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Celular
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredClients.map((client) => (
                    <tr key={client.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {client.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{client.dni}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {client.cuit || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {client.celular || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {client.email || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setImportMode('single');
                            setCurrentClient(client);
                            setIsModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(client.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      DNI
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Último intento
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {lead.dni || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{lead.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          lead.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : lead.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {lead.status === 'pending' ? 'Pendiente'
                            : lead.status === 'approved' ? 'Aprobado'
                            : 'Rechazado'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(lead.last_attempt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {lead.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveLead(lead)}
                              className="text-green-600 hover:text-green-800 mr-3"
                              title="Aprobar y crear cliente"
                            >
                              <UserPlus className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleRejectLead(lead.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Rechazar"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Modal para agregar/editar cliente o importar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            {importMode === 'single' ? (
              <>
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  {currentClient ? 'Editar Cliente' : 'Nuevo Cliente'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre
                    </label>
                    <input
                      name="name"
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      defaultValue={currentClient?.name}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      DNI
                    </label>
                    <input
                      name="dni"
                      type="text"
                      required
                      pattern="\d{7,8}"
                      title="DNI debe tener 7 u 8 dígitos"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      defaultValue={currentClient?.dni}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CUIT
                    </label>
                    <input
                      name="cuit"
                      type="text"
                      pattern="\d{11}"
                      title="CUIT debe tener 11 dígitos"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      defaultValue={currentClient?.cuit}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Celular
                    </label>
                    <input
                      name="celular"
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      defaultValue={currentClient?.celular}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      name="email"
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      defaultValue={currentClient?.email}
                    />
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {currentClient ? 'Guardar Cambios' : 'Crear Cliente'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Importación Masiva de Clientes
                </h2>
                
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <h3 className="font-semibold text-blue-800 mb-2">Instrucciones:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-blue-800">
                    <li>Prepare un archivo Excel (.xlsx) con las siguientes columnas:
                      <ul className="list-disc list-inside ml-4 mt-1 text-sm">
                        <li>name (Nombre del cliente - obligatorio)</li>
                        <li>dni (DNI - obligatorio, 7 u 8 dígitos)</li>
                        <li>cuit (CUIT - opcional, 11 dígitos)</li>
                        <li>celular (Celular - opcional)</li>
                        <li>email (Email - opcional)</li>
                      </ul>
                    </li>
                    <li>Asegúrese de que los DNIs y CUITs no estén duplicados</li>
                    <li>Los DNIs deben tener 7 u 8 dígitos</li>
                    <li>Los CUITs deben tener 11 dígitos</li>
                  </ol>
                </div>

                {importErrors.length > 0 && (
                  <div className="bg-red-50 p-4 rounded-lg mb-6">
                    <h3 className="font-semibold text-red-800 mb-2">Errores de importación:</h3>
                    <ul className="list-disc list-inside space-y-1 text-red-800 text-sm">
                      {importErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-10 h-10 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Haga clic para cargar</span> o arrastre y suelte
                      </p>
                      <p className="text-xs text-gray-500">
                        Archivo Excel (.xlsx)
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".xlsx"
                      onChange={handleFileUpload}
                      disabled={isImporting}
                    />
                  </label>
                </div>

                {isImporting && (
                  <div className="mt-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Importando clientes...</p>
                  </div>
                )}

                <div className="flex justify-end mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cerrar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}