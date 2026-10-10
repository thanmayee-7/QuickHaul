import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Truck, Package, Shield, Mail, Lock, User, Phone, CheckCircle2 } from 'lucide-react';

export const AuthModal = () => {
  const {
    authModalOpen,
    setAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    login,
    register
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('customer'); // 'customer' | 'driver'

  // Driver details
  const [vehicleModel, setVehicleModel] = useState('Tata Ace Gold HT Plus');
  const [vehiclePlate, setVehiclePlate] = useState('KA-01-MJ-9921');
  const [vehicleCategory, setVehicleCategory] = useState('tata_ace');
  const [licenseNumber, setLicenseNumber] = useState('DL-04-2022-918237');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!authModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (authModalMode === 'login') {
        await login(email, password);
      } else {
        const payload = {
          name,
          email,
          phone,
          password,
          role,
          driverDetails: role === 'driver' ? {
            vehicle_model: vehicleModel,
            vehicle_plate: vehiclePlate,
            vehicle_category_id: vehicleCategory,
            license_number: licenseNumber
          } : undefined
        };
        await register(payload);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setAuthModalOpen(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="brand-badge" style={{ padding: '4px 8px' }}>
              <Truck size={18} />
            </div>
            <h3 style={{ fontSize: '1.25rem' }}>
              {authModalMode === 'login' ? 'Sign In to QuickHaul' : 'Create QuickHaul Account'}
            </h3>
          </div>
          <button className="modal-close-btn" onClick={() => setAuthModalOpen(false)}>✕</button>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', marginBottom: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {authModalMode === 'register' && (
            <>
              {/* Role Picker */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                  Register As:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setRole('customer')}
                    style={{
                      padding: '10px',
                      borderRadius: 'var(--radius-md)',
                      background: role === 'customer' ? 'rgba(245, 158, 11, 0.2)' : '#0d1424',
                      border: `1px solid ${role === 'customer' ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                      color: role === 'customer' ? 'var(--brand-primary)' : 'var(--text-main)',
                      fontWeight: 700,
                      fontSize: '0.85rem'
                    }}
                  >
                    📦 Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('driver')}
                    style={{
                      padding: '10px',
                      borderRadius: 'var(--radius-md)',
                      background: role === 'driver' ? 'rgba(16, 185, 129, 0.2)' : '#0d1424',
                      border: `1px solid ${role === 'driver' ? 'var(--success)' : 'var(--border-subtle)'}`,
                      color: role === 'driver' ? 'var(--success)' : 'var(--text-main)',
                      fontWeight: 700,
                      fontSize: '0.85rem'
                    }}
                  >
                    🚚 Driver Partner
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                  Full Name / Business Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar or Tech Logistics"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98450 12345"
                />
              </div>

              {role === 'driver' && (
                <div style={{ background: '#0a0e17', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--brand-primary)' }}>
                    Commercial Vehicle Details:
                  </span>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Vehicle Type</label>
                    <select value={vehicleCategory} onChange={(e) => setVehicleCategory(e.target.value)}>
                      <option value="tata_ace">Tata Ace (Chota Hathi)</option>
                      <option value="3wheeler">3-Wheeler Ape / Piaggio</option>
                      <option value="bolero_pickup">Bolero Maxi Truck Plus</option>
                      <option value="tata_407">Tata 407 Heavy (14ft)</option>
                      <option value="e_loader">Eco-Loader Electric Cargo</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Plate Number</label>
                    <input
                      type="text"
                      value={vehiclePlate}
                      onChange={(e) => setVehiclePlate(e.target.value)}
                      placeholder="KA-01-AB-1234"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Driving License No</label>
                    <input
                      type="text"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="DL-04-2020-001234"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@quickhaul.com"
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="qh-btn qh-btn-primary qh-btn-lg"
            style={{ width: '100%', marginTop: '6px' }}
          >
            {loading ? 'Authenticating...' : authModalMode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          {authModalMode === 'login' ? (
            <span>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setAuthModalMode('register')}
                style={{ color: 'var(--brand-primary)', fontWeight: 700 }}
              >
                Sign Up
              </button>
            </span>
          ) : (
            <span>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => setAuthModalMode('login')}
                style={{ color: 'var(--brand-primary)', fontWeight: 700 }}
              >
                Sign In
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
