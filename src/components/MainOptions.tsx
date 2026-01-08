import React from 'react';
import { Wallet, ShoppingBag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function MainOptions() {
  const navigate = useNavigate();

  const handleCatalogClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo(0, 0);
    navigate('/catalogo');
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
          <div className="flex items-center mb-4">
            <Wallet className="h-8 w-8 text-blue-600" />
            <h3 className="text-2xl font-bold text-gray-800 ml-3">Préstamos Personales</h3>
          </div>
          <p className="text-gray-600 mb-6">
            Obtén el financiamiento que necesitas con las mejores tasas del mercado
            y plazos flexibles adaptados a tu capacidad de pago.
          </p>
          <Link
            to="https://app.accicom.com.ar/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg
            hover:bg-blue-700 transition-colors font-semibold"
          >
            Solicitar Ahora
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
          <div className="flex items-center mb-4">
            <ShoppingBag className="h-8 w-8 text-blue-600" />
            <h3 className="text-2xl font-bold text-gray-800 ml-3">Catálogo de Productos</h3>
          </div>
          <p className="text-gray-600 mb-6">
            Explora nuestra amplia gama de productos disponibles para financiamiento
            con cuotas fijas y sin intereses ocultos.
          </p>
          <a
            href="/catalogo"
            onClick={handleCatalogClick}
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg
            hover:bg-blue-700 transition-colors font-semibold"
          >
            Explorar Catálogo
          </a>
        </div>
      </div>
    </div>
  );
}