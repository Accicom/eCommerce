import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useAnalytics } from '../hooks/useAnalytics';

export default function WhatsAppButton() {
  const { trackEvent } = useAnalytics();

  const handleWhatsAppClick = () => {
    trackEvent('click_whatsapp', 'contact', 'WhatsApp Button');
    window.open('https://wa.me/5493513486125', '_blank');
  };

  return (
    <button
      onClick={handleWhatsAppClick}
      className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full
      shadow-lg hover:bg-green-600 transition-colors z-50"
    >
      <MessageCircle className="h-6 w-6" />
    </button>
  );
}