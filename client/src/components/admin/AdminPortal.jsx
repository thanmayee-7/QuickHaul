import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Shield, Users, Truck, DollarSign, AlertCircle, CheckCircle, XCircle,
  FileText, Settings, Search, RefreshCw, Eye, MessageSquare, BarChart3, TrendingUp
} from 'lucide-react';

export const AdminPortal = () => {
  const { user, switchPersona, fetchNotifications } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'drivers' | 'bookings' | 'users' | 'support' | 'pricing' | 'ledger'

  // Auto-align persona if entering Admin Desk with non-admin user
  useEffect(() => {
    if (user && user.role !== 'admin') {
      switchPersona('admin');
    }
  }, [user]);

  // Dashboard Stats
  const [stats, setStats] = useState(null);
  const [categoryVolume, setCategoryVolume] = useState([]);

  // Drivers Management
  const [drivers, setDrivers] = useState([]);
  const [driverFilter, setDriverFilter] = useState('');
  const [selectedDriverForDoc, setSelectedDriverForDoc] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Bookings Oversight
  const [bookings, setBookings] = useState([]);
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [selectedBookingDetail, setSelectedBookingDetail] = useState(null);

  // Users Management
  const [usersList, setUsersList] = useState([]);

  // Support Desk
  const [supportTickets, setSupportTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketReply, setTicketReply] = useState('');

  // Pricing Config
  const [categories, setCategories] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);

  // Financial Ledger
  const [transactions, setTransactions] = useState([]);

  // Toast
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load all initial data safely
  const loadDashboardData = async () => {
    try {
      const [statsRes, driversRes, bookingsRes, usersRes, ticketsRes, catRes, txRes] = await Promise.allSettled([
        api.getAdminStats(),
        api.getAdminDrivers(driverFilter),
        api.getAdminBookings(),
        api.getAdminUsers(),
        api.getAllTickets(),
        api.getCategories(),
        api.getAdminTransactions()
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.metrics);
        setCategoryVolume(statsRes.value.category_volume || []);
      }
      if (driversRes.status === 'fulfilled') {
        setDrivers(driversRes.value.drivers || []);
      }
      if (bookingsRes.status === 'fulfilled') {
        setBookings(bookingsRes.value.bookings || []);
      }
      if (usersRes.status === 'fulfilled') {
        setUsersList(usersRes.value.users || []);
      }
      if (ticketsRes.status === 'fulfilled') {
        setSupportTickets(ticketsRes.value.tickets || []);
      }
      if (catRes.status === 'fulfilled') {
        setCategories(catRes.value.categories || []);
      }
      if (txRes.status === 'fulfilled') {
        setTransactions(txRes.value.transactions || []);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user, driverFilter]);

  // Handle Driver Verification Action
  const handleVerifyDriver = async (driverId, action) => {
    try {
      await api.verifyDriver(driverId, {
        action,
        rejection_reason: action === 'reject' ? rejectionReason : undefined
      });
      showToast(`Driver verification marked as ${action.toUpperCase()}.`);
      setSelectedDriverForDoc(null);
      setRejectionReason('');
      const updatedDrivers = await api.getAdminDrivers(driverFilter);
      setDrivers(updatedDrivers.drivers || []);
      const updatedStats = await api.getAdminStats();
      setStats(updatedStats.metrics);
      fetchNotifications();
    } catch (err) {
      showToast(err.message);
    }
  };

  // Toggle user active / suspended
  const handleToggleUser = async (userId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
      await api.toggleUserStatus(userId, newStatus);
      showToast(`User status updated to ${newStatus}.`);
      const usersRes = await api.getAdminUsers();
      setUsersList(usersRes.users || []);
    } catch (err) {
      showToast(err.message);
    }
  };

  // Reply to support ticket
  const handleReplyTicket = async (e) => {
    e.preventDefault();
    if (!selectedTicket || !ticketReply) return;
    try {
      await api.updateTicket(selectedTicket.id, {
        admin_response: ticketReply,
        status: 'resolved'
      });
      showToast('Support ticket resolved and response sent to user.');
      setSelectedTicket(null);
      setTicketReply('');
      const ticketsRes = await api.getAllTickets();
      setSupportTickets(ticketsRes.tickets || []);
      fetchNotifications();
    } catch (err) {
      showToast(err.message);
    }
  };

  // Save Pricing update
  const handleSavePricing = async (e) => {
    e.preventDefault();
    if (!editingCategory) return;
    try {
      await api.updateCategoryPricing(editingCategory.id, {
        base_fare: Number(editingCategory.base_fare),
        per_km_rate: Number(editingCategory.per_km_rate),
        helper_rate: Number(editingCategory.helper_rate),
        commission_percent: Number(editingCategory.commission_percent)
      });
      showToast(`Pricing updated for ${editingCategory.name}!`);
      setEditingCategory(null);
      const catRes = await api.getCategories();
      setCategories(catRes.categories || []);
    } catch (err) {
      showToast(err.message);
    }
  };

  return (
    <div className="main-content">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="toast-container">
          <div className="toast">
            <CheckCircle size={18} color="var(--purple)" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Admin Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-purple">Enterprise Command</span>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Operations & Dispatch Control Desk</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Citywide fleet management, driver verification, live dispatch tracking, financials, and support desk.
          </p>
        </div>

        <button onClick={loadDashboardData} className="qh-btn qh-btn-secondary qh-btn-sm">
          <RefreshCw size={15} />
          <span>Refresh All Metrics</span>
        </button>
      </div>

      {/* KPI Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span>Gross Platform GMV</span>
            <DollarSign size={18} color="var(--brand-primary)" />
          </div>
          <div className="metric-value" style={{ color: 'var(--brand-primary)' }}>
            ₹{stats?.total_gmv?.toLocaleString() || '184,200'}
          </div>
          <div className="metric-footer">
            <span>Total cargo value transported</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span>Platform Revenue</span>
            <TrendingUp size={18} color="var(--success)" />
          </div>
          <div className="metric-value" style={{ color: 'var(--success)' }}>
            ₹{stats?.total_platform_commission?.toLocaleString() || '27,630'}
          </div>
          <div className="metric-footer">
            <span>Avg 15% marketplace take rate</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span>Live Active Trips</span>
            <Truck size={18} color="var(--info)" />
          </div>
          <div className="metric-value">
            {stats?.active_bookings || 1}
          </div>
          <div className="metric-footer">
            <span>{stats?.completed_bookings || 24} trips completed successfully</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span>Driver Fleet</span>
            <Users size={18} color="var(--purple)" />
          </div>
          <div className="metric-value">
            {stats?.drivers || 4}
          </div>
          <div className="metric-footer">
            <span style={{ color: stats?.pending_verifications > 0 ? '#fbbf24' : 'var(--text-muted)', fontWeight: 700 }}>
              {stats?.pending_verifications || 1} Pending Verifications ⚠️
            </span>
          </div>
        </div>
      </div>

      {/* Sub Navigation */}
      <div className="subnav-tabs">
        <button
          className={`subnav-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={17} />
          <span>Fleet Overview</span>
        </button>

        <button
          className={`subnav-tab-btn ${activeTab === 'drivers' ? 'active' : ''}`}
          onClick={() => setActiveTab('drivers')}
        >
          <Truck size={17} />
          <span>Driver Verification Desk {stats?.pending_verifications > 0 && `(${stats.pending_verifications})`}</span>
        </button>

        <button
          className={`subnav-tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          <FileText size={17} />
          <span>Live Bookings ({bookings.length})</span>
        </button>

        <button
          className={`subnav-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={17} />
          <span>User Moderation</span>
        </button>

        <button
          className={`subnav-tab-btn ${activeTab === 'support' ? 'active' : ''}`}
          onClick={() => setActiveTab('support')}
        >
          <MessageSquare size={17} />
          <span>Disputes & Support Desk ({supportTickets.length})</span>
        </button>

        <button
          className={`subnav-tab-btn ${activeTab === 'pricing' ? 'active' : ''}`}
          onClick={() => setActiveTab('pricing')}
        >
          <Settings size={17} />
          <span>Vehicle Pricing Rates</span>
        </button>

        <button
          className={`subnav-tab-btn ${activeTab === 'ledger' ? 'active' : ''}`}
          onClick={() => setActiveTab('ledger')}
        >
          <DollarSign size={17} />
          <span>Financial Transactions</span>
        </button>
      </div>

      {/* ================= TAB 1: FLEET OVERVIEW ================= */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          <div className="qh-card">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '14px' }}>
              Vehicle Category Utilization & Volume
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {categories.map((c) => (
                <div
                  key={c.id}
                  style={{
                    background: '#0d1424',
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.8rem' }}>{c.image_icon}</span>
                    <div>
                      <strong style={{ fontSize: '0.95rem' }}>{c.name}</strong>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Capacity: {c.max_payload_kg} kg • Base Rate: ₹{c.base_fare}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-success">₹{c.per_km_rate}/km</span>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                      {c.commission_percent}% commission
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="qh-card">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '14px' }}>
              Platform Security & Trust Summary
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: '#0d1424', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--brand-primary)' }}>
                  Driver Verification Standards
                </span>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  All captains are required to hold commercial badge driving licenses and up-to-date fitness certificates. Unverified drivers cannot accept trips.
                </p>
              </div>

              <div style={{ background: '#0d1424', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--success)' }}>
                  Two-Stage OTP Handshake
                </span>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  QuickHaul protects high-value cargo with randomized 4-digit pickup loading codes and delivery completion codes.
                </p>
              </div>

              <div style={{ background: '#0d1424', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--info)' }}>
                  Automated Settlement Ledger
                </span>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  85% net fare is automatically credited to driver wallets upon OTP confirmation, while 15% platform commission is booked.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: DRIVER VERIFICATION DESK ================= */}
      {activeTab === 'drivers' && (
        <div className="qh-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Fleet Drivers & Document Verification</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setDriverFilter('')}
                className={`qh-btn qh-btn-sm ${!driverFilter ? 'qh-btn-primary' : 'qh-btn-secondary'}`}
              >
                All Drivers
              </button>
              <button
                onClick={() => setDriverFilter('pending')}
                className={`qh-btn qh-btn-sm ${driverFilter === 'pending' ? 'qh-btn-primary' : 'qh-btn-secondary'}`}
              >
                Pending Verification Only ⚠️
              </button>
            </div>
          </div>

          <div className="qh-table-wrap">
            <table className="qh-table">
              <thead>
                <tr>
                  <th>Driver</th>
                  <th>Vehicle & Plate</th>
                  <th>License Number</th>
                  <th>Trips / Rating</th>
                  <th>Verification Status</th>
                  <th>Online Status</th>
                  <th>Inspect & Review</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                          src={d.avatar_url || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'}
                          alt={d.name}
                          style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div>
                          <strong>{d.name}</strong>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{d.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>{d.vehicle_model}</div>
                      <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--brand-primary)' }}>
                        {d.vehicle_plate}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace' }}>{d.license_number}</td>
                    <td>
                      <span>{d.total_trips} trips</span>
                      <div style={{ color: '#fbbf24', fontSize: '0.78rem' }}>★ {d.rating_avg}</div>
                    </td>
                    <td>
                      <span className={`badge ${d.verification_status === 'approved' ? 'badge-success' : d.verification_status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                        {d.verification_status}
                      </span>
                    </td>
                    <td>
                      <span className={`status-dot ${d.is_online ? 'status-dot-online' : 'status-dot-offline'}`} />
                      <span style={{ fontSize: '0.75rem', marginLeft: '6px' }}>{d.is_online ? 'Online' : 'Offline'}</span>
                    </td>
                    <td>
                      <button
                        onClick={() => setSelectedDriverForDoc(d)}
                        className="qh-btn qh-btn-secondary qh-btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Eye size={14} /> Review Docs
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 3: BOOKINGS OVERSIGHT ================= */}
      {activeTab === 'bookings' && (
        <div className="qh-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Citywide Booking Dispatch & Trip Oversight</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Showing {bookings.length} total shipments across all vehicle categories and zones.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search trip no, customer, driver, address..."
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                style={{ width: '280px' }}
              />
              <button onClick={loadDashboardData} className="qh-btn qh-btn-secondary qh-btn-sm" title="Refresh bookings">
                <RefreshCw size={14} /> Refresh
              </button>
            </div>
          </div>

          {/* Status Filter Chips */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All Bookings', count: bookings.length },
              { id: 'requested', label: 'Pending Dispatch 🔔', count: bookings.filter(b => b.status === 'requested').length },
              { id: 'active', label: 'In Transit / Active 🚚', count: bookings.filter(b => ['accepted', 'arrived_pickup', 'goods_loaded', 'in_transit', 'arrived_drop'].includes(b.status)).length },
              { id: 'completed', label: 'Completed ✅', count: bookings.filter(b => b.status === 'completed').length },
              { id: 'cancelled', label: 'Cancelled ❌', count: bookings.filter(b => b.status === 'cancelled').length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setBookingStatusFilter(tab.id)}
                className={`qh-btn qh-btn-sm ${bookingStatusFilter === tab.id ? 'qh-btn-primary' : 'qh-btn-secondary'}`}
                style={{ borderRadius: 'var(--radius-full)', fontSize: '0.78rem' }}
              >
                <span>{tab.label}</span>
                <span style={{
                  background: bookingStatusFilter === tab.id ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.1)',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontSize: '0.72rem',
                  fontWeight: 800
                }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="qh-table-wrap">
            <table className="qh-table">
              <thead>
                <tr>
                  <th>Booking No</th>
                  <th>Customer</th>
                  <th>Driver</th>
                  <th>Vehicle</th>
                  <th>Pickup ➔ Drop</th>
                  <th>Fare</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const filtered = bookings.filter(b => {
                    // Status filter
                    if (bookingStatusFilter === 'requested' && b.status !== 'requested') return false;
                    if (bookingStatusFilter === 'active' && !['accepted', 'arrived_pickup', 'goods_loaded', 'in_transit', 'arrived_drop'].includes(b.status)) return false;
                    if (bookingStatusFilter === 'completed' && b.status !== 'completed') return false;
                    if (bookingStatusFilter === 'cancelled' && b.status !== 'cancelled') return false;

                    // Search filter
                    if (bookingSearch) {
                      const q = bookingSearch.toLowerCase();
                      const matchNo = b.booking_number?.toLowerCase().includes(q);
                      const matchCust = b.customer_name?.toLowerCase().includes(q);
                      const matchDriver = b.driver_name?.toLowerCase().includes(q);
                      const matchPickup = b.pickup_address?.toLowerCase().includes(q);
                      const matchDrop = b.drop_address?.toLowerCase().includes(q);
                      const matchGoods = b.goods_type?.toLowerCase().includes(q);
                      return matchNo || matchCust || matchDriver || matchPickup || matchDrop || matchGoods;
                    }
                    return true;
                  });

                  if (filtered.length === 0) {
                    return (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-dim)' }}>
                          <FileText size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                          <div>No bookings found matching filter "{bookingStatusFilter}".</div>
                          <button
                            onClick={() => { setBookingStatusFilter('all'); setBookingSearch(''); }}
                            className="qh-btn qh-btn-secondary qh-btn-sm"
                            style={{ marginTop: '10px' }}
                          >
                            Reset Filter
                          </button>
                        </td>
                      </tr>
                    );
                  }

                  return filtered.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <strong>{b.booking_number}</strong>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                          {new Date(b.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td>
                        <strong>{b.customer_name || 'Customer'}</strong>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{b.customer_phone || ''}</div>
                      </td>
                      <td>
                        {b.driver_name ? (
                          <div>
                            <strong>{b.driver_name}</strong>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                              {b.vehicle_plate || ''}
                            </div>
                          </div>
                        ) : (
                          <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: '1rem', marginRight: '4px' }}>{b.image_icon || '🚚'}</span>
                        <span>{b.category_name || 'Tempo'}</span>
                      </td>
                      <td style={{ maxWidth: '280px', fontSize: '0.78rem' }}>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          🟢 {b.pickup_address}
                        </div>
                        <div style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          🏁 {b.drop_address}
                        </div>
                      </td>
                      <td>
                        <strong>₹{b.total_fare}</strong>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                          Comm: ₹{b.platform_commission}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${b.status === 'completed' ? 'badge-success' : b.status === 'cancelled' ? 'badge-danger' : b.status === 'requested' ? 'badge-warning' : 'badge-info'}`}>
                          {b.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => setSelectedBookingDetail(b)}
                          className="qh-btn qh-btn-secondary qh-btn-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Eye size={13} /> Details
                        </button>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 4: USERS MANAGEMENT ================= */}
      {activeTab === 'users' && (
        <div className="qh-card">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px' }}>Platform User Directory</h3>
          <div className="qh-table-wrap">
            <table className="qh-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Joined Date</th>
                  <th>Account Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img
                          src={u.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt={u.name}
                          style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                        />
                        <div>
                          <strong>{u.name}</strong>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-purple' : u.role === 'driver' ? 'badge-info' : 'badge-warning'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>{u.phone || 'N/A'}</td>
                    <td>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${u.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td>
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleUser(u.id, u.status)}
                          className={`qh-btn qh-btn-sm ${u.status === 'active' ? 'qh-btn-danger' : 'qh-btn-success'}`}
                        >
                          {u.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 5: SUPPORT & DISPUTES ================= */}
      {activeTab === 'support' && (
        <div className="qh-card">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px' }}>Support Tickets & Dispute Center</h3>
          <div className="qh-table-wrap">
            <table className="qh-table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>User</th>
                  <th>Category</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Resolution Reply</th>
                </tr>
              </thead>
              <tbody>
                {supportTickets.map((t) => (
                  <tr key={t.id}>
                    <td><strong>{t.ticket_number}</strong></td>
                    <td>{t.user_name} ({t.user_role})</td>
                    <td>{t.category}</td>
                    <td>
                      <div>{t.subject}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{t.description}</div>
                    </td>
                    <td>
                      <span className={`badge ${t.status === 'resolved' ? 'badge-success' : 'badge-warning'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => { setSelectedTicket(t); setTicketReply(t.admin_response || ''); }}
                        className="qh-btn qh-btn-secondary qh-btn-sm"
                      >
                        <MessageSquare size={14} /> {t.admin_response ? 'View Reply' : 'Respond'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 6: PRICING CONFIGURATION ================= */}
      {activeTab === 'pricing' && (
        <div className="qh-card">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px' }}>
            Vehicle Fleet Fare Rates & Platform Commission
          </h3>
          <div className="qh-table-wrap">
            <table className="qh-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Base Fare (₹)</th>
                  <th>Base Km Incl</th>
                  <th>Per KM Rate (₹)</th>
                  <th>Helper Rate (₹)</th>
                  <th>Platform Take Rate (%)</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.image_icon} {c.name}</strong>
                    </td>
                    <td>₹{c.base_fare}</td>
                    <td>{c.base_km_included} km</td>
                    <td>₹{c.per_km_rate}/km</td>
                    <td>₹{c.helper_rate}</td>
                    <td>{c.commission_percent}%</td>
                    <td>
                      <button
                        onClick={() => setEditingCategory({ ...c })}
                        className="qh-btn qh-btn-secondary qh-btn-sm"
                      >
                        Edit Rate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 7: FINANCIAL LEDGER ================= */}
      {activeTab === 'ledger' && (
        <div className="qh-card">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px' }}>Financial Transactions Ledger</h3>
          <div className="qh-table-wrap">
            <table className="qh-table">
              <thead>
                <tr>
                  <th>Reference ID</th>
                  <th>Type</th>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td style={{ fontFamily: 'monospace' }}><strong>{tx.reference_id}</strong></td>
                    <td><span className="badge badge-info">{tx.type}</span></td>
                    <td>{tx.user_name}</td>
                    <td style={{ fontWeight: 700 }}>₹{tx.amount}</td>
                    <td>{tx.payment_method}</td>
                    <td><span className="badge badge-success">{tx.status}</span></td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{tx.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= DRIVER DOCS INSPECTION MODAL ================= */}
      {selectedDriverForDoc && (
        <div className="modal-overlay" onClick={() => setSelectedDriverForDoc(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.25rem' }}>Verify Driver: {selectedDriverForDoc.name}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {selectedDriverForDoc.vehicle_model} • Plate: {selectedDriverForDoc.vehicle_plate} • License: {selectedDriverForDoc.license_number}
                </span>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedDriverForDoc(null)}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', margin: '16px 0' }}>
              <div style={{ background: '#0a0e17', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Driving License (Commercial)</span>
                <img
                  src={selectedDriverForDoc.dl_document_url || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400'}
                  alt="DL"
                  style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '6px', marginTop: '6px' }}
                />
              </div>

              <div style={{ background: '#0a0e17', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Vehicle Registration (RC)</span>
                <img
                  src={selectedDriverForDoc.rc_document_url || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400'}
                  alt="RC"
                  style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '6px', marginTop: '6px' }}
                />
              </div>

              <div style={{ background: '#0a0e17', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Commercial Goods Insurance</span>
                <img
                  src={selectedDriverForDoc.insurance_document_url || 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=400'}
                  alt="Insurance"
                  style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '6px', marginTop: '6px' }}
                />
              </div>

              <div style={{ background: '#0a0e17', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>National ID / Aadhaar</span>
                <img
                  src={selectedDriverForDoc.id_document_url || 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400'}
                  alt="ID"
                  style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '6px', marginTop: '6px' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                Rejection Remarks (if rejecting):
              </label>
              <input
                type="text"
                placeholder="e.g. Blurry photo of driving license or vehicle RC expired"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => handleVerifyDriver(selectedDriverForDoc.id, 'reject')}
                className="qh-btn qh-btn-danger"
              >
                Reject Documents
              </button>
              <button
                onClick={() => handleVerifyDriver(selectedDriverForDoc.id, 'approve')}
                className="qh-btn qh-btn-success"
              >
                Approve Driver & Grant Online Access
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= TICKET RESOLUTION MODAL ================= */}
      {selectedTicket && (
        <div className="modal-overlay" onClick={() => setSelectedTicket(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem' }}>Ticket #{selectedTicket.ticket_number}</h3>
              <button className="modal-close-btn" onClick={() => setSelectedTicket(null)}>✕</button>
            </div>

            <div style={{ margin: '12px 0' }}>
              <strong>{selectedTicket.subject}</strong>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {selectedTicket.description}
              </p>
            </div>

            <form onSubmit={handleReplyTicket} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                  Admin Response & Resolution Note
                </label>
                <textarea
                  rows="4"
                  required
                  placeholder="Provide resolution details for customer / driver..."
                  value={ticketReply}
                  onChange={(e) => setTicketReply(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setSelectedTicket(null)} className="qh-btn qh-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="qh-btn qh-btn-primary">
                  Save & Resolve Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT PRICING MODAL ================= */}
      {editingCategory && (
        <div className="modal-overlay" onClick={() => setEditingCategory(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem' }}>Edit Rates: {editingCategory.name}</h3>
              <button className="modal-close-btn" onClick={() => setEditingCategory(null)}>✕</button>
            </div>

            <form onSubmit={handleSavePricing} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                  Base Fare (₹)
                </label>
                <input
                  type="number"
                  value={editingCategory.base_fare}
                  onChange={(e) => setEditingCategory({ ...editingCategory, base_fare: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                  Per KM Rate (₹)
                </label>
                <input
                  type="number"
                  value={editingCategory.per_km_rate}
                  onChange={(e) => setEditingCategory({ ...editingCategory, per_km_rate: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                  Helper / Loading Rate (₹)
                </label>
                <input
                  type="number"
                  value={editingCategory.helper_rate}
                  onChange={(e) => setEditingCategory({ ...editingCategory, helper_rate: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                  Platform Commission (%)
                </label>
                <input
                  type="number"
                  value={editingCategory.commission_percent}
                  onChange={(e) => setEditingCategory({ ...editingCategory, commission_percent: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setEditingCategory(null)} className="qh-btn qh-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="qh-btn qh-btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ================= TRIP DETAILS INSPECTION MODAL ================= */}
      {selectedBookingDetail && (
        <div className="modal-overlay" onClick={() => setSelectedBookingDetail(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.25rem' }}>Shipment #{selectedBookingDetail.booking_number}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Created on {new Date(selectedBookingDetail.created_at).toLocaleString()}
                </span>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedBookingDetail(null)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', margin: '14px 0' }}>
              {/* Status & Category */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0a0e17', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.4rem' }}>{selectedBookingDetail.image_icon || '🚚'}</span>
                  <div>
                    <strong>{selectedBookingDetail.category_name}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      Distance: {selectedBookingDetail.distance_km} km • Est: ~{selectedBookingDetail.estimated_duration_mins} mins
                    </div>
                  </div>
                </div>
                <span className={`badge ${selectedBookingDetail.status === 'completed' ? 'badge-success' : selectedBookingDetail.status === 'cancelled' ? 'badge-danger' : selectedBookingDetail.status === 'requested' ? 'badge-warning' : 'badge-info'}`}>
                  {selectedBookingDetail.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              {/* Route */}
              <div style={{ background: '#0d1424', padding: '14px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <span style={{ color: '#38bdf8', fontWeight: 700, fontSize: '0.78rem' }}>🟢 PICKUP LOCATION:</span>
                  <p style={{ marginTop: '2px', color: 'var(--text-main)' }}>{selectedBookingDetail.pickup_address}</p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Contact: {selectedBookingDetail.pickup_contact_name || selectedBookingDetail.customer_name} ({selectedBookingDetail.pickup_contact_phone || selectedBookingDetail.customer_phone})</span>
                </div>
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
                  <span style={{ color: '#f87171', fontWeight: 700, fontSize: '0.78rem' }}>🏁 DESTINATION DROP:</span>
                  <p style={{ marginTop: '2px', color: 'var(--text-main)' }}>{selectedBookingDetail.drop_address}</p>
                </div>
              </div>

              {/* Cargo & Security OTPs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: '#0a0e17', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Cargo Details</span>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: '4px' }}>{selectedBookingDetail.goods_type}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Weight: ~{selectedBookingDetail.approx_weight_kg || 250} kg</div>
                  {selectedBookingDetail.goods_description && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>"{selectedBookingDetail.goods_description}"</div>
                  )}
                </div>

                <div style={{ background: '#0a0e17', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Security Handshake Codes</span>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Pickup OTP:</span>
                      <div style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--brand-primary)', fontSize: '1.1rem' }}>
                        {selectedBookingDetail.pickup_otp || '----'}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Delivery OTP:</span>
                      <div style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--success)', fontSize: '1.1rem' }}>
                        {selectedBookingDetail.delivery_otp || '----'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div style={{ background: '#0a0e17', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Customer Gross Fare:</span>
                  <strong style={{ fontSize: '0.95rem' }}>₹{selectedBookingDetail.total_fare} ({selectedBookingDetail.payment_method})</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Driver Share (85% Net):</span>
                  <strong style={{ color: 'var(--success)' }}>₹{selectedBookingDetail.driver_earnings}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Platform Commission (15%):</span>
                  <strong style={{ color: 'var(--brand-primary)' }}>₹{selectedBookingDetail.platform_commission}</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setSelectedBookingDetail(null)} className="qh-btn qh-btn-primary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
