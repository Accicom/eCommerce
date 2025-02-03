import React from 'react';
import { Phone, Mail } from 'lucide-react';

export default function ContactForm() {
  const handleWhatsAppClick = () => {
    window.open('https://wa.me/5493513486125', '_blank');
  };

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
          Contáctanos
        </h2>
        
        <div className="max-w-2xl mx-auto">
          <div className="space-y-8">
            <div 
              onClick={handleWhatsAppClick}
              className="flex items-center justify-center space-x-4 p-6 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
            >
              <Phone className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="text-xl font-semibold text-gray-800">WhatsApp</h3>
                <p className="text-green-600">+54 9 351 348-6125</p>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-4 p-6 bg-blue-50 rounded-lg">
              <Mail className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="text-xl font-semibold text-gray-800">Correo Electrónico</h3>
                <a 
                  href="mailto:atencion@accicom.com.ar"
                  className="text-blue-600 hover:underline"
                >
                  atencion@accicom.com.ar
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}