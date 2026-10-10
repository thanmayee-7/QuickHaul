import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

export const LeafletRouteMap = ({
  pickup = { lat: 12.9352, lng: 77.6245, label: 'Pickup Location' },
  drop = { lat: 12.9815, lng: 77.7289, label: 'Drop Location' },
  driverLoc = null,
  tripStatus = null,
  height = '360px'
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const routeLineRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Cleanup previous map instance if it exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Default center between pickup and drop
    const centerLat = (pickup.lat + drop.lat) / 2;
    const centerLng = (pickup.lng + drop.lng) / 2;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 12,
      zoomControl: true,
      attributionControl: false
    });

    // Dark logistics tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers and route polyline when props change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];
    if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }

    const pLat = pickup?.lat || 12.9352;
    const pLng = pickup?.lng || 77.6245;
    const dLat = drop?.lat || 12.9815;
    const dLng = drop?.lng || 77.7289;

    // Custom HTML Marker Icons
    const pickupIcon = L.divIcon({
      className: 'custom-leaflet-marker',
      html: `
        <div style="background: #0284c7; width: 34px; height: 34px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; font-size: 16px; color: white;">
          📦
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    const dropIcon = L.divIcon({
      className: 'custom-leaflet-marker',
      html: `
        <div style="background: #ef4444; width: 34px; height: 34px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; font-size: 16px; color: white;">
          🏁
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    const truckIcon = L.divIcon({
      className: 'custom-leaflet-marker pulse-truck',
      html: `
        <div style="background: #f59e0b; width: 42px; height: 42px; border-radius: 50%; border: 3px solid #000; box-shadow: 0 0 16px rgba(245,158,11,0.8); display: flex; align-items: center; justify-content: center; font-size: 22px;">
          🚚
        </div>
      `,
      iconSize: [42, 42],
      iconAnchor: [21, 21]
    });

    // Add Pickup & Drop markers
    const pickupMarker = L.marker([pLat, pLng], { icon: pickupIcon })
      .bindPopup(`<b>Pickup:</b><br/>${pickup.label || 'Origin'}`)
      .addTo(map);
    markersRef.current.push(pickupMarker);

    const dropMarker = L.marker([dLat, dLng], { icon: dropIcon })
      .bindPopup(`<b>Drop:</b><br/>${drop.label || 'Destination'}`)
      .addTo(map);
    markersRef.current.push(dropMarker);

    // Draw route line
    const routePoints = [[pLat, pLng]];
    // Add smooth midpoint curve
    const midLat = (pLat + dLat) / 2 + 0.008;
    const midLng = (pLng + dLng) / 2 - 0.005;
    routePoints.push([midLat, midLng]);
    routePoints.push([dLat, dLng]);

    const polyline = L.polyline(routePoints, {
      color: '#f59e0b',
      weight: 5,
      opacity: 0.85,
      dashArray: tripStatus === 'in_transit' ? '8, 8' : undefined
    }).addTo(map);
    routeLineRef.current = polyline;

    // Driver vehicle position
    if (driverLoc && driverLoc.lat && driverLoc.lng) {
      const driverMarker = L.marker([driverLoc.lat, driverLoc.lng], { icon: truckIcon })
        .bindPopup(`<b>QuickHaul Dispatcher</b><br/>Status: ${tripStatus || 'Live Tracking'}`)
        .addTo(map);
      markersRef.current.push(driverMarker);
    }

    // Auto-fit bounds
    const bounds = L.latLngBounds([
      [pLat, pLng],
      [dLat, dLng],
      ...(driverLoc ? [[driverLoc.lat, driverLoc.lng]] : [])
    ]);
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

  }, [pickup, drop, driverLoc, tripStatus]);

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%', borderRadius: '12px' }} />
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        zIndex: 500,
        background: 'rgba(17, 24, 39, 0.9)',
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '0.75rem',
        color: '#f9fafb',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
        QuickHaul Live Telematics Engine
      </div>
    </div>
  );
};
