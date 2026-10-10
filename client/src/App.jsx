import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/common/Header';
import { CustomerPortal } from './components/customer/CustomerPortal';
import { DriverPortal } from './components/driver/DriverPortal';
import { AdminPortal } from './components/admin/AdminPortal';
import { AuthModal } from './components/auth/AuthModal';
import { Truck, Shield, Clock, Award, PhoneCall } from 'lucide-react';

const AppContent = () => {
  const { activePortal, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <div className="brand-badge" style={{ padding: '12px 18px', fontSize: '1.8rem' }}>
          <Truck size={36} />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Initializing QuickHaul Engine...</h2>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <Header />

      {/* Portal Display */}
      {activePortal === 'customer' && <CustomerPortal />}
      {activePortal === 'driver' && <DriverPortal />}
      {activePortal === 'admin' && <AdminPortal />}

      {/* Global Auth Modal */}
      <AuthModal />

      {/* QuickHaul Footer */}
      <footer style={{ background: '#0a0e17', borderTop: '1px solid var(--border-subtle)', padding: '36px 20px', marginTop: 'auto' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="brand-badge" style={{ padding: '6px 10px' }}>
                <Truck size={20} />
              </div>
              <div>
                <strong style={{ fontSize: '1.15rem' }}>QuickHaul Logistics Platform</strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Fast, Reliable, Transparent Local Transportation for Goods & Commercial Cargo.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', fontSize: '0.82rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Shield size={16} color="var(--success)" /> Verified Commercial Drivers
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={16} color="var(--brand-primary)" /> Instant City Dispatch
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Award size={16} color="var(--info)" /> Transparent Distance Fares
              </span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            <div>© {new Date().getFullYear()} QuickHaul Technologies Inc. All rights reserved. Confidential Project.</div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <span>Privacy Policy</span>
              <span>Terms of Carriage</span>
              <span>Carrier Guidelines</span>
              <span>Safety Standards</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
