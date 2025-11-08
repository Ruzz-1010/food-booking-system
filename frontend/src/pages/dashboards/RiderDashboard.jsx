// src/pages/dashboards/RiderDashboard.jsx

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
    MapPin, 
    Navigation, 
    Target,
    Bike,
    Clock,
    Package,
    CheckCircle,
    AlertCircle
} from 'lucide-react';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Mini Map Component
const MiniMap = ({ 
    riderLocation, 
    pickupLocation, 
    deliveryLocation, 
    height = "200px",
    showRoute = false 
}) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);

    useEffect(() => {
        if (!mapRef.current) return;

        // Initialize map with default center (Manila)
        const map = L.map(mapRef.current).setView([14.5995, 120.9842], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        mapInstanceRef.current = map;

        // Clear existing markers
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        // Add pickup marker (Restaurant)
        if (pickupLocation && pickupLocation.latitude && pickupLocation.longitude) {
            const pickupIcon = L.divIcon({
                html: '<div style="background-color: #EF4444; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                className: 'pickup-marker',
                iconSize: [16, 16],
                iconAnchor: [8, 8]
            });

            const pickupMarker = L.marker([pickupLocation.latitude, pickupLocation.longitude], { 
                icon: pickupIcon 
            })
                .addTo(map)
                .bindPopup("📍 Pickup Location")
                .openPopup();
            
            markersRef.current.push(pickupMarker);
        }

        // Add delivery marker (Customer)
        if (deliveryLocation && deliveryLocation.latitude && deliveryLocation.longitude) {
            const deliveryIcon = L.divIcon({
                html: '<div style="background-color: #3B82F6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                className: 'delivery-marker',
                iconSize: [16, 16],
                iconAnchor: [8, 8]
            });

            const deliveryMarker = L.marker([deliveryLocation.latitude, deliveryLocation.longitude], { 
                icon: deliveryIcon 
            })
                .addTo(map)
                .bindPopup("🏠 Delivery Location");
            
            markersRef.current.push(deliveryMarker);
        }

        // Add rider marker (Current Location)
        if (riderLocation && riderLocation.latitude && riderLocation.longitude) {
            const riderIcon = L.divIcon({
                html: '<div style="background-color: #10B981; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 10px;">🚴</div>',
                className: 'rider-marker',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });

            const riderMarker = L.marker([riderLocation.latitude, riderLocation.longitude], { 
                icon: riderIcon 
            })
                .addTo(map)
                .bindPopup("🚴 Your Location")
                .openPopup();
            
            markersRef.current.push(riderMarker);
        }

        // Fit map to show all markers
        if (markersRef.current.length > 0) {
            const group = new L.featureGroup(markersRef.current);
            map.fitBounds(group.getBounds().pad(0.1));
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
            }
        };
    }, [riderLocation, pickupLocation, deliveryLocation, showRoute]);

    return (
        <div 
            ref={mapRef} 
            style={{ height, borderRadius: '8px' }}
            className="mini-map border border-gray-300 mt-2"
        />
    );
};

// Location Tracking Component
const LocationTracker = ({ onLocationUpdate, isTracking }) => {
    const [currentLocation, setCurrentLocation] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert("❌ Geolocation is not supported by this browser.");
            return;
        }

        setIsUpdating(true);
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                
                const locationData = {
                    latitude,
                    longitude,
                    timestamp: new Date().toISOString()
                };
                
                setCurrentLocation(locationData);
                
                // Send to backend if tracking is enabled
                if (isTracking && onLocationUpdate) {
                    try {
                        await onLocationUpdate(locationData);
                    } catch (error) {
                        console.error("Error updating location:", error);
                    }
                }
                
                setIsUpdating(false);
            },
            (error) => {
                console.error("Error getting location:", error);
                alert("❌ Failed to get your location. Please check your browser permissions.");
                setIsUpdating(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-md border">
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900 flex items-center">
                    <Target className="w-5 h-5 mr-2 text-green-600" />
                    Current Location
                </h4>
                <button
                    onClick={getCurrentLocation}
                    disabled={isUpdating}
                    className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700 transition-colors disabled:bg-gray-400 flex items-center"
                >
                    {isUpdating ? (
                        <>
                            <div className="w-3 h-3 border-t-2 border-white rounded-full animate-spin mr-1"></div>
                            Updating...
                        </>
                    ) : (
                        <>
                            <Navigation className="w-4 h-4 mr-1" />
                            Update Location
                        </>
                    )}
                </button>
            </div>
            
            {currentLocation ? (
                <div className="text-sm text-gray-600 space-y-1">
                    <p>📍 Coordinates: {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}</p>
                    <p>🕒 Last Updated: {new Date(currentLocation.timestamp).toLocaleTimeString()}</p>
                    {isTracking && (
                        <p className="text-green-600 text-xs font-semibold">
                            ✅ Live tracking active
                        </p>
                    )}
                </div>
            ) : (
                <p className="text-sm text-gray-500">Click "Update Location" to get your current position</p>
            )}
        </div>
    );
};

export default function RiderDashboard() {
  const [user, setUser] = useState(null);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [deliveryHistory, setDeliveryHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("available");
  const [isOnline, setIsOnline] = useState(true);
  const [riderLocation, setRiderLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const navigate = useNavigate();

  const fetchRiderData = useCallback(async (riderId, token) => {
    try {
      // Fetch available orders
      const availableResponse = await axios.get(
        "http://localhost:5000/api/orders/available-deliveries",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Fetch rider's current deliveries
      const myDeliveriesResponse = await axios.get(
        `http://localhost:5000/api/orders/rider/${riderId}/deliveries`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Fetch Delivery History
      const historyResponse = await axios.get(
        `http://localhost:5000/api/orders/rider/${riderId}/history`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAvailableOrders(availableResponse.data.orders || []);
      setMyDeliveries(myDeliveriesResponse.data.deliveries || []);
      setDeliveryHistory(historyResponse.data.history || []);
    } catch (error) {
      console.error("Error fetching rider data:", error);
      setAvailableOrders([]);
      setMyDeliveries([]);
      setDeliveryHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    const role = localStorage.getItem("role");

    if (!token || role !== "rider") {
      navigate("/login");
      return;
    }

    if (userData) {
      const userObj = JSON.parse(userData);
      setUser(userObj);
      fetchRiderData(userObj.id, token);
    }
  }, [navigate, fetchRiderData]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const toggleAvailability = () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    setIsTracking(newStatus); // Auto-enable tracking when going online
    
    if (newStatus) {
      // Get initial location when going online
      getInitialLocation();
    }
    
    console.log(`Rider status toggled to: ${newStatus ? 'Online' : 'Offline'}`);
  };

  const getInitialLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setRiderLocation({
            latitude,
            longitude,
            timestamp: new Date().toISOString()
          });
        },
        (error) => {
          console.error("Error getting initial location:", error);
        }
      );
    }
  };

  const updateRiderLocation = async (locationData) => {
    try {
      setRiderLocation(locationData);
      
      // Send to backend if tracking is enabled
      if (isTracking) {
        const token = localStorage.getItem("token");
        // You'll need to create this endpoint in your backend
        await axios.post(
          "http://localhost:5000/api/riders/update-location",
          locationData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (error) {
      console.error("Error updating rider location:", error);
    }
  };

  const acceptDelivery = async (orderId) => {
    try {
      const token = localStorage.getItem("token");
      const userObj = JSON.parse(localStorage.getItem("user"));

      await axios.patch(
        `http://localhost:5000/api/orders/${orderId}/assign-rider`,
        { riderId: userObj.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      fetchRiderData(userObj.id, token);
    } catch (error) {
      console.error("Error accepting delivery:", error);
      alert(`Acceptance Failed: ${error.response?.data?.message || error.message}`); 
    }
  };

  const updateDeliveryStatus = async (orderId, status) => {
    try {
      const token = localStorage.getItem("token");
      
      await axios.patch(
        `http://localhost:5000/api/orders/${orderId}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const userObj = JSON.parse(localStorage.getItem("user"));
      fetchRiderData(userObj.id, token);
    } catch (error) {
      console.error("Error updating delivery status:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-red-600 border-solid rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading rider dashboard...</p>
        </div>
      </div>
    );
  }

  const getMapLink = (address) => {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-extrabold text-red-600">🚴 FoodExpress Rider</h1>
              
              {/* Availability Toggle */}
              <div 
                onClick={toggleAvailability} 
                className={`ml-6 flex items-center p-2 rounded-full cursor-pointer transition-all ${
                    isOnline ? 'bg-green-100 ring-2 ring-green-500' : 'bg-gray-200 ring-2 ring-gray-400'
                }`}
              >
                <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-600' : 'bg-gray-600'}`}></div>
                <span className={`ml-2 text-sm font-semibold ${isOnline ? 'text-green-800' : 'text-gray-600'}`}>
                    {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 font-medium">Welcome, {user?.name}!</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-lg"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        
        {/* Location Tracker */}
        <div className="mb-6">
          <LocationTracker 
            onLocationUpdate={updateRiderLocation}
            isTracking={isTracking}
          />
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <TabButton name="available" currentTab={activeTab} setActiveTab={setActiveTab}>
                    Available Deliveries ({availableOrders.length})
                </TabButton>
                <TabButton name="myDeliveries" currentTab={activeTab} setActiveTab={setActiveTab}>
                    My Active Deliveries ({myDeliveries.length})
                </TabButton>
                <TabButton name="history" currentTab={activeTab} setActiveTab={setActiveTab}>
                    Delivery History ({deliveryHistory.length})
                </TabButton>
            </nav>
        </div>

        {/* Available Deliveries Tab */}
        {activeTab === "available" && (
          <div className="grid gap-6">
            {availableOrders.length === 0 ? (
              <EmptyState message="No available deliveries right now. Check back soon!" icon="📦" />
            ) : (
              availableOrders.map((order) => (
                <OrderCard 
                  key={order._id} 
                  order={order} 
                  tab="available" 
                  acceptDelivery={acceptDelivery} 
                  getMapLink={getMapLink}
                  isOnline={isOnline}
                  riderLocation={riderLocation}
                />
              ))
            )}
          </div>
        )}

        {/* My Deliveries Tab */}
        {activeTab === "myDeliveries" && (
          <div className="grid gap-6">
            {myDeliveries.length === 0 ? (
              <EmptyState message="You have no active deliveries. Accept one from the Available tab!" icon="🚴" />
            ) : (
              myDeliveries.map((order) => (
                <OrderCard 
                  key={order._id} 
                  order={order} 
                  tab="myDeliveries" 
                  updateDeliveryStatus={updateDeliveryStatus} 
                  getMapLink={getMapLink}
                  isOnline={isOnline}
                  riderLocation={riderLocation}
                />
              ))
            )}
          </div>
        )}
        
        {/* Delivery History Tab */}
        {activeTab === "history" && (
          <div className="grid gap-6">
            {deliveryHistory.length === 0 ? (
              <EmptyState message="You haven't completed any deliveries yet." icon="📜" />
            ) : (
              deliveryHistory.map((order) => (
                <OrderCard 
                  key={order._id} 
                  order={order} 
                  tab="history"
                  getMapLink={getMapLink}
                  isOnline={isOnline}
                  riderLocation={riderLocation}
                />
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// --- Component Helpers ---

const TabButton = ({ name, currentTab, setActiveTab, children }) => (
    <button
        onClick={() => setActiveTab(name)}
        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
            currentTab === name
                ? "border-red-600 text-red-600 font-bold"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
        }`}
    >
        {children}
    </button>
);

const EmptyState = ({ message, icon }) => (
    <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-dashed border-gray-300">
        <div className="text-6xl mb-4 opacity-70">{icon}</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">You're all caught up!</h3>
        <p className="text-gray-600">{message}</p>
    </div>
);

const OrderCard = ({ 
  order, 
  tab, 
  acceptDelivery, 
  updateDeliveryStatus, 
  getMapLink, 
  isOnline,
  riderLocation 
}) => {
  
  // Mock location data - replace with actual data from your backend
  const pickupLocation = order.restaurantId?.locations || {
    latitude: 14.5995 + (Math.random() - 0.5) * 0.01,
    longitude: 120.9842 + (Math.random() - 0.5) * 0.01,
    address: order.restaurantId?.address
  };

  const deliveryLocation = order.locations?.customer || {
    latitude: 14.5995 + (Math.random() - 0.5) * 0.01,
    longitude: 120.9842 + (Math.random() - 0.5) * 0.01,
    address: order.deliveryAddress
  };

  return (
    <div className={`bg-white shadow-xl rounded-xl p-6 border-t-4 ${tab === 'history' ? 'border-gray-500' : 'border-red-500'}`}>
        <div className="flex justify-between items-center mb-4 pb-4 border-b">
            <h3 className="text-xl font-bold text-gray-900">Order #{order._id?.substring(0, 8)}</h3>
            <span className={`px-4 py-1 rounded-full text-xs font-semibold ${
                tab === 'available' ? 'bg-green-100 text-green-800' : 
                tab === 'history' ? 'bg-gray-200 text-gray-700' : 'bg-red-100 text-red-800'
            }`}>
                {tab === 'available' ? 'NEW DELIVERY' : 
                   tab === 'history' ? 'DELIVERED' : order.status.toUpperCase().replace('_', ' ')}
            </span>
        </div>

        {/* Mini Map */}
        <div className="mb-4">
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
            <MapPin className="w-4 h-4 mr-2 text-red-500" />
            Delivery Route Map
          </h4>
          <MiniMap 
            riderLocation={riderLocation}
            pickupLocation={pickupLocation}
            deliveryLocation={deliveryLocation}
            height="200px"
            showRoute={tab === 'myDeliveries'}
          />
          <div className="flex items-center justify-center space-x-4 mt-2 text-xs text-gray-600">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
              <span>Pickup</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
              <span>Delivery</span>
            </div>
            {riderLocation && (
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-1">🚴</div>
                <span>You</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
            {/* Pickup Info */}
            <div className="flex items-start space-x-2 p-3 bg-red-50 rounded-lg">
                <MapPin className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div className="flex-1">
                    <p className="font-medium text-gray-700">Pickup Location:</p>
                    <p className="text-gray-600 font-semibold">{order.restaurantId?.name || 'Restaurant'}</p>
                    <p className="text-xs text-gray-500 mt-1">{order.restaurantId?.address || 'Address not specified'}</p>
                    <div className="flex space-x-2 mt-2">
                      <a 
                          href={getMapLink(order.restaurantId?.address || 'Restaurant')} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors"
                      >
                          Open in Maps
                      </a>
                      <button className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600 transition-colors">
                          Get Directions
                      </button>
                    </div>
                </div>
            </div>

            {/* Delivery Info */}
            <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg">
                <MapPin className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <div className="flex-1">
                    <p className="font-medium text-gray-700">Delivery Location:</p>
                    <p className="text-gray-600 font-semibold">{order.customerId?.name || 'Customer'}</p>
                    <p className="text-xs text-gray-500 mt-1">{order.deliveryAddress}</p>
                    <div className="flex space-x-2 mt-2">
                      <a 
                          href={getMapLink(order.deliveryAddress)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
                      >
                          Open in Maps
                      </a>
                      <button className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600 transition-colors">
                          Get Directions
                      </button>
                    </div>
                </div>
            </div>
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
            <div className="text-center p-2 bg-gray-50 rounded">
                <Package className="w-4 h-4 text-gray-600 mx-auto mb-1" />
                <p className="font-medium text-gray-700">Items</p>
                <p className="text-gray-900 font-semibold">{order.items?.length || 0}</p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
                <Bike className="w-4 h-4 text-gray-600 mx-auto mb-1" />
                <p className="font-medium text-gray-700">Distance</p>
                <p className="text-gray-900 font-semibold">~2.5 km</p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
                <Clock className="w-4 h-4 text-gray-600 mx-auto mb-1" />
                <p className="font-medium text-gray-700">Est. Time</p>
                <p className="text-gray-900 font-semibold">15-20 min</p>
            </div>
            <div className="text-center p-2 bg-green-50 rounded">
                <p className="font-medium text-gray-700">Earnings</p>
                <p className="text-2xl font-extrabold text-green-600">₱{order.deliveryFee || '50.00'}</p>
            </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-end pt-4 space-x-3 border-t">
            {tab === 'available' && (
                <button
                    onClick={() => acceptDelivery(order._id)}
                    className="bg-red-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                    disabled={!isOnline} 
                >
                    {isOnline ? (
                        <>
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Accept Delivery
                        </>
                    ) : (
                        <>
                            <AlertCircle className="w-5 h-5 mr-2" />
                            Go Online to Accept
                        </>
                    )}
                </button>
            )}
            {tab === 'myDeliveries' && (
                <>
                    {order.status === 'ready' && (
                        <button
                            onClick={() => updateDeliveryStatus(order._id, 'picked_up')}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                        >
                            <Package className="w-5 h-5 mr-2" />
                            Mark as Picked Up
                        </button>
                    )}
                    {order.status === 'picked_up' && (
                        <button
                            onClick={() => updateDeliveryStatus(order._id, 'delivered')}
                            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                        >
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Mark as Delivered
                        </button>
                    )}
                </>
            )}
        </div>
    </div>
  );
};