import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Truck, Package, Shield, User, Bell, LogOut, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api';

export const Header = () => {
  const {
    user,
    driverProfile,
    activePortal,
    setActivePortal,
    switchPortal,
    switchPersona,
    logout,
    notifications,
    unreadNotifsCount,
    setAuthModalOpen,
    setAuthModalMode,
    fetchNotifications
  } = useAuth();

  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const handleMarkAllRead = async () => {
    try {
      await api.markNotificationRead('all');
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="top-navbar">
      <div className="top-navbar-inner">
        {/* Brand Logo */}
        <div className="brand-logo-area" onClick={() => switchPortal('customer')}>
          <div className="brand-badge">
            <Truck size={24} strokeWidth={2.5} />
          </div>
          <div className="brand-text">
            <h1>QuickHaul</h1>
            <span>Fast • Reliable • Transparent</span>
          </div>
        </div>

        {/* Portal Switching Bar */}
        <div className="portal-switch-group">
          <button
            className={`portal-switch-btn portal-customer ${activePortal === 'customer' ? 'active' : ''}`}
            onClick={() => switchPortal('customer')}
          >
            <Package size={17} />
            <span>Customer App</span>
          </button>

          <button
            className={`portal-switch-btn portal-driver ${activePortal === 'driver' ? 'active' : ''}`}
            onClick={() => switchPortal('driver')}
          >
            <Truck size={17} />
            <span>Driver App</span>
            {driverProfile?.is_online ? (
              <span className="status-dot status-dot-online" title="Online" />
            ) : (
              <span className="status-dot status-dot-offline" title="Offline" />
            )}
          </button>

          <button
            className={`portal-switch-btn portal-admin ${activePortal === 'admin' ? 'active' : ''}`}
            onClick={() => switchPortal('admin')}
          >
            <Shield size={17} />
            <span>Admin Desk</span>
          </button>
        </div>

        {/* Right side: Notifications & User profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative' }}>
          {/* Notification Bell */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="qh-btn qh-btn-secondary qh-btn-sm"
              style={{ position: 'relative', padding: '8px 10px', borderRadius: '50%' }}
              title="Notifications"
            >
              <Bell size={18} />
              {unreadNotifsCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    background: '#ef4444',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 6px rgba(239, 68, 68, 0.8)'
                  }}
                >
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifMenu && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '46px',
                  width: '320px',
                  background: 'var(--bg-modal)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 2500,
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Live Notifications</span>
                  {unreadNotifsCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      style={{ fontSize: '0.75rem', color: 'var(--brand-primary)', fontWeight: 600 }}
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid var(--border-subtle)',
                          background: n.is_read ? 'transparent' : 'rgba(245, 158, 11, 0.05)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-main)' }}>
                            {n.title}
                          </span>
                          {!n.is_read && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--brand-primary)' }} />}
                        </div>
                        <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                          {n.message}
                        </p>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img
                src={user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                alt={user.name}
                style={{ width: '34px', height: '34px', borderRadius: '50%', border: '2px solid var(--border-medium)', objectFit: 'cover' }}
              />
              <div style={{ display: 'none', flexDirection: 'column' }} className="d-md-flex">
                <span style={{ fontSize: '0.86rem', fontWeight: 700, lineHeight: 1.1 }}>{user.name}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                  {user.role} {driverProfile?.verification_status === 'approved' && '• Verified 🛡️'}
                </span>
              </div>
              <button
                onClick={logout}
                className="qh-btn qh-btn-secondary qh-btn-sm"
                title="Logout"
                style={{ padding: '6px 8px' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setAuthModalMode('login'); setAuthModalOpen(true); }}
              className="qh-btn qh-btn-primary qh-btn-sm"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Demo Switcher Quick Bar */}
      <div className="demo-persona-banner">
        <div className="demo-persona-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.78rem' }}>🚀 One-Click Persona Switcher:</span>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>(Evaluator quick switch)</span>
          </div>

          <div className="persona-chips">
            <button
              className={`persona-chip-btn ${user?.email === 'customer@quickhaul.com' ? 'active' : ''}`}
              onClick={() => switchPersona('customer')}
            >
              <Package size={13} />
              <span>Alex Morgan (Customer)</span>
            </button>

            <button
              className={`persona-chip-btn ${user?.email === 'ramesh.driver@quickhaul.com' ? 'active' : ''}`}
              onClick={() => switchPersona('driver')}
            >
              <Truck size={13} />
              <span>Ramesh (Verified Driver - Tata Ace)</span>
            </button>

            <button
              className={`persona-chip-btn ${user?.email === 'vikram.driver@quickhaul.com' ? 'active' : ''}`}
              onClick={() => switchPersona('driver_pending')}
            >
              <AlertTriangle size={13} />
              <span>Vikram (Pending Driver - Tata 407)</span>
            </button>

            <button
              className={`persona-chip-btn ${user?.role === 'admin' ? 'active' : ''}`}
              onClick={() => switchPersona('admin')}
            >
              <Shield size={13} />
              <span>Operations Admin Desk</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
