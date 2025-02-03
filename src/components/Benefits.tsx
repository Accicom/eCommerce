import React from 'react';
import { Clock, Shield, DollarSign, Users } from 'lucide-react';

const benefits = [
  {
    icon: Clock,
    title: 'Aprobación Rápida',
    description: 'Proceso simplificado con respuesta en 24 horas'
  },
  {
    icon: Shield,
    title: 'Seguridad Garantizada',
    description: 'Tus datos están protegidos con la más alta tecnología'
  },
  {
    icon: DollarSign,
    title: 'Mejores Tasas',
    description: 'Tasas competitivas adaptadas a tu perfil'
  },
  {
    icon: Users,
    title: 'Atención Personalizada',
    description: 'Asesores expertos a tu disposición'
  }
];

export default function Benefits() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
          ¿Por Qué Elegirnos?
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg
              transition-shadow text-center"
            >
              <div className="inline-block p-3 bg-blue-100 rounded-full mb-4">
                <benefit.icon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {benefit.title}
              </h3>
              <p className="text-gray-600">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}