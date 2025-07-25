import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// API base URL
const API_BASE = 'http://localhost:5000/api';

// Simple Dashboard Components
function VendorDashboard() {
  const vendorId = new URLSearchParams(window.location.search).get('id');
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Vendor Dashboard</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Welcome, Vendor!</h2>
          <p className="text-gray-600 mb-4">Your vendor ID: {vendorId}</p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900">Available Credit</h3>
              <p className="text-2xl font-bold text-blue-600">₹5,000</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900">Trust Score</h3>
              <p className="text-2xl font-bold text-green-600">100</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-semibold text-orange-900">Total Savings</h3>
              <p className="text-2xl font-bold text-orange-600">₹0</p>
            </div>
          </div>
          <div className="mt-6 space-x-4">
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Create Order
            </button>
            <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
              Join Group
            </button>
            <button className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
              View Products
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SupplierDashboard() {
  const supplierId = new URLSearchParams(window.location.search).get('id');
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Supplier Dashboard</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Welcome, Supplier!</h2>
          <p className="text-gray-600 mb-4">Your supplier ID: {supplierId}</p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900">Rating</h3>
              <p className="text-2xl font-bold text-blue-600">5.0 ⭐</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900">Total Orders</h3>
              <p className="text-2xl font-bold text-green-600">0</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-semibold text-orange-900">Pending Bids</h3>
              <p className="text-2xl font-bold text-orange-600">0</p>
            </div>
          </div>
          <div className="mt-6 space-x-4">
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              View Orders
            </button>
            <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
              Create Bid
            </button>
            <button className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
              Manage Products
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// HomePage component with working registration modals
function HomePage() {
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleVendorSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    
    // Match exact backend schema for vendor
    const vendorData = {
      phone: formData.get('phone') as string,
      name: formData.get('name') as string,
      businessType: formData.get('businessType') as string,
      businessLocation: formData.get('businessLocation') as string,
      estimatedDailyPurchase: parseFloat(formData.get('estimatedDailyPurchase') as string) || 1000,
      bankAccount: formData.get('bankAccount') as string || "",
      upiId: formData.get('upiId') as string || ""
    };

    try {
      const response = await axios.post(`${API_BASE}/vendors`, vendorData);
      const vendor = response.data;
      alert(`Registration successful! Welcome ${vendor.name}`);
      setShowVendorModal(false);
      navigate(`/vendor/dashboard?id=${vendor.id}`);
    } catch (error: any) {
      console.error('Vendor registration error:', error);
      alert(error.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSupplierSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    
    // Match exact backend schema for supplier
    const supplierData = {
      phone: formData.get('phone') as string,
      businessName: formData.get('businessName') as string,
      businessRegNumber: formData.get('businessRegNumber') as string || "",
      gstNumber: formData.get('gstNumber') as string || "",
      contactPerson: formData.get('contactPerson') as string,
      email: formData.get('email') as string || "",
      businessAddress: formData.get('businessAddress') as string,
      deliveryAreas: (formData.get('deliveryAreas') as string).split(',').map(area => area.trim()).filter(area => area),
      productCategories: (formData.get('productCategories') as string).split(',').map(cat => cat.trim()).filter(cat => cat),
      bankAccount: formData.get('bankAccount') as string
    };

    try {
      const response = await axios.post(`${API_BASE}/suppliers`, supplierData);
      const supplier = response.data;
      alert(`Registration successful! Welcome ${supplier.businessName}`);
      setShowSupplierModal(false);
      navigate(`/supplier/dashboard?id=${supplier.id}`);
    } catch (error: any) {
      console.error('Supplier registration error:', error);
      alert(error.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          VendorCircle
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Group Buying + Smart Credit Platform for Street Food Vendors
        </p>
        <div className="space-x-4">
          <button 
            onClick={() => setShowVendorModal(true)}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600"
          >
            Register as Vendor
          </button>
          <button 
            onClick={() => setShowSupplierModal(true)}
            className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600"
          >
            Register as Supplier
          </button>
        </div>
        
        {/* Connection Status */}
        <div className="mt-4 text-sm text-gray-500">
          Backend should be running on http://localhost:5000
        </div>
      </div>

      {/* Vendor Registration Modal */}
      {showVendorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Register as Vendor</h2>
            <form onSubmit={handleVendorSubmit} className="space-y-4">
              <input
                name="name"
                type="text"
                placeholder="Full Name *"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <input
                name="phone"
                type="tel"
                placeholder="Phone Number (10 digits) *"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                pattern="[0-9]{10}"
              />
              <select
                name="businessType"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Business Type *</option>
                <option value="Chaat">Chaat</option>
                <option value="Dosa">Dosa</option>
                <option value="Pav Bhaji">Pav Bhaji</option>
                <option value="Vada Pav">Vada Pav</option>
                <option value="Idli Sambar">Idli Sambar</option>
                <option value="Biryani">Biryani</option>
                <option value="Sandwich">Sandwich</option>
                <option value="Juice & Snacks">Juice & Snacks</option>
                <option value="Other">Other</option>
              </select>
              <input
                name="businessLocation"
                type="text"
                placeholder="Business Location/Area *"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <input
                name="estimatedDailyPurchase"
                type="number"
                placeholder="Estimated Daily Purchase Amount (₹)"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                defaultValue="1000"
                min="100"
                step="100"
              />
              <input
                name="bankAccount"
                type="text"
                placeholder="Bank Account Number (Optional)"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                name="upiId"
                type="text"
                placeholder="UPI ID (Optional)"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Registering...' : 'Register'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowVendorModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 p-3 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Registration Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Register as Supplier</h2>
            <form onSubmit={handleSupplierSubmit} className="space-y-4">
              <input
                name="businessName"
                type="text"
                placeholder="Business Name *"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
              <input
                name="contactPerson"
                type="text"
                placeholder="Contact Person Name *"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
              <input
                name="phone"
                type="tel"
                placeholder="Phone Number (10 digits) *"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
                pattern="[0-9]{10}"
              />
              <input
                name="email"
                type="email"
                placeholder="Email Address (Optional)"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <input
                name="businessAddress"
                type="text"
                placeholder="Complete Business Address *"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
              <input
                name="businessRegNumber"
                type="text"
                placeholder="Business Registration Number (Optional)"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <input
                name="gstNumber"
                type="text"
                placeholder="GST Number (Optional)"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <input
                name="deliveryAreas"
                type="text"
                placeholder="Delivery Areas (comma separated) *"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
                title="Example: Andheri, Bandra, Juhu"
              />
              <input
                name="productCategories"
                type="text"
                placeholder="Product Categories (comma separated) *"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                defaultValue="Vegetables, Spices, Oil, Rice, Dal"
                required
                title="Example: Vegetables, Spices, Oil, Rice"
              />
              <input
                name="bankAccount"
                type="text"
                placeholder="Bank Account Number *"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-orange-500 text-white p-3 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Registering...' : 'Register'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 p-3 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/vendor/dashboard" element={<VendorDashboard />} />
          <Route path="/supplier/dashboard" element={<SupplierDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 