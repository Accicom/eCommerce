import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import InfoBanner from './components/InfoBanner';
import Header from './components/Header';
import Banner from './components/Banner';
import MainOptions from './components/MainOptions';
import Benefits from './components/Benefits';
import ProductCarousel from './components/ProductCarousel';
import Testimonials from './components/Testimonials';
import FAQ from './components/FAQ';
import Branches from './components/Branches';
import ContactForm from './components/ContactForm';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import MaintenanceScreen from './components/MaintenanceScreen';
import WaveDivider from './components/WaveDivider';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import CheckoutProcess from './pages/CheckoutProcess';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import Products from './pages/admin/Products';
import Categories from './pages/admin/Categories';
import BannerManagement from './pages/admin/Banner';
import InfoBannersManagement from './pages/admin/InfoBanners';
import Subscriptions from './pages/admin/Subscriptions';
import PopupManagement from './pages/admin/PopupManagement';
import Orders from './pages/admin/Orders';
import CatalogClients from './pages/admin/CatalogClients';
import BranchesManagement from './pages/admin/Branches';
import Testing from './pages/admin/Testing';
import ShowcaseGroupsManagement from './pages/admin/ShowcaseGroups';
import MaintenanceManagement from './pages/admin/Maintenance';
import { useAnalytics } from './hooks/useAnalytics';
import { supabase } from './lib/supabase';

// Analytics wrapper component
function AnalyticsWrapper({ children }: { children: React.ReactNode }) {
  useAnalytics();
  return <>{children}</>;
}

// Maintenance mode wrapper component
function MaintenanceWrapper({ children }: { children: React.ReactNode }) {
  const [maintenanceSettings, setMaintenanceSettings] = useState<{
    enabled: boolean;
    title: string;
    message: string;
    endTime: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    checkMaintenanceMode();

    const channel = supabase
      .channel('site_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_settings'
        },
        () => {
          checkMaintenanceMode();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function(...args) {
      originalPushState.apply(window.history, args);
      handleLocationChange();
    };

    window.history.replaceState = function(...args) {
      originalReplaceState.apply(window.history, args);
      handleLocationChange();
    };

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, []);

  const checkMaintenanceMode = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('maintenance_mode, maintenance_title, maintenance_message, maintenance_end_time')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setMaintenanceSettings({
          enabled: data.maintenance_mode,
          title: data.maintenance_title,
          message: data.maintenance_message,
          endTime: data.maintenance_end_time
        });
      }
    } catch (error) {
      console.error('Error checking maintenance mode:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  const isMaintenanceMode = maintenanceSettings?.enabled || false;
  const isAdminRoute = currentPath.startsWith('/admin');
  const isCatalogRoute = currentPath === '/catalogo' || currentPath.startsWith('/producto/') || currentPath.startsWith('/checkout/');

  if (isMaintenanceMode && !isAdminRoute && isCatalogRoute) {
    return (
      <MaintenanceScreen
        title={maintenanceSettings?.title}
        message={maintenanceSettings?.message}
        endTime={maintenanceSettings?.endTime}
      />
    );
  }

  return <>{children}</>;
}

function App() {
  return (
    <Router>
      <AnalyticsWrapper>
        <MaintenanceWrapper>
          <InfoBanner />
          <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={
            <div className="min-h-screen bg-gray-100">
              <Header />
              <main>
                <Banner />
                <MainOptions />
                <Benefits />
                <WaveDivider fromColor="#eff6ff" toColor="#ffffff" />
                <ProductCarousel />
                <WaveDivider fromColor="#ffffff" toColor="rgba(239, 246, 255, 0.5)" />
                <Testimonials />
                <WaveDivider fromColor="rgba(239, 246, 255, 0.5)" toColor="#ffffff" />
                <FAQ />
                <WaveDivider fromColor="#ffffff" toColor="rgba(239, 246, 255, 0.3)" />
                <Branches />
                <WaveDivider fromColor="rgba(239, 246, 255, 0.3)" toColor="#ffffff" />
                <ContactForm />
              </main>
              <Footer />
              <WhatsAppButton />
            </div>
          } />
          <Route path="/catalogo" element={
            <div className="min-h-screen bg-gray-100">
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
          <Route path="/checkout/:code" element={
            <div className="min-h-screen bg-gray-50">
              <Header />
              <CheckoutProcess />
              <Footer />
            </div>
          } />

          {/* Rutas de administración */}
          <Route path="/admin" element={<Login />} />
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/products" element={<Products />} />
          <Route path="/admin/categories" element={<Categories />} />
          <Route path="/admin/banner" element={<BannerManagement />} />
          <Route path="/admin/info-banners" element={<InfoBannersManagement />} />
          <Route path="/admin/subscriptions" element={<Subscriptions />} />
          <Route path="/admin/popup" element={<PopupManagement />} />
          <Route path="/admin/orders" element={<Orders />} />
          <Route path="/admin/catalog-clients" element={<CatalogClients />} />
          <Route path="/admin/branches" element={<BranchesManagement />} />
          <Route path="/admin/showcase-groups" element={<ShowcaseGroupsManagement />} />
          <Route path="/admin/maintenance" element={<MaintenanceManagement />} />
          <Route path="/admin/testing" element={<Testing />} />
        </Routes>
        </MaintenanceWrapper>
      </AnalyticsWrapper>
    </Router>
  );
}

export default App;