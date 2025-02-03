import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const faqs = [
  {
    question: '¿Cuáles son los requisitos para solicitar un préstamo?',
    answer: 'Los requisitos básicos incluyen ser mayor de edad, tener un ingreso comprobable, identificación oficial vigente'
  },
  {
    question: '¿Cuáles son los requisitos para comprar un producto?',
    answer: 'Se tomaran los mismos requisitos de un préstamo personal.'
  },
  {
    question: '¿Cuánto tiempo toma aprobar mi solicitud?',
    answer: 'El proceso de aprobación y acreditación se realiza el mismo dia una vez que toda la documentación ha sido recibida.'
  },
  {
    question: '¿Cuáles son las tasas de interés?',
    answer: 'Las tasas varían según el tipo de préstamo y tu perfil crediticio. Contáctanos para recibir una cotización personalizada.'
  },
  {
    question: '¿Puedo pagar mi préstamo por adelantado?',
    answer: 'Sí, puedes realizar pagos anticipados sin penalización. Esto te ayudará a reducir los intereses generados.'
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
          Preguntas Frecuentes
        </h2>
        
        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <div key={index} className="mb-4">
              <button
                className="w-full bg-white p-4 rounded-lg shadow-md hover:shadow-lg
                transition-shadow flex items-center justify-between"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="font-semibold text-gray-800">{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp className="h-5 w-5 text-blue-600" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-blue-600" />
                )}
              </button>
              
              {openIndex === index && (
                <div className="bg-white px-4 py-3 rounded-b-lg shadow-md mt-1">
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}