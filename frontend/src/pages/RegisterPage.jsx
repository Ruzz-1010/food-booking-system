import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "customer",
    restaurantName: "",
    restaurantAddress: "",
    restaurantDescription: "",
    restaurantCategory: "Filipino",
    vehicleType: "motorcycle",
    licenseNumber: "",
    latitude: null,
    longitude: null,
    address: "" // Added address field for all users
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const navigate = useNavigate();

  // ✅ Initialize Leaflet map once
  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map("map", {
        center: [14.5995, 120.9842],
        zoom: 14,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(mapRef.current);

      markerRef.current = L.marker([14.5995, 120.9842], { draggable: true })
        .addTo(mapRef.current)
        .bindPopup("📍 Drag to update your location")
        .openPopup();

      // When user drags pin
      markerRef.current.on("dragend", async () => {
        const { lat, lng } = markerRef.current.getLatLng();
        const address = await reverseGeocode(lat, lng);
        setFormData((prev) => ({ 
          ...prev, 
          latitude: lat, 
          longitude: lng,
          address: address || prev.address
        }));
      });
    }
  }, []);

  // ✅ Reverse geocode coordinates to get address
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

  // ✅ Fetch location manually
  const handleGetLocation = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          const address = await reverseGeocode(latitude, longitude);
          
          setFormData((prev) => ({ 
            ...prev, 
            latitude, 
            longitude,
            address: address || prev.address
          }));

          // Update map view + marker
          mapRef.current.setView([latitude, longitude], 16);
          markerRef.current.setLatLng([latitude, longitude]);
          markerRef.current.bindPopup("📍 Your current location").openPopup();
        },
        () => alert("⚠️ Please enable location access to use this feature.")
      );
    } else {
      alert("❌ Geolocation not supported on this device.");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    // Validate location for all user types
    if (!formData.latitude || !formData.longitude) {
      setError("Please set your location using the map.");
      setIsLoading(false);
      return;
    }

    try {
      const registrationData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        latitude: formData.latitude,
        longitude: formData.longitude,
        address: formData.address, // Include address for all users
      };

      if (formData.role === "restaurant") {
        registrationData.restaurantData = {
          name: formData.restaurantName,
          address: formData.restaurantAddress,
          description: formData.restaurantDescription,
          category: formData.restaurantCategory,
          latitude: formData.latitude, // Also save location in restaurant data
          longitude: formData.longitude,
        };
      }

      if (formData.role === "rider") {
        registrationData.vehicleType = formData.vehicleType;
        registrationData.licenseNumber = formData.licenseNumber;
        // Rider location is already in the main registrationData
      }

      const response = await axios.post(
        "http://localhost:5000/api/auth/register",
        registrationData
      );

      setSuccess(response.data.message);

      // Auto-login for all user types after registration
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role", response.data.role);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      
      setTimeout(() => navigate("/dashboard"), 1500);
      
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const restaurantCategories = [
    "Filipino", "Chinese", "Japanese", "Korean", "American",
    "Italian", "Mexican", "Thai", "Vietnamese", "Indian",
    "Fast Food", "Desserts", "Beverages", "Healthy", "Vegetarian",
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 bg-red-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">F</span>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{" "}
            <Link to="/login" className="font-medium text-red-600 hover:text-red-500">
              sign in to your existing account
            </Link>
          </p>
        </div>

        <div className="bg-white shadow rounded-lg">
          <form onSubmit={handleRegister} className="p-6 space-y-6">
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

            {/* Name + Email */}
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

            {/* Password */}
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

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                I want to join as: *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {["customer", "restaurant", "rider"].map((roleOption) => (
                  <label
                    key={roleOption}
                    className={`relative flex flex-col p-3 border rounded-lg cursor-pointer ${
                      formData.role === roleOption
                        ? "border-red-500 bg-red-50"
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
                    <span className="font-medium capitalize text-sm">{roleOption}</span>
                    <span className="text-xs text-gray-600 mt-1">
                      {roleOption === "customer" && "Order food • Auto-approved"}
                      {roleOption === "restaurant" && "Manage restaurant • Needs approval"}
                      {roleOption === "rider" && "Deliver food • Needs approval"}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Restaurant Info */}
            {formData.role === "restaurant" && (
              <div className="space-y-3">
                <h3 className="font-bold text-gray-800">🍴 Restaurant Information</h3>
                <input
                  type="text"
                  name="restaurantName"
                  placeholder="Restaurant Name"
                  value={formData.restaurantName}
                  onChange={handleChange}
                  className="w-full border p-3 rounded-lg"
                />
                <input
                  type="text"
                  name="restaurantAddress"
                  placeholder="Restaurant Address"
                  value={formData.restaurantAddress}
                  onChange={handleChange}
                  className="w-full border p-3 rounded-lg"
                />
                <textarea
                  name="restaurantDescription"
                  placeholder="Restaurant Description"
                  value={formData.restaurantDescription}
                  onChange={handleChange}
                  className="w-full border p-3 rounded-lg resize-none"
                />
                <select
                  name="restaurantCategory"
                  value={formData.restaurantCategory}
                  onChange={handleChange}
                  className="w-full border p-3 rounded-lg"
                >
                  {restaurantCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Rider Info */}
            {formData.role === "rider" && (
              <div className="space-y-3">
                <h3 className="font-bold text-gray-800">🚴 Rider Information</h3>
                <select
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleChange}
                  className="w-full border p-3 rounded-lg"
                >
                  <option value="motorcycle">Motorcycle</option>
                  <option value="bicycle">Bicycle</option>
                  <option value="car">Car</option>
                </select>
                <input
                  type="text"
                  name="licenseNumber"
                  placeholder="License Number"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  className="w-full border p-3 rounded-lg"
                />
              </div>
            )}

            {/* Map Section for ALL user types */}
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
                className="mb-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                📍 Get My Location
              </button>
              
              <div id="map" style={{ height: "300px", borderRadius: "10px" }}></div>
              
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}