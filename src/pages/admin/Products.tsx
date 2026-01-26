import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Edit2,
  Trash2,
  ArrowLeft,
  Star,
  Upload,
  FileSpreadsheet,
  Eye,
  EyeOff,
  Download,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { read, utils, write } from 'xlsx';
import type { Database } from '../../lib/database.types';

type Product = Database['public']['Tables']['products']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

type ImportMode = 'single' | 'bulk' | 'hide';

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
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

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
      brand: (formData.get('brand') as string) || null,
      supplier: (formData.get('supplier') as string) || null,
      visible: true, // nuevos visibles por defecto
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

  const toggleVisibility = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ visible: !product.visible })
        .eq('id', product.id);

      if (error) throw error;
      fetchProducts();
    } catch (error) {
      console.error('Error updating visibility:', error);
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

  // =========================
  // Helpers para import masivo
  // =========================

  // Lee un valor aceptando headers en inglés o español.
  // Ej: getVal(row, ['code', 'Código'])
  const getVal = (row: any, keys: string[]) => {
    for (const k of keys) {
      if (row?.[k] !== undefined && row?.[k] !== null && row?.[k] !== '') return row[k];
    }
    return undefined;
  };

  const toStr = (v: any) => (v === undefined || v === null ? undefined : v.toString());

  const parseBoolFlexible = (v: any): boolean | undefined => {
    if (v === undefined || v === null || v === '') return undefined;
    if (typeof v === 'boolean') return v;

    const s = v.toString().trim().toLowerCase();
    if (['sí', 'si', 'yes', 'true', '1'].includes(s)) return true;
    if (['no', 'false', '0'].includes(s)) return false;

    // si viene algo raro, mejor devolver undefined y no tocar el campo
    return undefined;
  };

  const parseNumberFlexible = (v: any): number | undefined => {
    if (v === undefined || v === null || v === '') return undefined;

    // Acepta "1234,56" o "1.234,56" (básico)
    if (typeof v === 'string') {
      const normalized = v
        .trim()
        .replace(/\./g, '')  // elimina separador de miles "."
        .replace(',', '.');  // coma decimal -> punto
      const n = Number(normalized);
      return Number.isFinite(n) ? n : undefined;
    }

    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  const chunkArray = <T,>(arr: T[], size: number) => {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
    return chunks;
  };

  /**
   * IMPORT MASIVO OPTIMIZADO (bulk):
   * - acepta headers ES/EN
   * - hace UPSERT por code (actualiza existentes / crea nuevos)
   * - para EXISTENTES: actualiza sólo campos presentes en la planilla (patch)
   * - para NUEVOS: exige requeridos (name, price, category, image)
   * - valida category si viene (o si es nuevo)
   * - valida URL de imagen si viene (o si es nuevo)
   */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportErrors([]);
    const errors: string[] = [];

    try {
      // 1) Leer Excel
      const data = await file.arrayBuffer();
      const workbook = read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json(worksheet);

      if (!jsonData || jsonData.length === 0) {
        errors.push('El archivo no contiene filas para importar.');
        setImportErrors(errors);
        return;
      }

      // 2) Categorías existentes (para validar)
      const categoryNames = new Set(categories.map(c => c.name));

      // 3) Obtener códigos y consultar cuáles existen
      const allCodes = jsonData
        .map((r: any) => toStr(getVal(r, ['code', 'Código']))?.trim())
        .filter(Boolean) as string[];

      const uniqueCodes = Array.from(new Set(allCodes));

      if (uniqueCodes.length === 0) {
        errors.push('No se encontraron códigos (code / Código) en el archivo.');
        setImportErrors(errors);
        return;
      }

      // Traer qué códigos existen en DB (en batches por si son muchos)
      const existingCodes = new Set<string>();
      const codeChunks = chunkArray(uniqueCodes, 800); // select .in(...) con chunk grande razonable

      for (const codesChunk of codeChunks) {
        const { data: existing, error: exErr } = await supabase
          .from('products')
          .select('code')
          .in('code', codesChunk);

        if (exErr) throw exErr;
        (existing || []).forEach(p => existingCodes.add(p.code));
      }

      // 4) Validar/armar payload con semántica patch
      const upsertPayload: any[] = [];

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i] as any;
        const rowNumber = i + 2; // fila 1 = headers

        const codeRaw = getVal(row, ['code', 'Código']);
        const code = toStr(codeRaw)?.trim();

        if (!code) {
          errors.push(`Fila ${rowNumber}: Falta el código del producto (code / Código)`);
          continue;
        }

        const isExisting = existingCodes.has(code);

        // leer campos con ES/EN
        const name = toStr(getVal(row, ['name', 'Nombre']))?.trim();
        const priceVal = getVal(row, ['price', 'Precio']);
        const price = parseNumberFlexible(priceVal);

        const category = toStr(getVal(row, ['category', 'Categoría']))?.trim();
        const image = toStr(getVal(row, ['image', 'URL Imagen', 'URL Imagen ', 'Url Imagen']))?.trim();
        const description = toStr(getVal(row, ['description', 'Descripción'])) ?? undefined;

        const featured = parseBoolFlexible(getVal(row, ['featured', 'Destacado']));
        const visible = parseBoolFlexible(getVal(row, ['visible', 'Visible']));
        const brand = toStr(getVal(row, ['brand', 'Marca'])) ?? undefined;
        const supplier = toStr(getVal(row, ['supplier', 'Proveedor'])) ?? undefined;

        // Reglas de validación:
        // - EXISTENTE: podés actualizar sólo precio, visible, etc. sin forzar todos los campos.
        // - NUEVO: exige name, price, category, image (y validar category/image)
        if (!isExisting) {
          if (!name) {
            errors.push(`Fila ${rowNumber}: Producto nuevo (${code}) requiere nombre (name / Nombre)`);
            continue;
          }
          if (price === undefined) {
            errors.push(`Fila ${rowNumber}: Producto nuevo (${code}) requiere precio válido (price / Precio)`);
            continue;
          }
          if (!category) {
            errors.push(`Fila ${rowNumber}: Producto nuevo (${code}) requiere categoría (category / Categoría)`);
            continue;
          }
          if (!image) {
            errors.push(`Fila ${rowNumber}: Producto nuevo (${code}) requiere URL de imagen (image / URL Imagen)`);
            continue;
          }
        }

        // Si viene price, validar
        if (priceVal !== undefined && price === undefined) {
          errors.push(`Fila ${rowNumber}: El precio no es válido (${code})`);
          continue;
        }

        // Si viene category (o es nuevo), validar que exista en el sistema
        if ((category || !isExisting) && category) {
          if (!categoryNames.has(category)) {
            errors.push(`Fila ${rowNumber}: La categoría "${category}" no existe en el sistema (${code})`);
            continue;
          }
        }

        // Si viene image (o es nuevo), validar URL
        if ((image || !isExisting) && image) {
          try {
            new URL(image);
          } catch {
            errors.push(`Fila ${rowNumber}: La URL de la imagen no es válida (${code})`);
            continue;
          }
        }

        // Armar objeto patch: sólo incluimos campos definidos
        const payloadRow: any = { code };

        if (name !== undefined) payloadRow.name = name;
        if (price !== undefined) payloadRow.price = price;
        if (category !== undefined) payloadRow.category = category;
        if (image !== undefined) payloadRow.image = image;
        if (description !== undefined) payloadRow.description = description;

        if (featured !== undefined) payloadRow.featured = featured;
        if (visible !== undefined) payloadRow.visible = visible;

        // brand / supplier: si viene vacío en excel, no lo tocamos (patch).
        // Si querés permitir “borrar” marca/proveedor desde Excel, decímelo y lo adaptamos.
        if (brand !== undefined) payloadRow.brand = brand;
        if (supplier !== undefined) payloadRow.supplier = supplier;

        upsertPayload.push(payloadRow);
      }

      if (upsertPayload.length === 0) {
        errors.push('No hay filas válidas para importar/actualizar.');
        setImportErrors(errors);
        return;
      }

      // 5) UPSERT en batches para performance/estabilidad
      const BATCH_SIZE = 300;
      const payloadChunks = chunkArray(upsertPayload, BATCH_SIZE);

      let okCount = 0;
      for (const chunk of payloadChunks) {
        const { error } = await supabase
          .from('products')
          .upsert(chunk, { onConflict: 'code' });

        if (error) {
          // si querés, se puede “degradar” a intentar fila por fila en caso de error
          throw error;
        }
        okCount += chunk.length;
      }

      errors.push(`Éxito: Se procesaron ${okCount} fila(s) (creación/actualización por código).`);
      fetchProducts();
    } catch (error) {
      console.error('Error importing/updating products:', error);
      errors.push('Error al procesar el archivo. Por favor, verifica el formato.');
    } finally {
      setImportErrors(errors);
      setIsImporting(false);
      e.target.value = ''; // limpiar input
    }
  };

  const downloadBulkTemplate = () => {
  const templateData = [
    {
      'Código': '',
      'Nombre': '',
      'Precio': '',
      'Categoría': '',
      'URL Imagen': '',
      'Marca': '',
      'Proveedor': '',
      'Descripción': '',
      'Destacado': '',
      'Visible': '',
    },
  ];

  const worksheet = utils.json_to_sheet(templateData);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, 'Plantilla');

  const buffer = write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = 'plantilla_carga_masiva_productos.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


  const downloadProductsExcel = () => {
    // Export en español (tal como lo tenés), y el import ahora lo entiende.
    const excelData = products.map(product => ({
      'Código': product.code,
      'Nombre': product.name,
      'Precio': product.price,
      'Categoría': product.category,
      'Marca': product.brand || '',
      'Proveedor': product.supplier || '',
      'Descripción': product.description || '',
      'Destacado': product.featured ? 'Sí' : 'No',
      'Visible': product.visible ? 'Sí' : 'No',
      'URL Imagen': product.image,
      'Fecha Creación': new Date(product.created_at).toLocaleDateString(),
    }));

    const worksheet = utils.json_to_sheet(excelData);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Productos');

    const excelBuffer = write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `productos_${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProductIds(new Set(products.map(p => p.id)));
    } else {
      setSelectedProductIds(new Set());
    }
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    const newSelected = new Set(selectedProductIds);
    if (checked) newSelected.add(productId);
    else newSelected.delete(productId);
    setSelectedProductIds(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedProductIds.size === 0) return;

    const confirmMessage = `¿Estás seguro de que deseas eliminar ${selectedProductIds.size} producto${selectedProductIds.size > 1 ? 's' : ''}? Esta acción no se puede deshacer.`;

    if (!window.confirm(confirmMessage)) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .in('id', Array.from(selectedProductIds));

      if (error) throw error;

      setSelectedProductIds(new Set());
      fetchProducts();
    } catch (error) {
      console.error('Error deleting products:', error);
      alert('Error al eliminar los productos. Por favor, intenta nuevamente.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Mantengo tu hide masivo (opcional).
  // Con el bulk upsert, también podés ocultar editando "Visible" en el Excel y subiendo.
  const handleHideProductsFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

      const codes: string[] = [];
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i] as any;
        const rowNumber = i + 2;

        const code = toStr(getVal(row, ['code', 'Código']))?.trim();
        if (!code) {
          errors.push(`Fila ${rowNumber}: Falta el código del producto`);
          continue;
        }
        codes.push(code);
      }

      if (codes.length > 0) {
        const { error } = await supabase
          .from('products')
          .update({ visible: false })
          .in('code', codes);

        if (error) throw error;

        errors.push(`Éxito: ${codes.length} producto${codes.length > 1 ? 's han' : ' ha'} sido ocultado${codes.length > 1 ? 's' : ''}`);
        fetchProducts();
      }
    } catch (error) {
      console.error('Error hiding products:', error);
      errors.push('Error al procesar el archivo. Por favor, verifica el formato.');
    } finally {
      setImportErrors(errors);
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const isAllSelected = products.length > 0 && selectedProductIds.size === products.length;
  const isIndeterminate = selectedProductIds.size > 0 && selectedProductIds.size < products.length;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="w-full max-w-none mx-auto px-2 sm:px-4 lg:px-6 py-8">
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
              onClick={downloadProductsExcel}
              className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-5 w-5 mr-2" />
              Descargar Excel
            </button>

            {selectedProductIds.size > 0 && (
              <button
                onClick={handleBulkDelete}
                disabled={isDeleting}
                className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-5 w-5 mr-2" />
                {isDeleting ? 'Eliminando...' : `Eliminar ${selectedProductIds.size}`}
              </button>
            )}

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

            <button
              onClick={() => {
                setImportMode('hide');
                setCurrentProduct(null);
                setIsModalOpen(true);
              }}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                importMode === 'hide'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-red-50'
              }`}
            >
              <EyeOff className="h-5 w-5 mr-2" />
              Ocultar Masivo
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto min-w-full">
              <table className="w-full table-fixed divide-y divide-gray-200" style={{ minWidth: '1400px' }}>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-12 px-3 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        ref={(input) => {
                          if (input) input.indeterminate = isIndeterminate;
                        }}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </th>
                    <th className="w-80 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="w-32 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="w-28 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Marca
                    </th>
                    <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio
                    </th>
                    <th className="w-20 px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Destacado
                    </th>
                    <th className="w-20 px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Visible
                    </th>
                    <th className="w-24 px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className={!product.visible ? 'bg-gray-50' : ''}>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedProductIds.has(product.id)}
                          onChange={(e) => handleSelectProduct(product.id, e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
                          />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {product.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {product.code}
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 truncate">
                        {product.brand || '-'}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${product.price.toFixed(2)}
                      </td>
                      <td className="px-2 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => toggleFeatured(product)}
                          className={`${
                            product.featured ? 'text-yellow-400' : 'text-gray-300'
                          } hover:text-yellow-500 transition-colors`}
                        >
                          <Star className="h-5 w-5 fill-current" />
                        </button>
                      </td>
                      <td className="px-2 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => toggleVisibility(product)}
                          className={`${
                            product.visible ? 'text-green-500' : 'text-gray-400'
                          } hover:text-green-600 transition-colors`}
                          title={product.visible ? 'Ocultar producto' : 'Mostrar producto'}
                        >
                          {product.visible ? (
                            <Eye className="h-5 w-5" />
                          ) : (
                            <EyeOff className="h-5 w-5" />
                          )}
                        </button>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
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
          </div>
        )}
      </div>

      {/* Modal */}
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
                        defaultValue={currentProduct?.brand || ''}
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
                        defaultValue={currentProduct?.supplier || ''}
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
                      defaultValue={currentProduct?.description || ''}
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
            ) : importMode === 'hide' ? (
              <>
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Ocultar Productos Masivamente
                </h2>

                <div className="bg-red-50 p-4 rounded-lg mb-6">
                  <h3 className="font-semibold text-red-800 mb-2">Instrucciones:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-red-800">
                    <li>Prepare un archivo Excel (.xlsx) con una columna:
                      <ul className="list-disc list-inside ml-4 mt-1 text-sm">
                        <li>code o Código (Código del producto - obligatorio)</li>
                      </ul>
                    </li>
                    <li>Agregue los códigos de los productos que desea ocultar, uno por fila</li>
                    <li>Los productos se ocultarán automáticamente sin ser eliminados</li>
                    <li>(Opcional) Ya podés ocultar también desde Carga Masiva editando la columna "Visible"</li>
                  </ol>
                </div>

                {importErrors.length > 0 && (
                  <div className="bg-red-50 p-4 rounded-lg mb-6">
                    <h3 className="font-semibold text-red-800 mb-2">
                      {importErrors.some(e => e.includes('Éxito')) ? 'Resultado:' : 'Errores:'}
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-red-800 text-sm">
                      {importErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-red-300 border-dashed rounded-lg cursor-pointer bg-red-50 hover:bg-red-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-10 h-10 mb-3 text-red-400" />
                      <p className="mb-2 text-sm text-red-600">
                        <span className="font-semibold">Haga clic para cargar</span> o arrastre y suelte
                      </p>
                      <p className="text-xs text-red-500">Archivo Excel (.xlsx) con códigos</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".xlsx"
                      onChange={handleHideProductsFile}
                      disabled={isImporting}
                    />
                  </label>
                </div>

                {isImporting && (
                  <div className="mt-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                    <p className="text-red-600 mt-2">Procesando archivo...</p>
                  </div>
                )}

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cerrar
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Importación / Actualización Masiva (UPsert)
                </h2>

<button
  onClick={downloadBulkTemplate}
  className="flex items-center mb-4 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
>
  <Download className="h-5 w-5 mr-2" />
  Descargar plantilla
</button>


                
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <h3 className="font-semibold text-blue-800 mb-2">Cómo funciona ahora:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-blue-800">
                    <li>Si el <b>Código</b> existe: actualiza los campos presentes en la planilla (ej. Precio, Visible, Destacado).</li>
                    <li>Si el <b>Código</b> no existe: crea el producto y exige los obligatorios (Nombre, Precio, Categoría, URL Imagen).</li>
                    <li>Se aceptan encabezados en <b>español</b> (como tu Excel descargado) y en <b>inglés</b>.</li>
                  </ol>
                </div>


                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <h3 className="font-semibold text-blue-800 mb-2">Columnas soportadas:</h3>
                  <ul className="list-disc list-inside ml-4 mt-1 text-sm text-blue-800 space-y-1">
                    <li>Código / code (obligatorio)</li>
                    <li>Nombre / name</li>
                    <li>Precio / price</li>
                    <li>Categoría / category (debe existir en el sistema si se envía)</li>
                    <li>URL Imagen / image</li>
                    <li>Descripción / description</li>
                    <li>Destacado / featured (Sí/No, true/false)</li>
                    <li>Visible / visible (Sí/No, true/false)</li>
                    <li>Marca / brand</li>
                    <li>Proveedor / supplier</li>
                  </ul>
                </div>

                {importErrors.length > 0 && (
                  <div className="bg-red-50 p-4 rounded-lg mb-6">
                    <h3 className="font-semibold text-red-800 mb-2">Resultado / Errores:</h3>
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
                      <p className="text-xs text-gray-500">Archivo Excel (.xlsx)</p>
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
                    <p className="mt-2 text-sm text-gray-600">Procesando planilla...</p>
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