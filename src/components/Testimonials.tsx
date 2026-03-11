import React from 'react';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Ana García',
    initials: 'AG',
    content: 'Cuotas accesibles y buena atención',
    bgColor: 'bg-blue-500'
  },
  {
    name: 'Carlos Rodríguez',
    initials: 'CR',
    content: 'Necesitaba cambiar la heladera urgente, ingrese al catalogo de productos y con las cuotas que me ofrecieron pude renovar toda la cocina sin problemas',
    bgColor: 'bg-green-500'
  },
  {
    name: 'María Torres',
    initials: 'MT',
    content: 'El proceso fue  rápido y profesional.',
    bgColor: 'bg-purple-500'
  }
];

export default function Testimonials() {
  return (
    <section className="py-16 bg-blue-50/50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
          Lo Que Dicen Nuestros Clientes
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center mb-4">
                <div className={`w-14 h-14 rounded-full ${testimonial.bgColor} flex items-center justify-center text-white font-bold text-lg`}>
                  {testimonial.initials}
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-800">{testimonial.name}</h3>
                  <div className="flex text-yellow-400 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed italic">"{testimonial.content}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}