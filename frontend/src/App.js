// src/App.js
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import CustomerDashboard from "./pages/dashboards/CustomerDashboard";
import RestaurantDashboard from "./pages/dashboards/RestaurantDashboard";
import RiderDashboard from "./pages/dashboards/RiderDashboard";
import AdminDashboard from "./pages/dashboards/AdminDashboard";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    const role = localStorage.getItem("role");
    
    if (token && userData && role) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading FoodExpress...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-white">
        <Routes>
          {/* Auto-redirect to CustomerDashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Main Dashboard Routes */}
          <Route path="/dashboard" element={<CustomerDashboard />} />
          <Route path="/restaurant" element={<RestaurantDashboard />} />
          <Route path="/rider" element={<RiderDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;