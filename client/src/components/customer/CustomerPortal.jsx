import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LeafletRouteMap } from '../common/LeafletRouteMap';
import {
  Truck, MapPin, Navigation, Package, DollarSign, Clock, Shield,
  CreditCard, CheckCircle2, AlertCircle, Phone, Star, FileText, Send, Sparkles, RefreshCw
} from 'lucide-react';

const PRESET_LOCATIONS = [
  { name: 'Koramangala 4th Block, 80ft Road', lat: 12.9352, lng: 77.6245 },
  { name: 'Electronic City Phase 1, Gate 6', lat: 12.8452, lng: 77.6602 },
  { name: 'Whitefield EPIP Zone, IT Park', lat: 12.9815, lng: 77.7289 },
  { name: 'Indiranagar 100ft Road, Metro', lat: 12.9719, lng: 77.6412 },
  { name: 'Peenya Industrial Area Stage 2', lat: 13.0298, lng: 77.5186 },
  { name: 'Yeshwanthpur Wholesale Market', lat: 13.0182, lng: 77.5463 },
  { name: 'HSR Layout Sector 2, 27th Main', lat: 12.9116, lng: 77.6389 },
];

const GOODS_CATEGORIES = [
  { label: 'Furniture & Household', icon: '🛋️' },
  { label: 'Electronics & Appliances', icon: '💻' },
  { label: 'Construction & Hardware', icon: '🧱' },
  { label: 'FMCG & Groceries', icon: '🥫' },
  { label: 'Commercial Machinery', icon: '⚙️' },
  { label: 'E-commerce Parcels', icon: '📦' },
];

export const CustomerPortal = () => {
  const { user, fetchNotifications } = useAuth();
  const [activeTab, setActiveTab] = useState('book'); // 'book' | 'track' | 'history' | 'support'

  // Categories & Fare
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [fareEstimate, setFareEstimate] = useState(null);
  const [loadingEstimate, setLoadingEstimate] = useState(false);

  // Booking Form State
  const [pickupAddress, setPickupAddress] = useState('Koramangala 4th Block, 80ft Road');
  const [pickupCoord, setPickupCoord] = useState({ lat: 12.9352, lng: 77.6245 });
  const [dropAddress, setDropAddress] = useState('Whitefield EPIP Zone, IT Park');
  const [dropCoord, setDropCoord] = useState({ lat: 12.9815, lng: 77.7289 });
  const [goodsType, setGoodsType] = useState('Electronics & Appliances');
  const [goodsDesc, setGoodsDesc] = useState('6 Fragile server units and network switch cartons');
  const [weightKg, setWeightKg] = useState(250);
  const [helperNeeded, setHelperNeeded] = useState(true);
  const [fragileHandling, setFragileHandling] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [promoCode, setPromoCode] = useState('');
  const [bookingInProgress, setBookingInProgress] = useState(false);

  // Active Tracking State
  const [activeBooking, setActiveBooking] = useState(null);
  const [trackingData, setTrackingData] = useState(null);

  // History & Invoices
  const [myBookings, setMyBookings] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [reviewModalBooking, setReviewModalBooking] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Support
  const [supportTickets, setSupportTickets] = useState([]);
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState('Delay/Driver Issue');
  const [newTicketDesc, setNewTicketDesc] = useState('');
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // Toast / Status Message
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load Categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await api.getCategories();
        setCategories(res.categories || []);
        if (res.categories?.length > 0) {
          const tataAce = res.categories.find(c => c.id === 'tata_ace') || res.categories[0];
          setSelectedCategory(tataAce);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    loadCategories();
  }, []);

  // Compute estimate whenever category, coords, helper or fragile changes
  useEffect(() => {
    if (!selectedCategory) return;
    const calc = async () => {
      setLoadingEstimate(true);
      try {
        const res = await api.estimateFare({
          category_id: selectedCategory.id,
          distance_km: calculateDistance(pickupCoord, dropCoord),
          helper_needed: helperNeeded,
          fragile_handling: fragileHandling,
          promo_code: promoCode
        });
        setFareEstimate(res.breakdown);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingEstimate(false);
      }
    };
    calc();
  }, [selectedCategory, pickupCoord, dropCoord, helperNeeded, fragileHandling, promoCode]);

  // Load customer bookings
  const loadBookings = async () => {
    try {
      const res = await api.getCustomerBookings('all');
      setMyBookings(res.bookings || []);
      // If there is an active booking, set it for tracking
      const active = (res.bookings || []).find(b => ['requested', 'accepted', 'arrived_pickup', 'goods_loaded', 'in_transit', 'arrived_drop'].includes(b.status));
      if (active) {
        setActiveBooking(active);
        loadTracking(active.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [user]);

  // Polling for live tracking if tracking tab is active
  const loadTracking = async (bookingId) => {
    try {
      const res = await api.getTracking(bookingId);
      setTrackingData(res);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    let interval = null;
    if (activeBooking && (activeTab === 'track' || activeTab === 'book')) {
      interval = setInterval(() => {
        loadTracking(activeBooking.id);
      }, 5000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [activeBooking, activeTab]);

  // Load support tickets
  const loadSupportTickets = async () => {
    try {
      const res = await api.getUserTickets();
      setSupportTickets(res.tickets || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'support') loadSupportTickets();
  }, [activeTab]);

  const calculateDistance = (p1, p2) => {
    const R = 6371;
    const dLat = (p2.lat - p1.lat) * (Math.PI / 180);
    const dLon = (p2.lng - p1.lng) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(p1.lat * (Math.PI / 180)) * Math.cos(p2.lat * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = +(R * c).toFixed(1);
    return dist < 1.0 ? 3.5 : dist;
  };

  // Submit new booking
  const handleCreateBooking = async () => {
    if (!selectedCategory) return;
    setBookingInProgress(true);
    try {
      const payload = {
        vehicle_category_id: selectedCategory.id,
        pickup_address: pickupAddress,
        pickup_lat: pickupCoord.lat,
        pickup_lng: pickupCoord.lng,
        drop_address: dropAddress,
        drop_lat: dropCoord.lat,
        drop_lng: dropCoord.lng,
        distance_km: calculateDistance(pickupCoord, dropCoord),
        goods_type: goodsType,
        goods_description: goodsDesc,
        approx_weight_kg: weightKg,
        helper_needed: helperNeeded ? 1 : 0,
        fragile_handling: fragileHandling ? 1 : 0,
        payment_method: paymentMethod,
        promo_code: promoCode
      };

      const res = await api.createBooking(payload);
      showToast(`Trip #${res.booking.booking_number} dispatched! Driver matching complete.`);
      setActiveBooking(res.booking);
      await loadTracking(res.booking.id);
      await loadBookings();
      fetchNotifications();
      setActiveTab('track');
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setBookingInProgress(false);
    }
  };

  // Cancel booking
  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await api.cancelBooking(bookingId, 'Customer requested cancellation');
      showToast('Booking cancelled.');
      await loadBookings();
      setActiveBooking(null);
    } catch (err) {
      showToast(`Cancel failed: ${err.message}`);
    }
  };

  // Submit Review
  const handleSubmitReview = async () => {
    if (!reviewModalBooking) return;
    setSubmittingReview(true);
    try {
      await api.addReview({
        booking_id: reviewModalBooking.id,
        rating: reviewRating,
        comment: reviewComment
      });
      showToast('Review submitted! Thank you.');
      setReviewModalBooking(null);
      setReviewComment('');
      loadBookings();
    } catch (err) {
      showToast(err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Submit Support Ticket
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!newTicketSubject || !newTicketDesc) return;
    setSubmittingTicket(true);
    try {
      await api.createTicket({
        subject: newTicketSubject,
        category: newTicketCategory,
        description: newTicketDesc,
        priority: 'medium'
      });
      showToast('Support ticket filed successfully.');
      setNewTicketSubject('');
      setNewTicketDesc('');
      loadSupportTickets();
    } catch (err) {
      showToast(err.message);
    } finally {
      setSubmittingTicket(false);
    }
  };

  return (
    <div className="main-content">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="toast-container">
          <div className="toast">
            <Sparkles size={18} color="var(--brand-primary)" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Customer Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Customer Logistics Desk</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Instant on-demand mini-truck, tempo, and small commercial vehicle booking across the city.
          </p>
        </div>

        {activeBooking && (
          <div
            onClick={() => setActiveTab('track')}
            style={{
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid var(--brand-primary)',
              borderRadius: 'var(--radius-full)',
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer'
            }}
          >
            <span className="status-dot status-dot-online" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--brand-primary)' }}>
              Active Trip #{activeBooking.booking_number} ({activeBooking.status.replace('_', ' ')})
            </span>
          </div>
        )}
      </div>

      {/* Sub Navigation Tabs */}
      <div className="subnav-tabs">
        <button
          className={`subnav-tab-btn ${activeTab === 'book' ? 'active' : ''}`}
          onClick={() => setActiveTab('book')}
        >
          <Package size={17} />
          <span>Book a Truck</span>
        </button>

        <button
          className={`subnav-tab-btn ${activeTab === 'track' ? 'active' : ''}`}
          onClick={() => setActiveTab('track')}
        >
          <Navigation size={17} />
          <span>Live Tracking {activeBooking && '🟢'}</span>
        </button>

        <button
          className={`subnav-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <FileText size={17} />
          <span>Shipment History & Invoices</span>
        </button>

        <button
          className={`subnav-tab-btn ${activeTab === 'support' ? 'active' : ''}`}
          onClick={() => setActiveTab('support')}
        >
          <Shield size={17} />
          <span>Help & Support</span>
        </button>
      </div>

      {/* ================= TAB 1: BOOK A TRUCK ================= */}
      {activeTab === 'book' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          {/* Left Column: Flow Inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Step 1: Locations */}
            <div className="qh-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <span className="badge badge-info">Step 1</span>
                <h3 style={{ fontSize: '1.1rem' }}>Pickup & Drop Addresses</h3>
              </div>

              {/* Pickup Address */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={15} color="#0284c7" /> Pickup Location
                </label>
                <input
                  type="text"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="Enter pickup warehouse, store, or residence address"
                />
                {/* Preset Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                  {PRESET_LOCATIONS.slice(0, 4).map((loc, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => { setPickupAddress(loc.name); setPickupCoord({ lat: loc.lat, lng: loc.lng }); }}
                      style={{
                        fontSize: '0.72rem',
                        padding: '3px 8px',
                        background: '#0d1424',
                        color: 'var(--text-muted)',
                        borderRadius: '12px',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      {loc.name.split(',')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Drop Address */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={15} color="#ef4444" /> Drop Destination
                </label>
                <input
                  type="text"
                  value={dropAddress}
                  onChange={(e) => setDropAddress(e.target.value)}
                  placeholder="Enter delivery destination address"
                />
                {/* Preset Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                  {PRESET_LOCATIONS.slice(2, 6).map((loc, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => { setDropAddress(loc.name); setDropCoord({ lat: loc.lat, lng: loc.lng }); }}
                      style={{
                        fontSize: '0.72rem',
                        padding: '3px 8px',
                        background: '#0d1424',
                        color: 'var(--text-muted)',
                        borderRadius: '12px',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      {loc.name.split(',')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 2: Vehicle Selection */}
            <div className="qh-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge badge-warning">Step 2</span>
                  <h3 style={{ fontSize: '1.1rem' }}>Choose Vehicle Category</h3>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Distance: <strong>{calculateDistance(pickupCoord, dropCoord)} km</strong>
                </span>
              </div>

              <div className="vehicle-grid">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className={`vehicle-card ${selectedCategory?.id === cat.id ? 'selected' : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat.badge && <span className="vehicle-badge-pill">{cat.badge}</span>}
                    <div className="vehicle-icon-large">{cat.image_icon || '🚚'}</div>
                    <div className="vehicle-title">{cat.name}</div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      {cat.tagline}
                    </p>

                    <div className="vehicle-spec-row">
                      <span>Max Payload:</span>
                      <strong>{cat.max_payload_kg} kg</strong>
                    </div>
                    <div className="vehicle-spec-row">
                      <span>Bed Size:</span>
                      <span>{cat.dimensions_feet}</span>
                    </div>
                    <div className="vehicle-spec-row">
                      <span>Base Rate:</span>
                      <span>₹{cat.base_fare} ({cat.base_km_included} km incl)</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                      <span className="vehicle-price-tag">₹{cat.per_km_rate}/km</span>
                      <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>
                        ● {cat.online_drivers_count || 3} nearby
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 3: Goods Details & Add-ons */}
            <div className="qh-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <span className="badge badge-purple">Step 3</span>
                <h3 style={{ fontSize: '1.1rem' }}>Goods & Cargo Details</h3>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>
                  Goods Category
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px' }}>
                  {GOODS_CATEGORIES.map((g, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setGoodsType(g.label)}
                      style={{
                        padding: '8px 10px',
                        background: goodsType === g.label ? 'rgba(245, 158, 11, 0.15)' : '#0d1424',
                        border: `1px solid ${goodsType === g.label ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: goodsType === g.label ? 'var(--brand-primary)' : 'var(--text-main)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        textAlign: 'left'
                      }}
                    >
                      <span>{g.icon}</span>
                      <span>{g.label.split('&')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                  Goods Description (Optional notes for driver)
                </label>
                <input
                  type="text"
                  value={goodsDesc}
                  onChange={(e) => setGoodsDesc(e.target.value)}
                  placeholder="e.g. 8 boxed items, requires rope tying, handle with care"
                />
              </div>

              {/* Weight Slider */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Approx Weight: <strong style={{ color: 'var(--text-main)' }}>{weightKg} kg</strong>
                  </label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--brand-primary)' }}>
                    (Vehicle limit: {selectedCategory?.max_payload_kg || 850} kg)
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max={selectedCategory?.max_payload_kg || 1500}
                  step="25"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                />
              </div>

              {/* Add-ons Toggles */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div
                  onClick={() => setHelperNeeded(!helperNeeded)}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    background: helperNeeded ? 'rgba(16, 185, 129, 0.1)' : '#0d1424',
                    border: `1px solid ${helperNeeded ? 'var(--success)' : 'var(--border-subtle)'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Helper / Labor</span>
                    <input type="checkbox" checked={helperNeeded} onChange={() => {}} />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Loading/unloading assistance (+₹{selectedCategory?.helper_rate || 200})
                  </span>
                </div>

                <div
                  onClick={() => setFragileHandling(!fragileHandling)}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    background: fragileHandling ? 'rgba(2, 132, 199, 0.1)' : '#0d1424',
                    border: `1px solid ${fragileHandling ? 'var(--info)' : 'var(--border-subtle)'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Fragile & Shield</span>
                    <input type="checkbox" checked={fragileHandling} onChange={() => {}} />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Corner protection & goods insurance (+₹50)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Route Map & Transparent Fare Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Interactive Leaflet Map */}
            <div className="qh-card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Route Visualization</span>
                <span className="badge badge-info">{calculateDistance(pickupCoord, dropCoord)} km City Route</span>
              </div>
              <LeafletRouteMap
                pickup={{ lat: pickupCoord.lat, lng: pickupCoord.lng, label: pickupAddress }}
                drop={{ lat: dropCoord.lat, lng: dropCoord.lng, label: dropAddress }}
                height="280px"
              />
            </div>

            {/* Transparent Fare Breakdown Card */}
            <div className="qh-card qh-card-elevated">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.2rem' }}>Transparent Fare Breakdown</h3>
                <span className="badge badge-success">No Hidden Fees</span>
              </div>

              {fareEstimate ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                    <span>Base Fare ({fareEstimate.base_km_included} km included)</span>
                    <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>₹{fareEstimate.base_fare.toFixed(2)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                    <span>Distance Charge ({fareEstimate.extra_km} extra km @ ₹{fareEstimate.per_km_rate}/km)</span>
                    <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>₹{fareEstimate.distance_fare.toFixed(2)}</span>
                  </div>

                  {fareEstimate.helper_fare > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                      <span>Loading Helper Charge</span>
                      <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>₹{fareEstimate.helper_fare.toFixed(2)}</span>
                    </div>
                  )}

                  {fareEstimate.fragile_fare > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                      <span>Fragile Cargo & Transit Insurance</span>
                      <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>₹{fareEstimate.fragile_fare.toFixed(2)}</span>
                    </div>
                  )}

                  {fareEstimate.discount_amount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#10b981' }}>
                      <span>Promotional Discount</span>
                      <span style={{ fontWeight: 700 }}>-₹{fareEstimate.discount_amount.toFixed(2)}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                    <span>GST (5% Intra-city Logistics Tax)</span>
                    <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>₹{fareEstimate.gst_tax.toFixed(2)}</span>
                  </div>

                  {/* Promo Code Input */}
                  <div style={{ display: 'flex', gap: '8px', margin: '8px 0' }}>
                    <input
                      type="text"
                      placeholder="Coupon (try QUICK50 or FIRSTHAUL)"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      style={{ fontSize: '0.85rem', textTransform: 'uppercase' }}
                    />
                    <button
                      type="button"
                      onClick={() => showToast(promoCode ? 'Coupon applied!' : 'Enter a promo code')}
                      className="qh-btn qh-btn-secondary qh-btn-sm"
                    >
                      Apply
                    </button>
                  </div>

                  {/* Divider */}
                  <div style={{ borderTop: '2px dashed var(--border-medium)', margin: '8px 0' }} />

                  {/* Total Fare */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div>
                      <span style={{ fontSize: '1rem', fontWeight: 800 }}>Total Estimated Fare</span>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        Est. Duration: ~{fareEstimate.estimated_duration_mins} mins
                      </div>
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--brand-primary)' }}>
                      ₹{fareEstimate.total_fare.toFixed(2)}
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div style={{ marginTop: '12px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                      Payment Mode
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                      {[
                        { id: 'upi', label: 'UPI / QR', icon: '⚡' },
                        { id: 'cash_on_delivery', label: 'Cash on Drop', icon: '💵' },
                        { id: 'card', label: 'Card', icon: '💳' },
                        { id: 'wallet', label: 'Wallet', icon: '👛' },
                      ].map((pm) => (
                        <button
                          key={pm.id}
                          type="button"
                          onClick={() => setPaymentMethod(pm.id)}
                          style={{
                            padding: '8px 4px',
                            background: paymentMethod === pm.id ? 'rgba(245, 158, 11, 0.2)' : '#0d1424',
                            border: `1px solid ${paymentMethod === pm.id ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            color: paymentMethod === pm.id ? 'var(--brand-primary)' : 'var(--text-main)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '2px'
                          }}
                        >
                          <span>{pm.icon}</span>
                          <span>{pm.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dispatch CTA */}
                  <button
                    type="button"
                    onClick={handleCreateBooking}
                    disabled={bookingInProgress}
                    className="qh-btn qh-btn-primary qh-btn-lg"
                    style={{ width: '100%', marginTop: '16px' }}
                  >
                    {bookingInProgress ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" />
                        <span>Matching Nearby Drivers...</span>
                      </>
                    ) : (
                      <>
                        <Truck size={20} />
                        <span>Confirm Booking & Dispatch {selectedCategory?.name.split(' ')[0]}</span>
                      </>
                    )}
                  </button>

                  <div style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    🔒 Secure 4-digit OTP generated for loading & delivery safety
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                  Calculating route & fare...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: LIVE TRIP TRACKING ================= */}
      {activeTab === 'track' && (
        <div>
          {activeBooking ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
              {/* Left Column: Live Map with Route Simulation */}
              <div className="qh-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                      Live Trip #{activeBooking.booking_number}
                    </h3>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {activeBooking.category_name || 'Commercial Vehicle'} • {activeBooking.distance_km} km
                    </span>
                  </div>

                  <span className={`badge ${activeBooking.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                    {activeBooking.status.toUpperCase().replace('_', ' ')}
                  </span>
                </div>

                <LeafletRouteMap
                  pickup={{ lat: activeBooking.pickup_lat, lng: activeBooking.pickup_lng, label: activeBooking.pickup_address }}
                  drop={{ lat: activeBooking.drop_lat, lng: activeBooking.drop_lng, label: activeBooking.drop_address }}
                  driverLoc={trackingData?.current_location}
                  tripStatus={activeBooking.status}
                  height="380px"
                />

                {/* Live Progress Bar */}
                <div style={{ marginTop: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                    <span>Transit Progress: <strong>{trackingData?.progress_percent || 30}%</strong></span>
                    <span style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>
                      ETA: ~{trackingData?.eta_minutes || 22} minutes
                    </span>
                  </div>
                  <div style={{ height: '8px', background: '#0d1424', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${trackingData?.progress_percent || 30}%`,
                        background: 'linear-gradient(90deg, #f59e0b, #10b981)',
                        transition: 'width 0.5s ease'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Driver Details & Secure OTPs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* OTP Security Verification Card */}
                <div className="qh-card" style={{ background: 'linear-gradient(135deg, #162032 0%, #1e293b 100%)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Shield size={20} color="var(--brand-primary)" />
                    <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>Trust & Safety Trip Codes</h4>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    Share these confidential 4-digit codes with your QuickHaul driver at pickup and delivery.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div style={{ background: '#0d1424', padding: '12px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                        Pickup Loading OTP
                      </span>
                      <div className="otp-display-box" style={{ justifyContent: 'center' }}>
                        {(activeBooking.pickup_otp || '4928').split('').map((d, i) => (
                          <div key={i} className="otp-digit">{d}</div>
                        ))}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Give to driver upon vehicle arrival
                      </span>
                    </div>

                    <div style={{ background: '#0d1424', padding: '12px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                        Delivery Completion OTP
                      </span>
                      <div className="otp-display-box" style={{ justifyContent: 'center' }}>
                        {(activeBooking.delivery_otp || '6175').split('').map((d, i) => (
                          <div key={i} className="otp-digit" style={{ borderColor: '#10b981', color: '#10b981' }}>{d}</div>
                        ))}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Recipient provides when goods unloaded
                      </span>
                    </div>
                  </div>
                </div>

                {/* Assigned Driver Profile Card */}
                <div className="qh-card">
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '14px' }}>
                    Assigned Driver & Vehicle
                  </h4>

                  {activeBooking.driver_name ? (
                    <div>
                      <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '16px' }}>
                        <img
                          src={activeBooking.driver_avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'}
                          alt={activeBooking.driver_name}
                          style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--brand-primary)' }}
                        />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <strong style={{ fontSize: '1.05rem' }}>{activeBooking.driver_name}</strong>
                            <span className="badge badge-success" style={{ padding: '2px 6px', fontSize: '0.65rem' }}>
                              Verified 🛡️
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#fbbf24' }}>
                              <Star size={13} fill="#fbbf24" /> {activeBooking.driver_rating || 4.9}
                            </span>
                            <span>• {activeBooking.driver_trips_count || 140} trips</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ background: '#0d1424', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Vehicle Model:</span>
                          <strong>{activeBooking.vehicle_model || 'Tata Ace Gold HT'}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '6px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Plate Number:</span>
                          <strong style={{ color: 'var(--brand-primary)', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                            {activeBooking.vehicle_plate || 'KA-01-MJ-4029'}
                          </strong>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px' }}>
                        <a
                          href={`tel:${activeBooking.driver_phone || '+919844077889'}`}
                          className="qh-btn qh-btn-secondary"
                          style={{ flex: 1 }}
                        >
                          <Phone size={16} />
                          <span>Call Driver</span>
                        </a>

                        <button
                          onClick={() => handleCancelBooking(activeBooking.id)}
                          className="qh-btn qh-btn-danger"
                          style={{ flex: 1 }}
                        >
                          Cancel Booking
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                      <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px' }} />
                      <p>Searching for nearby approved drivers in your zone...</p>
                    </div>
                  )}
                </div>

                {/* Trip Route Details Card */}
                <div className="qh-card">
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px' }}>Trip Summary</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-dim)' }}>Pickup:</span>
                      <p style={{ color: 'var(--text-main)', marginTop: '2px' }}>{activeBooking.pickup_address}</p>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-dim)' }}>Drop:</span>
                      <p style={{ color: 'var(--text-main)', marginTop: '2px' }}>{activeBooking.drop_address}</p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                      <span>Fare Amount:</span>
                      <strong style={{ color: 'var(--brand-primary)' }}>₹{activeBooking.total_fare} ({activeBooking.payment_method})</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="qh-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <Package size={48} color="var(--text-dim)" style={{ margin: '0 auto 16px' }} />
              <h3>No Active Trip Running</h3>
              <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '8px auto 20px' }}>
                You do not currently have an active shipment in transit. Select "Book a Truck" to dispatch a driver.
              </p>
              <button onClick={() => setActiveTab('book')} className="qh-btn qh-btn-primary">
                Book a Vehicle Now
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: SHIPMENT HISTORY & INVOICES ================= */}
      {activeTab === 'history' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>My Shipment History</h3>
            <button onClick={loadBookings} className="qh-btn qh-btn-secondary qh-btn-sm">
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          <div className="qh-table-wrap">
            <table className="qh-table">
              <thead>
                <tr>
                  <th>Booking No</th>
                  <th>Vehicle</th>
                  <th>Route (Pickup ➔ Drop)</th>
                  <th>Goods Type</th>
                  <th>Fare</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {myBookings.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)' }}>
                      No shipment bookings found.
                    </td>
                  </tr>
                ) : (
                  myBookings.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <strong>{b.booking_number}</strong>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                          {new Date(b.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '1.1rem' }}>{b.image_icon || '🚚'}</span>{' '}
                        <span>{b.category_name || 'Tempo'}</span>
                      </td>
                      <td style={{ maxWidth: '280px' }}>
                        <div style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          🟢 {b.pickup_address.split(',')[0]}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          🏁 {b.drop_address.split(',')[0]}
                        </div>
                      </td>
                      <td>{b.goods_type}</td>
                      <td>
                        <strong>₹{b.total_fare}</strong>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{b.payment_method}</div>
                      </td>
                      <td>
                        <span className={`badge ${b.status === 'completed' ? 'badge-success' : b.status === 'cancelled' ? 'badge-danger' : 'badge-warning'}`}>
                          {b.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => setSelectedInvoice(b)}
                            className="qh-btn qh-btn-secondary qh-btn-sm"
                            title="View Invoice"
                          >
                            <FileText size={14} />
                          </button>

                          {b.status === 'completed' && !b.review_rating && (
                            <button
                              onClick={() => setReviewModalBooking(b)}
                              className="qh-btn qh-btn-primary qh-btn-sm"
                              title="Rate Driver"
                            >
                              <Star size={14} />
                            </button>
                          )}

                          {['requested', 'accepted', 'in_transit'].includes(b.status) && (
                            <button
                              onClick={() => { setActiveBooking(b); setActiveTab('track'); }}
                              className="qh-btn qh-btn-outline qh-btn-sm"
                            >
                              Track
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 4: HELP & SUPPORT DESK ================= */}
      {activeTab === 'support' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          {/* File a Support Ticket */}
          <div className="qh-card">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '6px' }}>
              File a Support Ticket / Dispute
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Need assistance with fare billing, driver delays, or damaged cargo claim? Our operations desk responds swiftly.
            </p>

            <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                  Issue Category
                </label>
                <select value={newTicketCategory} onChange={(e) => setNewTicketCategory(e.target.value)}>
                  <option value="Delay/Driver Issue">Delay / Driver Unresponsive</option>
                  <option value="Billing & Fare Dispute">Billing & Fare Dispute</option>
                  <option value="Damaged Goods Claim">Damaged Goods / Insurance Claim</option>
                  <option value="App & Payment Bug">App & Payment Issue</option>
                  <option value="General Inquiry">Enterprise B2B / General Inquiry</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                  Subject / Summary
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Overcharged on distance or driver was late by 30 mins"
                  value={newTicketSubject}
                  onChange={(e) => setNewTicketSubject(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                  Detailed Description
                </label>
                <textarea
                  rows="4"
                  required
                  placeholder="Please describe what happened, including any relevant shipment or driver information..."
                  value={newTicketDesc}
                  onChange={(e) => setNewTicketDesc(e.target.value)}
                />
              </div>

              <button type="submit" disabled={submittingTicket} className="qh-btn qh-btn-primary">
                <Send size={16} />
                <span>{submittingTicket ? 'Submitting...' : 'Submit Support Ticket'}</span>
              </button>
            </form>
          </div>

          {/* Past Support Tickets */}
          <div className="qh-card">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '14px' }}>
              Your Support Tickets ({supportTickets.length})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {supportTickets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                  No open or resolved support inquiries.
                </div>
              ) : (
                supportTickets.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      background: '#0d1424',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>{t.ticket_number}: {t.subject}</span>
                      <span className={`badge ${t.status === 'resolved' ? 'badge-success' : t.status === 'in_progress' ? 'badge-warning' : 'badge-info'}`}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      Category: {t.category} • Filed: {new Date(t.created_at).toLocaleDateString()}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.description}</p>

                    {t.admin_response && (
                      <div style={{ background: 'rgba(245, 158, 11, 0.08)', borderLeft: '3px solid var(--brand-primary)', padding: '8px 12px', marginTop: '6px' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--brand-primary)', fontWeight: 700 }}>
                          Operations Desk Resolution:
                        </span>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-main)', marginTop: '2px' }}>
                          {t.admin_response}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= INVOICE MODAL ================= */}
      {selectedInvoice && (
        <div className="modal-overlay" onClick={() => setSelectedInvoice(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} color="var(--brand-primary)" />
                <h3 style={{ fontSize: '1.2rem' }}>QuickHaul Logistics Tax Invoice</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedInvoice(null)}>✕</button>
            </div>

            <div style={{ background: '#0a0e17', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', marginBottom: '12px' }}>
                <div>
                  <h4 style={{ color: 'var(--brand-primary)', fontSize: '1.1rem' }}>QuickHaul Technologies Pvt Ltd</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>GSTIN: 29AAACQ9824P1Z4</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Bangalore Central Logistics Hub</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>INVOICE: #{selectedInvoice.booking_number}</span>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    Date: {new Date(selectedInvoice.created_at).toLocaleDateString()}
                  </p>
                  <span className="badge badge-success" style={{ marginTop: '4px' }}>PAID</span>
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                <div><strong>Customer:</strong> {selectedInvoice.customer_name || user?.name}</div>
                <div><strong>Pickup:</strong> {selectedInvoice.pickup_address}</div>
                <div><strong>Drop:</strong> {selectedInvoice.drop_address}</div>
                <div><strong>Goods:</strong> {selectedInvoice.goods_type} ({selectedInvoice.approx_weight_kg || 150} kg)</div>
              </div>

              <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse', marginBottom: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-dim)' }}>
                    <th style={{ padding: '6px 0' }}>Description</th>
                    <th style={{ textAlign: 'right', padding: '6px 0' }}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '6px 0' }}>Base Vehicle Rate ({selectedInvoice.category_name})</td>
                    <td style={{ textAlign: 'right' }}>₹{selectedInvoice.base_fare?.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 0' }}>Distance Transport ({selectedInvoice.distance_km} km)</td>
                    <td style={{ textAlign: 'right' }}>₹{selectedInvoice.distance_fare?.toFixed(2)}</td>
                  </tr>
                  {selectedInvoice.helper_fare > 0 && (
                    <tr>
                      <td style={{ padding: '6px 0' }}>Loading / Helper Assistance</td>
                      <td style={{ textAlign: 'right' }}>₹{selectedInvoice.helper_fare?.toFixed(2)}</td>
                    </tr>
                  )}
                  {selectedInvoice.discount_amount > 0 && (
                    <tr style={{ color: '#10b981' }}>
                      <td style={{ padding: '6px 0' }}>Promo Discount</td>
                      <td style={{ textAlign: 'right' }}>-₹{selectedInvoice.discount_amount?.toFixed(2)}</td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ padding: '6px 0' }}>GST (5% Intra-State Goods Transport)</td>
                    <td style={{ textAlign: 'right' }}>₹{selectedInvoice.gst_tax?.toFixed(2)}</td>
                  </tr>
                  <tr style={{ borderTop: '2px solid var(--border-medium)', fontWeight: 800, fontSize: '0.95rem' }}>
                    <td style={{ padding: '10px 0' }}>Total Amount Paid</td>
                    <td style={{ textAlign: 'right', color: 'var(--brand-primary)' }}>₹{selectedInvoice.total_fare?.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => window.print()} className="qh-btn qh-btn-secondary">
                Print Invoice
              </button>
              <button onClick={() => setSelectedInvoice(null)} className="qh-btn qh-btn-primary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= REVIEW DRIVER MODAL ================= */}
      {reviewModalBooking && (
        <div className="modal-overlay" onClick={() => setReviewModalBooking(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem' }}>Rate Driver: {reviewModalBooking.driver_name || 'Driver'}</h3>
              <button className="modal-close-btn" onClick={() => setReviewModalBooking(null)}>✕</button>
            </div>

            <div style={{ textAlign: 'center', margin: '14px 0' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                How was your transport experience on Trip #{reviewModalBooking.booking_number}?
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '14px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    style={{ fontSize: '2rem', color: star <= reviewRating ? '#fbbf24' : '#475569' }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                Comments (Optional)
              </label>
              <textarea
                rows="3"
                placeholder="Mention driver punctuality, careful handling of cargo, or courteous service..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setReviewModalBooking(null)} className="qh-btn qh-btn-secondary">
                Cancel
              </button>
              <button onClick={handleSubmitReview} disabled={submittingReview} className="qh-btn qh-btn-primary">
                {submittingReview ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
