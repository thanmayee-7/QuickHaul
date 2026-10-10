import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LeafletRouteMap } from '../common/LeafletRouteMap';
import {
  Truck, Shield, Power, DollarSign, CheckCircle2, Clock, MapPin,
  Phone, AlertTriangle, ArrowRight, Wallet, Award, Star, RefreshCw, Send, FileCheck
} from 'lucide-react';

export const DriverPortal = () => {
  const { user, driverProfile, switchPersona, refreshUser, fetchNotifications } = useAuth();
  const [activeTab, setActiveTab] = useState('trips'); // 'trips' | 'earnings' | 'documents' | 'reviews'

  // Auto-align persona if entering Driver App with non-driver user
  useEffect(() => {
    if (user && user.role !== 'driver') {
      switchPersona('driver');
    }
  }, [user]);

  // Online / Offline status
  const [isOnline, setIsOnline] = useState(driverProfile?.is_online === 1);
  const [togglingOnline, setTogglingOnline] = useState(false);

  // Trips State
  const [driverBookings, setDriverBookings] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);
  const [loadingTrips, setLoadingTrips] = useState(false);

  // OTP Verification Modals
  const [otpModalMode, setOtpModalMode] = useState(null); // 'pickup' | 'delivery'
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [submittingStatus, setSubmittingStatus] = useState(false);

  // Earnings & Payout State
  const [earningsData, setEarningsData] = useState(null);
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('1000');
  const [payoutMethod, setPayoutMethod] = useState('upi');
  const [payoutAccount, setPayoutAccount] = useState('ramesh.driver@okhdfcbank');
  const [submittingPayout, setSubmittingPayout] = useState(false);

  // Document Management State
  const [dlUrl, setDlUrl] = useState(driverProfile?.dl_document_url || '');
  const [rcUrl, setRcUrl] = useState(driverProfile?.rc_document_url || '');
  const [insuranceUrl, setInsuranceUrl] = useState(driverProfile?.insurance_document_url || '');
  const [idUrl, setIdUrl] = useState(driverProfile?.id_document_url || '');
  const [updatingDocs, setUpdatingDocs] = useState(false);

  // Toast alert
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    if (driverProfile) {
      setIsOnline(driverProfile.is_online === 1);
      setDlUrl(driverProfile.dl_document_url || '');
      setRcUrl(driverProfile.rc_document_url || '');
      setInsuranceUrl(driverProfile.insurance_document_url || '');
      setIdUrl(driverProfile.id_document_url || '');
    }
  }, [driverProfile]);

  // Load driver bookings
  const loadDriverBookings = async () => {
    setLoadingTrips(true);
    try {
      const res = await api.getDriverBookings('all');
      setDriverBookings(res.bookings || []);
      const currentActive = (res.bookings || []).find(b =>
        ['accepted', 'arrived_pickup', 'goods_loaded', 'in_transit', 'arrived_drop'].includes(b.status)
      );
      setActiveTrip(currentActive || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTrips(false);
    }
  };

  // Load driver earnings
  const loadEarnings = async () => {
    try {
      const res = await api.getDriverEarnings();
      setEarningsData(res);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user?.role === 'driver') {
      loadDriverBookings();
      loadEarnings();
    }
  }, [user]);

  // Toggle online availability
  const handleToggleOnline = async () => {
    setTogglingOnline(true);
    try {
      const newStatus = !isOnline;
      await api.toggleOnline(newStatus);
      setIsOnline(newStatus);
      showToast(newStatus ? 'You are now ONLINE and ready for dispatch.' : 'You went OFFLINE.');
      refreshUser();
    } catch (err) {
      showToast(err.message);
    } finally {
      setTogglingOnline(false);
    }
  };

  // Accept booking
  const handleAcceptBooking = async (bookingId) => {
    try {
      const res = await api.acceptBooking(bookingId);
      showToast(`Trip #${res.booking.booking_number} accepted!`);
      setActiveTrip(res.booking);
      loadDriverBookings();
      fetchNotifications();
    } catch (err) {
      showToast(err.message);
    }
  };

  // Step progression in trip lifecycle
  const handleAdvanceTripStage = async (nextStatus) => {
    if (nextStatus === 'goods_loaded') {
      setOtpModalMode('pickup');
      setEnteredOtp('');
      setOtpError('');
      return;
    }
    if (nextStatus === 'completed') {
      setOtpModalMode('delivery');
      setEnteredOtp('');
      setOtpError('');
      return;
    }

    setSubmittingStatus(true);
    try {
      const res = await api.updateTripStatus(activeTrip.id, { status: nextStatus });
      showToast(`Trip stage: ${nextStatus.replace('_', ' ').toUpperCase()}`);
      setActiveTrip(res.booking);
      loadDriverBookings();
    } catch (err) {
      showToast(err.message);
    } finally {
      setSubmittingStatus(false);
    }
  };

  // Submit OTP for loading or delivery completion
  const handleVerifyOtp = async () => {
    if (!enteredOtp || enteredOtp.length !== 4) {
      setOtpError('Please enter a valid 4-digit OTP.');
      return;
    }
    setSubmittingStatus(true);
    setOtpError('');
    try {
      const targetStatus = otpModalMode === 'pickup' ? 'goods_loaded' : 'completed';
      const res = await api.updateTripStatus(activeTrip.id, {
        status: targetStatus,
        otp: enteredOtp.trim()
      });

      showToast(
        otpModalMode === 'pickup'
          ? 'Pickup verified! Goods loaded into vehicle.'
          : `Trip completed! ₹${res.booking.driver_earnings} credited to your wallet.`
      );

      setOtpModalMode(null);
      setEnteredOtp('');
      await loadDriverBookings();
      await loadEarnings();
      refreshUser();
      fetchNotifications();
    } catch (err) {
      setOtpError(err.message);
    } finally {
      setSubmittingStatus(false);
    }
  };

  // Payout request
  const handleRequestPayout = async (e) => {
    e.preventDefault();
    setSubmittingPayout(true);
    try {
      const res = await api.requestPayout({
        amount: Number(payoutAmount),
        payout_method: payoutMethod,
        account_details: payoutAccount
      });
      showToast(res.message);
      setPayoutModalOpen(false);
      loadEarnings();
      refreshUser();
    } catch (err) {
      showToast(err.message);
    } finally {
      setSubmittingPayout(false);
    }
  };

  // Update documents
  const handleUpdateDocuments = async (e) => {
    e.preventDefault();
    setUpdatingDocs(true);
    try {
      await api.updateDriverDocuments({
        dl_url: dlUrl,
        rc_url: rcUrl,
        insurance_url: insuranceUrl,
        id_url: idUrl
      });
      showToast('Documents submitted for review! Operations desk notified.');
      refreshUser();
    } catch (err) {
      showToast(err.message);
    } finally {
      setUpdatingDocs(false);
    }
  };

  const isVerified = driverProfile?.verification_status === 'approved';

  return (
    <div className="main-content">
      {/* Toast */}
      {toastMessage && (
        <div className="toast-container">
          <div className="toast">
            <CheckCircle2 size={18} color="var(--success)" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Driver Header Banner & Online Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img
            src={user?.avatar_url || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'}
            alt="Driver Profile"
            style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--success)' }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800 }}>Captain {user?.name || 'Driver'}</h2>
              {isVerified ? (
                <span className="badge badge-success">Verified Captain 🛡️</span>
              ) : (
                <span className="badge badge-warning">Verification: {driverProfile?.verification_status?.toUpperCase() || 'PENDING'}</span>
              )}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {driverProfile?.vehicle_model || 'Tata Ace Gold'} • Plate: <strong style={{ color: 'var(--brand-primary)', fontFamily: 'monospace' }}>{driverProfile?.vehicle_plate || 'KA-01-MJ-4029'}</strong>
            </div>
          </div>
        </div>

        {/* Online / Offline Toggle Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={handleToggleOnline}
            disabled={togglingOnline || !isVerified}
            className={`qh-btn ${isOnline ? 'qh-btn-success' : 'qh-btn-secondary'}`}
            style={{ padding: '12px 24px', fontSize: '1rem', fontWeight: 800, borderRadius: 'var(--radius-full)' }}
          >
            <Power size={18} />
            <span>{isOnline ? 'ONLINE & DISPATCHABLE' : 'GO ONLINE'}</span>
            <span className={`status-dot ${isOnline ? 'status-dot-online' : 'status-dot-offline'}`} />
          </button>
        </div>
      </div>

      {/* Verification Warning Notice if pending */}
      {!isVerified && (
        <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid var(--warning)', borderRadius: 'var(--radius-md)', padding: '14px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={24} color="var(--warning)" />
            <div>
              <strong style={{ fontSize: '0.95rem' }}>Driver Account Awaiting Admin Verification</strong>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Your commercial vehicle documents are under review. Once approved by the QuickHaul Admin desk, you can accept customer trips.
              </p>
            </div>
          </div>
          <button onClick={() => setActiveTab('documents')} className="qh-btn qh-btn-secondary qh-btn-sm">
            View Documents
          </button>
        </div>
      )}

      {/* Sub Navigation */}
      <div className="subnav-tabs">
        <button
          className={`subnav-tab-btn ${activeTab === 'trips' ? 'active' : ''}`}
          onClick={() => setActiveTab('trips')}
        >
          <Truck size={17} />
          <span>Active Trips & Requests {driverBookings.filter(b => b.status === 'requested').length > 0 && '🔔'}</span>
        </button>

        <button
          className={`subnav-tab-btn ${activeTab === 'earnings' ? 'active' : ''}`}
          onClick={() => setActiveTab('earnings')}
        >
          <DollarSign size={17} />
          <span>Earnings & Wallet (₹{driverProfile?.wallet_balance || 0})</span>
        </button>

        <button
          className={`subnav-tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          <FileCheck size={17} />
          <span>Vehicle Documents</span>
        </button>

        <button
          className={`subnav-tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          <Star size={17} />
          <span>Ratings & Performance (⭐ {driverProfile?.rating_avg || 4.9})</span>
        </button>
      </div>

      {/* ================= TAB 1: ACTIVE TRIPS & DISPATCH REQUESTS ================= */}
      {activeTab === 'trips' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          {/* Active Trip Workflow Panel (if currently on a trip) */}
          {activeTrip && (
            <div className="qh-card" style={{ gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <span className="badge badge-warning" style={{ marginBottom: '6px' }}>Current Active Mission</span>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Trip #{activeTrip.booking_number}</h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Customer: <strong>{activeTrip.customer_name || 'Alex Morgan'}</strong> • Net Earnings: <strong style={{ color: 'var(--success)' }}>₹{activeTrip.driver_earnings}</strong>
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className="badge badge-info">{activeTrip.status.replace('_', ' ').toUpperCase()}</span>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                    Payment: {activeTrip.payment_method?.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Interactive Map */}
              <LeafletRouteMap
                pickup={{ lat: activeTrip.pickup_lat, lng: activeTrip.pickup_lng, label: activeTrip.pickup_address }}
                drop={{ lat: activeTrip.drop_lat, lng: activeTrip.drop_lng, label: activeTrip.drop_address }}
                height="320px"
              />

              {/* Trip Lifecycle Workflow Actions */}
              <div style={{ background: '#0d1424', padding: '20px', borderRadius: 'var(--radius-lg)', marginTop: '20px', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '14px' }}>
                  Driver Mission Control (Advance Current Trip Stage):
                </h4>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {activeTrip.status === 'accepted' && (
                    <button
                      onClick={() => handleAdvanceTripStage('arrived_pickup')}
                      disabled={submittingStatus}
                      className="qh-btn qh-btn-primary"
                    >
                      <span>1. Confirm Arrived at Pickup</span>
                      <ArrowRight size={16} />
                    </button>
                  )}

                  {activeTrip.status === 'arrived_pickup' && (
                    <button
                      onClick={() => handleAdvanceTripStage('goods_loaded')}
                      disabled={submittingStatus}
                      className="qh-btn qh-btn-warning"
                    >
                      <Shield size={16} />
                      <span>2. Verify Customer Pickup OTP & Load Goods</span>
                    </button>
                  )}

                  {activeTrip.status === 'goods_loaded' && (
                    <button
                      onClick={() => handleAdvanceTripStage('in_transit')}
                      disabled={submittingStatus}
                      className="qh-btn qh-btn-primary"
                    >
                      <Truck size={16} />
                      <span>3. Start Transit to Destination</span>
                    </button>
                  )}

                  {activeTrip.status === 'in_transit' && (
                    <button
                      onClick={() => handleAdvanceTripStage('arrived_drop')}
                      disabled={submittingStatus}
                      className="qh-btn qh-btn-primary"
                    >
                      <MapPin size={16} />
                      <span>4. Arrived at Destination</span>
                    </button>
                  )}

                  {activeTrip.status === 'arrived_drop' && (
                    <button
                      onClick={() => handleAdvanceTripStage('completed')}
                      disabled={submittingStatus}
                      className="qh-btn qh-btn-success"
                    >
                      <CheckCircle2 size={16} />
                      <span>5. Verify Delivery OTP & Complete Trip</span>
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginTop: '16px' }}>
                  <div style={{ fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Pickup:</span>
                    <p style={{ color: 'var(--text-main)', marginTop: '2px' }}>{activeTrip.pickup_address}</p>
                  </div>
                  <div style={{ fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Drop:</span>
                    <p style={{ color: 'var(--text-main)', marginTop: '2px' }}>{activeTrip.drop_address}</p>
                  </div>
                  <div style={{ fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Cargo:</span>
                    <p style={{ color: 'var(--text-main)', marginTop: '2px' }}>{activeTrip.goods_type} ({activeTrip.approx_weight_kg || 150} kg)</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pending Dispatch Requests Radar (ALWAYS VISIBLE WITH RICH ENTRIES!) */}
          <div className="qh-card" style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="status-dot status-dot-online" />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                    Live Nearby Dispatch Radar ({driverBookings.filter(b => b.status === 'requested').length} Available Requests)
                  </h3>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Broadcasting real-time local customer cargo shipments within your operating zone.
                </p>
              </div>
              <button onClick={loadDriverBookings} className="qh-btn qh-btn-secondary qh-btn-sm">
                <RefreshCw size={14} /> Refresh Radar
              </button>
            </div>

            {driverBookings.filter(b => b.status === 'requested').length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
                <Truck size={42} color="var(--text-dim)" style={{ margin: '0 auto 12px' }} />
                <h4>No pending dispatch requests right now</h4>
                <p style={{ fontSize: '0.82rem', marginTop: '6px' }}>
                  Keep your status <strong>ONLINE</strong> to receive instant alerts when customers book a vehicle.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
                {driverBookings.filter(b => b.status === 'requested').map((req) => (
                  <div
                    key={req.id}
                    style={{
                      background: '#0d1424',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      boxShadow: 'var(--shadow-glow)',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="badge badge-warning" style={{ fontSize: '0.68rem' }}>
                          ⚡ FAST DISPATCH
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          {req.category_name || 'Commercial Vehicle'}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--success)' }}>
                          ₹{req.driver_earnings}
                        </span>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Net Driver Share</div>
                      </div>
                    </div>

                    <div style={{ background: '#080d18', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', display: 'flex', gap: '6px' }}>
                        <span style={{ color: '#38bdf8' }}>🟢</span>
                        <div>
                          <strong>Pickup:</strong> {req.pickup_address}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', gap: '6px' }}>
                        <span style={{ color: '#f87171' }}>🏁</span>
                        <div>
                          <strong>Drop:</strong> {req.drop_address}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
                      <span>📍 Distance: <strong>{req.distance_km} km</strong> (~{req.estimated_duration_mins}m)</span>
                      <span>📦 <strong>{req.goods_type}</strong> ({req.approx_weight_kg || 250} kg)</span>
                    </div>

                    <button
                      onClick={() => handleAcceptBooking(req.id)}
                      disabled={!isVerified}
                      className="qh-btn qh-btn-primary"
                      style={{ width: '100%', padding: '10px', fontWeight: 800 }}
                    >
                      {activeTrip ? 'Accept as Next Mission' : 'Accept Trip Dispatch Now 🚛'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: EARNINGS & WALLET ================= */}
      {activeTab === 'earnings' && (
        <div>
          {/* Metrics Grid */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-header">
                <span>Wallet Balance</span>
                <Wallet size={18} color="var(--brand-primary)" />
              </div>
              <div className="metric-value" style={{ color: 'var(--brand-primary)' }}>
                ₹{earningsData?.driver?.wallet_balance?.toFixed(2) || '4,250.00'}
              </div>
              <div className="metric-footer">
                <button
                  onClick={() => setPayoutModalOpen(true)}
                  className="qh-btn qh-btn-success qh-btn-sm"
                  style={{ width: '100%', marginTop: '6px' }}
                >
                  Withdraw / Payout
                </button>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span>Today's Earnings</span>
                <DollarSign size={18} color="var(--success)" />
              </div>
              <div className="metric-value">
                ₹{earningsData?.today?.earnings?.toFixed(2) || '0.00'}
              </div>
              <div className="metric-footer">
                <span>{earningsData?.today?.trips || 0} trips completed today</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span>Total Lifetime Earnings</span>
                <Award size={18} color="var(--purple)" />
              </div>
              <div className="metric-value">
                ₹{earningsData?.driver?.total_earnings?.toFixed(2) || '78,500.00'}
              </div>
              <div className="metric-footer">
                <span>Platform commission deducted at 15%</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span>Completed Trips</span>
                <CheckCircle2 size={18} color="var(--info)" />
              </div>
              <div className="metric-value">
                {earningsData?.driver?.total_trips || 189}
              </div>
              <div className="metric-footer">
                <span>Rating: ⭐ {earningsData?.driver?.rating_avg || 4.9}</span>
              </div>
            </div>
          </div>

          {/* Completed Trips Table */}
          <div className="qh-card">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px' }}>
              Completed Trips & Payout Ledger
            </h3>

            <div className="qh-table-wrap">
              <table className="qh-table">
                <thead>
                  <tr>
                    <th>Trip ID</th>
                    <th>Date</th>
                    <th>Distance</th>
                    <th>Customer Total</th>
                    <th>Commission (15%)</th>
                    <th>Net Driver Earning</th>
                    <th>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {(earningsData?.completed_trips || []).length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)' }}>
                        No completed trips yet.
                      </td>
                    </tr>
                  ) : (
                    earningsData?.completed_trips?.map((ct) => (
                      <tr key={ct.id}>
                        <td><strong>{ct.booking_number}</strong></td>
                        <td>{new Date(ct.completed_at || ct.created_at).toLocaleDateString()}</td>
                        <td>{ct.distance_km} km</td>
                        <td>₹{ct.total_fare}</td>
                        <td style={{ color: '#ef4444' }}>-₹{ct.platform_commission}</td>
                        <td style={{ color: '#10b981', fontWeight: 700 }}>+₹{ct.driver_earnings}</td>
                        <td><span className="badge badge-success">{ct.payment_method}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: VEHICLE & VERIFICATION DOCUMENTS ================= */}
      {activeTab === 'documents' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          <div className="qh-card">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '6px' }}>
              Commercial Vehicle & ID Documents
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
              QuickHaul verifies driver licenses and commercial vehicle registration certificates (RC) for customer trust and road safety.
            </p>

            <form onSubmit={handleUpdateDocuments} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                  Commercial Driving License (DL) URL / Doc
                </label>
                <input
                  type="text"
                  value={dlUrl}
                  onChange={(e) => setDlUrl(e.target.value)}
                  placeholder="https://... document preview link"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                  Vehicle RC (Registration Certificate) URL
                </label>
                <input
                  type="text"
                  value={rcUrl}
                  onChange={(e) => setRcUrl(e.target.value)}
                  placeholder="https://... vehicle RC link"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                  Commercial Goods Insurance Policy URL
                </label>
                <input
                  type="text"
                  value={insuranceUrl}
                  onChange={(e) => setInsuranceUrl(e.target.value)}
                  placeholder="https://... insurance policy link"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                  National ID (Aadhaar / Voter ID) URL
                </label>
                <input
                  type="text"
                  value={idUrl}
                  onChange={(e) => setIdUrl(e.target.value)}
                  placeholder="https://... national ID link"
                />
              </div>

              <button type="submit" disabled={updatingDocs} className="qh-btn qh-btn-primary">
                <Send size={16} />
                <span>{updatingDocs ? 'Submitting...' : 'Submit Documents for Verification'}</span>
              </button>
            </form>
          </div>

          {/* Document Previews Card */}
          <div className="qh-card">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '14px' }}>
              Submitted Document Records
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ background: '#0d1424', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Driving License</span>
                <img
                  src={dlUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400'}
                  alt="DL"
                  style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '6px', marginTop: '6px', border: '1px solid var(--border-subtle)' }}
                />
              </div>

              <div style={{ background: '#0d1424', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Vehicle RC</span>
                <img
                  src={rcUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400'}
                  alt="RC"
                  style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '6px', marginTop: '6px', border: '1px solid var(--border-subtle)' }}
                />
              </div>

              <div style={{ background: '#0d1424', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Commercial Insurance</span>
                <img
                  src={insuranceUrl || 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=400'}
                  alt="Insurance"
                  style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '6px', marginTop: '6px', border: '1px solid var(--border-subtle)' }}
                />
              </div>

              <div style={{ background: '#0d1424', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>National ID</span>
                <img
                  src={idUrl || 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400'}
                  alt="ID"
                  style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '6px', marginTop: '6px', border: '1px solid var(--border-subtle)' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: RATINGS & REVIEWS ================= */}
      {activeTab === 'reviews' && (
        <div className="qh-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center', background: '#0d1424', padding: '20px 30px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fbbf24' }}>
                {driverProfile?.rating_avg || 4.92}
              </div>
              <div style={{ color: '#fbbf24', fontSize: '1.2rem', marginBottom: '4px' }}>★★★★★</div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Based on {driverProfile?.rating_count || 142} verified customer reviews
              </span>
            </div>

            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>Captain Performance Score</h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Maintain high ratings by arriving promptly at pickup, securing cargo with ropes/straps, and confirming OTPs safely.
              </p>
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <span className="badge badge-success">Punctuality: 98%</span>
                <span className="badge badge-info">Zero Damage: 99.4%</span>
                <span className="badge badge-purple">Polite Service: 100%</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: '#0d1424', padding: '14px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <strong>Alex Morgan (Electronics Wholesale)</strong>
                <span style={{ color: '#fbbf24' }}>★★★★★</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                "Outstanding service by Ramesh! Arrived right on time at Koramangala, strapped the IT server cartons securely, and delivered without a scratch. Highly recommended!"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================= OTP VERIFICATION MODAL ================= */}
      {otpModalMode && (
        <div className="modal-overlay" onClick={() => setOtpModalMode(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', textAlign: 'center' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem' }}>
                {otpModalMode === 'pickup' ? 'Enter Customer Pickup OTP' : 'Enter Recipient Delivery OTP'}
              </h3>
              <button className="modal-close-btn" onClick={() => setOtpModalMode(null)}>✕</button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '14px 0' }}>
              {otpModalMode === 'pickup'
                ? 'Ask the customer at the pickup point for their 4-digit security code before loading goods.'
                : 'Ask the recipient at the drop point for their 4-digit completion code to finalize delivery and receive earnings.'}
            </p>

            <div style={{ margin: '16px 0' }}>
              <input
                type="text"
                maxLength={4}
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value)}
                placeholder="4-digit OTP"
                style={{
                  fontSize: '2rem',
                  letterSpacing: '0.4em',
                  textAlign: 'center',
                  fontFamily: 'monospace',
                  width: '200px',
                  margin: '0 auto',
                  padding: '10px'
                }}
              />
            </div>

            {otpError && (
              <div style={{ color: 'var(--danger)', fontSize: '0.82rem', marginBottom: '12px' }}>
                {otpError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button onClick={() => setOtpModalMode(null)} className="qh-btn qh-btn-secondary">
                Cancel
              </button>
              <button onClick={handleVerifyOtp} disabled={submittingStatus} className="qh-btn qh-btn-primary">
                {submittingStatus ? 'Verifying...' : 'Verify & Continue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= INSTANT PAYOUT MODAL ================= */}
      {payoutModalOpen && (
        <div className="modal-overlay" onClick={() => setPayoutModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem' }}>Instant Driver Wallet Payout</h3>
              <button className="modal-close-btn" onClick={() => setPayoutModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleRequestPayout} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                  Available Wallet Balance: <strong style={{ color: 'var(--success)' }}>₹{earningsData?.driver?.wallet_balance || 4250}</strong>
                </label>
                <input
                  type="number"
                  min="500"
                  max={earningsData?.driver?.wallet_balance || 4250}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="Amount to withdraw"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                  Payout Transfer Method
                </label>
                <select value={payoutMethod} onChange={(e) => setPayoutMethod(e.target.value)}>
                  <option value="upi">Instant UPI (VPA)</option>
                  <option value="bank_transfer">IMPS Bank Account</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                  Account / UPI Details
                </label>
                <input
                  type="text"
                  value={payoutAccount}
                  onChange={(e) => setPayoutAccount(e.target.value)}
                  placeholder="e.g. driver@upi or A/C 9182746152 / IFSC HDFC000182"
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setPayoutModalOpen(false)} className="qh-btn qh-btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submittingPayout} className="qh-btn qh-btn-success">
                  {submittingPayout ? 'Processing...' : `Transfer ₹${payoutAmount}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
