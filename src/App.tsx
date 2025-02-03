import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Banner from './components/Banner';
import MainOptions from './components/MainOptions';
import Benefits from './components/Benefits';
import Testimonials from './components/Testimonials';
import FAQ from './components/FAQ';
import ContactForm from './components/ContactForm';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import Products from './pages/admin/Products';
import Categories from './pages/admin/Categories';
import BannerManagement from './pages/admin/Banner';
import Subscriptions from './pages/admin/Subscriptions';
import PopupManagement from './pages/admin/PopupManagement';
import { CartProvider } from './context/CartContext';
import Cart from './components/Cart';
import { useAnalytics } from './hooks/useAnalytics';

// Analytics wrapper component
function AnalyticsWrapper({ children }: { children: React.ReactNode }) {
  useAnalytics();
  return <>{children}</>;
}

function App() {
  return (
    <CartProvider>
      <Router>
        <AnalyticsWrapper>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={
              <div className="min-h-screen bg-gray-100">
                <Header />
                <main>
                  <Banner />
                  <MainOptions />
                  <Benefits />
                  <Testimonials />
                  <FAQ />
                  <ContactForm />
                </main>
                <Footer />
                <WhatsAppButton />
              </div>
            } />
            <Route path="/catalogo" element={
              <div className="min-h-screen bg-gray-100">
                <Header />
                <Catalog />
                <Footer />
                <WhatsAppButton />
                <Cart />
              </div>
            } />
            <Route path="/producto/:code" element={
              <div className="min-h-screen bg-gray-100">
                <Header />
                <ProductDetail />
                <Footer />
                <WhatsAppButton />
                <Cart />
              </div>
            } />

            {/* Rutas de administración */}
            <Route path="/admin" element={<Login />} />
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/products" element={<Products />} />
            <Route path="/admin/categories" element={<Categories />} />
            <Route path="/admin/banner" element={<BannerManagement />} />
            <Route path="/admin/subscriptions" element={<Subscriptions />} />
            <Route path="/admin/popup" element={<PopupManagement />} />
          </Routes>
        </AnalyticsWrapper>
      </Router>
    </CartProvider>
  );
}

export default App;