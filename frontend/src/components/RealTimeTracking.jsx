// ILAGAY MO ITO SA: frontend/src/components/RealTimeTracking.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import socketService from '../services/socket.js';
import LocationMap from './LocationMap';

const RealTimeTracking = ({ orderId, userRole }) => {
  const [locations, setLocations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrderLocations();
    setupSocketListeners();

    return () => {
      socketService.offRiderLocationUpdate(handleRiderLocationUpdate);
      socketService.leaveOrderRoom(orderId);
    };
  }, [orderId]);

  const fetchOrderLocations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/location/order/${orderId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLocations(response.data.locations);
    } catch (err) {
      console.error('Error fetching locations:', err);
      setError('Failed to load order locations');
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    const token = localStorage.getItem('token');
    
    if (!socketService.isConnected) {
      socketService.connect(token);
    }

    socketService.joinOrderRoom(orderId);
    socketService.onRiderLocationUpdate(handleRiderLocationUpdate);
  };

  const handleRiderLocationUpdate = (data) => {
    if (data.orderId === orderId && locations?.rider) {
      setLocations(prev => ({
        ...prev,
        rider: {
          ...prev.rider,
          currentLocation: data.riderLocation
        }
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-gray-900">Live Order Tracking</h3>
      
      <LocationMap locations={locations} height="400px" />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <h4 className="font-semibold text-gray-900">📍 Customer</h4>
          <p className="text-sm text-gray-600">{locations?.customer?.name}</p>
          <p className="text-xs text-gray-500 mt-1">{locations?.customer?.address}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <h4 className="font-semibold text-gray-900">🏪 Restaurant</h4>
          <p className="text-sm text-gray-600">{locations?.restaurant?.name}</p>
          <p className="text-xs text-gray-500 mt-1">{locations?.restaurant?.address}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <h4 className="font-semibold text-gray-900">🚴 Rider</h4>
          {locations?.rider ? (
            <>
              <p className="text-sm text-gray-600">{locations.rider.name}</p>
              <p className="text-xs text-gray-500 mt-1">
                {locations.rider.vehicleType} • {locations.rider.currentLocation ? 'Moving' : 'Waiting'}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-500">No rider assigned yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RealTimeTracking;