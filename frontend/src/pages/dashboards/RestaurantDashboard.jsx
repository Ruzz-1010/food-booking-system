// src/pages/dashboards/RestaurantDashboard.jsx

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
    Home, 
    ClipboardList, 
    Utensils, 
    LogOut, 
    Plus, 
    Package, 
    Clock, 
    DollarSign, 
    Loader2, 
    X, 
    AlertTriangle, 
    Menu, 
    ChevronRight, 
    Settings,
    CalendarDays,
    ShoppingBag,
    MapPin,
    Save,
    Camera,
    Edit,
    Upload
} from 'lucide-react'; 

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Global Constants
const API_BASE_URL = 'http://localhost:5000';

// Status color mapping
const statusClasses = {
    'pending': 'bg-yellow-100 text-yellow-800 border-yellow-500',
    'accepted': 'bg-green-100 text-green-800 border-green-500',
    'preparing': 'bg-blue-100 text-blue-800 border-blue-500',
    'ready': 'bg-green-100 text-green-800 border-green-500',
    'picked_up': 'bg-purple-100 text-purple-800 border-purple-500', 
    'out_for_delivery': 'bg-purple-100 text-purple-800 border-purple-500',
    'delivered': 'bg-gray-100 text-gray-800 border-gray-500',
    'rejected': 'bg-red-100 text-red-800 border-red-500',
};

// Location Map Component
const LocationMap = ({ latitude, longitude, onLocationChange, isEditing = false }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView([
      latitude || 14.5995, 
      longitude || 120.9842
    ], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    mapInstanceRef.current = map;

    // Add marker if location exists
    if (latitude && longitude) {
      const customIcon = L.divIcon({
        html: '<div style="background-color: #EF4444; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
        className: 'location-marker',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      markerRef.current = L.marker([latitude, longitude], { 
        draggable: isEditing,
        icon: customIcon
      })
        .addTo(map)
        .bindPopup("📍 Restaurant Location")
        .openPopup();

      // If editing, allow dragging to update location
      if (isEditing && onLocationChange) {
        markerRef.current.on('dragend', function() {
          const { lat, lng } = this.getLatLng();
          onLocationChange(lat, lng);
        });
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, [latitude, longitude, isEditing, onLocationChange]);

  return (
    <div 
      ref={mapRef} 
      style={{ height: '300px', borderRadius: '10px' }}
      className="location-map mt-4 border border-gray-300"
    />
  );
};

// Sidebar Component
const Sidebar = ({ activeTab, setActiveTab, restaurantName, restaurantLogo, handleLogout }) => {
    const navItems = [
        { name: 'Dashboard', icon: Home, tab: 'dashboard' },
        { name: 'Orders', icon: ClipboardList, tab: 'orders' },
        { name: 'Menu', icon: Utensils, tab: 'menu' },
        { name: 'Reports', icon: CalendarDays, tab: 'reports' },
        { name: 'Profile', icon: Settings, tab: 'profile' },
    ];

    return (
        <div className="w-60 bg-white shadow-xl flex flex-col h-screen fixed top-0 left-0 p-6 z-10">
            <div className="flex items-center space-x-2 mb-8 border-b pb-4">
                {restaurantLogo ? (
                    <img 
                        src={`${API_BASE_URL}${restaurantLogo}`} 
                        alt="Restaurant Logo" 
                        className="w-10 h-10 rounded-full object-cover border-2 border-red-600"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://via.placeholder.com/40x40?text=R";
                        }}
                    />
                ) : (
                    <Menu size={28} className="text-red-600"/>
                )}
                <h1 className="text-xl font-extrabold text-gray-900 truncate" title={restaurantName}>
                    {restaurantName}
                </h1>
            </div>
            
            <nav className="flex-grow space-y-2">
                {navItems.map(item => (
                    <button
                        key={item.tab}
                        onClick={() => setActiveTab(item.tab)}
                        className={`flex items-center w-full px-4 py-3 rounded-xl transition-colors duration-200 font-medium ${
                            activeTab === item.tab
                                ? 'bg-red-600 text-white shadow-lg'
                                : 'text-gray-600 hover:bg-red-50 hover:text-red-600'
                        }`}
                    >
                        <item.icon size={20} className="mr-3" />
                        {item.name}
                    </button>
                ))}
            </nav>

            <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors duration-200 mt-4 border"
            >
                <LogOut size={20} className="mr-3" />
                Logout
            </button>
        </div>
    );
};

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, colorClass, description }) => (
    <div className={`bg-white p-6 rounded-2xl shadow-lg border-l-4 ${colorClass}`}>
        <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-500">{title}</h3>
            <Icon size={24} className={`text-opacity-70 ${colorClass.replace('border-', 'text-')}`} />
        </div>
        <p className="text-4xl font-extrabold text-gray-900 mt-2">{value}</p>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
    </div>
);

// Menu Item Card Component
const MenuItemCard = ({ item }) => (
    <div className="bg-white rounded-xl shadow-md overflow-hidden transition-shadow duration-300 hover:shadow-xl flex flex-col h-full">
        <div className="h-40 w-full overflow-hidden flex-shrink-0">
            {item.image ? (
                <img 
                    src={`${API_BASE_URL}${item.image}`} 
                    alt={item.name} 
                    className="w-full h-full object-cover" 
                    onError={(e) => { 
                        e.target.onerror = null; 
                        e.target.src = "https://via.placeholder.com/400x300?text=Image+Not+Found";
                    }}
                />
            ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                    No Image
                </div>
            )}
        </div>
        
        <div className="p-4 flex-grow flex flex-col justify-between">
            <div>
                <h4 className="font-bold text-gray-900 text-lg mb-1">{item.name}</h4>
                <p className="text-sm text-gray-500 mb-2 truncate">{item.description}</p>
                <span className="inline-block bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full capitalize">
                    {item.category}
                </span>
            </div>
            <div className="mt-3 pt-2 border-t border-gray-100 flex justify-between items-center">
                <span className="font-extrabold text-red-600 text-xl">₱{parseFloat(item.price).toFixed(2)}</span>
                <button className="text-gray-400 hover:text-red-500 text-sm">Edit</button>
            </div>
        </div>
    </div>
);

// Order Card Component
const OrderCard = ({ order, onUpdateStatus, onAssignRiderClick }) => {
    const isReadyForAssignment = order.status === 'ready' && !order.riderId;
    
    return (
        <div className={`bg-white shadow rounded-xl p-5 border-l-4 ${statusClasses[order.status] || 'border-gray-300'}`}>
            <div className="flex justify-between items-start mb-3">
                <div className="font-bold text-lg text-gray-900">
                    Order #{order._id?.substring(0, 8)}
                </div>
                <div className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${statusClasses[order.status] || 'bg-gray-200'}`}>
                    {order.status.replace(/_/g, ' ')}
                </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-1">Customer: {order.customerId?.name || 'Guest'}</p>
            <p className="text-sm text-gray-600 mb-3">Time: {new Date(order.createdAt).toLocaleTimeString()} ({new Date(order.createdAt).toLocaleDateString()})</p>
            
            <div className="border-t pt-3 mt-3">
                <p className="font-extrabold text-xl text-red-600 mb-3">Total: ₱{parseFloat(order.totalAmount).toFixed(2)}</p>
                
                <h5 className="font-semibold text-gray-700 text-sm">Items:</h5>
                <ul className="text-xs text-gray-500 space-y-1 mt-1 max-h-16 overflow-y-auto">
                    {order.items?.map((item, index) => (
                        <li key={index} className="flex justify-between">
                            <span>{item.quantity}x {item.name}</span>
                            <span>₱{(item.price * item.quantity).toFixed(2)}</span>
                        </li>
                    ))}
                </ul>
                
                {order.status === 'pending' && (
                    <div className="flex space-x-2 mt-4">
                        <button 
                            onClick={() => onUpdateStatus(order._id, 'preparing')}
                            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                        >
                            Accept & Prepare <ChevronRight size={16} className="inline ml-1"/>
                        </button>
                        <button 
                            onClick={() => onUpdateStatus(order._id, 'rejected')}
                            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                        >
                            Reject <X size={16} className="inline ml-1"/>
                        </button>
                    </div>
                )}
                
                {order.status === 'preparing' && (
                    <button 
                        onClick={() => onUpdateStatus(order._id, 'ready')}
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg mt-4 hover:bg-blue-700 transition-colors font-medium text-sm"
                    >
                        Mark as Ready for Pickup <ChevronRight size={16} className="inline ml-1"/>
                    </button>
                )}
                
                {isReadyForAssignment && (
                    <button 
                        onClick={() => onAssignRiderClick(order)}
                        className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg mt-4 hover:bg-orange-700 transition-colors font-medium text-sm"
                    >
                        Assign Rider <ChevronRight size={16} className="inline ml-1"/>
                    </button>
                )}

                {(order.status === 'ready' && order.riderId) && (
                    <p className="text-center text-sm text-green-600 mt-4 font-semibold">
                        Rider Assigned: {order.riderId?.name}
                    </p>
                )}
                
                {(order.status === 'picked_up' || order.status === 'out_for_delivery') && (
                    <p className="text-center text-sm text-gray-500 mt-4 font-semibold">
                        Awaiting Rider Status Update ({order.riderId ? `Assigned to ${order.riderId.name}` : 'Unassigned'})
                    </p>
                )}
                {(order.status === 'rejected' || order.status === 'delivered') && (
                    <p className="text-center text-sm text-gray-500 mt-4 font-semibold">Order is {order.status}.</p>
                )}
            </div>
        </div>
    );
};

// Assign Rider Modal
const AssignRiderModal = ({ 
    order, 
    riders, 
    onClose, 
    onAssign 
}) => {
    const [selectedRider, setSelectedRider] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (selectedRider && order?._id) {
            onAssign(order._id, selectedRider);
        } else {
            alert('Please select a rider.');
        }
    };

    if (!order) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm">
                <div className="flex justify-between items-center mb-6 border-b pb-3">
                    <h3 className="text-xl font-bold text-gray-900">Assign Rider for Order #{order._id?.substring(0, 8)}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Available Rider</label>
                        <select
                            value={selectedRider}
                            onChange={(e) => setSelectedRider(e.target.value)}
                            className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-red-500 focus:border-red-500 bg-white"
                            required
                        >
                            <option value="" disabled>-- Choose a Rider --</option>
                            {riders.length > 0 ? (
                                riders.map(rider => (
                                    <option key={rider._id} value={rider._id}>{rider.name} (ID: {rider._id?.substring(0, 4)}...)</option>
                                ))
                            ) : (
                                <option value="" disabled>No riders currently available.</option>
                            )}
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={!selectedRider || riders.length === 0}
                        className="w-full bg-red-600 text-white px-4 py-2 rounded-xl shadow-md hover:bg-red-700 transition-colors font-semibold disabled:bg-gray-400"
                    >
                        Confirm Assignment
                    </button>
                </form>
            </div>
        </div>
    );
};

// Order operation with retry logic
const handleOrderOperation = async (operation, orderId, ...args) => {
    const MAX_RETRIES = 2;
    let lastError;
    
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            if (attempt > 0) {
                console.log(`🔄 Retry attempt ${attempt} for order ${orderId}`);
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
            }
            
            await operation(orderId, ...args);
            return; // Success
        } catch (error) {
            lastError = error;
            console.error(`Attempt ${attempt} failed:`, error);
            
            if (attempt === MAX_RETRIES) {
                throw error; // Final attempt failed
            }
        }
    }
};

// Main Restaurant Dashboard Component
export default function RestaurantDashboard() {
    const [user, setUser] = useState(null);
    const [restaurant, setRestaurant] = useState(null);
    const [orders, setOrders] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [riders, setRiders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("dashboard");
    const [showAddItemModal, setShowAddItemModal] = useState(false);
    const [showAssignRiderModal, setShowAssignRiderModal] = useState(false);
    const [selectedOrderToAssign, setSelectedOrderToAssign] = useState(null);
    const [updatingLocation, setUpdatingLocation] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);

    const [newItem, setNewItem] = useState({
        name: "",
        description: "",
        price: "",
        category: "",
        image: null
    });

    const [profileData, setProfileData] = useState({
        name: '',
        description: '',
        phone: '',
        address: '',
        category: '',
        latitude: null,
        longitude: null,
        logo: null
    });

    const [editingProfile, setEditingProfile] = useState(false);

    const navigate = useNavigate();

    // Get current location
    const getCurrentLocation = () => {
        setUpdatingLocation(true);
        
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    
                    try {
                        // Reverse geocode to get address
                        const address = await reverseGeocode(latitude, longitude);
                        
                        setProfileData(prev => ({
                            ...prev,
                            latitude,
                            longitude,
                            address: address || prev.address
                        }));
                        
                        alert("📍 Location updated successfully!");
                    } catch (error) {
                        console.error("Error getting address:", error);
                        alert("📍 Location updated, but could not get address details.");
                    } finally {
                        setUpdatingLocation(false);
                    }
                },
                (error) => {
                    console.error("Error getting location:", error);
                    alert("❌ Failed to get your location. Please check your browser permissions.");
                    setUpdatingLocation(false);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000
                }
            );
        } else {
            alert("❌ Geolocation is not supported by this browser.");
            setUpdatingLocation(false);
        }
    };

    // Reverse geocode coordinates
    const reverseGeocode = async (lat, lng) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
            );
            const data = await response.json();
            return data.display_name || "";
        } catch (error) {
            console.error("Reverse geocoding error:", error);
            return "";
        }
    };

    // Handle location change from map
    const handleLocationChange = async (newLat, newLng) => {
        if (!editingProfile) return;
        
        try {
            const address = await reverseGeocode(newLat, newLng);
            
            setProfileData(prev => ({
                ...prev,
                latitude: newLat,
                longitude: newLng,
                address: address || prev.address
            }));
        } catch (error) {
            console.error("Error updating location:", error);
        }
    };

    const fetchAvailableRiders = useCallback(async (token) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/riders/available`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRiders(response.data.riders || []); 
        } catch (error) {
            console.error("Error fetching available riders:", error.response?.data || error.message);
        }
    }, []);

    const fetchRestaurantData = useCallback(async (restaurantId, token) => {
        if (!restaurantId || !token) return;
      
        try {
          setLoading(true);
          
          const userObj = JSON.parse(localStorage.getItem("user"));
          const ownerId = userObj.id || userObj._id;
          
          console.log("🔍 Getting restaurant for owner:", ownerId);
      
          // Get restaurant by owner ID
          const restaurantResponse = await axios.get(`${API_BASE_URL}/api/restaurants/owner/${ownerId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const correctRestaurant = restaurantResponse.data;
          const correctRestaurantId = correctRestaurant._id;
          
          console.log("✅ Found restaurant:", correctRestaurant.name, "ID:", correctRestaurantId);
      
          // ✅ AUTO-DETECT MENU RESTAURANT ID
          let menuRestaurantId = correctRestaurantId;
          let menuItems = [];
      
          // Try current restaurant ID first
          try {
            const menuResponse = await axios.get(`${API_BASE_URL}/api/menu/restaurant/${correctRestaurantId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            menuItems = menuResponse.data.menu || [];
            console.log("✅ Menu found with current ID:", menuItems.length);
          } catch (error) {
            // If no menu with current ID, try old ID
            console.log("🔄 Trying old restaurant ID for menu...");
            const oldRestaurantId = "68f70998c748535a0498badd";
            try {
              const oldMenuResponse = await axios.get(`${API_BASE_URL}/api/menu/restaurant/${oldRestaurantId}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              menuItems = oldMenuResponse.data.menu || [];
              menuRestaurantId = oldRestaurantId;
              console.log("✅ Menu found with old ID:", menuItems.length);
            } catch (oldError) {
              console.log("❌ No menu found with both IDs");
            }
          }
      
          // Get orders with proper error handling
          try {
            const ordersResponse = await axios.get(`${API_BASE_URL}/api/orders/restaurant/${correctRestaurantId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            console.log("✅ Orders fetched:", ordersResponse.data.orders?.length || 0);
            setOrders(ordersResponse.data.orders || []);
            
          } catch (orderError) {
            console.error("❌ Error fetching orders:", orderError.response?.data || orderError.message);
            
            // Try alternative endpoint if available
            try {
                console.log("🔄 Trying alternative orders endpoint...");
                const altOrdersResponse = await axios.get(`${API_BASE_URL}/api/orders/my-orders`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setOrders(altOrdersResponse.data.orders || []);
            } catch (altError) {
                console.error("❌ Alternative orders endpoint also failed");
                setOrders([]);
            }
          }
      
          setMenuItems(menuItems);
          setRestaurant(correctRestaurant);
          
          // Set profile data
          setProfileData({
            name: correctRestaurant.name || '',
            description: correctRestaurant.description || '',
            phone: correctRestaurant.phone || '',
            address: correctRestaurant.address || '',
            category: correctRestaurant.category || '',
            latitude: correctRestaurant.latitude || null,
            longitude: correctRestaurant.longitude || null,
            logo: correctRestaurant.logo || null
          });
          
        } catch (error) {
          console.error("❌ Error fetching restaurant data:", error.response?.data || error.message);
        } finally {
          setLoading(false);
        }
      }, []);
      
      useEffect(() => {
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("user");
        const role = localStorage.getItem("role");
        
        if (!token || role !== "restaurant") {
          navigate("/login");
          return;
        }
        
        if (userData) {
          const userObj = JSON.parse(userData);
          setUser(userObj);
          
          // ✅ PASS USER ID INSTEAD OF RESTAURANT ID
          const userId = userObj.id || userObj._id;
          fetchRestaurantData(userId, token);
          fetchAvailableRiders(token);
        }
      }, [navigate, fetchRestaurantData, fetchAvailableRiders]);

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

    const handleImageChange = (e) => {
        setNewItem({...newItem, image: e.target.files[0]});
    };

    const handleLogoChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setProfileData({...profileData, logo: e.target.files[0]});
        }
    };

    const addMenuItem = async (e) => {
        e.preventDefault();
        try {
          const token = localStorage.getItem("token");
          const userObj = JSON.parse(localStorage.getItem("user"));
          const restaurantId = restaurant?._id || userObj.restaurantId || userObj.id;
          
          console.log("🔄 Adding menu item for restaurant:", restaurantId);
      
          const formData = new FormData();
          formData.append('name', newItem.name);
          formData.append('description', newItem.description);
          formData.append('price', newItem.price);
          formData.append('category', newItem.category);
          
          if (newItem.image) {
            formData.append('image', newItem.image);
          }
      
          console.log("📦 FormData contents:");
          for (let [key, value] of formData.entries()) {
            console.log(`  ${key}:`, value);
          }
      
          // ✅ ADD LOADING STATE FOR THE BUTTON
          const addButton = e.target.querySelector('button[type="submit"]');
          const originalText = addButton.innerHTML;
          addButton.innerHTML = '<Loader2 size={20} className="animate-spin mr-2"/> Adding...';
          addButton.disabled = true;
      
          const response = await axios.post(
            `${API_BASE_URL}/api/menu/restaurant/${restaurantId}`,
            formData,
            { 
              headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
              } 
            }
          );
      
          console.log("✅ Add menu response:", response.data);
      
          // ✅ CLOSE MODAL AND RESET FORM
          setShowAddItemModal(false);
          setNewItem({ name: "", description: "", price: "", category: "", image: null });
          
          // ✅ REFRESH MENU DATA IMMEDIATELY
          await fetchRestaurantData(restaurantId, token);
          
          alert("✅ Menu item added successfully!");
          
        } catch (error) {
          console.error("❌ Add item error:", error);
          console.error("❌ Error response:", error.response?.data);
          alert(`Error adding item: ${error.response?.data?.error || error.message}`);
        }
      };

    const updateOrderStatus = async (orderId, status) => {
        await handleOrderOperation(async (orderId, status) => {
            try {
                const token = localStorage.getItem("token");
                const userObj = JSON.parse(localStorage.getItem("user"));
                const ownerId = userObj.id || userObj._id;
                
                console.log("🔄 Updating order status:", { orderId, status, ownerId });

                // First get the restaurant ID for this owner
                const restaurantResponse = await axios.get(`${API_BASE_URL}/api/restaurants/owner/${ownerId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                const correctRestaurant = restaurantResponse.data;
                const correctRestaurantId = correctRestaurant._id;

                console.log("✅ Using restaurant ID:", correctRestaurantId);

                // Update the order with the correct restaurant context
                const response = await axios.patch(
                    `${API_BASE_URL}/api/orders/${orderId}`,
                    { 
                        status,
                        restaurantId: correctRestaurantId // Include restaurant ID in the request
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                
                console.log("✅ Order status updated successfully:", response.data);
                
                // Refresh orders data
                await fetchRestaurantData(ownerId, token);
                
            } catch (error) {
                console.error("❌ Error updating order:", error);
                const errorMessage = error.response?.data?.message || error.message;
                alert(`Error updating order status: ${errorMessage}`);
                throw error; // Re-throw for retry logic
            }
        }, orderId, status);
    };

    const handleAssignRiderClick = (order) => {
        setSelectedOrderToAssign(order);
        setShowAssignRiderModal(true);
    };

    const assignRiderToOrder = async (orderId, riderId) => {
        try {
            const token = localStorage.getItem("token");
            await axios.patch(
                `${API_BASE_URL}/api/orders/${orderId}/assign-rider`, 
                { riderId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            const userObj = JSON.parse(localStorage.getItem("user"));
            const restaurantId = userObj.restaurantId || userObj.id;
            fetchRestaurantData(restaurantId, token);
            setShowAssignRiderModal(false);
            setSelectedOrderToAssign(null);
            alert("✅ Rider assigned successfully! The order is now waiting for the rider to pick it up.");
        } catch (error) {
            console.error("Error assigning rider:", error);
            alert(`Error assigning rider: ${error.response?.data?.message || error.message}`);
        }
    };

    const updateRestaurantProfile = async () => {
        try {
          setSavingProfile(true);
          const token = localStorage.getItem("token");
          const userObj = JSON.parse(localStorage.getItem("user"));
          
          console.log("🔄 Starting restaurant profile update...");
          console.log("🔍 User:", userObj);
          console.log("📦 Profile Data:", profileData);
      
          // ✅ GET RESTAURANT ID FROM RESTAURANT OBJECT (MOST RELIABLE)
          let restaurantId = restaurant?._id;
          
          if (!restaurantId) {
            // Try to get restaurant by owner ID first
            try {
              const restaurantResponse = await axios.get(
                `${API_BASE_URL}/api/restaurants/owner/${userObj.id}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              restaurantId = restaurantResponse.data._id;
              console.log("✅ Found restaurant ID from owner:", restaurantId);
            } catch (error) {
              console.error("❌ Could not find restaurant:", error);
              alert("❌ Restaurant not found. Please contact support.");
              return;
            }
          }
      
          console.log("🎯 Using Restaurant ID:", restaurantId);
      
          // ✅ CREATE FORM DATA PROPERLY
          const formData = new FormData();
          
          // Append all fields - handle empty values properly
          formData.append('name', profileData.name || '');
          formData.append('description', profileData.description || '');
          formData.append('phone', profileData.phone || '');
          formData.append('address', profileData.address || '');
          formData.append('category', profileData.category || 'General');
          
          // Handle coordinates - convert to string or null
          if (profileData.latitude !== null && profileData.latitude !== undefined) {
            formData.append('latitude', profileData.latitude.toString());
          } else {
            formData.append('latitude', 'null');
          }
          
          if (profileData.longitude !== null && profileData.longitude !== undefined) {
            formData.append('longitude', profileData.longitude.toString());
          } else {
            formData.append('longitude', 'null');
          }
          
          // Handle logo - only append if it's a new file
          if (profileData.logo && typeof profileData.logo !== 'string') {
            formData.append('logo', profileData.logo);
            console.log("🖼️ Logo file appended:", profileData.logo.name);
          }
      
          // ✅ DEBUG: Log FormData contents
          console.log("📦 FormData contents:");
          for (let [key, value] of formData.entries()) {
            console.log(`  ${key}:`, value);
          }
      
          // ✅ MAKE THE API CALL
          console.log("🔄 Sending PUT request to:", `${API_BASE_URL}/api/restaurants/${restaurantId}`);
          
          const response = await axios.put(
            `${API_BASE_URL}/api/restaurants/${restaurantId}`, // ✅ CORRECT ENDPOINT
            formData,
            { 
              headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
              } 
            }
          );
      
          console.log("✅ Update successful:", response.data);
          
          // ✅ UPDATE LOCAL STATE
          setRestaurant(response.data);
          setEditingProfile(false);
          
          // ✅ SHOW SUCCESS MESSAGE
          alert("✅ Restaurant profile updated successfully!");
          
          // ✅ REFRESH DATA
          await fetchRestaurantData(userObj.id, token);
          
        } catch (error) {
          console.error("❌ Error updating restaurant profile:", error);
          console.error("❌ Error details:", {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
          });
          
          let errorMessage = "Failed to update profile. ";
          
          if (error.response?.data?.error) {
            errorMessage += error.response.data.error;
          } else if (error.response?.data?.message) {
            errorMessage += error.response.data.message;
          } else {
            errorMessage += error.message;
          }
          
          alert(`❌ ${errorMessage}`);
        } finally {
          setSavingProfile(false);
        }
      };
      
    // Derived State for Orders
    const pendingOrders = orders.filter(order => order.status === 'pending');
    const preparingOrders = orders.filter(order => order.status === 'preparing');
    const readyOrders = orders.filter(order => order.status === 'ready');
    const totalOrders = orders.length;

    const calculateSales = (period) => {
        const now = new Date();
        let sales = 0;
        
        orders.forEach(order => {
            if (order.status !== 'delivered') return;

            const orderDate = new Date(order.createdAt);
            const orderTimestamp = orderDate.getTime();
            const oneDay = 24 * 60 * 60 * 1000;
            
            let shouldInclude = false;

            switch (period) {
                case 'day':
                    const today = new Date(now).setHours(0, 0, 0, 0);
                    const orderDay = new Date(orderDate).setHours(0, 0, 0, 0);
                    if (orderDay === today) shouldInclude = true;
                    break;
                case 'week':
                    const lastWeek = now.getTime() - (7 * oneDay);
                    if (orderTimestamp >= lastWeek) shouldInclude = true;
                    break;
                case 'month':
                    if (orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear()) {
                        shouldInclude = true;
                    }
                    break;
                case 'total':
                default:
                    shouldInclude = true;
                    break;
            }

            if (shouldInclude) {
                sales += parseFloat(order.totalAmount || 0);
            }
        });
        
        return sales.toFixed(2);
    };

    const deliveredToday = orders.filter(order => {
        const now = new Date();
        const orderDate = new Date(order.createdAt);
        return order.status === 'delivered' &&
               orderDate.getDate() === now.getDate() && 
               orderDate.getMonth() === now.getMonth() && 
               orderDate.getFullYear() === now.getFullYear();
    });

    const dailySales = calculateSales('day');
    const weeklySales = calculateSales('week');
    const monthlySales = calculateSales('month');

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center p-8 bg-white rounded-xl shadow-lg">
                    <Loader2 size={32} className="text-red-600 animate-spin mx-auto mb-4" />
                    <p className="text-lg text-gray-600 font-medium">Loading restaurant dashboard...</p>
                </div>
            </div>
        );
    }

    const restaurantName = restaurant?.name || user?.name || 'Restaurant Dashboard';
    const restaurantLogo = restaurant?.logo;

    // Tab Content Renderers
    const renderDashboard = () => (
        <div className="space-y-8">
            <h2 className="text-3xl font-extrabold text-gray-900">Welcome back, {user?.name}!</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Orders"
                    value={totalOrders} 
                    icon={Package}
                    colorClass="border-blue-600"
                    description="Total orders ever processed"
                />
                <StatCard
                    title="Pending Orders"
                    value={pendingOrders.length} 
                    icon={Clock}
                    colorClass="border-yellow-600"
                    description="Waiting for your acceptance"
                />
                <StatCard
                    title="Menu Items"
                    value={menuItems.length} 
                    icon={Utensils}
                    colorClass="border-green-600"
                    description="Items available on the menu"
                />
                <StatCard
                    title="Daily Sales"
                    value={`₱${dailySales}`} 
                    icon={DollarSign}
                    colorClass="border-red-600"
                    description={`Sales from ${deliveredToday.length} orders delivered today`}
                />
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <ClipboardList size={20} className="mr-2 text-red-600"/> Quick Order Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button onClick={() => setActiveTab('orders')} className="p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition text-left">
                        <p className="text-3xl font-bold text-yellow-600">{pendingOrders.length}</p>
                        <p className="text-gray-600 font-medium">New Pending Orders</p>
                    </button>
                    <button onClick={() => setActiveTab('orders')} className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition text-left">
                        <p className="text-3xl font-bold text-blue-600">{preparingOrders.length}</p>
                        <p className="text-gray-600 font-medium">In Preparation</p>
                    </button>
                    <button onClick={() => setActiveTab('orders')} className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition text-left">
                        <p className="text-3xl font-bold text-green-600">{readyOrders.length}</p>
                        <p className="text-gray-600 font-medium">Ready for Delivery</p>
                    </button>
                </div>
            </div>
        </div>
    );

    const renderOrders = () => (
        <div className="space-y-8">
            <h2 className="text-3xl font-extrabold text-gray-900">Order Management ({totalOrders} Total)</h2>
            
            {/* Add debug info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                    🔍 Restaurant ID: {restaurant?._id?.substring(0, 8)}... | 
                    Orders Loaded: {orders.length} | 
                    Pending: {pendingOrders.length}
                </p>
            </div>
            
            {totalOrders === 0 ? (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                    <AlertTriangle size={48} className="text-yellow-500 mx-auto mb-4"/>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Orders Yet!</h3>
                    <p className="text-gray-600">New orders will appear here for you to accept.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-yellow-600 border-b pb-2">New Orders ({pendingOrders.length})</h3>
                        {pendingOrders.map(order => (
                            <OrderCard key={order._id} order={order} onUpdateStatus={updateOrderStatus} onAssignRiderClick={handleAssignRiderClick} />
                        ))}
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-blue-600 border-b pb-2">In Preparation ({preparingOrders.length})</h3>
                        {preparingOrders.map(order => (
                            <OrderCard key={order._id} order={order} onUpdateStatus={updateOrderStatus} onAssignRiderClick={handleAssignRiderClick} />
                        ))}
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-green-600 border-b pb-2">Ready/Delivery ({readyOrders.length})</h3>
                        {readyOrders.map(order => (
                            <OrderCard 
                                key={order._id} 
                                order={order} 
                                onUpdateStatus={updateOrderStatus} 
                                onAssignRiderClick={handleAssignRiderClick}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const renderMenu = () => (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-3xl font-extrabold text-gray-900">Menu Management ({menuItems.length} Items)</h2>
                <button 
                    onClick={() => setShowAddItemModal(true)}
                    className="bg-red-600 text-white px-6 py-3 rounded-xl shadow-md hover:bg-red-700 transition-colors flex items-center font-semibold whitespace-nowrap"
                >
                    <Plus size={20} className="mr-2"/> Add New Item
                </button>
            </div>

            {menuItems.length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                    <Utensils size={48} className="text-red-500 mx-auto mb-4"/>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Menu is Empty</h3>
                    <p className="text-gray-600 mb-6">Start by adding your first delicious item!</p>
                    <button 
                        onClick={() => setShowAddItemModal(true)}
                        className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold"
                    >
                        Add First Item
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {menuItems.map((item) => (
                        <MenuItemCard key={item._id} item={item} />
                    ))}
                </div>
            )}
        </div>
    );

    const renderReports = () => (
        <div className="space-y-8">
            <h2 className="text-3xl font-extrabold text-gray-900">Sales and Performance Reports</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    title="Daily Revenue"
                    value={`₱${dailySales}`}
                    icon={DollarSign}
                    colorClass="border-red-600"
                    description="Total revenue from delivered orders today"
                />
                <StatCard
                    title="Weekly Revenue"
                    value={`₱${weeklySales}`}
                    icon={DollarSign}
                    colorClass="border-green-600"
                    description="Total revenue from the last 7 days"
                />
                <StatCard
                    title="Monthly Revenue"
                    value={`₱${monthlySales}`}
                    icon={DollarSign}
                    colorClass="border-blue-600"
                    description="Total revenue for the current month"
                />
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <ShoppingBag size={20} className="mr-2 text-red-600"/> All Orders History
                </h3>
                <div className="max-h-96 overflow-y-auto border rounded-xl">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(order => (
                                <tr key={order._id}>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{order._id?.substring(0, 8)}...</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{order.customerId?.name || 'N/A'}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-red-600">₱{parseFloat(order.totalAmount).toFixed(2)}</td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${statusClasses[order.status] || 'bg-gray-200'}`}>
                                            {order.status.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {orders.length === 0 && <p className="text-center py-8 text-gray-500">No orders found in history.</p>}
                </div>
            </div>
        </div>
    );

    const renderProfile = () => (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-extrabold text-gray-900">Restaurant Profile</h2>
                <div className="flex space-x-2">
                    {!editingProfile ? (
                        <button
                            onClick={() => setEditingProfile(true)}
                            className="flex items-center space-x-2 text-red-600 hover:text-red-800 bg-red-50 px-4 py-2 rounded-lg"
                        >
                            <Edit size={16} />
                            <span>Edit Profile</span>
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={updateRestaurantProfile}
                                disabled={savingProfile}
                                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                                {savingProfile ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Save size={16} />
                                )}
                                <span>{savingProfile ? 'Saving...' : 'Save Changes'}</span>
                            </button>
                            <button
                                onClick={() => {
                                    setEditingProfile(false);
                                    // Reset form data
                                    if (restaurant) {
                                        setProfileData({
                                            name: restaurant.name || '',
                                            description: restaurant.description || '',
                                            phone: restaurant.phone || '',
                                            address: restaurant.address || '',
                                            category: restaurant.category || '',
                                            latitude: restaurant.latitude || null,
                                            longitude: restaurant.longitude || null,
                                            logo: restaurant.logo || null
                                        });
                                    }
                                }}
                                className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                            >
                                <X size={16} />
                                <span>Cancel</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {editingProfile ? (
                <div className="space-y-6">
                    {/* Logo Upload */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg border-t-4 border-blue-500">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                            <Camera size={20} className="mr-2 text-blue-600"/> Restaurant Logo
                        </h3>
                        <div className="flex items-center space-x-6">
                            <div className="w-24 h-24 bg-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
                                {profileData.logo ? (
                                    <img 
                                        src={typeof profileData.logo === 'string' ? `${API_BASE_URL}${profileData.logo}` : URL.createObjectURL(profileData.logo)} 
                                        alt="Restaurant Logo" 
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <Camera size={32} className="text-gray-400" />
                                )}
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Logo</label>
                                <input
                                    type="file"
                                    onChange={handleLogoChange}
                                    className="w-full text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                                    accept="image/*"
                                />
                                <p className="text-xs text-gray-500 mt-1">Recommended: 500x500px, PNG or JPG</p>
                            </div>
                        </div>
                    </div>

                    {/* Restaurant Information */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg border-t-4 border-green-500">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                            <Home size={20} className="mr-2 text-green-600"/> Restaurant Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name *</label>
                                <input
                                    type="text"
                                    value={profileData.name}
                                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                                    placeholder="Enter restaurant name"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                                <select
                                    value={profileData.category}
                                    onChange={(e) => setProfileData({...profileData, category: e.target.value})}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 bg-white"
                                    required
                                >
                                    <option value="">Select Category</option>
                                    <option value="Filipino">Filipino</option>
                                    <option value="Chinese">Chinese</option>
                                    <option value="Japanese">Japanese</option>
                                    <option value="Korean">Korean</option>
                                    <option value="American">American</option>
                                    <option value="Italian">Italian</option>
                                    <option value="Mexican">Mexican</option>
                                    <option value="Fast Food">Fast Food</option>
                                    <option value="Desserts">Desserts</option>
                                    <option value="Beverages">Beverages</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={profileData.description}
                                    onChange={(e) => setProfileData({...profileData, description: e.target.value})}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 resize-none"
                                    rows="3"
                                    placeholder="Describe your restaurant..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                                <input
                                    type="tel"
                                    value={profileData.phone}
                                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                                    placeholder="Enter phone number"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Location Section */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg border-t-4 border-purple-500">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center">
                                <MapPin size={20} className="mr-2 text-purple-600"/> Restaurant Location
                            </h3>
                            <button
                                onClick={getCurrentLocation}
                                disabled={updatingLocation}
                                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                <MapPin size={16} />
                                <span>
                                    {updatingLocation ? 'Getting Location...' : 'Use Current Location'}
                                </span>
                            </button>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Address *</label>
                            <textarea
                                value={profileData.address}
                                onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 resize-none"
                                rows="3"
                                placeholder="Enter your restaurant address..."
                                required
                            />
                        </div>

                        {/* Location Map */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Location on Map {profileData.latitude && `(${profileData.latitude.toFixed(4)}, ${profileData.longitude.toFixed(4)})`}
                            </label>
                            <p className="text-sm text-gray-600 mb-3">
                                {editingProfile ? "Drag the marker to update your location" : "Your restaurant location"}
                            </p>
                            
                            <LocationMap 
                                latitude={profileData.latitude}
                                longitude={profileData.longitude}
                                onLocationChange={handleLocationChange}
                                isEditing={editingProfile}
                            />
                            
                            {!profileData.latitude && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                                    <p className="text-yellow-800 text-sm">
                                        📍 No location set. Click "Use Current Location" or set your address above.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Profile Summary */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <div className="flex items-center space-x-6">
                            <div className="w-24 h-24 bg-red-100 rounded-xl flex items-center justify-center overflow-hidden">
                                {restaurantLogo ? (
                                    <img 
                                        src={`${API_BASE_URL}${restaurantLogo}`} 
                                        alt="Restaurant Logo" 
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = "https://via.placeholder.com/96x96?text=Logo";
                                        }}
                                    />
                                ) : (
                                    <Camera size={32} className="text-red-600" />
                                )}
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">{restaurant?.name}</h3>
                                <p className="text-gray-600">{restaurant?.description}</p>
                                <div className="flex items-center space-x-4 mt-2">
                                    <span className="inline-block bg-red-100 text-red-700 text-sm font-semibold px-3 py-1 rounded-full">
                                        {restaurant?.category}
                                    </span>
                                    <span className="flex items-center text-gray-600 text-sm">
                                        <MapPin size={16} className="mr-1" />
                                        {restaurant?.address}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Restaurant Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-2xl shadow-lg">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h4>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-600">Phone Number</p>
                                    <p className="font-medium text-gray-900">{restaurant?.phone || 'Not provided'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Address</p>
                                    <p className="font-medium text-gray-900">{restaurant?.address || 'Not provided'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Location Display */}
                        <div className="bg-white p-6 rounded-2xl shadow-lg">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Location</h4>
                            {restaurant?.latitude && restaurant?.longitude ? (
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-600">
                                        Coordinates: {restaurant.latitude.toFixed(4)}, {restaurant.longitude.toFixed(4)}
                                    </p>
                                    <LocationMap 
                                        latitude={restaurant.latitude}
                                        longitude={restaurant.longitude}
                                        isEditing={false}
                                    />
                                </div>
                            ) : (
                                <div className="bg-gray-100 rounded-lg p-4 text-center">
                                    <p className="text-gray-500 text-sm">📍 No location set</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Restaurant Statistics */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Restaurant Statistics</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div className="bg-red-50 p-4 rounded-lg">
                                <p className="text-2xl font-bold text-red-600">{totalOrders}</p>
                                <p className="text-sm text-gray-600">Total Orders</p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                                <p className="text-2xl font-bold text-green-600">{menuItems.length}</p>
                                <p className="text-sm text-gray-600">Menu Items</p>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-2xl font-bold text-blue-600">{deliveredToday.length}</p>
                                <p className="text-sm text-gray-600">Delivered Today</p>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg">
                                <p className="text-2xl font-bold text-purple-600">₱{dailySales}</p>
                                <p className="text-sm text-gray-600">Today's Revenue</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return renderDashboard();
            case 'orders': return renderOrders();
            case 'menu': return renderMenu();
            case 'reports': return renderReports();
            case 'profile': return renderProfile();
            default: return renderDashboard();
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                restaurantName={restaurantName}
                restaurantLogo={restaurantLogo}
                handleLogout={handleLogout}
            />
            
            <main className="flex-1 ml-60 min-h-screen overflow-auto">
                <div className="p-6">
                    {renderContent()}
                </div>
            </main>
            
            {showAddItemModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-20 flex items-center justify-center p-4">
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6 border-b pb-3">
                            <h3 className="text-2xl font-bold text-gray-900">Add New Menu Item</h3>
                            <button onClick={() => setShowAddItemModal(false)} className="text-gray-400 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={addMenuItem} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                                <input
                                    type="text"
                                    value={newItem.name}
                                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-red-500 focus:border-red-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={newItem.description}
                                    onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                                    rows="3"
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-red-500 focus:border-red-500"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (₱)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={newItem.price}
                                        onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-red-500 focus:border-red-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <input
                                        type="text"
                                        value={newItem.category}
                                        onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-red-500 focus:border-red-500"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                                <input
                                    type="file"
                                    onChange={handleImageChange}
                                    className="w-full text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                                    accept="image/*"
                                />
                            </div>
                            <div className="pt-4 border-t mt-6">
                                <button
                                    type="submit"
                                    className="w-full bg-red-600 text-white px-6 py-3 rounded-xl shadow-md hover:bg-red-700 transition-colors font-semibold flex items-center justify-center"
                                >
                                    <Plus size={20} className="mr-2"/> Add Item to Menu
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAssignRiderModal && (
                <AssignRiderModal
                    order={selectedOrderToAssign}
                    riders={riders}
                    onClose={() => setShowAssignRiderModal(false)}
                    onAssign={assignRiderToOrder}
                />
            )}
        </div>
    );
}