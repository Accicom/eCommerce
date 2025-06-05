import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Banner from './components/Banner';
import MainOptions from './components/MainOptions';
import Benefits from './components/Benefits';
import Testimonials from './components/Testimonials';
import FAQ from './components/FAQ';
import Branches from './components/Branches';
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
import Orders from './pages/admin/Orders';
import CatalogClients from './pages/admin/CatalogClients';
import BranchesManagement from './pages/admin/Branches';
import { useAnalytics } from './hooks/useAnalytics';

// Analytics wrapper component
function AnalyticsWrapper({ children }: { children: React.ReactNode }) {
  useAnalytics();
  return <>{children}</>;
}

function App() {
  return (
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
                <Branches />
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
            </div>
          } />
          <Route path="/producto/:code" element={
            <div className="min-h-screen bg-gray-100">
              <Header />
              <ProductDetail />
              <Footer />
              <WhatsAppButton />
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
          <Route path="/admin/orders" element={<Orders />} />
          <Route path="/admin/catalog-clients" element={<CatalogClients />} />
          <Route path="/admin/branches" element={<BranchesManagement />} />
        </Routes>
      </AnalyticsWrapper>
    </Router>
  );
}

export default App;