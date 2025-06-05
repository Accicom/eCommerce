import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, GripVertical } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type Branch = {
  id: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  images: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
  order: number;
};

export default function BranchesManagement() {
  const navigate = useNavigate();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchBranches();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/admin');
    }
  };

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .order('order', { ascending: true });

      if (error) throw error;
      setBranches(data || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const branchData = {
      name: formData.get('name') as string,
      address: formData.get('address') as string,
      phone: formData.get('phone') as string,
      hours: formData.get('hours') as string,
      images: (formData.get('images') as string).split('\n').filter(url => url.trim()),
      coordinates: {
        lat: parseFloat(formData.get('lat') as string),
        lng: parseFloat(formData.get('lng') as string)
      },
      order: currentBranch ? currentBranch.order : branches.length
    };

    try {
      if (currentBranch) {
        const { error } = await supabase
          .from('branches')
          .update(branchData)
          .eq('id', currentBranch.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('branches')
          .insert([branchData]);
        
        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchBranches();
    } catch (error) {
      console.error('Error saving branch:', error);
    }
  };

  const handleDelete = async (branchId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta sucursal?')) {
      try {
        const { error } = await supabase
          .from('branches')
          .delete()
          .eq('id', branchId);

        if (error) throw error;
        fetchBranches();
      } catch (error) {
        console.error('Error deleting branch:', error);
      }
    }
  };

  const handleReorder = async (draggedId: string, targetId: string) => {
    const draggedBranch = branches.find(b => b.id === draggedId);
    const targetBranch = branches.find(b => b.id === targetId);
    
    if (!draggedBranch || !targetBranch) return;

    const newBranches = [...branches];
    const draggedIndex = newBranches.findIndex(b => b.id === draggedId);
    const targetIndex = newBranches.findIndex(b => b.id === targetId);

    newBranches.splice(draggedIndex, 1);
    newBranches.splice(targetIndex, 0, draggedBranch);

    const updates = newBranches.map((branch, index) => ({
      id: branch.id,
      order: index
    }));

    try {
      for (const update of updates) {
        const { error } = await supabase
          .from('branches')
          .update({ order: update.order })
          .eq('id', update.id);

        if (error) throw error;
      }

      setBranches(newBranches);
    } catch (error) {
      console.error('Error reordering branches:', error);
    }
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
            <h1 className="text-2xl font-bold text-gray-800">Gestión de Sucursales</h1>
          </div>
          <button
            onClick={() => {
              setCurrentBranch(null);
              setIsModalOpen(true);
            }}
            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nueva Sucursal
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {branches.map((branch) => (
              <div
                key={branch.id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
                draggable
                onDragStart={(e) => e.dataTransfer.setData('text/plain', branch.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const draggedId = e.dataTransfer.getData('text/plain');
                  handleReorder(draggedId, branch.id);
                }}
              >
                <div className="p-6 flex items-center">
                  <GripVertical className="h-5 w-5 text-gray-400 cursor-move mr-4" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">{branch.name}</h3>
                    <p className="text-gray-600">{branch.address}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setCurrentBranch(branch);
                        setIsModalOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(branch.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal para agregar/editar sucursal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {currentBranch ? 'Editar Sucursal' : 'Nueva Sucursal'}
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
                  defaultValue={currentBranch?.name}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <input
                  name="address"
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  defaultValue={currentBranch?.address}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  name="phone"
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  defaultValue={currentBranch?.phone}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horario
                </label>
                <input
                  name="hours"
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  defaultValue={currentBranch?.hours}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URLs de imágenes (una por línea)
                </label>
                <textarea
                  name="images"
                  rows={3}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  defaultValue={currentBranch?.images.join('\n')}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Latitud
                  </label>
                  <input
                    name="lat"
                    type="number"
                    step="any"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    defaultValue={currentBranch?.coordinates.lat}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Longitud
                  </label>
                  <input
                    name="lng"
                    type="number"
                    step="any"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    defaultValue={currentBranch?.coordinates.lng}
                  />
                </div>
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
                  {currentBranch ? 'Guardar Cambios' : 'Crear Sucursal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}