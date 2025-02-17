import React from 'react';
import { Facebook, Instagram, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Accicom</h3>
            <p className="text-gray-400">
              Tu solución financiera, al alcance de un clic.
            </p>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-2">
              <li>
                <Link to="https://wa.me/5493513486125" className="text-gray-400 hover:text-white transition-colors">
                  Quiero un préstamo
                </Link>
              </li>
              <li>
                <Link to="/catalogo" className="text-gray-400 hover:text-white transition-colors">
                  Catálogo
                </Link>
              </li>
              <li>
                <Link to="#" className="text-gray-400 hover:text-white transition-colors">
                  Contacto
                </Link>
              </li>
              <li>
                <Link to="#" className="text-gray-400 hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="#" className="text-gray-400 hover:text-white transition-colors">
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link to="https://autogestion.produccion.gob.ar/consumidores" className="text-gray-400 hover:text-white transition-colors">
                  Defensa al consumidor
                </Link>
              </li>
              <li>
                <Link to="https://www.bcra.gob.ar/BCRAyVos/usuarios_financieros.asp" className="text-gray-400 hover:text-white transition-colors">
                  Información al usuario financiero
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Síguenos</h4>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="h-6 w-6" />
              </a>
              <a href="https://ar.linkedin.com/company/accicom" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col items-center space-y-4">
            <p className="text-gray-400">&copy; {new Date().getFullYear()} Accicom. Todos los derechos reservados.</p>
            
            {/* Logos institucionales */}
            <div className="flex flex-wrap justify-center items-center gap-4">
              {/* AFIP QR Code */}
              <div className="scale-75 transform origin-center">
                <a 
                  href="http://qr.afip.gob.ar/?qr=ZJNOTebrEU123kRj6egpLg,," 
                  target="_F960AFIPInfo"
                  className="inline-block opacity-75 hover:opacity-100 transition-opacity"
                >
                  <img 
                    src="http://www.afip.gob.ar/images/f960/DATAWEB.jpg" 
                    alt="AFIP QR"
                    className="w-auto h-16"
                  />
                </a>
              </div>

              {/* BCRA Usuarios Financieros */}
              <div className="scale-90 transform origin-center">
                <a 
                  href="https://www.bcra.gob.ar/BCRAyVos/usuarios_financieros.asp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block opacity-75 hover:opacity-100 transition-opacity"
                >
                  <img 
                    src="https://i.ibb.co/NPMdFWY/usuarios-financieros-2x.png"
                    alt="Usuarios Financieros BCRA"
                    className="w-auto h-16"
                  />
                </a>
              </div>

              {/* BCRA Logo */}
              <div className="scale-90 transform origin-center">
                <a 
                  href="http://www.bcra.gov.ar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block opacity-75 hover:opacity-100 transition-opacity"
                >
                  <img 
                    src="https://i.ibb.co/0RVXmWJy/BCRA-logo-svg.png"
                    alt="Banco Central de la República Argentina"
                    className="w-auto h-16"
                  />
                </a>
              </div>
            </div>

            {/* Texto legal */}
            <p className="text-gray-500 text-xs text-center max-w-4xl mt-4 leading-relaxed">
              (*) Cada préstamo presenta una tasa fija, en moneda local, y se concede mediante el sistema de amortización francés con cuotas mensuales y consecutivas. En todas las situaciones, la Tasa Nominal Anual (TNA), la Tasa Efectiva Anual (TEA), el Costo Financiero Total (CFT), y la Tasa Efectiva Anual con IVA (CFTEA) varían según el perfil crediticio del cliente. Estas tasas se proporcionarán y detallarán antes de que el solicitante acepte la oferta de préstamo. TNA (S/IVA) 394,48% - CFT (S/IVA) 2928,70%
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}