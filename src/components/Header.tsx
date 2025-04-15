import React from 'react';
import { Menu, X, CreditCard, Phone, HelpCircle, Home, Wallet } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const navigate = useNavigate();

  const handleCatalogClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo(0, 0);
    navigate('/catalogo');
  };

  return (
    <header className="bg-white shadow-md fixed w-full top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img 
                src="https://i.ibb.co/tMLmv5dG/Logo-Accicom-HD-sin-fondo.png" 
                alt="Accicom" 
                className="h-8"
              />
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className="text-gray-600 hover:text-blue-600 flex items-center">
              <Home className="w-4 h-4 mr-1" />
              Inicio
            </Link>
            <Link to="https://wa.me/5493513486125" className="text-gray-600 hover:text-blue-600 flex items-center">
              <Wallet className="w-4 h-4 mr-1" />
              Préstamo
            </Link>
            <a
              href="/catalogo"
              onClick={handleCatalogClick}
              className="text-gray-600 hover:text-blue-600 flex items-center"
            >
              <CreditCard className="w-4 h-4 mr-1" />
              Catálogo
            </a>
            {/* <Link to="/contacto" className="text-gray-600 hover:text-blue-600 flex items-center">
              <Phone className="w-4 h-4 mr-1" />
              Contacto
            </Link> */}
            {/* <Link to="/faq" className="text-gray-600 hover:text-blue-600 flex items-center">
              <HelpCircle className="w-4 h-4 mr-1" />
              FAQ
            </Link> */}
          </nav>

          <button 
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6 text-gray-600" />
            ) : (
              <Menu className="h-6 w-6 text-gray-600" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link to="/" className="block px-3 py-2 text-gray-600 hover:text-blue-600">
                Inicio
              </Link>
              <Link to="https://wa.me/5493513486125" className="block px-3 py-2 text-gray-600 hover:text-blue-600">
                Préstamo
              </Link>
              <a
                href="/catalogo"
                onClick={handleCatalogClick}
                className="block px-3 py-2 text-gray-600 hover:text-blue-600"
              >
                Catálogo
              </a>
              {/* <Link to="/contacto" className="block px-3 py-2 text-gray-600 hover:text-blue-600">
                Contacto
              </Link> */}
              {/* <Link to="/faq" className="block px-3 py-2 text-gray-600 hover:text-blue-600">
                FAQ
              </Link> */}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}