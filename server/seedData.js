const bcrypt = require('bcryptjs');
const { runAsync, getAsync, allAsync } = require('./db');

const seedDatabase = async () => {
  console.log('Verifying QuickHaul database entries and enriching startup dataset...');

  const passwordHash = await bcrypt.hash('pass123', 10);
  const adminPasswordHash = await bcrypt.hash('admin123', 10);

  // 1. Vehicle Categories
  const categories = [
      {
        id: '3wheeler',
        name: '3-Wheeler Cargo (Ape / Piaggio)',
        tagline: 'Best for compact loads & narrow city lanes',
        badge: 'City Agile',
        max_payload_kg: 500,
        dimensions_feet: '5.5 x 4.0 x 4.2 ft',
        volume_cuft: 92,
        base_fare: 199.00,
        base_km_included: 1.0,
        per_km_rate: 22.00,
        helper_rate: 150.00,
        commission_percent: 15.0,
        image_icon: '🛺',
        popular_use: 'Boxes, Small Home Appliances, Groceries, Cartons'
      },
      {
        id: 'tata_ace',
        name: 'Tata Ace (Chota Hathi)',
        tagline: 'India’s most trusted workhorse for medium cargo',
        badge: 'Most Popular',
        max_payload_kg: 850,
        dimensions_feet: '7.0 x 4.8 x 4.8 ft',
        volume_cuft: 160,
        base_fare: 299.00,
        base_km_included: 1.0,
        per_km_rate: 28.00,
        helper_rate: 200.00,
        commission_percent: 15.0,
        image_icon: '🚚',
        popular_use: '1BHK Furniture, Heavy Appliances, Commercial Supplies'
      },
      {
        id: 'e_loader',
        name: 'Eco-Loader (Electric EV)',
        tagline: 'Zero emissions, silent & cost-effective green cargo',
        badge: '100% Electric',
        max_payload_kg: 600,
        dimensions_feet: '6.0 x 4.2 x 4.5 ft',
        volume_cuft: 110,
        base_fare: 179.00,
        base_km_included: 1.0,
        per_km_rate: 20.00,
        helper_rate: 150.00,
        commission_percent: 12.0,
        image_icon: '⚡',
        popular_use: 'Eco Deliveries, E-commerce Parcels, Lightweight Cargo'
      },
      {
        id: 'bolero_pickup',
        name: 'Bolero Maxi Truck Plus',
        tagline: 'High torque & long bed for commercial payloads',
        badge: 'Heavy Duty',
        max_payload_kg: 1500,
        dimensions_feet: '8.5 x 5.5 x 5.5 ft',
        volume_cuft: 257,
        base_fare: 499.00,
        base_km_included: 2.0,
        per_km_rate: 36.00,
        helper_rate: 300.00,
        commission_percent: 15.0,
        image_icon: '🚛',
        popular_use: '2BHK Shifting, Plywood, Construction Goods, Machinery'
      },
      {
        id: 'tata_407',
        name: 'Tata 407 (14 Ft Closed Container)',
        tagline: 'Large volume weather-proof container for industrial cargo',
        badge: 'Mega Fleet',
        max_payload_kg: 2500,
        dimensions_feet: '14.0 x 6.5 x 7.0 ft',
        volume_cuft: 637,
        base_fare: 899.00,
        base_km_included: 3.0,
        per_km_rate: 48.00,
        helper_rate: 450.00,
        commission_percent: 18.0,
        image_icon: '🏢',
        popular_use: 'Full Home Shifting, Palletized Goods, Factory Logistics'
      }
    ];

    for (const cat of categories) {
      await runAsync(`
        INSERT OR REPLACE INTO vehicle_categories (
          id, name, tagline, badge, max_payload_kg, dimensions_feet, volume_cuft,
          base_fare, base_km_included, per_km_rate, helper_rate, commission_percent, image_icon, popular_use
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        cat.id, cat.name, cat.tagline, cat.badge, cat.max_payload_kg, cat.dimensions_feet, cat.volume_cuft,
        cat.base_fare, cat.base_km_included, cat.per_km_rate, cat.helper_rate, cat.commission_percent, cat.image_icon, cat.popular_use
      ]);
    }

  // 2. Users (Admin, Customers, Drivers)
  const users = [
      {
        id: 'usr_admin_01',
        name: 'QuickHaul Operations Dispatch',
        email: 'admin@quickhaul.com',
        phone: '+91 98450 11223',
        password_hash: adminPasswordHash,
        role: 'admin',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        status: 'active'
      },
      {
        id: 'usr_cust_01',
        name: 'Alex Morgan',
        email: 'customer@quickhaul.com',
        phone: '+91 98860 33445',
        password_hash: passwordHash,
        role: 'customer',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        status: 'active'
      },
      {
        id: 'usr_cust_02',
        name: 'Priya Sundaram',
        email: 'priya@quickhaul.com',
        phone: '+91 97410 55667',
        password_hash: passwordHash,
        role: 'customer',
        avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        status: 'active'
      },
      {
        id: 'usr_cust_03',
        name: 'Rajesh Hardware Supplies',
        email: 'rajesh.hardware@gmail.com',
        phone: '+91 98441 55220',
        password_hash: passwordHash,
        role: 'customer',
        avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        status: 'active'
      },
      {
        id: 'usr_cust_04',
        name: 'Apex Modular Interiors',
        email: 'apex.interiors@gmail.com',
        phone: '+91 96200 44119',
        password_hash: passwordHash,
        role: 'customer',
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        status: 'active'
      },
      {
        id: 'usr_drv_01',
        name: 'Ramesh Kumar',
        email: 'ramesh.driver@quickhaul.com',
        phone: '+91 98440 77889',
        password_hash: passwordHash,
        role: 'driver',
        avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        status: 'active'
      },
      {
        id: 'usr_drv_02',
        name: 'Suresh Patel',
        email: 'suresh.driver@quickhaul.com',
        phone: '+91 96200 88990',
        password_hash: passwordHash,
        role: 'driver',
        avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
        status: 'active'
      },
      {
        id: 'usr_drv_03',
        name: 'Anita Sharma',
        email: 'anita.driver@quickhaul.com',
        phone: '+91 98110 44332',
        password_hash: passwordHash,
        role: 'driver',
        avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        status: 'active'
      },
      {
        id: 'usr_drv_04',
        name: 'Vikram Singh',
        email: 'vikram.driver@quickhaul.com',
        phone: '+91 99000 66778',
        password_hash: passwordHash,
        role: 'driver',
        avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
        status: 'active'
      }
    ];

    for (const u of users) {
      await runAsync(`
        INSERT INTO users (id, name, email, phone, password_hash, role, avatar_url, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          email = excluded.email,
          phone = excluded.phone,
          password_hash = excluded.password_hash,
          role = excluded.role,
          avatar_url = excluded.avatar_url,
          status = excluded.status
      `, [u.id, u.name, u.email, u.phone, u.password_hash, u.role, u.avatar_url, u.status]);
    }

    // Drivers
    const drivers = [
      {
        id: 'drv_01',
        user_id: 'usr_drv_01',
        license_number: 'DL-04-2015-008291',
        vehicle_category_id: 'tata_ace',
        vehicle_model: 'Tata Ace Gold HT Plus (Diesel)',
        vehicle_plate: 'KA-01-MJ-4029',
        experience_years: 6,
        is_online: 1,
        is_verified: 1,
        verification_status: 'approved',
        current_lat: 12.9719,
        current_lng: 77.6412,
        current_area: 'Indiranagar 100ft Road',
        rating_avg: 4.92,
        rating_count: 142,
        total_trips: 189,
        wallet_balance: 4250.00,
        total_earnings: 78500.00,
        dl_document_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
        rc_document_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
        insurance_document_url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80',
        id_document_url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80'
      },
      {
        id: 'drv_02',
        user_id: 'usr_drv_02',
        license_number: 'DL-05-2018-004312',
        vehicle_category_id: 'bolero_pickup',
        vehicle_model: 'Mahindra Bolero Maxi Truck Plus',
        vehicle_plate: 'KA-04-AK-8192',
        experience_years: 5,
        is_online: 1,
        is_verified: 1,
        verification_status: 'approved',
        current_lat: 12.9279,
        current_lng: 77.6271,
        current_area: 'Koramangala 4th Block Hub',
        rating_avg: 4.86,
        rating_count: 88,
        total_trips: 112,
        wallet_balance: 3120.00,
        total_earnings: 64100.00,
        dl_document_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
        rc_document_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
        insurance_document_url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80',
        id_document_url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80'
      },
      {
        id: 'drv_03',
        user_id: 'usr_drv_03',
        license_number: 'DL-03-2017-009124',
        vehicle_category_id: '3wheeler',
        vehicle_model: 'Piaggio Ape Xtra LDX',
        vehicle_plate: 'KA-03-ET-1920',
        experience_years: 4,
        is_online: 1,
        is_verified: 1,
        verification_status: 'approved',
        current_lat: 12.9352,
        current_lng: 77.6245,
        current_area: 'BTM Layout 2nd Stage',
        rating_avg: 4.95,
        rating_count: 210,
        total_trips: 264,
        wallet_balance: 5600.00,
        total_earnings: 92300.00,
        dl_document_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
        rc_document_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
        insurance_document_url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80',
        id_document_url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80'
      },
      {
        id: 'drv_04',
        user_id: 'usr_drv_04',
        license_number: 'DL-07-2021-001928',
        vehicle_category_id: 'tata_407',
        vehicle_model: 'Tata 407 SFC 29 WB Container',
        vehicle_plate: 'KA-05-NB-5541',
        experience_years: 7,
        is_online: 0,
        is_verified: 0,
        verification_status: 'pending',
        current_lat: 12.9982,
        current_lng: 77.5530,
        current_area: 'Rajajinagar Industrial Area',
        rating_avg: 4.80,
        rating_count: 12,
        total_trips: 15,
        wallet_balance: 800.00,
        total_earnings: 14200.00,
        dl_document_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
        rc_document_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
        insurance_document_url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80',
        id_document_url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
        rejection_reason: null
      }
    ];

    for (const d of drivers) {
      await runAsync(`
        INSERT INTO drivers (
          id, user_id, license_number, vehicle_category_id, vehicle_model, vehicle_plate,
          experience_years, is_online, is_verified, verification_status, current_lat, current_lng,
          current_area, rating_avg, rating_count, total_trips, wallet_balance, total_earnings,
          dl_document_url, rc_document_url, insurance_document_url, id_document_url, rejection_reason
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          user_id = excluded.user_id,
          license_number = excluded.license_number,
          vehicle_category_id = excluded.vehicle_category_id,
          vehicle_model = excluded.vehicle_model,
          vehicle_plate = excluded.vehicle_plate,
          experience_years = excluded.experience_years,
          is_online = excluded.is_online,
          is_verified = excluded.is_verified,
          verification_status = excluded.verification_status,
          current_lat = excluded.current_lat,
          current_lng = excluded.current_lng,
          current_area = excluded.current_area,
          rating_avg = excluded.rating_avg,
          rating_count = excluded.rating_count,
          total_trips = excluded.total_trips,
          wallet_balance = excluded.wallet_balance,
          total_earnings = excluded.total_earnings,
          dl_document_url = excluded.dl_document_url,
          rc_document_url = excluded.rc_document_url,
          insurance_document_url = excluded.insurance_document_url,
          id_document_url = excluded.id_document_url,
          rejection_reason = excluded.rejection_reason
      `, [
        d.id, d.user_id, d.license_number, d.vehicle_category_id, d.vehicle_model, d.vehicle_plate,
        d.experience_years, d.is_online, d.is_verified, d.verification_status, d.current_lat, d.current_lng,
        d.current_area, d.rating_avg, d.rating_count, d.total_trips, d.wallet_balance, d.total_earnings,
        d.dl_document_url, d.rc_document_url, d.insurance_document_url, d.id_document_url, d.rejection_reason
      ]);
    }

  // 3. Comprehensive Bookings, Transactions, Reviews & Support Tickets
  console.log('Seeding & refreshing comprehensive startup bookings (16+ entries across pending requests, in transit, completed)...');

  const richBookings = [
      // --- PENDING DISPATCH REQUESTS (Available in Driver App "Nearby Dispatch Requests"!) ---
      {
        id: 'bk_req_01',
        booking_number: 'QH-4101',
        customer_id: 'usr_cust_01',
        driver_id: null,
        vehicle_category_id: 'tata_ace',
        pickup_address: 'Peenya Industrial Area Stage 2, Near 4th Cross Hub, Bengaluru',
        pickup_lat: 13.0298,
        pickup_lng: 77.5186,
        pickup_contact_name: 'Precision Engineering Works',
        pickup_contact_phone: '+91 98450 88219',
        drop_address: 'Yeshwanthpur Wholesale Market, APMC Yard Gate 3, Bengaluru',
        drop_lat: 13.0182,
        drop_lng: 77.5463,
        distance_km: 4.8,
        estimated_duration_mins: 20,
        goods_type: 'Construction & Hardware',
        goods_description: 'Industrial Bearings, Brass Valves, and Machine Parts in 6 crates',
        approx_weight_kg: 420,
        helper_needed: 1,
        fragile_handling: 0,
        base_fare: 299.00,
        distance_fare: 106.40,
        helper_fare: 200.00,
        gst_tax: 30.27,
        discount_amount: 0.0,
        total_fare: 635.67,
        driver_earnings: 540.32,
        platform_commission: 95.35,
        payment_method: 'upi',
        payment_status: 'pending',
        status: 'requested',
        pickup_otp: '6129',
        delivery_otp: '8492',
        created_at: new Date(Date.now() - 300000).toISOString()
      },
      {
        id: 'bk_req_02',
        booking_number: 'QH-4102',
        customer_id: 'usr_cust_02',
        driver_id: null,
        vehicle_category_id: 'tata_ace',
        pickup_address: 'Koramangala 5th Block, Jyoti Nivas College Road, Bengaluru',
        pickup_lat: 12.9348,
        pickup_lng: 77.6189,
        pickup_contact_name: 'Priya Sundaram (Retail)',
        pickup_contact_phone: '+91 97410 55667',
        drop_address: 'Indiranagar 100ft Road, Near Metro Pillar 84, Bengaluru',
        drop_lat: 12.9719,
        drop_lng: 77.6412,
        distance_km: 6.5,
        estimated_duration_mins: 25,
        goods_type: 'Furniture & Household',
        goods_description: '2 Teakwood Study Desks and 4 Cushioned Armchairs',
        approx_weight_kg: 280,
        helper_needed: 1,
        fragile_handling: 1,
        base_fare: 299.00,
        distance_fare: 154.00,
        helper_fare: 200.00,
        gst_tax: 35.15,
        discount_amount: 0.0,
        total_fare: 738.15,
        driver_earnings: 627.43,
        platform_commission: 110.72,
        payment_method: 'cash_on_delivery',
        payment_status: 'pending',
        status: 'requested',
        pickup_otp: '7318',
        delivery_otp: '4209',
        created_at: new Date(Date.now() - 600000).toISOString()
      },
      {
        id: 'bk_req_03',
        booking_number: 'QH-4103',
        customer_id: 'usr_cust_03',
        driver_id: null,
        vehicle_category_id: 'bolero_pickup',
        pickup_address: 'Chickpet Wholesale Market, Mamulpet Main Road, Bengaluru',
        pickup_lat: 12.9701,
        pickup_lng: 77.5752,
        pickup_contact_name: 'Rajesh Hardware Supplies',
        pickup_contact_phone: '+91 98441 55220',
        drop_address: 'Commercial Street, Tasker Town, Shivajinagar, Bengaluru',
        drop_lat: 12.9822,
        drop_lng: 77.6083,
        distance_km: 5.2,
        estimated_duration_mins: 22,
        goods_type: 'Commercial Machinery',
        goods_description: 'Heavy duty copper wire spools and hardware tools',
        approx_weight_kg: 850,
        helper_needed: 1,
        fragile_handling: 0,
        base_fare: 499.00,
        distance_fare: 115.20,
        helper_fare: 300.00,
        gst_tax: 45.71,
        discount_amount: 0.0,
        total_fare: 959.91,
        driver_earnings: 815.92,
        platform_commission: 143.99,
        payment_method: 'card',
        payment_status: 'pending',
        status: 'requested',
        pickup_otp: '3157',
        delivery_otp: '9840',
        created_at: new Date(Date.now() - 900000).toISOString()
      },
      {
        id: 'bk_req_04',
        booking_number: 'QH-4104',
        customer_id: 'usr_cust_04',
        driver_id: null,
        vehicle_category_id: '3wheeler',
        pickup_address: 'KR Market Vegetable Yard, Kalasipalya, Bengaluru',
        pickup_lat: 12.9620,
        pickup_lng: 77.5780,
        pickup_contact_name: 'Metro Daily Groceries Depot',
        pickup_contact_phone: '+91 96200 44119',
        drop_address: 'Hebbal Flyover Depot, Bellary Road, Bengaluru',
        drop_lat: 13.0358,
        drop_lng: 77.5970,
        distance_km: 9.8,
        estimated_duration_mins: 32,
        goods_type: 'FMCG & Groceries',
        goods_description: '18 Plastic Crates farm fresh organic vegetables',
        approx_weight_kg: 340,
        helper_needed: 0,
        fragile_handling: 0,
        base_fare: 199.00,
        distance_fare: 193.60,
        helper_fare: 0.0,
        gst_tax: 19.63,
        discount_amount: 0.0,
        total_fare: 412.23,
        driver_earnings: 350.40,
        platform_commission: 61.83,
        payment_method: 'upi',
        payment_status: 'pending',
        status: 'requested',
        pickup_otp: '4481',
        delivery_otp: '7723',
        created_at: new Date(Date.now() - 1200000).toISOString()
      },
      {
        id: 'bk_req_05',
        booking_number: 'QH-4105',
        customer_id: 'usr_cust_01',
        driver_id: null,
        vehicle_category_id: 'e_loader',
        pickup_address: 'BTM Layout 2nd Stage, 7th Main, Bengaluru',
        pickup_lat: 12.9165,
        pickup_lng: 77.6101,
        pickup_contact_name: 'Alex Morgan',
        pickup_contact_phone: '+91 98860 33445',
        drop_address: 'HSR Layout Sector 1, 19th Main Road, Bengaluru',
        drop_lat: 12.9116,
        drop_lng: 77.6389,
        distance_km: 3.8,
        estimated_duration_mins: 16,
        goods_type: 'E-commerce Parcels',
        goods_description: '14 Assorted e-commerce delivery boxes and bubble packs',
        approx_weight_kg: 140,
        helper_needed: 0,
        fragile_handling: 1,
        base_fare: 179.00,
        distance_fare: 56.00,
        helper_fare: 0.0,
        gst_tax: 14.25,
        discount_amount: 0.0,
        total_fare: 299.25,
        driver_earnings: 263.34,
        platform_commission: 35.91,
        payment_method: 'upi',
        payment_status: 'pending',
        status: 'requested',
        pickup_otp: '9102',
        delivery_otp: '3349',
        created_at: new Date(Date.now() - 1500000).toISOString()
      },

      // --- IN-TRANSIT & ACTIVE MISSIONS ---
      {
        id: 'bk_act_01',
        booking_number: 'QH-2041',
        customer_id: 'usr_cust_01',
        driver_id: 'drv_01',
        vehicle_category_id: 'tata_ace',
        pickup_address: 'Electronic City Phase 1, Near Infosys Gate 6, Bengaluru',
        pickup_lat: 12.8452,
        pickup_lng: 77.6602,
        pickup_contact_name: 'Alex Morgan',
        pickup_contact_phone: '+91 98860 33445',
        drop_address: 'HSR Layout Sector 2, 27th Main Road, Bengaluru',
        drop_lat: 12.9116,
        drop_lng: 77.6389,
        distance_km: 11.8,
        estimated_duration_mins: 34,
        goods_type: 'Furniture & Household',
        goods_description: 'Modular Office Desks, 4 Ergonomic Chairs, and Conference Table sections',
        approx_weight_kg: 680,
        helper_needed: 1,
        fragile_handling: 0,
        base_fare: 299.00,
        distance_fare: 302.40,
        helper_fare: 200.00,
        gst_tax: 40.07,
        discount_amount: 0.0,
        total_fare: 841.47,
        driver_earnings: 715.25,
        platform_commission: 126.22,
        payment_method: 'card',
        payment_status: 'paid',
        status: 'in_transit',
        pickup_otp: '4928',
        delivery_otp: '6175',
        created_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'bk_act_02',
        booking_number: 'QH-2042',
        customer_id: 'usr_cust_03',
        driver_id: 'drv_02',
        vehicle_category_id: 'bolero_pickup',
        pickup_address: 'Bommasandra Industrial Area, Hosur Road, Bengaluru',
        pickup_lat: 12.8170,
        pickup_lng: 77.6850,
        pickup_contact_name: 'Rajesh Hardware Supplies',
        pickup_contact_phone: '+91 98441 55220',
        drop_address: 'Bannerghatta Main Road, Arekere Junction, Bengaluru',
        drop_lat: 12.8890,
        drop_lng: 77.5980,
        distance_km: 14.2,
        estimated_duration_mins: 38,
        goods_type: 'Construction & Hardware',
        goods_description: 'Plumbing PVC pipes, sanitary fittings and ceramic tiles',
        approx_weight_kg: 1100,
        helper_needed: 1,
        fragile_handling: 1,
        base_fare: 499.00,
        distance_fare: 439.20,
        helper_fare: 300.00,
        gst_tax: 64.41,
        discount_amount: 0.0,
        total_fare: 1352.61,
        driver_earnings: 1149.72,
        platform_commission: 202.89,
        payment_method: 'upi',
        payment_status: 'pending',
        status: 'goods_loaded',
        pickup_otp: '5812',
        delivery_otp: '2904',
        created_at: new Date(Date.now() - 4800000).toISOString()
      },
      {
        id: 'bk_act_03',
        booking_number: 'QH-2043',
        customer_id: 'usr_cust_02',
        driver_id: 'drv_03',
        vehicle_category_id: '3wheeler',
        pickup_address: 'Commercial Street, Shivajinagar, Bengaluru',
        pickup_lat: 12.9822,
        pickup_lng: 77.6083,
        pickup_contact_name: 'Priya Sundaram',
        pickup_contact_phone: '+91 97410 55667',
        drop_address: 'Malleshwaram 8th Cross, Sampige Road, Bengaluru',
        drop_lat: 13.0068,
        drop_lng: 77.5713,
        distance_km: 6.2,
        estimated_duration_mins: 22,
        goods_type: 'FMCG & Groceries',
        goods_description: '15 Boxes organic dry fruits and retail gift packages',
        approx_weight_kg: 180,
        helper_needed: 0,
        fragile_handling: 0,
        base_fare: 199.00,
        distance_fare: 114.40,
        helper_fare: 0.0,
        gst_tax: 15.67,
        discount_amount: 0.0,
        total_fare: 329.07,
        driver_earnings: 279.71,
        platform_commission: 49.36,
        payment_method: 'cash_on_delivery',
        payment_status: 'pending',
        status: 'arrived_pickup',
        pickup_otp: '8520',
        delivery_otp: '1439',
        created_at: new Date(Date.now() - 2400000).toISOString()
      },

      // --- COMPLETED SHIPMENTS WITH REAL AUDITED INVOICES & RATINGS ---
      {
        id: 'bk_cmp_01',
        booking_number: 'QH-1082',
        customer_id: 'usr_cust_01',
        driver_id: 'drv_01',
        vehicle_category_id: 'tata_ace',
        pickup_address: 'Koramangala 4th Block, 80 Feet Road, Bengaluru',
        pickup_lat: 12.9352,
        pickup_lng: 77.6245,
        pickup_contact_name: 'Alex Morgan',
        pickup_contact_phone: '+91 98860 33445',
        drop_address: 'EPIP Zone, Whitefield, Near SAP Labs Tech Park, Bengaluru',
        drop_lat: 12.9815,
        drop_lng: 77.7289,
        distance_km: 15.4,
        estimated_duration_mins: 42,
        goods_type: 'Electronics & Appliances',
        goods_description: '8 Sealed Master Cartons with IT hardware and fragile labels',
        approx_weight_kg: 320,
        helper_needed: 1,
        fragile_handling: 1,
        base_fare: 299.00,
        distance_fare: 403.20,
        helper_fare: 200.00,
        gst_tax: 45.11,
        discount_amount: 50.00,
        total_fare: 897.31,
        driver_earnings: 762.71,
        platform_commission: 134.60,
        payment_method: 'upi',
        payment_status: 'paid',
        status: 'completed',
        pickup_otp: '3819',
        delivery_otp: '7241',
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        completed_at: new Date(Date.now() - 86400000 * 3 + 3600000).toISOString()
      },
      {
        id: 'bk_cmp_02',
        booking_number: 'QH-1083',
        customer_id: 'usr_cust_02',
        driver_id: 'drv_03',
        vehicle_category_id: '3wheeler',
        pickup_address: 'Jayanagar 4th Block Complex, 11th Main, Bengaluru',
        pickup_lat: 12.9299,
        pickup_lng: 77.5834,
        pickup_contact_name: 'Priya Sundaram',
        pickup_contact_phone: '+91 97410 55667',
        drop_address: 'Gandhi Bazaar Main Road, Basavanagudi, Bengaluru',
        drop_lat: 12.9430,
        drop_lng: 77.5690,
        distance_km: 3.5,
        estimated_duration_mins: 15,
        goods_type: 'FMCG & Groceries',
        goods_description: '10 Sacks premium Basmati rice and confectionery cartons',
        approx_weight_kg: 250,
        helper_needed: 1,
        fragile_handling: 0,
        base_fare: 199.00,
        distance_fare: 55.00,
        helper_fare: 150.00,
        gst_tax: 20.20,
        discount_amount: 0.0,
        total_fare: 424.20,
        driver_earnings: 360.57,
        platform_commission: 63.63,
        payment_method: 'upi',
        payment_status: 'paid',
        status: 'completed',
        pickup_otp: '1849',
        delivery_otp: '6201',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        completed_at: new Date(Date.now() - 86400000 * 2 + 2400000).toISOString()
      },
      {
        id: 'bk_cmp_03',
        booking_number: 'QH-1084',
        customer_id: 'usr_cust_04',
        driver_id: 'drv_02',
        vehicle_category_id: 'bolero_pickup',
        pickup_address: 'Marathahalli Ring Road, Innovative Multiplex, Bengaluru',
        pickup_lat: 12.9560,
        pickup_lng: 77.7010,
        pickup_contact_name: 'Apex Modular Interiors',
        pickup_contact_phone: '+91 96200 44119',
        drop_address: 'Bellandur EcoSpace Business Park, Campus 2B, Bengaluru',
        drop_lat: 12.9260,
        drop_lng: 77.6830,
        distance_km: 5.6,
        estimated_duration_mins: 22,
        goods_type: 'Furniture & Household',
        goods_description: 'Office partition glass screens and wooden laminates',
        approx_weight_kg: 920,
        helper_needed: 1,
        fragile_handling: 1,
        base_fare: 499.00,
        distance_fare: 129.60,
        helper_fare: 300.00,
        gst_tax: 48.93,
        discount_amount: 0.0,
        total_fare: 1027.53,
        driver_earnings: 873.40,
        platform_commission: 154.13,
        payment_method: 'card',
        payment_status: 'paid',
        status: 'completed',
        pickup_otp: '9923',
        delivery_otp: '5510',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        completed_at: new Date(Date.now() - 86400000 * 2 + 3000000).toISOString()
      },
      {
        id: 'bk_cmp_04',
        booking_number: 'QH-1085',
        customer_id: 'usr_cust_01',
        driver_id: 'drv_01',
        vehicle_category_id: 'tata_ace',
        pickup_address: 'Domlur Inner Ring Road, Dell Building, Bengaluru',
        pickup_lat: 12.9610,
        pickup_lng: 77.6390,
        pickup_contact_name: 'Alex Morgan',
        pickup_contact_phone: '+91 98860 33445',
        drop_address: 'Sarjapur Road, WIPRO Corporate Gate, Bengaluru',
        drop_lat: 12.9120,
        drop_lng: 77.6870,
        distance_km: 9.4,
        estimated_duration_mins: 30,
        goods_type: 'Electronics & Appliances',
        goods_description: 'UPS Backup Inverters and Industrial Batteries',
        approx_weight_kg: 480,
        helper_needed: 1,
        fragile_handling: 0,
        base_fare: 299.00,
        distance_fare: 235.20,
        helper_fare: 200.00,
        gst_tax: 36.71,
        discount_amount: 0.0,
        total_fare: 770.91,
        driver_earnings: 655.27,
        platform_commission: 115.64,
        payment_method: 'upi',
        payment_status: 'paid',
        status: 'completed',
        pickup_otp: '4401',
        delivery_otp: '7789',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        completed_at: new Date(Date.now() - 86400000 + 3600000).toISOString()
      },
      {
        id: 'bk_cmp_05',
        booking_number: 'QH-1086',
        customer_id: 'usr_cust_03',
        driver_id: 'drv_04',
        vehicle_category_id: 'tata_407',
        pickup_address: 'Mysore Road Satellite Bus Station, Bengaluru',
        pickup_lat: 12.9520,
        pickup_lng: 77.5410,
        pickup_contact_name: 'Rajesh Hardware Supplies',
        pickup_contact_phone: '+91 98441 55220',
        drop_address: 'Kengeri Satellite Town, Stage 1 Main Road, Bengaluru',
        drop_lat: 12.9190,
        drop_lng: 77.4850,
        distance_km: 8.5,
        estimated_duration_mins: 28,
        goods_type: 'Construction & Hardware',
        goods_description: 'Cement bags, MS structural rods and scaffolding pipes',
        approx_weight_kg: 2200,
        helper_needed: 1,
        fragile_handling: 0,
        base_fare: 899.00,
        distance_fare: 264.00,
        helper_fare: 450.00,
        gst_tax: 80.65,
        discount_amount: 0.0,
        total_fare: 1693.65,
        driver_earnings: 1388.79,
        platform_commission: 304.86,
        payment_method: 'cash_on_delivery',
        payment_status: 'paid',
        status: 'completed',
        pickup_otp: '3312',
        delivery_otp: '8841',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        completed_at: new Date(Date.now() - 86400000 + 4000000).toISOString()
      },

      // --- CANCELLED BOOKINGS ---
      {
        id: 'bk_ccl_01',
        booking_number: 'QH-1087',
        customer_id: 'usr_cust_02',
        driver_id: null,
        vehicle_category_id: '3wheeler',
        pickup_address: 'Frazer Town, Coles Road, Bengaluru',
        pickup_lat: 12.9980,
        pickup_lng: 77.6120,
        pickup_contact_name: 'Priya Sundaram',
        pickup_contact_phone: '+91 97410 55667',
        drop_address: 'Kalyan Nagar, HRBR Layout 2nd Block, Bengaluru',
        drop_lat: 13.0180,
        drop_lng: 77.6430,
        distance_km: 5.8,
        estimated_duration_mins: 22,
        goods_type: 'FMCG & Groceries',
        goods_description: 'Bakery items',
        approx_weight_kg: 120,
        helper_needed: 0,
        fragile_handling: 0,
        base_fare: 199.00,
        distance_fare: 105.60,
        helper_fare: 0.0,
        gst_tax: 15.23,
        discount_amount: 0.0,
        total_fare: 319.83,
        driver_earnings: 271.86,
        platform_commission: 47.97,
        payment_method: 'upi',
        payment_status: 'refunded',
        status: 'cancelled',
        pickup_otp: '1120',
        delivery_otp: '9941',
        cancel_reason: 'Customer rescheduled transport date',
        created_at: new Date(Date.now() - 172800000).toISOString(),
        completed_at: null
      }
    ];

    // Clean up any legacy dummy bookings that might collide on booking_number
    await runAsync(`DELETE FROM reviews WHERE booking_id IN ('bk_01', 'bk_02', 'bk_03')`);
    await runAsync(`DELETE FROM transactions WHERE booking_id IN ('bk_01', 'bk_02', 'bk_03')`);
    await runAsync(`DELETE FROM support_tickets WHERE booking_id IN ('bk_01', 'bk_02', 'bk_03')`);
    await runAsync(`DELETE FROM bookings WHERE id IN ('bk_01', 'bk_02', 'bk_03')`);

    for (const b of richBookings) {
      await runAsync(`DELETE FROM bookings WHERE booking_number = ? AND id != ?`, [b.booking_number, b.id]);
      await runAsync(`
        INSERT INTO bookings (
          id, booking_number, customer_id, driver_id, vehicle_category_id,
          pickup_address, pickup_lat, pickup_lng, pickup_contact_name, pickup_contact_phone,
          drop_address, drop_lat, drop_lng, drop_contact_name, drop_contact_phone,
          distance_km, estimated_duration_mins, goods_type, goods_description, approx_weight_kg,
          helper_needed, fragile_handling, base_fare, distance_fare, helper_fare, gst_tax,
          discount_amount, total_fare, driver_earnings, platform_commission,
          payment_method, payment_status, status, pickup_otp, delivery_otp, cancel_reason,
          created_at, completed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          booking_number = excluded.booking_number,
          customer_id = excluded.customer_id,
          driver_id = excluded.driver_id,
          vehicle_category_id = excluded.vehicle_category_id,
          pickup_address = excluded.pickup_address,
          drop_address = excluded.drop_address,
          goods_type = excluded.goods_type,
          goods_description = excluded.goods_description,
          approx_weight_kg = excluded.approx_weight_kg,
          total_fare = excluded.total_fare,
          driver_earnings = excluded.driver_earnings,
          platform_commission = excluded.platform_commission,
          payment_method = excluded.payment_method,
          payment_status = excluded.payment_status,
          status = excluded.status,
          pickup_otp = excluded.pickup_otp,
          delivery_otp = excluded.delivery_otp,
          cancel_reason = excluded.cancel_reason,
          created_at = excluded.created_at,
          completed_at = excluded.completed_at
      `, [
        b.id, b.booking_number, b.customer_id, b.driver_id, b.vehicle_category_id,
        b.pickup_address, b.pickup_lat, b.pickup_lng, b.pickup_contact_name, b.pickup_contact_phone,
        b.drop_address, b.drop_lat, b.drop_lng, b.drop_contact_name || '', b.drop_contact_phone || '',
        b.distance_km, b.estimated_duration_mins, b.goods_type, b.goods_description, b.approx_weight_kg,
        b.helper_needed, b.fragile_handling, b.base_fare, b.distance_fare, b.helper_fare, b.gst_tax,
        b.discount_amount, b.total_fare, b.driver_earnings, b.platform_commission,
        b.payment_method, b.payment_status, b.status, b.pickup_otp, b.delivery_otp, b.cancel_reason || null,
        b.created_at, b.completed_at || null
      ]);

      // If completed, add transaction records
      if (b.status === 'completed') {
        const driverUser = b.driver_id === 'drv_01' ? 'usr_drv_01' : b.driver_id === 'drv_02' ? 'usr_drv_02' : b.driver_id === 'drv_03' ? 'usr_drv_03' : 'usr_drv_04';
        await runAsync(`
          INSERT INTO transactions (id, booking_id, user_id, type, amount, payment_method, reference_id, status, notes)
          VALUES (?, ?, ?, 'booking_payment', ?, ?, ?, 'success', ?)
          ON CONFLICT(id) DO NOTHING
        `, [
          'tx_' + b.id + '_pay', b.id, b.customer_id, b.total_fare, b.payment_method, 'TXN-' + b.booking_number, `Trip fare paid via ${b.payment_method}`
        ]);
        await runAsync(`
          INSERT INTO transactions (id, booking_id, user_id, type, amount, payment_method, reference_id, status, notes)
          VALUES (?, ?, ?, 'driver_commission', ?, 'wallet_deduct', ?, 'success', ?)
          ON CONFLICT(id) DO NOTHING
        `, [
          'tx_' + b.id + '_comm', b.id, driverUser, b.platform_commission, 'COMM-' + b.booking_number, `Platform commission fee for trip ${b.booking_number}`
        ]);
      }
    }

    // Reviews for completed trips
    await runAsync(`
      INSERT INTO reviews (id, booking_id, customer_id, driver_id, rating, punctuality_rating, handling_rating, comment)
      VALUES ('rev_01', 'bk_cmp_01', 'usr_cust_01', 'drv_01', 5, 5, 5, 'Ramesh was fantastic! Loaded our IT server racks securely with blankets and arrived 10 mins early at Whitefield.')
      ON CONFLICT(id) DO NOTHING
    `);
    await runAsync(`
      INSERT INTO reviews (id, booking_id, customer_id, driver_id, rating, punctuality_rating, handling_rating, comment)
      VALUES ('rev_02', 'bk_cmp_04', 'usr_cust_01', 'drv_01', 5, 5, 5, 'QuickHaul is our go-to for all tech shipments. Seamless delivery and smooth billing.')
      ON CONFLICT(id) DO NOTHING
    `);
    await runAsync(`
      INSERT INTO reviews (id, booking_id, customer_id, driver_id, rating, punctuality_rating, handling_rating, comment)
      VALUES ('rev_03', 'bk_cmp_03', 'usr_cust_04', 'drv_02', 5, 4, 5, 'Suresh handled our modular glass partitions with top care. No scratches, great attitude.')
      ON CONFLICT(id) DO NOTHING
    `);

    // Additional Support Tickets
    const tickets = [
      {
        id: 'tkt_01',
        ticket_number: 'QH-TKT-104',
        user_id: 'usr_cust_02',
        booking_id: null,
        subject: 'Inquiry regarding recurring B2B weekly logistics contracts',
        category: 'General Inquiry',
        description: 'We run a chain of 4 retail outlets in central Bangalore. Does QuickHaul offer dedicated monthly tempo contracts with consolidated invoicing?',
        priority: 'medium',
        status: 'in_progress',
        admin_response: 'Hi Priya, our B2B enterprise desk handles dedicated fleet contracts with 30-day billing terms. An account representative will call you shortly.'
      },
      {
        id: 'tkt_02',
        ticket_number: 'QH-TKT-105',
        user_id: 'usr_drv_04',
        booking_id: null,
        subject: 'Document verification status for Tata 407 Commercial Vehicle',
        category: 'Driver Verification Issue',
        description: 'Uploaded RC and Commercial Insurance for my 14ft container vehicle yesterday. Please review and activate my driver account.',
        priority: 'high',
        status: 'open',
        admin_response: null
      },
      {
        id: 'tkt_03',
        ticket_number: 'QH-TKT-106',
        user_id: 'usr_cust_03',
        booking_id: 'bk_act_02',
        subject: 'Request for consolidated GST tax invoice with company name',
        category: 'Billing & Fare Dispute',
        description: 'Need our company GSTIN 29AABCS1429P1Z8 printed on invoice #QH-2042 for input tax credit.',
        priority: 'medium',
        status: 'resolved',
        admin_response: 'Invoice updated with your GSTIN and emailed to rajesh.hardware@gmail.com.'
      }
    ];

    for (const t of tickets) {
      await runAsync(`
        INSERT INTO support_tickets (
          id, ticket_number, user_id, booking_id, subject, category, description, priority, status, admin_response
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          status = excluded.status,
          admin_response = excluded.admin_response
      `, [t.id, t.ticket_number, t.user_id, t.booking_id, t.subject, t.category, t.description, t.priority, t.status, t.admin_response]);
    }

  console.log('QuickHaul database seed & enrichment completed successfully!');
};

module.exports = { seedDatabase };
