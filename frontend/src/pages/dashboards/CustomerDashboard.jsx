// src/pages/dashboards/CustomerDashboard.jsx

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
    User, Search, MapPin, Package, Phone, 
    Star, Clock, CheckCircle, RefreshCw,
    ShoppingCart, Heart, ChevronDown, Filter,
    Facebook, Twitter, Instagram, Youtube,
    Mail, Map, Edit, Save, X, Menu
} from 'lucide-react'; 

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// LoginForm Component
const LoginForm = ({ onLogin, onSwitchToRegister, isLoading, onClose, showCloseButton = false }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      await onLogin(email, password);
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-xl ${showCloseButton ? 'relative' : ''}`}>
      {showCloseButton && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <X size={24} />
        </button>
      )}
      
      <div className="p-8">
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-red-800 rounded-lg flex items-center justify-center shadow-md mb-4">
            <span className="text-white font-bold text-xl">FX</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h2>
          <p className="text-gray-600">
            Sign in to your FoodExpress account
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800 focus:border-red-800 transition-colors"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800 focus:border-red-800 transition-colors"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div className="space-y-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-red-800 hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Signing in...
                </div>
              ) : (
                "SIGN IN TO ORDER"
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-red-800 hover:text-red-900 font-medium text-sm transition-colors"
              >
                Don't have an account? Sign up now
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// RegisterForm Component
const RegisterForm = ({ onRegister, onSwitchToLogin, isLoading, onClose, showCloseButton = false }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "customer",
    address: "",
    latitude: null,
    longitude: null,
    restaurantName: "",
    restaurantAddress: "",
    restaurantDescription: "",
    restaurantCategory: "Filipino",
    vehicleType: "motorcycle",
    licenseNumber: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const restaurantCategories = [
    "Filipino", "Chinese", "Japanese", "Korean", "American",
    "Italian", "Mexican", "Thai", "Vietnamese", "Indian",
    "Fast Food", "Desserts", "Beverages", "Healthy", "Vegetarian",
  ];

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map("register-map", {
        center: [14.5995, 120.9842],
        zoom: 13,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(mapRef.current);

      markerRef.current = L.marker([14.5995, 120.9842], { draggable: true })
        .addTo(mapRef.current)
        .bindPopup("📍 Drag to set your location")
        .openPopup();

      markerRef.current.on("dragend", async () => {
        const { lat, lng } = markerRef.current.getLatLng();
        const address = await reverseGeocode(lat, lng);
        setFormData(prev => ({ 
          ...prev, 
          latitude: lat, 
          longitude: lng,
          address: address || prev.address
        }));
      });
    }
  }, []);

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      return data.display_name || "";
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return "";
    }
  };

  const handleGetLocation = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          const address = await reverseGeocode(latitude, longitude);
          
          setFormData(prev => ({ 
            ...prev, 
            latitude, 
            longitude,
            address: address || prev.address
          }));

          mapRef.current.setView([latitude, longitude], 16);
          markerRef.current.setLatLng([latitude, longitude]);
          markerRef.current.bindPopup("📍 Your location").openPopup();
        },
        () => alert("Please enable location access to use this feature.")
      );
    } else {
      alert("Geolocation not supported on this device.");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.name || !formData.email || !formData.password || !formData.phone) {
      setError("Please fill in all required fields");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      setError("Please set your location using the map");
      return;
    }

    if (!formData.address || formData.address.trim() === '') {
      setError("Please set your location properly using the map");
      return;
    }

    try {
      await onRegister(formData);
      setSuccess("Account created successfully! Redirecting...");
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto ${showCloseButton ? 'relative' : ''}`}>
      {showCloseButton && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <X size={24} />
        </button>
      )}
      
      <div className="p-6">
        <div className="text-center mb-6">
          <div className="mx-auto h-16 w-16 bg-red-800 rounded-lg flex items-center justify-center shadow-md mb-4">
            <span className="text-white font-bold text-xl">FX</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Join FoodExpress
          </h2>
          <p className="text-gray-600">
            Create your account to start ordering
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm">
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                minLength="6"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                placeholder="09XXXXXXXXX"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              I want to join as: *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {["customer", "restaurant", "rider"].map((roleOption) => (
                <label
                  key={roleOption}
                  className={`relative flex flex-col p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.role === roleOption
                      ? "border-red-800 bg-red-50 text-red-800"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={roleOption}
                    checked={formData.role === roleOption}
                    onChange={handleChange}
                    className="sr-only"
                    required
                  />
                  <span className="font-medium capitalize text-sm text-center">{roleOption}</span>
                  <span className="text-xs text-gray-600 mt-1 text-center">
                    {roleOption === "customer" && "Order food • Auto-approved"}
                    {roleOption === "restaurant" && "Sell food • Needs approval"}
                    {roleOption === "rider" && "Deliver food • Needs approval"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {formData.role === "restaurant" && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-bold text-gray-800"> Restaurant Information</h3>
              <input
                type="text"
                name="restaurantName"
                placeholder="Restaurant Name *"
                value={formData.restaurantName}
                onChange={handleChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                required
              />
              <input
                type="text"
                name="restaurantAddress"
                placeholder="Restaurant Address *"
                value={formData.restaurantAddress}
                onChange={handleChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                required
              />
              <textarea
                name="restaurantDescription"
                placeholder="Restaurant Description"
                value={formData.restaurantDescription}
                onChange={handleChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 resize-none"
                rows="3"
              />
              <select
                name="restaurantCategory"
                value={formData.restaurantCategory}
                onChange={handleChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
              >
                {restaurantCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          )}

          {formData.role === "rider" && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-bold text-gray-800"> Rider Information</h3>
              <select
                name="vehicleType"
                value={formData.vehicleType}
                onChange={handleChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
              >
                <option value="motorcycle">Motorcycle</option>
                <option value="bicycle">Bicycle</option>
                <option value="car">Car</option>
              </select>
              <input
                type="text"
                name="licenseNumber"
                placeholder="License Number *"
                value={formData.licenseNumber}
                onChange={handleChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Location *
            </label>
            <p className="text-sm text-gray-600 mb-3">
              {formData.role === "customer" && "Set your delivery location"}
              {formData.role === "restaurant" && "Set your restaurant location"}
              {formData.role === "rider" && "Set your base location"}
            </p>
            
            <button
              type="button"
              onClick={handleGetLocation}
              className="mb-2 px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 transition-colors"
            >
              📍 Get My Location
            </button>
            
            <div id="register-map" style={{ height: "200px", borderRadius: "10px" }}></div>
            
            {formData.address && (
              <p className="text-sm text-gray-700 mt-2">
                <strong>Address:</strong> {formData.address}
              </p>
            )}
            
            {formData.latitude && (
              <p className="text-xs text-gray-500 mt-1">
                Coordinates: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-red-800 hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating account...
                </div>
              ) : (
                "CREATE ACCOUNT & START ORDERING"
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-red-800 hover:text-red-900 font-medium text-sm transition-colors"
              >
                Already have an account? Sign in
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// Order Tracking Map Component
const OrderTrackingMap = ({ 
    order, 
    userLocation, 
    riderLocation,
    restaurantLocation,
    height = "400px" 
}) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef({});
    const polylineRef = useRef(null);

    useEffect(() => {
        if (!mapRef.current) return;

        const defaultLat = 14.5995;
        const defaultLng = 120.9842;
        
        const map = L.map(mapRef.current).setView([defaultLat, defaultLng], 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        mapInstanceRef.current = map;

        Object.values(markersRef.current).forEach(marker => {
            if (marker && map.hasLayer(marker)) {
                map.removeLayer(marker);
            }
        });
        markersRef.current = {};
        
        if (polylineRef.current && map.hasLayer(polylineRef.current)) {
            map.removeLayer(polylineRef.current);
        }

        const locations = [];
        let hasValidLocations = false;

        if (restaurantLocation && restaurantLocation.latitude && restaurantLocation.longitude) {
            const restaurantIcon = L.divIcon({
                html: '<div style="background-color: #8B0000; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 12px;">🏪</div>',
                className: 'restaurant-marker',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });

            const restaurantMarker = L.marker([restaurantLocation.latitude, restaurantLocation.longitude], { 
                icon: restaurantIcon 
            })
                .addTo(map)
                .bindPopup(`<strong>${order?.restaurantId?.restaurantName || 'Restaurant'}</strong><br>Pickup Location`);
            
            markersRef.current.restaurant = restaurantMarker;
            locations.push([restaurantLocation.latitude, restaurantLocation.longitude]);
            hasValidLocations = true;
        }

        if (riderLocation && riderLocation.latitude && riderLocation.longitude) {
            const riderIcon = L.divIcon({
                html: '<div style="background-color: #8B0000; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 14px;">🚴</div>',
                className: 'rider-marker',
                iconSize: [28, 28],
                iconAnchor: [14, 14]
            });

            const riderMarker = L.marker([riderLocation.latitude, riderLocation.longitude], { 
                icon: riderIcon 
            })
                .addTo(map)
                .bindPopup(`<strong>Rider</strong><br>${order?.riderId?.name || 'Your Rider'}`);
            
            markersRef.current.rider = riderMarker;
            locations.push([riderLocation.latitude, riderLocation.longitude]);
            hasValidLocations = true;
        }

        if (userLocation && userLocation.latitude && userLocation.longitude) {
            const customerIcon = L.divIcon({
                html: '<div style="background-color: #8B0000; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 12px;">🏠</div>',
                className: 'customer-marker',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });

            const customerMarker = L.marker([userLocation.latitude, userLocation.longitude], { 
                icon: customerIcon 
            })
                .addTo(map)
                .bindPopup(`<strong>Your Location</strong><br>Delivery Address`);
            
            markersRef.current.customer = customerMarker;
            locations.push([userLocation.latitude, userLocation.longitude]);
            hasValidLocations = true;
        }

        if (locations.length >= 2) {
            polylineRef.current = L.polyline(locations, {
                color: '#8B0000',
                weight: 5,
                opacity: 0.8,
                dashArray: '10, 10'
            }).addTo(map);
        }

        if (hasValidLocations && Object.keys(markersRef.current).length > 0) {
            const group = new L.featureGroup(Object.values(markersRef.current));
            map.fitBounds(group.getBounds().pad(0.1));
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
            }
        };
    }, [order, userLocation, riderLocation, restaurantLocation]);

    return (
        <div 
            ref={mapRef} 
            style={{ height, borderRadius: '8px' }}
            className="order-tracking-map border border-gray-300"
        />
    );
};

// Order Tracking Component
const OrderTracking = ({ order, userLocation, riderLocation, restaurantLocation, onRefreshLocation }) => {
    const statusSteps = [
        { status: 'pending', label: 'Order Placed', icon: Clock, color: 'text-yellow-500' },
        { status: 'preparing', label: 'Preparing', icon: Package, color: 'text-orange-500' },
        { status: 'ready', label: 'Ready', icon: CheckCircle, color: 'text-blue-500' },
        { status: 'picked_up', label: 'Picked Up', icon: Package, color: 'text-purple-500' },
        { status: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'text-green-500' }
    ];

    const currentStepIndex = statusSteps.findIndex(step => step.status === order.status);

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-2xl font-bold text-gray-900">Order Tracking</h3>
                    <p className="text-gray-600">Order #{(order._id || '').substring(0, 8).toUpperCase()}</p>
                </div>
                <button
                    onClick={onRefreshLocation}
                    className="flex items-center space-x-2 bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900 transition-colors"
                >
                    <RefreshCw size={16} />
                    <span>Refresh</span>
                </button>
            </div>
            
            <div className="mb-8">
                <div className="flex justify-between mb-2">
                    {statusSteps.map((step, index) => (
                        <div key={step.status} className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full transition-colors ${
                                index <= currentStepIndex ? 'bg-red-800' : 'bg-gray-300'
                            }`}></div>
                        </div>
                    ))}
                </div>
                <div className="h-1 bg-gray-200 rounded -mt-2">
                    <div 
                        className="h-full bg-red-800 rounded transition-all duration-1000 ease-out"
                        style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
                    ></div>
                </div>
            </div>
            
            <div className="grid grid-cols-5 gap-4 mb-6">
                {statusSteps.map((step, index) => {
                    const StepIcon = step.icon;
                    const isCompleted = index <= currentStepIndex;
                    const isCurrent = index === currentStepIndex;
                    
                    return (
                        <div key={step.status} className="text-center">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2 transition-colors ${
                                isCompleted ? 'bg-red-800 text-white shadow-md' :
                                'bg-gray-100 text-gray-400'
                            }`}>
                                <StepIcon size={20} />
                            </div>
                            <p className={`text-sm font-medium transition-colors ${
                                isCompleted ? 'text-red-800' : 'text-gray-500'
                            }`}>
                                {step.label}
                            </p>
                            {isCurrent && (
                                <p className="text-xs text-red-800 font-semibold mt-1">In progress</p>
                            )}
                        </div>
                    );
                })}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <Package size={20} className="text-red-800" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">Restaurant</p>
                            <p className="text-sm text-red-800">Pickup Location</p>
                        </div>
                    </div>
                    <p className="text-gray-700 font-medium">{order.restaurantId?.restaurantName}</p>
                    <p className="text-gray-500 text-sm">{order.restaurantId?.address}</p>
                </div>
                
                {riderLocation && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center space-x-3 mb-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <MapPin size={20} className="text-blue-800" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">Rider</p>
                                <p className="text-sm text-blue-800">On the way</p>
                            </div>
                        </div>
                        <p className="text-gray-700 font-medium">{order.riderId?.name || 'Your Rider'}</p>
                        <p className="text-gray-500 text-sm">
                            {riderLocation.latitude?.toFixed(4)}, {riderLocation.longitude?.toFixed(4)}
                        </p>
                    </div>
                )}
                
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <MapPin size={20} className="text-green-800" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">Your Location</p>
                            <p className="text-sm text-green-800">Delivery Address</p>
                        </div>
                    </div>
                    <p className="text-gray-700 font-medium">Delivery Address</p>
                    <p className="text-gray-500 text-sm">{order.deliveryAddress}</p>
                </div>
            </div>
        </div>
    );
};

// Profile Section Component
const ProfileSection = ({ user, profileData, onUpdateProfile }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(profileData);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setFormData(profileData);
    }, [profileData]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await onUpdateProfile(formData);
            setIsEditing(false);
        } catch (error) {
            console.error("Error saving profile:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData(profileData);
        setIsEditing(false);
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">PROFILE INFORMATION</h2>
                <div className="flex space-x-3">
                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center space-x-2 bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900 transition-colors"
                        >
                            <Edit size={16} />
                            <span>Edit Profile</span>
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center space-x-2 bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900 disabled:opacity-50 transition-colors"
                            >
                                <Save size={16} className={saving ? 'animate-spin' : ''} />
                                <span>{saving ? 'Saving...' : 'Save'}</span>
                            </button>
                            <button
                                onClick={handleCancel}
                                className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
                            >
                                <X size={16} />
                                <span>Cancel</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center space-x-4 p-4 bg-red-50 rounded-lg">
                    <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center">
                        <User size={24} className="text-red-800" />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900">{user?.name}</h3>
                        <p className="text-gray-600">{user?.email}</p>
                        <p className="text-sm text-red-800 font-medium">Customer Account</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Full Name
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-red-800 focus:border-red-800 transition-colors"
                                    placeholder="Enter your full name"
                                />
                            ) : (
                                <p className="p-3 bg-gray-50 rounded text-gray-900">{profileData.name}</p>
                            )}
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            {isEditing ? (
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-red-800 focus:border-red-800 transition-colors"
                                    placeholder="Enter your email"
                                />
                            ) : (
                                <p className="p-3 bg-gray-50 rounded text-gray-900">{profileData.email}</p>
                            )}
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Phone Number
                            </label>
                            {isEditing ? (
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-red-800 focus:border-red-800 transition-colors"
                                    placeholder="Enter your phone number"
                                />
                            ) : (
                                <p className="p-3 bg-gray-50 rounded text-gray-900">
                                    {profileData.phone || 'Not provided'}
                                </p>
                            )}
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Delivery Address
                            </label>
                            {isEditing ? (
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => handleInputChange('address', e.target.value)}
                                    rows="3"
                                    className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-red-800 focus:border-red-800 transition-colors"
                                    placeholder="Enter your delivery address"
                                />
                            ) : (
                                <p className="p-3 bg-gray-50 rounded text-gray-900">
                                    {profileData.address || 'Not provided'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Cart Sidebar Component
const CartSidebar = ({ cart, onUpdateQuantity, onRemoveItem, onPlaceOrder, isOpen, onClose, isAuthenticated, onRequireAuth }) => {
    const getCartTotal = () => {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const handlePlaceOrder = () => {
        if (!isAuthenticated) {
            onRequireAuth('placeOrder', onPlaceOrder);
            return;
        }
        onPlaceOrder();
    };

    return (
        <div className={`fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl transform transition-transform duration-300 ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
        } z-50`}>
            <div className="p-6 h-full flex flex-col">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h3 className="text-xl font-bold text-gray-900">YOUR CART</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {cart.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <ShoppingCart size={64} className="text-gray-300 mb-4" />
                        <p className="text-gray-500 text-lg">Your cart is empty</p>
                        <p className="text-gray-400 text-sm mt-2">Add some delicious items to get started!</p>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto space-y-4">
                            {cart.map((item, index) => (
                                <div 
                                    key={item._id} 
                                    className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg"
                                >
                                    <div className="w-16 h-16 bg-red-100 rounded flex items-center justify-center">
                                        <span className="text-lg"></span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-gray-900 truncate">{item.name}</h4>
                                        <p className="text-red-800 font-bold">₱{item.price?.toFixed(2)}</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => onUpdateQuantity(item._id, item.quantity - 1)}
                                            className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-gray-600 hover:bg-gray-300 transition-colors"
                                        >
                                            -
                                        </button>
                                        <span className="font-medium w-8 text-center text-gray-900">{item.quantity}</span>
                                        <button
                                            onClick={() => onUpdateQuantity(item._id, item.quantity + 1)}
                                            className="w-8 h-8 bg-red-800 text-white rounded flex items-center justify-center hover:bg-red-900 transition-colors"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t pt-4 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-medium text-gray-900">₱{getCartTotal().toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-red-800 font-bold">Delivery Fee</span>
                                <span className="font-bold text-red-800">₱20.00</span>
                            </div>
                            <div className="flex justify-between pt-3 border-t border-gray-300">
                                <span className="text-lg font-bold text-gray-900">TOTAL</span>
                                <span className="text-lg font-extrabold text-red-800">₱{(getCartTotal() + 20).toFixed(2)}</span>
                            </div>
                            
                            <button 
                                className="w-full bg-red-800 text-white py-3 rounded font-bold text-lg hover:bg-red-900 transition-colors mt-4"
                                onClick={handlePlaceOrder}
                            >
                                {isAuthenticated ? `PLACE ORDER - ₱{(getCartTotal() + 20).toFixed(2)}` : 'LOGIN TO ORDER'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

// Footer Component
const Footer = () => {
    return (
        <footer className="bg-gray-900 text-white">
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <h3 className="text-xl font-bold text-white mb-4">FOODEXPRESS</h3>
                        <p className="text-gray-400 mb-4">
                            Delivering delicious food to your doorstep with the best quality and service.
                        </p>
                        <div className="flex space-x-4">
                            {[Facebook, Twitter, Instagram, Youtube].map((Icon, index) => (
                                <Icon 
                                    key={index}
                                    size={20} 
                                    className="text-gray-400 hover:text-white cursor-pointer transition-colors" 
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-4">QUICK LINKS</h4>
                        <ul className="space-y-2 text-gray-400">
                            {['About Us', 'Contact Us', 'FAQs', 'Privacy Policy'].map((link, index) => (
                                <li key={index}>
                                    <button className="hover:text-white transition-colors">
                                        {link}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-4">CONTACT INFO</h4>
                        <div className="space-y-2 text-gray-400">
                            <div className="flex items-center space-x-2 hover:text-white transition-colors">
                                <Phone size={16} />
                                <span>09105019330</span>
                            </div>
                            <div className="flex items-center space-x-2 hover:text-white transition-colors">
                                <Mail size={16} />
                                <span>foodexpress@delivery.com</span>
                            </div>
                            <div className="flex items-center space-x-2 hover:text-white transition-colors">
                                <Map size={16} />
                                <span>Puerto Princesa City, Philippines</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-4">NEWSLETTER</h4>
                        <p className="text-gray-400 mb-4">Subscribe to get special offers and updates</p>
                        <div className="flex">
                            <input 
                                type="email" 
                                placeholder="Your email" 
                                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-l focus:outline-none focus:border-red-800 transition-colors"
                            />
                            <button className="bg-red-800 text-white px-4 py-2 rounded-r hover:bg-red-900 transition-colors">
                                SUBSCRIBE
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-t border-gray-800">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
                        <p>&copy; 2025 FoodExpress Delivery Service. All rights reserved.</p>
                        <div className="flex space-x-4 mt-2 md:mt-0">
                            {['Terms & Conditions', 'Privacy Policy', 'Sitemap'].map((item, index) => (
                                <span 
                                    key={index}
                                    className="hover:text-white transition-colors cursor-pointer"
                                >
                                    {item}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

// Main Customer Dashboard Component
export default function CustomerDashboard() {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authMode, setAuthMode] = useState('login');
    const [authLoading, setAuthLoading] = useState(false);
    
    // Dashboard states
    const [restaurants, setRestaurants] = useState([]);
    const [selectedRestaurant, setSelectedRestaurant] = useState(null);
    const [menuItems, setMenuItems] = useState([]);
    const [cart, setCart] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("home");
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [riderLocations, setRiderLocations] = useState({});
    const [locationRefreshTime, setLocationRefreshTime] = useState(null);
    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        latitude: null,
        longitude: null
    });
    const [cartOpen, setCartOpen] = useState(false);
    const [filteredRestaurants, setFilteredRestaurants] = useState([]);
    const [filteredMenuItems, setFilteredMenuItems] = useState([]);
    
    const navigate = useNavigate();

    // Sync profile data when user changes
    useEffect(() => {
        if (user) {
            const userProfileData = {
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                address: user.address || '',
                latitude: user.latitude || null,
                longitude: user.longitude || null
            };
            setProfileData(userProfileData);
        }
    }, [user]);

    // Check authentication on component mount - ALLOW BROWSING WITHOUT LOGIN
   // Check authentication on component mount - ALLOW BROWSING WITHOUT LOGIN
useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    const role = localStorage.getItem("role");

    console.log("Auth Check - Token:", !!token, "UserData:", !!userData, "Role:", role);

    if (token && userData && role === "customer") {
        const userObj = JSON.parse(userData);
        setUser(userObj);
        setIsAuthenticated(true);
        
        const userProfileData = {
            name: userObj.name || '',
            email: userObj.email || '',
            phone: userObj.phone || '',
            address: userObj.address || '',
            latitude: userObj.latitude || null,
            longitude: userObj.longitude || null
        };
        setProfileData(userProfileData);
        
        initializeDashboardData(userObj, token);
    } else {
        // IMPORTANT: ALWAYS LOAD RESTAURANTS EVEN IF NOT AUTHENTICATED
        console.log("User not authenticated, loading restaurants for browsing...");
        fetchRestaurants();
        setLoading(false);
    }
}, [navigate]);

    // Authentication handlers
    const handleLogin = async (email, password) => {
        setAuthLoading(true);
        try {
            const response = await axios.post("http://localhost:5000/api/auth/login", {
                email,
                password,
            });

            const userData = {
                id: response.data.user.id,
                name: response.data.user.name,
                email: response.data.user.email,
                phone: response.data.user.phone || '',
                address: response.data.user.address || '',
                latitude: response.data.user.latitude || null,
                longitude: response.data.user.longitude || null,
                role: response.data.user.role,
                status: response.data.user.status
            };

            localStorage.setItem("token", response.data.token);
            localStorage.setItem("role", response.data.role);
            localStorage.setItem("user", JSON.stringify(userData));

            if (response.data.role === "customer") {
                setUser(userData);
                setIsAuthenticated(true);
                setShowAuthModal(false);
                
                setProfileData({
                    name: userData.name,
                    email: userData.email,
                    phone: userData.phone,
                    address: userData.address,
                    latitude: userData.latitude,
                    longitude: userData.longitude
                });
                
                initializeDashboardData(userData, response.data.token);
            } else {
                window.location.href = `/${response.data.role}`;
            }
        } catch (error) {
            throw new Error(error.response?.data?.message || "Login failed. Please check your credentials.");
        } finally {
            setAuthLoading(false);
        }
    };

    const handleRegister = async (formData) => {
        setAuthLoading(true);
        try {
            const registrationData = {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                phone: formData.phone,
                role: formData.role,
                latitude: formData.latitude,
                longitude: formData.longitude,
                address: formData.address
            };

            if (formData.role === "restaurant") {
                registrationData.restaurantData = {
                    name: formData.restaurantName,
                    address: formData.restaurantAddress,
                    description: formData.restaurantDescription,
                    category: formData.restaurantCategory,
                    phone: formData.phone,
                    latitude: formData.latitude,
                    longitude: formData.longitude,
                };
            }

            if (formData.role === "rider") {
                registrationData.vehicleType = formData.vehicleType;
                registrationData.licenseNumber = formData.licenseNumber;
            }

            const response = await axios.post(
                "http://localhost:5000/api/auth/register",
                registrationData
            );

            const userData = {
                id: response.data.user.id,
                name: response.data.user.name,
                email: response.data.user.email,
                phone: response.data.user.phone || formData.phone,
                address: response.data.user.address || formData.address,
                latitude: response.data.user.latitude || formData.latitude,
                longitude: response.data.user.longitude || formData.longitude,
                role: response.data.user.role
            };

            localStorage.setItem("token", response.data.token);
            localStorage.setItem("role", response.data.role);
            localStorage.setItem("user", JSON.stringify(userData));

            if (response.data.role === "customer") {
                setUser(userData);
                setIsAuthenticated(true);
                setShowAuthModal(false);
                
                setProfileData({
                    name: userData.name,
                    email: userData.email,
                    phone: userData.phone,
                    address: userData.address,
                    latitude: userData.latitude,
                    longitude: userData.longitude
                });
                
                initializeDashboardData(userData, response.data.token);
            } else {
                window.location.href = `/${response.data.role}`;
            }
        } catch (error) {
            throw new Error(error.response?.data?.message || "Registration failed. Please try again.");
        } finally {
            setAuthLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        setUser(null);
        setIsAuthenticated(false);
        setRestaurants([]);
        setCart([]);
        setOrders([]);
        setProfileData({
            name: '',
            email: '',
            phone: '',
            address: '',
            latitude: null,
            longitude: null
        });
        setActiveTab("home");
    };

    const initializeDashboardData = async (userObj, token) => {
        try {
            setLoading(true);
            
            if (!userObj.phone || !userObj.address || !userObj.latitude) {
                try {
                    const userResponse = await axios.get(
                        `http://localhost:5000/api/customers/${userObj.id}`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    
                    const updatedUser = userResponse.data.user || userObj;
                    
                    const completeUserData = {
                        ...updatedUser,
                        phone: updatedUser.phone || userObj.phone,
                        address: updatedUser.address || userObj.address,
                        latitude: updatedUser.latitude || userObj.latitude,
                        longitude: updatedUser.longitude || userObj.longitude
                    };
                    
                    setUser(completeUserData);
                    localStorage.setItem('user', JSON.stringify(completeUserData));
                    
                    setProfileData({
                        name: completeUserData.name,
                        email: completeUserData.email,
                        phone: completeUserData.phone,
                        address: completeUserData.address,
                        latitude: completeUserData.latitude,
                        longitude: completeUserData.longitude
                    });
                    
                } catch (error) {
                    console.error("Error fetching user data:", error);
                    setProfileData({
                        name: userObj.name || '',
                        email: userObj.email || '',
                        phone: userObj.phone || '',
                        address: userObj.address || '',
                        latitude: userObj.latitude || null,
                        longitude: userObj.longitude || null
                    });
                }
            } else {
                setProfileData({
                    name: userObj.name,
                    email: userObj.email,
                    phone: userObj.phone,
                    address: userObj.address,
                    latitude: userObj.latitude,
                    longitude: userObj.longitude
                });
            }
            
            await Promise.all([
                fetchRestaurants(),
                fetchCustomerOrders(userObj.id, token)
            ]);
            
        } catch (error) {
            console.error("Error initializing dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    // NEW: Function to require authentication for protected features
    const requireAuth = (action, callback) => {
        if (!isAuthenticated) {
            setShowAuthModal(true);
            setAuthMode('login');
            return false;
        }
        if (callback) {
            callback();
        }
        return true;
    };

    // Real-time updates
    useEffect(() => {
        const interval = setInterval(() => {
            refreshActiveData();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const refreshActiveData = () => {
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("user");
        
        if (userData && token) {
            const userObj = JSON.parse(userData);
            fetchCustomerOrders(userObj.id, token);
            fetchRiderLocations();
        }
    };

    // SEARCH FUNCTIONALITY
    const handleSearch = (query) => {
        setSearchQuery(query);
        
        if (!query.trim()) {
            setFilteredRestaurants(restaurants.filter(restaurant => restaurant.status === 'approved'));
            setFilteredMenuItems(menuItems);
            return;
        }

        const searchTerm = query.toLowerCase().trim();

        const restaurantResults = restaurants.filter(restaurant => {
            if (restaurant.status !== 'approved') return false;
            
            return (
                restaurant.restaurantName?.toLowerCase().includes(searchTerm) ||
                restaurant.cuisineType?.toLowerCase().includes(searchTerm) ||
                restaurant.address?.toLowerCase().includes(searchTerm) ||
                restaurant.description?.toLowerCase().includes(searchTerm)
            );
        });

        const menuResults = menuItems.filter(item =>
            item.menuName?.toLowerCase().includes(searchTerm) ||
            item.description?.toLowerCase().includes(searchTerm) ||
            item.category?.toLowerCase().includes(searchTerm)
        );

        setFilteredRestaurants(restaurantResults);
        setFilteredMenuItems(menuResults);

        if (restaurantResults.length > 0 && activeTab !== 'restaurants' && activeTab !== 'menu') {
            setActiveTab('restaurants');
        }
    };

    // Initialize filtered data when restaurants or menu items change
    useEffect(() => {
        setFilteredRestaurants(restaurants.filter(restaurant => restaurant.status === 'approved'));
        setFilteredMenuItems(menuItems);
    }, [restaurants, menuItems]);

    // Real-time rider location updates
    const fetchRiderLocations = async () => {
        try {
            const token = localStorage.getItem("token");
            const activeOrders = orders.filter(order => 
                order.status === 'ready' || order.status === 'picked_up' || order.status === 'out_for_delivery'
            );

            for (const order of activeOrders) {
                if (order.riderId) {
                    try {
                        const response = await axios.get(
                            `http://localhost:5000/api/riders/${order.riderId}/location`,
                            { headers: { Authorization: `Bearer ${token}` } }
                        );
                        
                        if (response.data.location) {
                            setRiderLocations(prev => ({
                                ...prev,
                                [order.riderId]: response.data.location
                            }));
                        }
                    } catch (error) {
                        console.log(`No location data for rider ${order.riderId}`);
                    }
                }
            }
            
            setLocationRefreshTime(new Date());
        } catch (error) {
            console.error("Error fetching rider locations:", error);
        }
    };

    // Auto-refresh rider locations
    useEffect(() => {
        const activeOrders = orders.filter(order => 
            order.status === 'ready' || order.status === 'picked_up' || order.status === 'out_for_delivery'
        );
        
        if (activeOrders.length > 0) {
            fetchRiderLocations();
            const interval = setInterval(fetchRiderLocations, 20000);
            return () => clearInterval(interval);
        }
    }, [orders]);

    const fetchRestaurants = async () => {
        try {
            setLoading(true);
            console.log("Fetching restaurants...");
            
            const response = await axios.get("http://localhost:5000/api/restaurants");
            console.log("Restaurants API Response:", response.data);
            
            const approvedRestaurants = (response.data.restaurants || response.data || []).filter(restaurant => 
                restaurant.status === 'approved'
            );
            
            console.log("Approved Restaurants:", approvedRestaurants);
            setRestaurants(approvedRestaurants);
            setFilteredRestaurants(approvedRestaurants);
        } catch (error) {
            console.error("Error fetching restaurants:", error);
            console.error("Error details:", error.response?.data);
            setRestaurants([]);
            setFilteredRestaurants([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomerOrders = async (customerId, token) => {
        try {
            const response = await axios.get(
                `http://localhost:5000/api/orders/customer/${customerId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setOrders(response.data.orders || []);
        } catch (error) {
            console.error('Error fetching customer orders:', error);
            setOrders([]);
        }
    };

    const fetchRestaurantMenu = async (restaurantId) => {
        try {
            setLoading(true);
            const response = await axios.get(
                `http://localhost:5000/api/menu/restaurant/${restaurantId}`
            );
            
            let menuData = [];
            
            if (response.data.menus) {
                menuData = response.data.menus;
            } else if (response.data.menu) {
                menuData = response.data.menu;
            } else if (Array.isArray(response.data)) {
                menuData = response.data;
            }
            
            setMenuItems(menuData);
            setFilteredMenuItems(menuData);
            setSelectedRestaurant(restaurantId);
            setActiveTab("menu");
            
        } catch (error) {
            console.error("Error fetching menu:", error);
            setMenuItems([]);
            setFilteredMenuItems([]);
            alert("Error loading menu: " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (item) => {
        if (!requireAuth('addToCart', () => addToCart(item))) {
            return;
        }

        const existingItem = cart.find(cartItem => cartItem._id === item._id);
        
        if (existingItem) {
            setCart(cart.map(cartItem =>
                cartItem._id === item._id
                    ? { ...cartItem, quantity: cartItem.quantity + 1 }
                    : cartItem
            ));
        } else {
            setCart([...cart, { ...item, quantity: 1 }]);
        }
        
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-red-800 text-white px-4 py-2 rounded shadow-lg z-50';
        notification.textContent = `✅ ${item.name} added to cart!`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 2000);
    };

    const removeFromCart = (itemId) => {
        setCart(cart.filter(item => item._id !== itemId));
    };

    const updateQuantity = (itemId, newQuantity) => {
        if (newQuantity < 1) {
            removeFromCart(itemId);
            return;
        }
        
        setCart(cart.map(item =>
            item._id === itemId ? { ...item, quantity: newQuantity } : item
        ));
    };

    const getCartTotal = () => {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const placeOrder = async () => {
        if (cart.length === 0) {
            alert("Your cart is empty!");
            return;
        }

        if (!selectedRestaurant) {
            alert("Please select a restaurant first!");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const userObj = JSON.parse(localStorage.getItem("user"));
            
            const orderData = {
                restaurantId: selectedRestaurant,
                items: cart.map(item => ({
                    menuItemId: item._id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity
                })),
                totalAmount: getCartTotal(),
                deliveryAddress: userObj.address || "Please update your address",
                specialInstructions: "No special instructions"
            };

            const response = await axios.post(
                "http://localhost:5000/api/orders",
                orderData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setCart([]);
            setCartOpen(false);
            fetchCustomerOrders(userObj.id, token);
            alert("Order placed successfully! The restaurant will now prepare your food.");
            setActiveTab("orders");
        } catch (error) {
            console.error("❌ Error placing order:", error);
            alert("Error placing order: " + (error.response?.data?.error || error.message));
        }
    };

    // Update user profile function
    const updateUserProfile = async (updatedData) => {
        try {
            const token = localStorage.getItem("token");
            const userObj = JSON.parse(localStorage.getItem("user"));
            
            if (!token) {
                alert("❌ No authentication token found. Please log in again.");
                return false;
            }

            let response;

            try {
                response = await axios.put(
                    `http://localhost:5000/api/customers/profile`,
                    updatedData,
                    { 
                        headers: { 
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        } 
                    }
                );
            } catch (firstError) {
                try {
                    response = await axios.put(
                        `http://localhost:5000/api/customers/${userObj.id}`,
                        updatedData,
                        { 
                            headers: { 
                                Authorization: `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            } 
                        }
                    );
                } catch (secondError) {
                    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
                    const updatedUser = {
                        ...currentUser,
                        ...updatedData,
                        updatedAt: new Date().toISOString()
                    };
                    
                    setUser(updatedUser);
                    setProfileData(updatedData);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    
                    alert("⚠️ Profile saved locally (server update failed). Some features may not work properly.");
                    return true;
                }
            }

            if (response.data.user) {
                const updatedUser = response.data.user;
                setUser(updatedUser);
                setProfileData({
                    name: updatedUser.name,
                    email: updatedUser.email,
                    phone: updatedUser.phone,
                    address: updatedUser.address,
                    latitude: updatedUser.latitude,
                    longitude: updatedUser.longitude
                });
                
                localStorage.setItem('user', JSON.stringify(updatedUser));
                alert("✅ Profile updated successfully!");
                return true;
            } else {
                alert("❌ Unexpected response format from server");
                return false;
            }
            
        } catch (error) {
            console.error("❌ Error updating profile:", error);
            alert("Error updating profile. Please try again.");
            return false;
        }
    };

    // Button handlers
    const handleOrderNow = () => {
        if (!requireAuth('orderNow', () => setActiveTab("restaurants"))) {
            return;
        }
        setActiveTab("restaurants");
    };

    const handleBrowseRestaurants = () => {
        setActiveTab("restaurants");
    };

    // Header Component
    const Header = ({ user, onLogout, searchQuery, setSearchQuery, activeTab, setActiveTab, cartItemCount, onCartOpen, onSearch }) => {
        const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
        const [isScrolled, setIsScrolled] = useState(false);

        const navigationItems = [
            { name: 'HOME', tab: 'home' },
            { name: 'RESTAURANTS', tab: 'restaurants' },
            ...(isAuthenticated ? [
                { name: 'MY ORDERS', tab: 'orders' },
                { name: 'TRACK ORDER', tab: 'tracking' },
                { name: 'PROFILE', tab: 'profile' },
            ] : [])
        ];

        useEffect(() => {
            const handleScroll = () => {
                setIsScrolled(window.scrollY > 10);
            };
            window.addEventListener('scroll', handleScroll);
            return () => window.removeEventListener('scroll', handleScroll);
        }, []);

        const handleSearchSubmit = (e) => {
            e.preventDefault();
            onSearch(searchQuery);
        };

        const handleProtectedAction = (tab) => {
            if (['orders', 'tracking', 'profile'].includes(tab) && !isAuthenticated) {
                setShowAuthModal(true);
                setAuthMode('login');
                return;
            }
            setActiveTab(tab);
        };

        return (
            <header className={`bg-white shadow-md sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'shadow-lg' : 'shadow-md'}`}>
                <div className="bg-gray-800 text-white py-2">
                    <div className="max-w-7xl mx-auto px-4 text-center text-sm">
                        Free delivery on orders over ₱299! • ⭐ Rate your experience and get rewards
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button 
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="lg:hidden text-gray-700 hover:text-red-800 transition-colors"
                            >
                                <Menu size={24} />
                            </button>
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-red-800 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">
                                    FX
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-red-800">FOODEXPRESS</h1>
                                    <p className="text-xs text-gray-600">Delivery Service</p>
                                </div>
                            </div>
                        </div>

                        <nav className="hidden lg:flex items-center space-x-8">
                            {navigationItems.map(item => (
                                <button
                                    key={item.tab}
                                    onClick={() => handleProtectedAction(item.tab)}
                                    className={`font-semibold text-sm hover:text-red-800 transition-colors ${
                                        activeTab === item.tab ? 'text-red-800 border-b-2 border-red-800' : 'text-gray-700'
                                    }`}
                                >
                                    {item.name}
                                </button>
                            ))}
                        </nav>

                        <div className="flex items-center space-x-4">
                            {isAuthenticated ? (
                                <>
                                    <button 
                                        onClick={() => requireAuth('cart', onCartOpen)}
                                        className="relative flex items-center space-x-2 text-gray-700 hover:text-red-800 transition-colors"
                                    >
                                        <ShoppingCart size={24} />
                                        {cartItemCount > 0 && (
                                            <span className="absolute -top-2 -right-2 bg-red-800 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                                                {cartItemCount}
                                            </span>
                                        )}
                                        <span className="hidden sm:block font-medium">CART</span>
                                    </button>
                                    
                                    <button 
                                        onClick={onLogout}
                                        className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900 transition-colors shadow-md"
                                    >
                                        LOGOUT
                                    </button>
                                </>
                            ) : (
                                <div className="flex items-center space-x-3">
                                    <button 
                                        onClick={() => { setShowAuthModal(true); setAuthMode('login'); }}
                                        className="text-gray-700 hover:text-red-800 font-medium transition-colors"
                                    >
                                        LOGIN
                                    </button>
                                    <button 
                                        onClick={() => { setShowAuthModal(true); setAuthMode('register'); }}
                                        className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900 transition-colors shadow-md"
                                    >
                                        SIGN UP
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={`lg:hidden transition-all duration-300 overflow-hidden ${mobileMenuOpen ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                        <div className="bg-white border rounded-lg shadow-lg">
                            <div className="flex flex-col space-y-2 p-4">
                                {navigationItems.map(item => (
                                    <button
                                        key={item.tab}
                                        onClick={() => {
                                            handleProtectedAction(item.tab);
                                            setMobileMenuOpen(false);
                                        }}
                                        className={`text-left py-2 px-4 rounded font-semibold transition-colors ${
                                            activeTab === item.tab 
                                                ? 'bg-red-800 text-white' 
                                                : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                    >
                                        {item.name}
                                    </button>
                                ))}
                                {!isAuthenticated && (
                                    <div className="flex space-x-2 pt-2 border-t border-gray-200">
                                        <button
                                            onClick={() => {
                                                setShowAuthModal(true);
                                                setAuthMode('login');
                                                setMobileMenuOpen(false);
                                            }}
                                            className="flex-1 text-center py-2 px-4 border border-red-800 text-red-800 rounded font-semibold hover:bg-red-50 transition-colors"
                                        >
                                            LOGIN
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowAuthModal(true);
                                                setAuthMode('register');
                                                setMobileMenuOpen(false);
                                            }}
                                            className="flex-1 text-center py-2 px-4 bg-red-800 text-white rounded font-semibold hover:bg-red-900 transition-colors"
                                        >
                                            SIGN UP
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-100 border-t border-b border-gray-200 py-4">
                    <div className="max-w-7xl mx-auto px-4">
                        <form onSubmit={handleSearchSubmit} className="flex items-center space-x-4">
                            <div className="flex-1 max-w-2xl">
                                <div className="relative">
                                    <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input 
                                        type="text" 
                                        placeholder="Search for restaurants, cuisines, or dishes..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded focus:ring-2 focus:ring-red-800 focus:border-red-800 transition-colors"
                                    />
                                </div>
                            </div>
                            <button 
                                type="submit"
                                className="flex items-center space-x-2 bg-red-800 text-white px-6 py-3 rounded hover:bg-red-900 transition-colors"
                            >
                                <Search size={16} />
                                <span>SEARCH</span>
                            </button>
                            <button 
                                type="button"
                                className="flex items-center space-x-2 bg-white border border-gray-300 px-4 py-3 rounded hover:border-red-800 transition-colors"
                            >
                                <Filter size={16} />
                                <span className="font-semibold">FILTER</span>
                            </button>
                        </form>
                    </div>
                </div>
            </header>
        );
    };

    // Hero Banner Component
    const HeroBanner = ({ onOrderNow, onBrowseRestaurants }) => {
        const handleOrderNow = () => {
            if (!isAuthenticated) {
                setShowAuthModal(true);
                setAuthMode('login');
                return;
            }
            onOrderNow();
        };

        return (
            <div className="bg-gradient-to-r from-red-800 to-red-900 text-white py-16 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 relative z-10">
                    <div className="text-center">
                        <h1 className="text-4xl md:text-5xl font-bold mb-6">
                            DELICIOUS FOOD DELIVERED TO YOUR DOORSTEP
                        </h1>
                        <p className="text-lg md:text-xl mb-8 opacity-90">
                            Experience the best food delivery service in town
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                            <button 
                                onClick={handleOrderNow}
                                className="bg-white text-red-800 px-8 py-4 rounded font-bold text-lg hover:bg-gray-100 transition-colors"
                            >
                                {isAuthenticated ? "ORDER NOW" : "LOGIN TO ORDER"}
                            </button>
                            <button 
                                onClick={onBrowseRestaurants}
                                className="border-2 border-white text-white px-8 py-4 rounded font-bold text-lg hover:bg-white hover:text-red-800 transition-colors"
                            >
                                BROWSE RESTAURANTS
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Restaurant Card Component
    const RestaurantCard = ({ restaurant, onViewMenu }) => {
        const [logoError, setLogoError] = useState(false);
        const [isFavorite, setIsFavorite] = useState(false);
        const [imageLoaded, setImageLoaded] = useState(false);

        if (restaurant.status !== 'approved') {
            return null;
        }

        const handleOrderClick = () => {
            if (!isAuthenticated) {
                setShowAuthModal(true);
                setAuthMode('login');
                return;
            }
            onViewMenu(restaurant._id);
        };

        return (
            <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200">
                <div className="relative h-48 bg-gray-200 overflow-hidden">
                    {restaurant.logo && !logoError ? (
                        <img 
                            src={`http://localhost:5000${restaurant.logo}`} 
                            alt={restaurant.restaurantName || restaurant.name}
                            className={`w-full h-full object-cover transition-all duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                            onLoad={() => setImageLoaded(true)}
                            onError={() => setLogoError(true)}
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center">
                            <div className="text-white text-4xl"></div>
                        </div>
                    )}
                    
                    {!imageLoaded && restaurant.logo && !logoError && (
                        <div className="absolute inset-0 bg-gray-300"></div>
                    )}
                    
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsFavorite(!isFavorite); }}
                        className={`absolute top-3 right-3 p-2 rounded-full transition-colors ${
                            isFavorite ? 'bg-red-100 text-red-800' : 'bg-white text-gray-400'
                        } hover:bg-red-100 hover:text-red-800 shadow-md`}
                    >
                        <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />
                    </button>
                    
                    {restaurant.promo && (
                        <div className="absolute top-3 left-3 bg-yellow-500 text-white px-3 py-1 rounded text-sm font-bold shadow-md">
                            {restaurant.promo}
                        </div>
                    )}
                </div>

                <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                        <h3 className="text-xl font-bold text-gray-900 flex-1 hover:text-red-800 transition-colors">
                            {restaurant.restaurantName || restaurant.name}
                        </h3>
                        <div className="flex items-center space-x-1 ml-2">
                            <Star size={16} className="text-yellow-400 fill-current" />
                            <span className="text-sm font-bold text-gray-900">{restaurant.rating || '0'}</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center text-gray-600 text-sm mb-3">
                        <MapPin size={14} className="mr-1 text-red-800" />
                        <span className="truncate">{restaurant.address || 'Location details unavailable'}</span>
                    </div>

                    <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                        <span className="bg-gray-100 px-3 py-1 rounded transition-colors hover:bg-red-100 hover:text-red-800">
                            {restaurant.cuisineType || 'Mixed Cuisine'}
                        </span>
                        <span className="text-green-600 font-semibold flex items-center">
                            <Clock size={14} className="mr-1" />
                            {restaurant.deliveryTime || '20-30 min'}
                        </span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-red-800 font-bold text-lg">
                            ₱{restaurant.deliveryFee || '35'} delivery
                        </span>
                        <button
                            onClick={handleOrderClick}
                            className="bg-red-800 text-white px-6 py-2 rounded hover:bg-red-900 transition-colors"
                        >
                            {isAuthenticated ? "ORDER" : "LOGIN TO ORDER"}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Menu Item Card Component
    const MenuItemCard = ({ item, onAddToCart }) => {
        const [imageError, setImageError] = useState(false);
        const [imageLoaded, setImageLoaded] = useState(false);
        const [isAdding, setIsAdding] = useState(false);

        const handleAddToCart = async () => {
            setIsAdding(true);
            await onAddToCart(item);
            setTimeout(() => setIsAdding(false), 600);
        };

        return (
            <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-300">
                <div className="flex space-x-4">
                    {item.image && !imageError ? (
                        <div className="flex-shrink-0 w-24 h-24 relative">
                            <img 
                                src={`http://localhost:5000${item.image}`} 
                                alt={item.menuName || item.name} 
                                className={`w-full h-full object-cover rounded-lg transition-all duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                                onLoad={() => setImageLoaded(true)}
                                onError={() => setImageError(true)}
                            />
                            {!imageLoaded && (
                                <div className="absolute inset-0 bg-gray-300 rounded-lg"></div>
                            )}
                        </div>
                    ) : (
                        <div className="flex-shrink-0 w-24 h-24 bg-gradient-to-br from-red-100 to-red-200 rounded-lg flex items-center justify-center">
                            <span className="text-2xl"></span>
                        </div>
                    )}
                    
                    <div className="flex-grow flex flex-col justify-between min-w-0">
                        <div>
                            <h4 className="font-bold text-gray-900 text-lg mb-1 hover:text-red-800 transition-colors">
                                {item.menuName || item.name || 'Unnamed Item'}
                            </h4>
                            <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                                {item.description || item.menuDescription || 'Delicious meal item'}
                            </p>
                        </div>
                        
                        <div className="flex justify-between items-center">
                            <span className="font-extrabold text-red-800 text-xl">
                                ₱{item.price?.toFixed(2) || item.menuPrice?.toFixed(2) || '0.00'}
                            </span>
                            <button 
                                onClick={handleAddToCart}
                                disabled={isAdding}
                                className={`bg-red-800 text-white rounded px-4 py-2 transition-colors ${
                                    isAdding 
                                        ? 'bg-green-600' 
                                        : 'hover:bg-red-900'
                                } font-semibold`}
                            >
                                {isAdding ? 'ADDED!' : 'ADD TO CART'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Get restaurant location data
    const getRestaurantLocation = (order) => {
        const restaurant = restaurants.find(r => r._id === order.restaurantId?._id || r._id === order.restaurantId);
        if (restaurant && restaurant.latitude && restaurant.longitude) {
            return {
                latitude: restaurant.latitude,
                longitude: restaurant.longitude,
                address: restaurant.address
            };
        }
        
        return {
            latitude: 14.5995 + (Math.random() - 0.5) * 0.01,
            longitude: 120.9842 + (Math.random() - 0.5) * 0.01,
            address: order.restaurantId?.address || 'Restaurant Location'
        };
    };

    // Get rider location data
    const getRiderLocation = (order) => {
        if (order.riderId && riderLocations[order.riderId]) {
            return riderLocations[order.riderId];
        }
        
        const restaurantLoc = getRestaurantLocation(order);
        const userLoc = {
            latitude: user?.latitude || 14.5995,
            longitude: user?.longitude || 120.9842
        };
        
        return {
            latitude: (restaurantLoc.latitude + userLoc.latitude) / 2 + (Math.random() - 0.5) * 0.005,
            longitude: (restaurantLoc.longitude + userLoc.longitude) / 2 + (Math.random() - 0.5) * 0.005,
            timestamp: new Date().toISOString()
        };
    };

    // Get user location data
    const getUserLocation = () => {
        return {
            latitude: user?.latitude || 14.5995,
            longitude: user?.longitude || 120.9842,
            address: user?.address || 'Your Location'
        };
    };

    // Render Home Content
    const renderHomeContent = () => (
        <div className="space-y-12">
            <HeroBanner 
                onOrderNow={handleOrderNow}
                onBrowseRestaurants={handleBrowseRestaurants}
            />
            
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">FEATURED RESTAURANTS</h2>
                    <button 
                        onClick={() => setActiveTab("restaurants")}
                        className="text-red-800 hover:text-red-900 font-semibold transition-colors"
                    >
                        VIEW ALL →
                    </button>
                </div>
                
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-gray-200 rounded-lg p-4">
                                <div className="h-48 bg-gray-300 rounded-lg mb-4"></div>
                                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                                <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                            </div>
                        ))}
                    </div>
                ) : filteredRestaurants.length === 0 ? (
                    <div className="bg-gray-50 rounded-lg p-12 text-center">
                        <div className="text-6xl mb-4 text-gray-400"></div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {searchQuery ? 'No restaurants found' : 'No approved restaurants available'}
                        </h3>
                        <p className="text-gray-600">
                            {searchQuery ? 'Try adjusting your search terms' : 'Please check back later for available restaurants.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {filteredRestaurants.slice(0, 4).map((restaurant) => (
                            <RestaurantCard key={restaurant._id} restaurant={restaurant} onViewMenu={fetchRestaurantMenu} />
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-red-800 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold mb-4">SPECIAL OFFER!</h2>
                    <p className="text-xl mb-6">Get 20% OFF on your first order with promo code: WELCOME20</p>
                    <button 
                        onClick={handleOrderNow}
                        className="bg-white text-red-800 px-8 py-3 rounded font-bold text-lg hover:bg-gray-100 transition-colors"
                    >
                        {isAuthenticated ? "GRAB THIS OFFER" : "LOGIN TO GET OFFER"}
                    </button>
                </div>
            </div>
        </div>
    );

    // Render Restaurants Content
    const renderRestaurantsContent = () => (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    {searchQuery ? `SEARCH RESULTS FOR "${searchQuery}"` : 'ALL RESTAURANTS'}
                </h1>
                <p className="text-gray-600">
                    {searchQuery 
                        ? `Found ${filteredRestaurants.length} restaurants matching your search`
                        : 'Discover the best restaurants in your area'
                    }
                </p>
            </div>
            
            {loading ? (
                <div className="text-center py-12">
                    <div className="w-16 h-16 border-t-4 border-red-800 border-solid rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading restaurants...</p>
                </div>
            ) : filteredRestaurants.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                    <div className="text-6xl mb-4 text-gray-400"></div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {searchQuery ? 'No restaurants found' : 'No restaurants available'}
                    </h3>
                    <p className="text-gray-600">
                        {searchQuery ? 'Try adjusting your search terms' : 'Please check back later for available restaurants.'}
                    </p>
                    {searchQuery && (
                        <button 
                            onClick={() => {
                                setSearchQuery('');
                                handleSearch('');
                            }}
                            className="bg-red-800 text-white px-6 py-3 rounded hover:bg-red-900 transition-colors mt-4"
                        >
                            CLEAR SEARCH
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRestaurants.map((restaurant) => (
                        <RestaurantCard key={restaurant._id} restaurant={restaurant} onViewMenu={fetchRestaurantMenu} />
                    ))}
                </div>
            )}
        </div>
    );

    // Render Menu Content
    const renderMenuContent = () => {
        const restaurant = restaurants.find(r => r._id === selectedRestaurant);
        
        return (
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="mb-6">
                    <button
                        onClick={() => { setActiveTab("restaurants"); setSelectedRestaurant(null); }}
                        className="text-red-800 hover:text-red-900 font-semibold flex items-center mb-4 transition-colors"
                    >
                        ← BACK TO RESTAURANTS
                    </button>
                    
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                    {restaurant?.restaurantName || restaurant?.name || 'Restaurant'}
                                </h1>
                                <p className="text-gray-600 mb-2">{restaurant?.address}</p>
                                <div className="flex items-center space-x-4 text-sm">
                                    <div className="flex items-center space-x-1">
                                        <Star size={16} className="text-yellow-400 fill-current" />
                                        <span className="font-semibold">{restaurant?.rating || '4.5'}</span>
                                    </div>
                                    <span className="text-gray-400">•</span>
                                    <span className="text-gray-600">{restaurant?.cuisineType || 'Mixed Cuisine'}</span>
                                    <span className="text-gray-400">•</span>
                                    <span className="text-green-600 font-semibold">{restaurant?.status || 'Open'}</span>
                                </div>
                            </div>
                            <div className="mt-4 lg:mt-0">
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <p className="font-semibold text-red-800">Delivery Info</p>
                                    <p className="text-sm text-gray-600">₱{restaurant?.deliveryFee || '35'} • {restaurant?.deliveryTime || '20-30 min'}</p>
                                </div>
                            </div>
                        </div>
    
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 border-t-4 border-red-800 border-solid rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-gray-600">Loading menu...</p>
                            </div>
                        ) : filteredMenuItems.length === 0 ? (
                            <div className="bg-gray-50 rounded-lg p-12 text-center">
                                <div className="text-6xl mb-4 text-gray-400"></div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    {searchQuery ? 'No menu items found' : 'Menu not available'}
                                </h3>
                                <p className="text-gray-600">
                                    {searchQuery ? 'Try adjusting your search terms' : 'This restaurant hasn\'t added any items to their menu yet.'}
                                </p>
                                {searchQuery && (
                                    <button 
                                        onClick={() => {
                                            setSearchQuery('');
                                            handleSearch('');
                                        }}
                                        className="bg-red-800 text-white px-6 py-3 rounded hover:bg-red-900 transition-colors mt-4"
                                    >
                                        CLEAR SEARCH
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {filteredMenuItems.map((item) => (
                                    <MenuItemCard key={item._id || item.menuId} item={item} onAddToCart={addToCart} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Render Orders Content
    const renderOrdersContent = () => {
        if (!isAuthenticated) {
            return (
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <div className="text-6xl mb-4"></div>
                        <h3 className="text-2xl font-semibold text-gray-900 mb-4">Please Login to View Orders</h3>
                        <p className="text-gray-600 mb-6">You need to be logged in to view your order history.</p>
                        <button 
                            onClick={() => { setShowAuthModal(true); setAuthMode('login'); }}
                            className="bg-red-800 text-white px-6 py-3 rounded hover:bg-red-900 transition-colors"
                        >
                            LOGIN TO CONTINUE
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">MY ORDERS</h1>

                    {orders.length === 0 ? (
                        <div className="bg-gray-50 rounded-lg p-12 text-center">
                            <div className="text-6xl mb-4"></div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h3>
                            <p className="text-gray-600 mb-4">Your orders will appear here once you place them.</p>
                            <button 
                                onClick={() => setActiveTab("restaurants")}
                                className="bg-red-800 text-white px-6 py-3 rounded hover:bg-red-900 transition-colors"
                            >
                                BROWSE RESTAURANTS
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {orders.map((order) => (
                                <div 
                                    key={order._id} 
                                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-300"
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                                Order #{(order._id || '').substring(0, 8).toUpperCase()}
                                            </h3>
                                            <p className="text-gray-600 mb-1">
                                                <strong>Restaurant:</strong> {order.restaurantId?.restaurantName || order.restaurantId?.name || 'Unknown Restaurant'}
                                            </p>
                                            <p className="text-gray-600 mb-1">
                                                <strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString()}
                                            </p>
                                            <p className="text-gray-600">
                                                <strong>Delivery Address:</strong> {order.deliveryAddress}
                                            </p>
                                        </div>
                                        <div className="mt-4 lg:mt-0 lg:text-right">
                                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                                                order.status === 'ready' ? 'bg-green-100 text-green-800' :
                                                order.status === 'delivered' ? 'bg-purple-100 text-purple-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {order.status?.toUpperCase() || 'PENDING'}
                                            </span>
                                            <p className="text-2xl font-bold text-red-800 mt-2">₱{order.totalAmount?.toFixed(2)}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="mb-4">
                                        <p className="font-medium text-gray-700 mb-2">Items Ordered:</p>
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            {order.items?.map((item, itemIndex) => (
                                                <div key={itemIndex} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                                                    <span>{item.quantity}x {item.name}</span>
                                                    <span className="font-semibold">₱{(item.price * item.quantity).toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="flex space-x-4 pt-4 border-t border-gray-200">
                                        <button 
                                            onClick={() => { setSelectedOrder(order); setActiveTab("tracking"); }}
                                            className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900 transition-colors"
                                        >
                                            TRACK ORDER
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Render Tracking Content
    const renderTrackingContent = () => {
        if (!isAuthenticated) {
            return (
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                        <div className="text-6xl mb-4">🚴</div>
                        <h3 className="text-2xl font-semibold text-gray-900 mb-4">Please Login to Track Orders</h3>
                        <p className="text-gray-600 mb-6">You need to be logged in to track your orders.</p>
                        <button 
                            onClick={() => { setShowAuthModal(true); setAuthMode('login'); }}
                            className="bg-red-800 text-white px-6 py-3 rounded hover:bg-red-900 transition-colors"
                        >
                            LOGIN TO CONTINUE
                        </button>
                    </div>
                </div>
            );
        }

        const orderToTrack = selectedOrder || orders.find(o => o.status !== 'delivered') || orders[0];
        
        if (!orderToTrack) {
            return (
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h2 className="text-3xl font-bold text-gray-900 mb-6">ORDER TRACKING</h2>
                        <div className="bg-gray-50 rounded-lg p-12 text-center">
                            <div className="text-6xl mb-4">🚴</div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No active orders</h3>
                            <p className="text-gray-600">You don't have any orders to track right now.</p>
                            <button 
                                onClick={() => setActiveTab("restaurants")}
                                className="bg-red-800 text-white px-6 py-3 rounded hover:bg-red-900 transition-colors mt-4"
                            >
                                ORDER FOOD
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        const restaurantLocation = getRestaurantLocation(orderToTrack);
        const riderLocation = getRiderLocation(orderToTrack);
        const userLocation = getUserLocation();

        return (
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="space-y-6">
                    <OrderTracking 
                        order={orderToTrack}
                        userLocation={userLocation}
                        riderLocation={riderLocation}
                        restaurantLocation={restaurantLocation}
                        onRefreshLocation={fetchRiderLocations}
                    />
                    
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Live Delivery Map</h3>
                            {locationRefreshTime && (
                                <p className="text-sm text-gray-500">
                                    Last updated: {locationRefreshTime.toLocaleTimeString()}
                                </p>
                            )}
                        </div>
                        
                        <OrderTrackingMap 
                            order={orderToTrack}
                            userLocation={userLocation}
                            riderLocation={riderLocation}
                            restaurantLocation={restaurantLocation}
                            height="400px"
                        />
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-xl font-bold mb-4">Order Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-2">Items</h4>
                                <div className="space-y-2">
                                    {orderToTrack.items?.map((item, index) => (
                                        <div key={index} className="flex justify-between text-sm border-b border-gray-200 pb-2">
                                            <span>{item.quantity}x {item.name}</span>
                                            <span className="font-semibold">₱{(item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-2">Delivery Information</h4>
                                <div className="space-y-2 text-sm">
                                    <p><strong>Address:</strong> {orderToTrack.deliveryAddress}</p>
                                    <p><strong>Rider:</strong> {orderToTrack.riderId?.name || 'Not assigned yet'}</p>
                                    <p><strong>Restaurant:</strong> {orderToTrack.restaurantId?.restaurantName || orderToTrack.restaurantId?.name}</p>
                                    <p><strong>Total Amount:</strong> ₱{orderToTrack.totalAmount?.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Render Profile Content
    const renderProfileContent = () => {
        if (!isAuthenticated) {
            return (
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                        <div className="text-6xl mb-4"></div>
                        <h3 className="text-2xl font-semibold text-gray-900 mb-4">Please Login to View Profile</h3>
                        <p className="text-gray-600 mb-6">You need to be logged in to view and edit your profile.</p>
                        <button 
                            onClick={() => { setShowAuthModal(true); setAuthMode('login'); }}
                            className="bg-red-800 text-white px-6 py-3 rounded hover:bg-red-900 transition-colors"
                        >
                            LOGIN TO CONTINUE
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="max-w-7xl mx-auto px-4 py-8">
                <ProfileSection 
                    user={user}
                    profileData={profileData}
                    onUpdateProfile={updateUserProfile}
                />
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header 
                user={user}
                onLogout={handleLogout}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                cartItemCount={cart.length}
                onCartOpen={() => setCartOpen(true)}
                onSearch={handleSearch}
            />

            <main className="pt-4">
                {activeTab === "home" && renderHomeContent()}
                {activeTab === "restaurants" && renderRestaurantsContent()}
                {activeTab === "menu" && renderMenuContent()}
                {activeTab === "orders" && renderOrdersContent()}
                {activeTab === "tracking" && renderTrackingContent()}
                {activeTab === "profile" && renderProfileContent()}
            </main>

            <CartSidebar 
                cart={cart}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeFromCart}
                onPlaceOrder={placeOrder}
                isOpen={cartOpen}
                onClose={() => setCartOpen(false)}
                isAuthenticated={isAuthenticated}
                onRequireAuth={requireAuth}
            />

            {/* Auth Modal */}
            {showAuthModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="max-w-md w-full max-h-[90vh] overflow-y-auto">
                        {authMode === 'login' ? (
                            <LoginForm 
                                onLogin={handleLogin}
                                onSwitchToRegister={() => setAuthMode('register')}
                                isLoading={authLoading}
                                onClose={() => setShowAuthModal(false)}
                                showCloseButton={true}
                            />
                        ) : (
                            <RegisterForm 
                                onRegister={handleRegister}
                                onSwitchToLogin={() => setAuthMode('login')}
                                isLoading={authLoading}
                                onClose={() => setShowAuthModal(false)}
                                showCloseButton={true}
                            />
                        )}
                    </div>
                </div>
            )}

            {cartOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40"
                    onClick={() => setCartOpen(false)}
                />
            )}

            <Footer />
        </div>
    );
}