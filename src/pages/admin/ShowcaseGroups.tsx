import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, ArrowLeft, ArrowUp, ArrowDown, Eye, EyeOff, Layers } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type Category = Database['public']['Tables']['categories']['Row'];

interface ShowcaseGroup {
  id: string;
  title: string;
  display_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface GroupCategory {
  id: string;
  group_id: string;
  category_name: string;
  created_at: string;
}

export default function ShowcaseGroups() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<ShowcaseGroup[]>([]);
  const [groupCategories, setGroupCategories] = useState<Record<string, GroupCategory[]>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<ShowcaseGroup | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [formTitle, setFormTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchData();
  }, [navigate]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/admin');
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    await Promise.all([fetchGroups(), fetchCategories()]);
    setIsLoading(false);
  };

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('product_showcase_groups')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      const groupsData = data || [];
      setGroups(groupsData);

      if (groupsData.length > 0) {
        const { data: catData, error: catError } = await supabase
          .from('product_showcase_group_categories')
          .select('*')
          .in('group_id', groupsData.map(g => g.id));

        if (catError) throw catError;

        const mapped: Record<string, GroupCategory[]> = {};
        (catData || []).forEach(gc => {
          if (!mapped[gc.group_id]) mapped[gc.group_id] = [];
          mapped[gc.group_id].push(gc);
        });
        setGroupCategories(mapped);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const openCreateModal = () => {
    setCurrentGroup(null);
    setFormTitle('');
    setSelectedCategories([]);
    setIsModalOpen(true);
  };

  const openEditModal = (group: ShowcaseGroup) => {
    setCurrentGroup(group);
    setFormTitle(group.title);
    setSelectedCategories(
      (groupCategories[group.id] || []).map(gc => gc.category_name)
    );
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || selectedCategories.length === 0) return;

    setIsSaving(true);
    try {
      if (currentGroup) {
        const { error } = await supabase
          .from('product_showcase_groups')
          .update({ title: formTitle.trim(), updated_at: new Date().toISOString() })
          .eq('id', currentGroup.id);
        if (error) throw error;

        const { error: delError } = await supabase
          .from('product_showcase_group_categories')
          .delete()
          .eq('group_id', currentGroup.id);
        if (delError) throw delError;

        const { error: insError } = await supabase
          .from('product_showcase_group_categories')
          .insert(selectedCategories.map(name => ({
            group_id: currentGroup.id,
            category_name: name,
          })));
        if (insError) throw insError;
      } else {
        const maxOrder = groups.length > 0
          ? Math.max(...groups.map(g => g.display_order))
          : -1;

        const { data: newGroup, error } = await supabase
          .from('product_showcase_groups')
          .insert([{ title: formTitle.trim(), display_order: maxOrder + 1 }])
          .select()
          .single();
        if (error) throw error;

        const { error: insError } = await supabase
          .from('product_showcase_group_categories')
          .insert(selectedCategories.map(name => ({
            group_id: newGroup.id,
            category_name: name,
          })));
        if (insError) throw insError;
      }

      setIsModalOpen(false);
      await fetchGroups();
    } catch (error) {
      console.error('Error saving group:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (groupId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este grupo?')) return;
    try {
      const { error } = await supabase
        .from('product_showcase_groups')
        .delete()
        .eq('id', groupId);
      if (error) throw error;
      await fetchGroups();
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  };

  const toggleActive = async (group: ShowcaseGroup) => {
    try {
      const { error } = await supabase
        .from('product_showcase_groups')
        .update({ active: !group.active, updated_at: new Date().toISOString() })
        .eq('id', group.id);
      if (error) throw error;
      await fetchGroups();
    } catch (error) {
      console.error('Error toggling group:', error);
    }
  };

  const moveGroup = async (group: ShowcaseGroup, direction: 'up' | 'down') => {
    const idx = groups.findIndex(g => g.id === group.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= groups.length) return;

    const other = groups[swapIdx];
    try {
      await supabase
        .from('product_showcase_groups')
        .update({ display_order: other.display_order })
        .eq('id', group.id);
      await supabase
        .from('product_showcase_groups')
        .update({ display_order: group.display_order })
        .eq('id', other.id);
      await fetchGroups();
    } catch (error) {
      console.error('Error reordering:', error);
    }
  };

  const toggleCategory = (name: string) => {
    setSelectedCategories(prev =>
      prev.includes(name)
        ? prev.filter(c => c !== name)
        : [...prev, name]
    );
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
            <h1 className="text-2xl font-bold text-gray-800">Grupos de Exhibición</h1>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nuevo Grupo
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Layers className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No hay grupos creados</h3>
            <p className="text-gray-400 mb-6">
              Crea grupos para mostrar productos agrupados por categoría en la página principal.
            </p>
            <button
              onClick={openCreateModal}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Crear primer grupo
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group, idx) => (
              <div
                key={group.id}
                className={`bg-white rounded-lg shadow-md overflow-hidden ${!group.active ? 'opacity-60' : ''}`}
              >
                <div className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => moveGroup(group, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowUp className="h-4 w-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => moveGroup(group, 'down')}
                        disabled={idx === groups.length - 1}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowDown className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-gray-800 truncate">
                        {group.title}
                      </h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(groupCategories[group.id] || []).map(gc => (
                          <span
                            key={gc.id}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {gc.category_name}
                          </span>
                        ))}
                        {(!groupCategories[group.id] || groupCategories[group.id].length === 0) && (
                          <span className="text-xs text-gray-400">Sin categorías asignadas</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <button
                      onClick={() => toggleActive(group)}
                      className={`p-2 rounded-lg transition-colors ${
                        group.active
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                      title={group.active ? 'Desactivar' : 'Activar'}
                    >
                      {group.active ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                    </button>
                    <button
                      onClick={() => openEditModal(group)}
                      className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(group.id)}
                      className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {currentGroup ? 'Editar Grupo' : 'Nuevo Grupo'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título del grupo
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder='Ej: "Ofertas de San Valentín"'
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categorías incluidas
                </label>
                {categories.length === 0 ? (
                  <p className="text-sm text-gray-400">No hay categorías disponibles.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {categories.map(cat => (
                      <label
                        key={cat.id}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                          selectedCategories.includes(cat.name)
                            ? 'bg-blue-50 border border-blue-200'
                            : 'hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(cat.name)}
                          onChange={() => toggleCategory(cat.name)}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 truncate">{cat.name}</span>
                      </label>
                    ))}
                  </div>
                )}
                {selectedCategories.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    {selectedCategories.length} categoría{selectedCategories.length !== 1 ? 's' : ''} seleccionada{selectedCategories.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving || selectedCategories.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Guardando...' : currentGroup ? 'Guardar Cambios' : 'Crear Grupo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
