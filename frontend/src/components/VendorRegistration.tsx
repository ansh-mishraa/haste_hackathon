import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import toast from 'react-hot-toast';

interface VendorRegistrationProps {
  onClose: () => void;
  onSuccess: (vendorId: string) => void;
}

const VendorRegistration: React.FC<VendorRegistrationProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    phone: '',
    name: '',
    businessType: '',
    businessLocation: '',
    latitude: null as number | null,
    longitude: null as number | null,
    estimatedDailyPurchase: '',
    bankAccount: '',
    upiId: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const businessTypes = [
    'Chaat',
    'Dosa',
    'Pav Bhaji',
    'Juice',
    'Tea/Coffee',
    'Biryani',
    'Momos',
    'Sandwich',
    'Ice Cream',
    'Other'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getCurrentLocation = () => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }));
          setLocationLoading(false);
          toast.success('Location captured successfully!');
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationLoading(false);
          toast.error('Could not get location. Please enter manually.');
        }
      );
    } else {
      setLocationLoading(false);
      toast.error('Geolocation is not supported by this browser.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/vendors`, {
        ...formData,
        estimatedDailyPurchase: parseFloat(formData.estimatedDailyPurchase)
      });

      toast.success('Registration successful! Welcome to VendorCircle!');
      onSuccess(response.data.id);
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Join as Vendor</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Phone Number */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone Number *
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                +91
              </span>
              <input
                type="tel"
                name="phone"
                id="phone"
                required
                pattern="[0-9]{10}"
                value={formData.phone}
                onChange={handleInputChange}
                className="flex-1 focus:ring-blue-500 focus:border-blue-500 block w-full rounded-none rounded-r-md sm:text-sm border-gray-300"
                placeholder="9876543210"
              />
            </div>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              id="name"
              required
              value={formData.name}
              onChange={handleInputChange}
              className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              placeholder="Enter your full name"
            />
          </div>

          {/* Business Type */}
          <div>
            <label htmlFor="businessType" className="block text-sm font-medium text-gray-700">
              Business Type *
            </label>
            <select
              name="businessType"
              id="businessType"
              required
              value={formData.businessType}
              onChange={handleInputChange}
              className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Select your business type</option>
              {businessTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Business Location */}
          <div>
            <label htmlFor="businessLocation" className="block text-sm font-medium text-gray-700">
              Business Location *
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="text"
                name="businessLocation"
                id="businessLocation"
                required
                value={formData.businessLocation}
                onChange={handleInputChange}
                className="flex-1 focus:ring-blue-500 focus:border-blue-500 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300"
                placeholder="e.g., FC Road, Pune"
              />
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={locationLoading}
                className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm hover:bg-gray-100"
              >
                {locationLoading ? 'Getting...' : 'GPS'}
              </button>
            </div>
          </div>

          {/* Estimated Daily Purchase */}
          <div>
            <label htmlFor="estimatedDailyPurchase" className="block text-sm font-medium text-gray-700">
              Estimated Daily Purchase Amount (₹)
            </label>
            <input
              type="number"
              name="estimatedDailyPurchase"
              id="estimatedDailyPurchase"
              min="0"
              step="50"
              value={formData.estimatedDailyPurchase}
              onChange={handleInputChange}
              className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              placeholder="1500"
            />
          </div>

          {/* Bank Account */}
          <div>
            <label htmlFor="bankAccount" className="block text-sm font-medium text-gray-700">
              Bank Account Number
            </label>
            <input
              type="text"
              name="bankAccount"
              id="bankAccount"
              value={formData.bankAccount}
              onChange={handleInputChange}
              className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              placeholder="Account number"
            />
          </div>

          {/* UPI ID */}
          <div>
            <label htmlFor="upiId" className="block text-sm font-medium text-gray-700">
              UPI ID
            </label>
            <input
              type="text"
              name="upiId"
              id="upiId"
              value={formData.upiId}
              onChange={handleInputChange}
              className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              placeholder="your@upi"
            />
          </div>

          {/* Location Status */}
          {formData.latitude && formData.longitude && (
            <div className="text-sm text-green-600">
              ✓ Location captured: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Creating Account...' : 'Join VendorCircle'}
            </button>
          </div>
        </form>

        {/* Info Note */}
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Your account will be verified automatically for this demo. 
            You'll get ₹5,000 initial credit limit to start buying with our "Pay Later" system.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VendorRegistration; 