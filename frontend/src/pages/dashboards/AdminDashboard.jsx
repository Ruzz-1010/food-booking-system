// src/pages/dashboards/AdminDashboard.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Import components
import DashboardCard from "../../components/admin/DashboardCard";
import StatCard from "../../components/admin/StatCard";
import StatusBadge from "../../components/admin/StatusBadge";
import Header from "../../components/admin/Header";
import Sidebar from "../../components/admin/Sidebar";

// Icons
import { 
  Store, Bike, Clock, PieChart, Users, Settings, Package, Home,
  User, DollarSign, ShoppingCart, CheckCircle,
  MapPin, Phone, Calendar, Star, Truck, Eye, Edit, Search, Download,
  BarChart3, CreditCard, UserCheck, AlertCircle, ChefHat, Menu
} from 'lucide-react';

// Global Constants
const API_BASE_URL = 'http://localhost:5000';

// Custom Hooks
const useRealTimeData = (endpoint, token, interval = 30000) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data);
      setError(null);
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [endpoint, token]);

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, interval);
    return () => clearInterval(intervalId);
  }, [fetchData, interval]);

  return { data, loading, error, refetch: fetchData };
};

// Main Component
export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [notifications, setNotifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  // Real-time data hooks - UPDATED ENDPOINTS
  const { data: dashboardStats, loading: statsLoading, refetch: refetchStats } = useRealTimeData('/api/admin/dashboard', token);
  const { data: usersData, loading: usersLoading, refetch: refetchUsers } = useRealTimeData('/api/admin/users', token);
  const { data: restaurantsData, loading: restaurantsLoading, refetch: refetchRestaurants } = useRealTimeData('/api/admin/restaurants', token);
  const { data: ridersData, loading: ridersLoading, refetch: refetchRiders } = useRealTimeData('/api/admin/riders', token);
  const { data: ordersData, loading: ordersLoading, refetch: refetchOrders } = useRealTimeData('/api/admin/orders', token);
  const { data: approvalsData, loading: approvalsLoading, refetch: refetchApprovals } = useRealTimeData('/api/admin/approvals/pending', token);

  // Get data from responses
  const users = usersData?.users || [];
  const restaurants = restaurantsData?.restaurants || [];
  const riders = ridersData?.riders || [];
  const orders = ordersData?.orders || [];
  const pendingRestaurants = approvalsData?.pendingRestaurants || [];
  const pendingRiders = approvalsData?.pendingRiders || [];

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    const role = localStorage.getItem("role");
    
    if (!token || role !== "admin") {
      navigate("/login");
      return;
    }
    
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  // Calculate derived data
  const activeRestaurants = restaurants?.filter(r => 
    r.status === 'approved' || r.status === 'active'
  ) || [];

  const completedOrders = orders?.filter(o => o.status === 'delivered') || [];
  const totalRevenue = completedOrders.reduce((sum, order) => sum + (parseFloat(order.totalAmount) || 0), 0);

  // Real-time stats
  const realTimeStats = {
    totalRevenue: dashboardStats?.totalRevenue || totalRevenue,
    activeRestaurants: dashboardStats?.approvedRestaurants || activeRestaurants.length,
    pendingApprovals: (dashboardStats?.pendingRestaurants || 0) + (dashboardStats?.pendingRiders || 0),
    completedOrders: dashboardStats?.completedOrders || completedOrders.length,
    totalUsers: dashboardStats?.totalUsers || users?.length || 0,
    totalOrders: dashboardStats?.totalOrders || orders?.length || 0
  };

  // Navigation Items
  const navItems = [
    { name: "Dashboard", icon: Home, tab: "dashboard", badge: null },
    { name: "Users", icon: Users, tab: "users", badge: users?.length || 0 },
    { name: "Restaurants", icon: Store, tab: "restaurants", badge: restaurants?.length || 0 },
    { name: "Riders", icon: Bike, tab: "riders", badge: riders?.length || 0 },
    { 
      name: "Approvals", 
      icon: Clock, 
      tab: "approvals", 
      badge: realTimeStats.pendingApprovals
    },
    { name: "Orders", icon: Package, tab: "orders", badge: orders?.length || 0 },
    { name: "Analytics", icon: PieChart, tab: "analytics", badge: null },
    { name: "Settings", icon: Settings, tab: "settings", badge: null },
  ];

  // ✅ FIXED: Handle approval actions
  const handleApprove = async (type, id) => {
    try {
      let endpoint;
      
      if (type === 'restaurant') {
        endpoint = `/api/admin/restaurant/${id}/status`;
      } else if (type === 'rider') {
        endpoint = `/api/admin/rider/${id}/status`;
      } else {
        throw new Error('Invalid approval type');
      }

      console.log(`🔄 Approving ${type} with ID: ${id}`);

      const response = await axios.put(
        `${API_BASE_URL}${endpoint}`,
        { status: 'approved' }, // ✅ Send status in request body
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log(`✅ ${type} approved:`, response.data);
      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} approved successfully!`);
      
      // Refresh all relevant data
      refetchApprovals();
      refetchRestaurants();
      refetchRiders();
      refetchStats();
      
    } catch (error) {
      console.error(`❌ Error approving ${type}:`, error);
      alert(`Failed to approve ${type}. Please try again.`);
    }
  };

  // ✅ FIXED: Handle rejection actions
  const handleReject = async (type, id) => {
    try {
      let endpoint;
      
      if (type === 'restaurant') {
        endpoint = `/api/admin/restaurant/${id}/status`;
      } else if (type === 'rider') {
        endpoint = `/api/admin/rider/${id}/status`;
      } else {
        throw new Error('Invalid rejection type');
      }

      console.log(`🔄 Rejecting ${type} with ID: ${id}`);

      const response = await axios.put(
        `${API_BASE_URL}${endpoint}`,
        { status: 'rejected' }, // ✅ Send status in request body
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log(`✅ ${type} rejected:`, response.data);
      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} rejected successfully!`);
      
      // Refresh all relevant data
      refetchApprovals();
      refetchRestaurants();
      refetchRiders();
      refetchStats();
      
    } catch (error) {
      console.error(`❌ Error rejecting ${type}:`, error);
      alert(`Failed to reject ${type}. Please try again.`);
    }
  };

  // ✅ FIX: Fix restaurant statuses
  const handleFixRestaurantStatus = async () => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/admin/fix-restaurant-status`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert(`Fixed ${response.data.restaurantsUpdated} restaurants!`);
      window.location.reload();
    } catch (error) {
      console.error('Error fixing restaurant status:', error);
      alert('Failed to fix restaurant statuses.');
    }
  };

  // Loading state component
  const renderLoading = () => (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-2 text-gray-600">Loading data...</span>
    </div>
  );

  // Render functions
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard 
          label="Total Revenue" 
          value={`₱${(realTimeStats.totalRevenue || 0).toLocaleString()}`}
          icon={<DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />}
          color="success"
          trend={{ type: 'up', value: 12.5 }}
          subtitle="Real-time revenue data"
          loading={statsLoading}
        />
        <StatCard 
          label="Active Restaurants" 
          value={realTimeStats.activeRestaurants}
          icon={<Store className="w-4 h-4 sm:w-5 sm:h-5" />}
          color="primary"
          trend={{ type: 'up', value: 5.2 }}
          subtitle={`${restaurants?.length || 0} total registered`}
          loading={restaurantsLoading}
        />
        <StatCard 
          label="Pending Approvals" 
          value={realTimeStats.pendingApprovals}
          icon={<AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />}
          color="warning"
          subtitle="Requires immediate attention"
          loading={approvalsLoading}
        />
        <StatCard 
          label="Completed Orders" 
          value={realTimeStats.completedOrders}
          icon={<CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />}
          color="info"
          trend={{ type: 'up', value: 8.3 }}
          subtitle={`${realTimeStats.totalOrders} total orders`}
          loading={ordersLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <DashboardCard
            title="Recent Orders"
            icon={<ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />}
            actions={
              <button 
                onClick={() => handleTabChange("orders")}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
              >
                View All
              </button>
            }
          >
            {ordersLoading ? renderLoading() : (
              <div className="space-y-3 sm:space-y-4">
                {orders?.slice(0, 5).map((order) => (
                  <div key={order._id} className="flex items-center justify-between p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl border border-gray-200 transition-all hover:shadow-md">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-lg sm:rounded-xl flex items-center justify-center">
                        <Package className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                          Order #{order.orderNumber || order._id?.slice(-6).toUpperCase()}
                        </p>
                        <p className="text-gray-500 text-xs sm:text-sm truncate">
                          {order.customerId?.name || order.customerName || 'Customer'} • {order.restaurantId?.name || order.restaurantName || 'Restaurant'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      <p className="font-bold text-gray-900 text-sm sm:text-base">₱{parseFloat(order.totalAmount || 0).toFixed(2)}</p>
                      <div className="mt-1">
                        <StatusBadge status={order.status} />
                      </div>
                    </div>
                  </div>
                ))}
                {(!orders || orders.length === 0) && (
                  <div className="text-center py-6 sm:py-8 text-gray-500 text-sm sm:text-base">
                    No orders found
                  </div>
                )}
              </div>
            )}
          </DashboardCard>
        </div>

        {/* Quick Stats & Approvals */}
        <div className="space-y-4 sm:space-y-6">
          <DashboardCard
            title="Quick Stats"
            icon={<BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />}
          >
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                  <span className="text-gray-600 text-xs sm:text-sm">Daily Revenue</span>
                </div>
                <span className="font-bold text-green-600 text-sm sm:text-base">
                  ₱{((realTimeStats.totalRevenue || 0) * 0.15).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <UserCheck className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                  <span className="text-gray-600 text-xs sm:text-sm">Active Users</span>
                </div>
                <span className="font-bold text-blue-600 text-sm sm:text-base">{realTimeStats.totalUsers}</span>
              </div>
              <div className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Bike className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600" />
                  <span className="text-gray-600 text-xs sm:text-sm">Active Riders</span>
                </div>
                <span className="font-bold text-orange-600 text-sm sm:text-base">
                  {riders?.filter(r => r.isOnline || r.status === 'active' || r.status === 'approved').length || 0}
                </span>
              </div>
            </div>
          </DashboardCard>

          {/* Pending Approvals */}
          <DashboardCard
            title="Pending Approvals"
            icon={<Clock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />}
            actions={
              <button 
                onClick={() => handleTabChange("approvals")}
                className="text-orange-600 hover:text-orange-700 text-sm font-medium transition-colors"
              >
                View All
              </button>
            }
          >
            <div className="space-y-2 sm:space-y-3">
              {pendingRestaurants.slice(0, 2).map((restaurant) => (
                <div key={restaurant._id} className="p-2 sm:p-3 bg-orange-50 rounded-lg border border-orange-200 transition-all hover:shadow-sm">
                  <div className="flex items-center space-x-2">
                    <Store className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600" />
                    <span className="font-medium text-xs sm:text-sm text-gray-900 truncate">
                      {restaurant.name || restaurant.restaurantName}
                    </span>
                  </div>
                  <p className="text-xs text-orange-600 ml-5 sm:ml-6 mt-1">Restaurant Application</p>
                </div>
              ))}
              {pendingRiders.slice(0, 2).map((rider) => (
                <div key={rider._id} className="p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-200 transition-all hover:shadow-sm">
                  <div className="flex items-center space-x-2">
                    <Bike className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                    <span className="font-medium text-xs sm:text-sm text-gray-900 truncate">{rider.name}</span>
                  </div>
                  <p className="text-xs text-blue-600 ml-5 sm:ml-6 mt-1">Rider Application</p>
                </div>
              ))}
              {(pendingRestaurants.length === 0 && pendingRiders.length === 0) && (
                <div className="text-center py-4 text-gray-500 text-xs sm:text-sm">
                  No pending approvals
                </div>
              )}
            </div>
          </DashboardCard>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <DashboardCard
      title={`Users Management (${users?.length || 0})`}
      icon={<Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />}
      actions={
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-48 lg:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 sm:pl-10 pr-4 py-2 bg-gray-50 rounded-lg sm:rounded-xl text-xs sm:text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-gray-200"
            />
          </div>
          <button className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl hover:bg-blue-700 flex items-center justify-center space-x-2 text-xs sm:text-sm transition-all w-full sm:w-auto">
            <Download className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Export</span>
          </button>
        </div>
      }
    >
      {usersLoading ? renderLoading() : (
        <div className="overflow-x-auto rounded-lg sm:rounded-xl border border-gray-200">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-gray-600">User</th>
                <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-gray-600">Contact</th>
                <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-gray-600">Role</th>
                <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-gray-600">Status</th>
                <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {users?.filter(user => 
                user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.phone?.includes(searchTerm)
              ).map((user) => (
                <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 sm:py-4 px-3 sm:px-4">
                    <div>
                      <p className="font-semibold text-gray-900 text-xs sm:text-sm">{user.name}</p>
                      <p className="text-gray-500 text-xs">{user.email}</p>
                    </div>
                  </td>
                  <td className="py-3 sm:py-4 px-3 sm:px-4">
                    <p className="text-sm text-gray-600 text-xs sm:text-sm">{user.phone}</p>
                  </td>
                  <td className="py-3 sm:py-4 px-3 sm:px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'customer' 
                        ? 'bg-green-100 text-green-800' 
                        : user.role === 'restaurant_owner'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 sm:py-4 px-3 sm:px-4">
                    <StatusBadge status={user.status} />
                  </td>
                  <td className="py-3 sm:py-4 px-3 sm:px-4">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <button className="p-1 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                      </button>
                      <button className="p-1 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Edit className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!users || users.length === 0) && (
                <tr>
                  <td colSpan="5" className="py-6 sm:py-8 text-center text-gray-500 text-sm sm:text-base">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </DashboardCard>
  );

  const renderRestaurants = () => (
    <DashboardCard
      title={`Restaurants Management (${restaurants?.length || 0})`}
      icon={<Store className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />}
      actions={
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-48 lg:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
            <input
              type="text"
              placeholder="Search restaurants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 sm:pl-10 pr-4 py-2 bg-gray-50 rounded-lg sm:rounded-xl text-xs sm:text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-gray-200"
            />
          </div>
          <button 
            onClick={handleFixRestaurantStatus}
            className="bg-orange-600 text-white px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl hover:bg-orange-700 flex items-center justify-center space-x-2 text-xs sm:text-sm transition-all w-full sm:w-auto"
          >
            <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Fix Status</span>
          </button>
        </div>
      }
    >
      {restaurantsLoading ? renderLoading() : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {restaurants?.filter(restaurant =>
            restaurant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            restaurant.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            restaurant.address?.toLowerCase().includes(searchTerm.toLowerCase())
          ).map((restaurant) => (
            <div key={restaurant._id} className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-4 sm:p-5 transition-all hover:shadow-lg">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base lg:text-lg mb-1 truncate">{restaurant.name}</h3>
                  <p className="text-gray-600 text-xs sm:text-sm">{restaurant.category}</p>
                </div>
                <div className="ml-2">
                  <StatusBadge status={restaurant.status} />
                </div>
              </div>
              <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-600">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                  <span className="flex-1 truncate">{restaurant.address}</span>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <User className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                  <span className="truncate">Owner: {restaurant.ownerId?.name || restaurant.ownerName}</span>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                  <span>{restaurant.phone}</span>
                </div>
              </div>
              <div className="flex space-x-2 mt-3 sm:mt-4">
                <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm">
                  View Details
                </button>
                <button className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors text-xs sm:text-sm">
                  Edit
                </button>
              </div>
            </div>
          ))}
          {(!restaurants || restaurants.length === 0) && (
            <div className="col-span-full text-center py-8 text-gray-500 text-sm sm:text-base">
              No restaurants found
            </div>
          )}
        </div>
      )}
    </DashboardCard>
  );

  const renderRiders = () => (
    <DashboardCard
      title={`Riders Management (${riders?.length || 0})`}
      icon={<Bike className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />}
      actions={
        <div className="w-full sm:w-48 lg:w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
            <input
              type="text"
              placeholder="Search riders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 sm:pl-10 pr-4 py-2 bg-gray-50 rounded-lg sm:rounded-xl text-xs sm:text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-gray-200"
            />
          </div>
        </div>
      }
    >
      {ridersLoading ? renderLoading() : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {riders?.filter(rider =>
            rider.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            rider.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            rider.vehicle?.toLowerCase().includes(searchTerm.toLowerCase())
          ).map((rider) => (
            <div key={rider._id} className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-4 sm:p-5 transition-all hover:shadow-lg">
              <div className="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-14 sm:h-14 bg-orange-50 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <Bike className="w-4 h-4 sm:w-6 sm:h-6 text-orange-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base">{rider.name}</h3>
                  <p className="text-gray-600 text-xs sm:text-sm truncate">{rider.email}</p>
                </div>
              </div>
              <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-600">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                  <span>{rider.phone}</span>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Truck className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{rider.vehicle}</span>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 flex-shrink-0" />
                  <span>{rider.rating || '0.0'} rating</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="font-medium text-xs sm:text-sm">{rider.completedDeliveries || 0} deliveries</span>
                  {rider.isOnline && (
                    <span className="flex items-center space-x-1 sm:space-x-2 text-green-600">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs font-medium">Online</span>
                    </span>
                  )}
                </div>
              </div>
              <div className="flex space-x-2 mt-3 sm:mt-4">
                <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm">
                  View Details
                </button>
                <button className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors text-xs sm:text-sm">
                  Edit
                </button>
              </div>
            </div>
          ))}
          {(!riders || riders.length === 0) && (
            <div className="col-span-full text-center py-8 text-gray-500 text-sm sm:text-base">
              No riders found
            </div>
          )}
        </div>
      )}
    </DashboardCard>
  );

  const renderApprovals = () => (
    <div className="space-y-4 sm:space-y-6">
      <DashboardCard
        title={`Restaurant Approvals (${pendingRestaurants.length})`}
        icon={<ChefHat className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {pendingRestaurants.map((restaurant) => (
            <div key={restaurant._id} className="border border-orange-200 rounded-lg sm:rounded-xl p-4 sm:p-5 bg-orange-50 transition-all hover:shadow-md">
              <h3 className="font-bold text-gray-900 text-sm sm:text-base lg:text-lg mb-2 sm:mb-3 truncate">{restaurant.name || restaurant.restaurantName}</h3>
              <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600 flex-shrink-0" />
                  <span className="truncate">{restaurant.address}</span>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <User className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600 flex-shrink-0" />
                  <span className="truncate">Owner: {restaurant.ownerId?.name || restaurant.ownerName || 'Unknown'}</span>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600 flex-shrink-0" />
                  <span>{restaurant.phone}</span>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600 flex-shrink-0" />
                  <span>Submitted: {new Date(restaurant.createdAt || restaurant.submittedAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex space-x-2 sm:space-x-3">
                <button 
                  onClick={() => handleApprove('restaurant', restaurant._id)}
                  className="flex-1 bg-green-600 text-white py-2 sm:py-2.5 rounded-lg sm:rounded-xl hover:bg-green-700 transition-colors font-medium text-xs sm:text-sm"
                >
                  Approve
                </button>
                <button 
                  onClick={() => handleReject('restaurant', restaurant._id)}
                  className="flex-1 bg-red-600 text-white py-2 sm:py-2.5 rounded-lg sm:rounded-xl hover:bg-red-700 transition-colors font-medium text-xs sm:text-sm"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
          {pendingRestaurants.length === 0 && (
            <div className="col-span-full text-center py-6 sm:py-8 text-gray-500 text-sm sm:text-base">
              No pending restaurant approvals
            </div>
          )}
        </div>
      </DashboardCard>

      <DashboardCard
        title={`Rider Approvals (${pendingRiders.length})`}
        icon={<Bike className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {pendingRiders.map((rider) => (
            <div key={rider._id} className="border border-blue-200 rounded-lg sm:rounded-xl p-4 sm:p-5 bg-blue-50 transition-all hover:shadow-md">
              <h3 className="font-bold text-gray-900 text-sm sm:text-base lg:text-lg mb-2 sm:mb-3">{rider.name}</h3>
              <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 flex-shrink-0" />
                  <span>{rider.phone}</span>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Bike className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 flex-shrink-0" />
                  <span>Vehicle: {rider.vehicle}</span>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 flex-shrink-0" />
                  <span>Submitted: {new Date(rider.createdAt || rider.submittedAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex space-x-2 sm:space-x-3">
                <button 
                  onClick={() => handleApprove('rider', rider._id)}
                  className="flex-1 bg-green-600 text-white py-2 sm:py-2.5 rounded-lg sm:rounded-xl hover:bg-green-700 transition-colors font-medium text-xs sm:text-sm"
                >
                  Approve
                </button>
                <button 
                  onClick={() => handleReject('rider', rider._id)}
                  className="flex-1 bg-red-600 text-white py-2 sm:py-2.5 rounded-lg sm:rounded-xl hover:bg-red-700 transition-colors font-medium text-xs sm:text-sm"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
          {pendingRiders.length === 0 && (
            <div className="col-span-full text-center py-6 sm:py-8 text-gray-500 text-sm sm:text-base">
              No pending rider approvals
            </div>
          )}
        </div>
      </DashboardCard>
    </div>
  );

  const renderOrders = () => (
    <DashboardCard
      title={`Orders Management (${orders?.length || 0})`}
      icon={<Package className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />}
      actions={
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-48 lg:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 sm:pl-10 pr-4 py-2 bg-gray-50 rounded-lg sm:rounded-xl text-xs sm:text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-gray-200"
            />
          </div>
          <button className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl hover:bg-blue-700 flex items-center justify-center space-x-2 text-xs sm:text-sm transition-all w-full sm:w-auto">
            <Download className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Export</span>
          </button>
        </div>
      }
    >
      {ordersLoading ? renderLoading() : (
        <div className="overflow-x-auto rounded-lg sm:rounded-xl border border-gray-200">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-gray-600">Order ID</th>
                <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-gray-600">Customer</th>
                <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-gray-600">Restaurant</th>
                <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-gray-600">Rider</th>
                <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-gray-600">Amount</th>
                <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-gray-600">Status</th>
                <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {orders?.filter(order =>
                order._id?.includes(searchTerm) ||
                order.customerId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.restaurantId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.status?.toLowerCase().includes(searchTerm.toLowerCase())
              ).map((order) => (
                <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 sm:py-4 px-3 sm:px-4">
                    <p className="font-semibold text-gray-900 text-xs sm:text-sm">#{order.orderNumber || order._id?.slice(-6)}</p>
                  </td>
                  <td className="py-3 sm:py-4 px-3 sm:px-4">
                    <p className="text-sm text-gray-600 text-xs sm:text-sm">{order.customerId?.name || 'Customer'}</p>
                  </td>
                  <td className="py-3 sm:py-4 px-3 sm:px-4">
                    <p className="text-sm text-gray-600 text-xs sm:text-sm">{order.restaurantId?.name || 'Restaurant'}</p>
                  </td>
                  <td className="py-3 sm:py-4 px-3 sm:px-4">
                    <p className="text-sm text-gray-600 text-xs sm:text-sm">{order.riderId?.name || 'Not assigned'}</p>
                  </td>
                  <td className="py-3 sm:py-4 px-3 sm:px-4">
                    <p className="font-bold text-gray-900 text-xs sm:text-sm">₱{parseFloat(order.totalAmount || 0).toFixed(2)}</p>
                  </td>
                  <td className="py-3 sm:py-4 px-3 sm:px-4">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="py-3 sm:py-4 px-3 sm:px-4">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <button className="p-1 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                      </button>
                      <button className="p-1 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Edit className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!orders || orders.length === 0) && (
                <tr>
                  <td colSpan="7" className="py-6 sm:py-8 text-center text-gray-500 text-sm sm:text-base">
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </DashboardCard>
  );

  const renderAnalytics = () => (
    <DashboardCard
      title="Analytics & Reports"
      icon={<PieChart className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />}
    >
      <div className="text-center py-12 sm:py-16">
        <PieChart className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-400 mb-3 sm:mb-4" />
        <p className="text-gray-600 text-sm sm:text-lg">Analytics dashboard coming soon</p>
        <p className="text-gray-500 text-xs sm:text-sm mt-1 sm:mt-2">Advanced charts and reports will be available here</p>
      </div>
    </DashboardCard>
  );

  const renderSettings = () => (
    <DashboardCard
      title="Settings"
      icon={<Settings className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />}
    >
      <div className="max-w-2xl space-y-4 sm:space-y-6">
        <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-4 sm:p-6">
          <h3 className="font-bold text-gray-900 text-sm sm:text-base lg:text-lg mb-3 sm:mb-4">System Settings</h3>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 text-xs sm:text-sm">Auto-refresh Data</p>
                <p className="text-gray-600 text-xs">Automatically refresh data every 30 seconds</p>
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 text-xs sm:text-sm">Real-time Updates</p>
                <p className="text-gray-600 text-xs">Live data from database</p>
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl border border-red-200 p-4 sm:p-6">
          <h3 className="font-bold text-red-600 text-sm sm:text-base lg:text-lg mb-3 sm:mb-4">Danger Zone</h3>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
              <div>
                <p className="font-medium text-gray-900 text-xs sm:text-sm">Clear Cache</p>
                <p className="text-gray-600 text-xs">Clear all cached data</p>
              </div>
              <button className="bg-red-600 text-white px-4 sm:px-6 py-2 rounded-lg sm:rounded-xl hover:bg-red-700 transition-colors font-medium text-xs sm:text-sm w-full sm:w-auto">
                Clear Cache
              </button>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
              <div>
                <p className="font-medium text-gray-900 text-xs sm:text-sm">Logout</p>
                <p className="text-gray-600 text-xs">Sign out from admin panel</p>
              </div>
              <button 
                onClick={handleLogout}
                className="bg-gray-600 text-white px-4 sm:px-6 py-2 rounded-lg sm:rounded-xl hover:bg-gray-700 transition-colors font-medium text-xs sm:text-sm w-full sm:w-auto"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardCard>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      
      {/* Header */}
      <div className="sticky top-0 z-50">
        <Header 
          user={user}
          toggleSidebar={toggleSidebar}
          notifications={notifications}
          onLogout={handleLogout}
        />
      </div>

      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="hidden lg:block">
          <Sidebar 
            navItems={navItems}
            activeTab={activeTab}
            setActiveTab={handleTabChange}
            user={user}
          />
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={toggleSidebar}></div>
            <div className="relative w-80 h-full">
              <Sidebar 
                navItems={navItems}
                activeTab={activeTab}
                setActiveTab={handleTabChange}
                user={user}
                onClose={toggleSidebar}
              />
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 capitalize">
                  {activeTab === 'dashboard' ? 'Dashboard Overview' : activeTab}
                </h1>
                <p className="text-gray-600 mt-1 sm:mt-2 text-xs sm:text-sm">
                  {activeTab === 'dashboard' 
                    ? 'Real-time platform analytics and monitoring' 
                    : `Manage ${activeTab} in your platform`}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm text-gray-600">Last updated</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date().toLocaleTimeString()}
                  </p>
                </div>
                {/* Mobile Menu Button */}
                <button 
                  onClick={toggleSidebar}
                  className="lg:hidden p-2 bg-white rounded-lg border border-gray-200 shadow-sm"
                >
                  <Menu className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Content */}
            {activeTab === "dashboard" && renderDashboard()}
            {activeTab === "users" && renderUsers()}
            {activeTab === "restaurants" && renderRestaurants()}
            {activeTab === "riders" && renderRiders()}
            {activeTab === "approvals" && renderApprovals()}
            {activeTab === "orders" && renderOrders()}
            {activeTab === "analytics" && renderAnalytics()}
            {activeTab === "settings" && renderSettings()}
          </div>
        </main>
      </div>
    </div>
  );
}