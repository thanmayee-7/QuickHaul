const { allAsync, getAsync } = require('../db');

const getCategories = async (req, res) => {
  try {
    const categories = await allAsync(`
      SELECT vc.*,
             (SELECT COUNT(*) FROM drivers d WHERE d.vehicle_category_id = vc.id AND d.is_online = 1 AND d.verification_status = 'approved') as online_drivers_count
      FROM vehicle_categories vc
      WHERE vc.is_active = 1
      ORDER BY vc.base_fare ASC
    `);

    return res.json({ categories });
  } catch (error) {
    console.error('getCategories error:', error);
    return res.status(500).json({ error: 'Failed to fetch vehicle categories.' });
  }
};

const estimateFare = async (req, res) => {
  try {
    const { category_id, distance_km, helper_needed, fragile_handling, promo_code } = req.body;

    if (!category_id || distance_km === undefined) {
      return res.status(400).json({ error: 'category_id and distance_km are required.' });
    }

    const dist = Math.max(0.5, parseFloat(distance_km) || 1.0);
    const category = await getAsync('SELECT * FROM vehicle_categories WHERE id = ?', [category_id]);
    if (!category) {
      return res.status(404).json({ error: 'Vehicle category not found.' });
    }

    const baseFare = category.base_fare;
    const baseKm = category.base_km_included;
    const extraKm = Math.max(0, dist - baseKm);
    const distanceFare = +(extraKm * category.per_km_rate).toFixed(2);
    const helperFare = helper_needed ? category.helper_rate : 0.0;
    const fragileFare = fragile_handling ? 50.0 : 0.0;

    const subtotal = +(baseFare + distanceFare + helperFare + fragileFare).toFixed(2);

    let discount = 0.0;
    if (promo_code) {
      const code = promo_code.toUpperCase().trim();
      if (code === 'QUICK50') {
        discount = Math.min(50, +(subtotal * 0.15).toFixed(2));
      } else if (code === 'FIRSTHAUL') {
        discount = Math.min(100, +(subtotal * 0.20).toFixed(2));
      }
    }

    const taxableAmount = Math.max(0, subtotal - discount);
    const gstTax = +(taxableAmount * 0.05).toFixed(2); // 5% logistics GST
    const totalFare = +(taxableAmount + gstTax).toFixed(2);

    // Platform commission and Driver net earnings
    const commissionPercent = category.commission_percent || 15.0;
    const platformCommission = +(totalFare * (commissionPercent / 100)).toFixed(2);
    const driverEarnings = +(totalFare - platformCommission).toFixed(2);

    // Estimate duration: assume urban speed ~ 20 km/h with 10 mins loading/unloading buffer
    const durationMinutes = Math.round(15 + (dist / 20) * 60);

    return res.json({
      category: {
        id: category.id,
        name: category.name,
        max_payload_kg: category.max_payload_kg,
        dimensions_feet: category.dimensions_feet,
        volume_cuft: category.volume_cuft,
        image_icon: category.image_icon
      },
      breakdown: {
        distance_km: dist,
        base_fare: baseFare,
        base_km_included: baseKm,
        extra_km: +extraKm.toFixed(2),
        per_km_rate: category.per_km_rate,
        distance_fare: distanceFare,
        helper_fare: helperFare,
        fragile_fare: fragileFare,
        discount_amount: discount,
        gst_tax: gstTax,
        total_fare: totalFare,
        platform_commission: platformCommission,
        driver_earnings: driverEarnings,
        estimated_duration_mins: durationMinutes
      }
    });
  } catch (error) {
    console.error('estimateFare error:', error);
    return res.status(500).json({ error: 'Failed to calculate fare estimate.' });
  }
};

module.exports = {
  getCategories,
  estimateFare
};
