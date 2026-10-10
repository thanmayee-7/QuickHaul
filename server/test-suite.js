const assert = require('assert');

const BASE_URL = 'http://localhost:5000/api';

const runTests = async () => {
  console.log('====================================================');
  console.log('🧪 QuickHaul Production Platform Automated Test Suite');
  console.log('====================================================');

  let passed = 0;
  let failed = 0;

  const test = async (name, fn) => {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${name}`, err.message);
      failed++;
    }
  };

  // 1. Health
  await test('1. System Health Check', async () => {
    const res = await fetch(`${BASE_URL}/health`).then(r => r.json());
    assert.strictEqual(res.status, 'healthy');
    assert.strictEqual(res.platform, 'QuickHaul API Gateway');
  });

  // 2. Categories
  let tataAceCategory = null;
  await test('2. Vehicle Categories List', async () => {
    const res = await fetch(`${BASE_URL}/vehicles/categories`).then(r => r.json());
    assert(Array.isArray(res.categories));
    assert(res.categories.length >= 5);
    tataAceCategory = res.categories.find(c => c.id === 'tata_ace');
    assert(tataAceCategory !== undefined);
    assert.strictEqual(tataAceCategory.name, 'Tata Ace (Chota Hathi)');
  });

  // 3. Fare Estimation
  await test('3. Transparent Fare Estimation Math', async () => {
    const payload = {
      category_id: 'tata_ace',
      distance_km: 15.0,
      helper_needed: true,
      fragile_handling: true,
      promo_code: 'QUICK50'
    };
    const res = await fetch(`${BASE_URL}/vehicles/estimate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(r => r.json());

    assert(res.breakdown !== undefined);
    assert(res.breakdown.total_fare > 0);
    assert(res.breakdown.driver_earnings > 0);
    assert(res.breakdown.platform_commission > 0);
    assert(res.breakdown.discount_amount > 0);
    console.log(`   Estimated Fare for 15km Tata Ace with Helper & Insurance: ₹${res.breakdown.total_fare} (Driver takes: ₹${res.breakdown.driver_earnings}, QuickHaul fee: ₹${res.breakdown.platform_commission})`);
  });

  // 4. Customer Login
  let customerToken = null;
  let customerUser = null;
  await test('4. Customer Authentication (Alex Morgan)', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'customer@quickhaul.com', password: 'pass123' })
    }).then(r => r.json());

    assert(res.token !== undefined);
    assert.strictEqual(res.user.role, 'customer');
    customerToken = res.token;
    customerUser = res.user;
  });

  // 5. Driver Login
  let driverToken = null;
  let driverProfile = null;
  await test('5. Driver Authentication (Ramesh Kumar)', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ramesh.driver@quickhaul.com', password: 'pass123' })
    }).then(r => r.json());

    assert(res.token !== undefined);
    assert.strictEqual(res.user.role, 'driver');
    assert(res.driverProfile !== null);
    driverToken = res.token;
    driverProfile = res.driverProfile;
  });

  // 6. Admin Login
  let adminToken = null;
  await test('6. Operations Admin Authentication', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@quickhaul.com', password: 'admin123' })
    }).then(r => r.json());

    assert(res.token !== undefined);
    assert.strictEqual(res.user.role, 'admin');
    adminToken = res.token;
  });

  // 7. Create End-to-End Booking
  let newBooking = null;
  await test('7. Customer Creates Booking & Smart Driver Matching', async () => {
    const payload = {
      vehicle_category_id: 'tata_ace',
      pickup_address: 'Indiranagar 100ft Road, Bengaluru',
      pickup_lat: 12.9719,
      pickup_lng: 77.6412,
      drop_address: 'Koramangala 4th Block, Bengaluru',
      drop_lat: 12.9352,
      drop_lng: 77.6245,
      distance_km: 7.5,
      goods_type: 'Electronics & Appliances',
      goods_description: 'High-end audio equipment in padded flight cases',
      approx_weight_kg: 280,
      helper_needed: 1,
      fragile_handling: 1,
      payment_method: 'upi'
    };

    const res = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`
      },
      body: JSON.stringify(payload)
    }).then(r => r.json());

    assert(res.booking !== undefined);
    assert(res.booking.booking_number.startsWith('QH-'));
    assert(res.booking.pickup_otp.length === 4);
    assert(res.booking.delivery_otp.length === 4);
    assert(res.booking.total_fare > 0);
    newBooking = res.booking;
    console.log(`   Created Booking: ${newBooking.booking_number} | Pickup OTP: ${newBooking.pickup_otp} | Delivery OTP: ${newBooking.delivery_otp}`);
  });

  // 8. Live Tracking
  await test('8. Telematics Live Tracking & Waypoints', async () => {
    const res = await fetch(`${BASE_URL}/bookings/${newBooking.id}/tracking`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    }).then(r => r.json());

    assert.strictEqual(res.booking_id, newBooking.id);
    assert(res.current_location.lat !== undefined);
    assert(res.progress_percent >= 0);
    assert(res.eta_minutes > 0);
  });

  // 9. Driver Trip Lifecycle (Stage progression & OTP validation)
  await test('9. Driver Trip Workflow Lifecycle with Two-Stage OTP Validation', async () => {
    // 9a. Confirm arrived at pickup
    const r1 = await fetch(`${BASE_URL}/bookings/${newBooking.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`
      },
      body: JSON.stringify({ status: 'arrived_pickup' })
    }).then(r => r.json());
    assert.strictEqual(r1.booking.status, 'arrived_pickup');

    // 9b. Verify Pickup OTP & load goods
    const r2 = await fetch(`${BASE_URL}/bookings/${newBooking.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`
      },
      body: JSON.stringify({ status: 'goods_loaded', otp: newBooking.pickup_otp })
    }).then(r => r.json());
    assert.strictEqual(r2.booking.status, 'goods_loaded');

    // 9c. Start transit
    const r3 = await fetch(`${BASE_URL}/bookings/${newBooking.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`
      },
      body: JSON.stringify({ status: 'in_transit' })
    }).then(r => r.json());
    assert.strictEqual(r3.booking.status, 'in_transit');

    // 9d. Arrived at drop
    const r4 = await fetch(`${BASE_URL}/bookings/${newBooking.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`
      },
      body: JSON.stringify({ status: 'arrived_drop' })
    }).then(r => r.json());
    assert.strictEqual(r4.booking.status, 'arrived_drop');

    // 9e. Verify Delivery OTP & Complete Trip
    const r5 = await fetch(`${BASE_URL}/bookings/${newBooking.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`
      },
      body: JSON.stringify({ status: 'completed', otp: newBooking.delivery_otp })
    }).then(r => r.json());
    assert.strictEqual(r5.booking.status, 'completed');
    assert.strictEqual(r5.booking.payment_status, 'paid');
    console.log(`   Trip ${newBooking.booking_number} fully completed and ledger finalized.`);
  });

  // 10. Driver Wallet Credit & Payout
  await test('10. Driver Wallet Settlement & Instant Payout', async () => {
    const earningsRes = await fetch(`${BASE_URL}/driver/earnings`, {
      headers: { Authorization: `Bearer ${driverToken}` }
    }).then(r => r.json());

    assert(earningsRes.driver.wallet_balance > 0);
    console.log(`   Driver Wallet Balance after Trip: ₹${earningsRes.driver.wallet_balance}`);

    // Request payout
    const payoutRes = await fetch(`${BASE_URL}/driver/payout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`
      },
      body: JSON.stringify({
        amount: 500.0,
        payout_method: 'upi',
        account_details: 'ramesh.driver@okhdfcbank'
      })
    }).then(r => r.json());

    assert(payoutRes.reference_id.startsWith('PAYOUT-'));
    console.log(`   Payout of ₹500 Processed! Ref: ${payoutRes.reference_id}`);
  });

  // 11. Customer Rating
  await test('11. Customer Rating & Driver Score Update', async () => {
    const reviewRes = await fetch(`${BASE_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        booking_id: newBooking.id,
        rating: 5,
        comment: 'Super fast delivery and handled fragile audio equipment with extreme care.'
      })
    }).then(r => r.json());

    assert.strictEqual(reviewRes.review.rating, 5);
    assert(reviewRes.new_driver_rating >= 4.0);
    console.log(`   Driver Rating updated to: ⭐ ${reviewRes.new_driver_rating}`);
  });

  // 12. Support Ticket Flow
  let ticketId = null;
  await test('12. Support & Dispute Ticket Submission and Admin Resolution', async () => {
    const ticketRes = await fetch(`${BASE_URL}/support/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        subject: 'Weekly recurring business haulage rate inquiry',
        category: 'General Inquiry',
        description: 'Need 4 dedicated Tata Ace tempos every Tuesday morning for distribution.',
        priority: 'medium'
      })
    }).then(r => r.json());

    assert(ticketRes.ticket.ticket_number.startsWith('QH-TKT-'));
    ticketId = ticketRes.ticket.id;

    // Admin resolves ticket
    const resolveRes = await fetch(`${BASE_URL}/support/tickets/${ticketId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        status: 'resolved',
        admin_response: 'Our enterprise business desk will assign 4 dedicated fleet tempos with corporate billing.'
      })
    }).then(r => r.json());

    assert.strictEqual(resolveRes.ticket.status, 'resolved');
    assert(resolveRes.ticket.admin_response !== null);
  });

  // 13. Admin Operations & Driver Document Verification
  await test('13. Admin Driver Verification Review', async () => {
    let pendingDrivers = await fetch(`${BASE_URL}/admin/drivers?status=pending`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    }).then(r => r.json());

    let targetDriver = null;
    if (pendingDrivers.drivers && pendingDrivers.drivers.length > 0) {
      targetDriver = pendingDrivers.drivers[0];
    } else {
      // Fetch all drivers and pick the last one
      const allDrivers = await fetch(`${BASE_URL}/admin/drivers`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      }).then(r => r.json());
      targetDriver = allDrivers.drivers[allDrivers.drivers.length - 1];
    }

    assert(targetDriver !== undefined && targetDriver !== null);

    // Approve driver
    const verifyRes = await fetch(`${BASE_URL}/admin/drivers/${targetDriver.id}/verify`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ action: 'approve' })
    }).then(r => r.json());

    assert.strictEqual(verifyRes.driver.verification_status, 'approved');
    assert.strictEqual(verifyRes.driver.is_verified, 1);
    console.log(`   Driver ${targetDriver.name} approved and granted online dispatch access!`);
  });

  // 14. Admin KPIs
  await test('14. Admin Operations KPIs & Platform Financials', async () => {
    const statsRes = await fetch(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    }).then(r => r.json());

    assert(statsRes.metrics.total_gmv > 0);
    assert(statsRes.metrics.total_platform_commission > 0);
    assert(statsRes.metrics.completed_bookings >= 2);
    console.log(`   Platform Financial Overview:`);
    console.log(`     Total GMV: ₹${statsRes.metrics.total_gmv}`);
    console.log(`     Platform Commission Earned: ₹${statsRes.metrics.total_platform_commission}`);
    console.log(`     Completed Bookings: ${statsRes.metrics.completed_bookings}`);
  });

  console.log('====================================================');
  console.log(`🏁 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
  else process.exit(0);
};

runTests();
