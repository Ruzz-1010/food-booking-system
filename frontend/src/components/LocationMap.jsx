// ILAGAY MO ITO SA: frontend/src/components/LocationMap.jsx
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LocationMap = ({ 
  locations, 
  height = '400px', 
  zoom = 13,
  showRoutes = false 
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    mapInstanceRef.current = L.map(mapRef.current).setView([14.5995, 120.9842], zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstanceRef.current);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, [zoom]);

  useEffect(() => {
    if (!mapInstanceRef.current || !locations) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => {
      mapInstanceRef.current.removeLayer(marker);
    });
    markersRef.current = {};

    // Add new markers
    if (locations.customer && locations.customer.latitude && locations.customer.longitude) {
      const customerIcon = L.divIcon({
        html: '<div style="background-color: #EF4444; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
        className: 'customer-marker',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      markersRef.current.customer = L.marker([
        locations.customer.latitude,
        locations.customer.longitude
      ], { icon: customerIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div>
            <strong>📍 Customer</strong><br/>
            ${locations.customer.name}<br/>
            ${locations.customer.address || ''}
          </div>
        `);
    }

    if (locations.restaurant && locations.restaurant.latitude && locations.restaurant.longitude) {
      const restaurantIcon = L.divIcon({
        html: '<div style="background-color: #10B981; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
        className: 'restaurant-marker',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      markersRef.current.restaurant = L.marker([
        locations.restaurant.latitude,
        locations.restaurant.longitude
      ], { icon: restaurantIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div>
            <strong>🏪 Restaurant</strong><br/>
            ${locations.restaurant.name}<br/>
            ${locations.restaurant.address || ''}
          </div>
        `);
    }

    if (locations.rider && locations.rider.currentLocation) {
      const riderIcon = L.divIcon({
        html: '<div style="background-color: #3B82F6; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 12px;">🚴</div>',
        className: 'rider-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      markersRef.current.rider = L.marker([
        locations.rider.currentLocation.latitude,
        locations.rider.currentLocation.longitude
      ], { icon: riderIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div>
            <strong>🚴 Rider</strong><br/>
            ${locations.rider.name}<br/>
            ${locations.rider.vehicleType || 'Motorcycle'}
          </div>
        `);
    }

    // Fit map to show all markers
    const markerGroup = Object.values(markersRef.current);
    if (markerGroup.length > 0) {
      const group = new L.featureGroup(markerGroup);
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
    }

  }, [locations]);

  return (
    <div 
      ref={mapRef} 
      style={{ height, borderRadius: '10px' }}
      className="location-map"
    />
  );
};

export default LocationMap;