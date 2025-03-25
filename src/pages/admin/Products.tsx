import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, ArrowLeft, Star, Upload, FileSpreadsheet } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { read, utils } from 'xlsx';
import type { Database } from '../../lib/database.types';

type Product = Database['public']['Tables']['products']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

type ImportMode = 'single' | 'bulk';

export default function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [importMode, setImportMode] = useState<ImportMode>('single');
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchProducts();
    fetchCategories();
  }, [navigate]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/admin');
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

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const productData = {
      code: formData.get('code') as string,
      name: formData.get('name') as string,
      price: parseFloat(formData.get('price') as string),
      image: formData.get('image') as string,
      category: formData.get('category') as string,
      description: formData.get('description') as string,
      featured: formData.get('featured') === 'true',
      brand: formData.get('brand') as string || null,
      supplier: formData.get('supplier') as string || null,
      visible: true, // New products are visible by default
    };

    try {
      if (currentProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', currentProduct.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData]);
        
        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleDelete = async (productId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', productId);

        if (error) throw error;
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const toggleFeatured = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ featured: !product.featured })
        .eq('id', product.id);

      if (error) throw error;
      fetchProducts();
    } catch (error) {
      console.error('Error updating featured status:', error);
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
      const validProducts = [];
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i] as any;
        const rowNumber = i + 2; // +2 porque la fila 1 es el encabezado

        // Validar campos requeridos
        if (!row.code) {
          errors.push(`Fila ${rowNumber}: Falta el código del producto`);
          continue;
        }
        if (!row.name) {
          errors.push(`Fila ${rowNumber}: Falta el nombre del producto`);
          continue;
        }
        if (!row.price || isNaN(row.price)) {
          errors.push(`Fila ${rowNumber}: El precio no es válido`);
          continue;
        }
        if (!row.category) {
          errors.push(`Fila ${rowNumber}: Falta la categoría del producto`);
          continue;
        }
        if (!row.image) {
          errors.push(`Fila ${rowNumber}: Falta la URL de la imagen`);
          continue;
        }

        // Validar que la categoría exista
        const categoryExists = categories.some(cat => cat.name === row.category);
        if (!categoryExists) {
          errors.push(`Fila ${rowNumber}: La categoría "${row.category}" no existe en el sistema`);
          continue;
        }

        // Validar formato de URL de imagen
        try {
          new URL(row.image);
        } catch {
          errors.push(`Fila ${rowNumber}: La URL de la imagen no es válida`);
          continue;
        }

        validProducts.push({
          code: row.code.toString(),
          name: row.name.toString(),
          price: parseFloat(row.price),
          category: row.category.toString(),
          image: row.image.toString(),
          description: row.description?.toString() || '',
          featured: row.featured === true || row.featured === 'true',
        });
      }

      if (validProducts.length > 0) {
        const { error } = await supabase
          .from('products')
          .insert(validProducts);

        if (error) {
          if (error.code === '23505') { // Código duplicado
            errors.push('Algunos productos no se pudieron importar porque sus códigos ya existen');
          } else {
            throw error;
          }
        }

        fetchProducts();
      }
    } catch (error) {
      console.error('Error importing products:', error);
      errors.push('Error al procesar el archivo. Por favor, verifica el formato.');
    } finally {
      setImportErrors(errors);
      setIsImporting(false);
      e.target.value = ''; // Limpiar input
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
            <h1 className="text-2xl font-bold text-gray-800">Gestión de Productos</h1>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => {
                setImportMode('single');
                setCurrentProduct(null);
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
                setCurrentProduct(null);
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
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Destacado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {product.code}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => toggleFeatured(product)}
                        className={`${
                          product.featured ? 'text-yellow-400' : 'text-gray-300'
                        } hover:text-yellow-500 transition-colors`}
                      >
                        <Star className="h-5 w-5 fill-current" />
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setImportMode('single');
                          setCurrentProduct(product);
                          setIsModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para agregar/editar producto o importar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            {importMode === 'single' ? (
              <>
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  {currentProduct ? 'Editar Producto' : 'Nuevo Producto'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Código
                      </label>
                      <input
                        name="code"
                        type="text"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        defaultValue={currentProduct?.code}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre
                      </label>
                      <input
                        name="name"
                        type="text"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        defaultValue={currentProduct?.name}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Marca
                      </label>
                      <input
                        name="brand"
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        defaultValue={currentProduct?.brand}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Proveedor
                      </label>
                      <input
                        name="supplier"
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        defaultValue={currentProduct?.supplier}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Categoría
                      </label>
                      <select
                        name="category"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        defaultValue={currentProduct?.category}
                      >
                        {categories.map(category => (
                          <option key={category.id} value={category.name}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Precio
                      </label>
                      <input
                        name="price"
                        type="number"
                        step="0.01"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        defaultValue={currentProduct?.price}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL de la imagen
                    </label>
                    <input
                      name="image"
                      type="url"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      defaultValue={currentProduct?.image}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción del producto
                    </label>
                    <textarea
                      name="description"
                      rows={5}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      defaultValue={currentProduct?.description}
                      placeholder="Ingrese una descripción detallada del producto..."
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="featured"
                      id="featured"
                      value="true"
                      defaultChecked={currentProduct?.featured}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="featured" className="text-sm text-gray-700">
                      Marcar como destacado
                    </label>
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
                      {currentProduct ? 'Guardar Cambios' : 'Crear Producto'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Importación Masiva de Productos
                </h2>
                
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <h3 className="font-semibold text-blue-800 mb-2">Instrucciones:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-blue-800">
                    <li>Prepare un archivo Excel (.xlsx) con las siguientes columnas:
                      <ul className="list-disc list-inside ml-4 mt-1 text-sm">
                        <li>code (Código del producto - obligatorio)</li>
                        <li>name (Nombre del producto - obligatorio)</li>
                        <li>price (Precio - obligatorio)</li>
                        <li>category (Categoría - obligatorio, debe existir en el sistema)</li>
                        <li>image (URL de la imagen - obligatorio)</li>
                        <li>description (Descripción - opcional)</li>
                        <li>featured (Destacado - opcional, valores: true/false)</li>
                        <li>brand (Marca - opcional)</li>
                        <li>supplier (Proveedor - opcional)</li>
                      </ul>
                    </li>
                    <li>Asegúrese de que los códigos no estén duplicados</li>
                    <li>Verifique que las categorías existan en el sistema</li>
                    <li>Las URLs de las imágenes deben ser válidas y accesibles</li>
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
                    <p className="mt-2 text-sm text-gray-600">Importando productos...</p>
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