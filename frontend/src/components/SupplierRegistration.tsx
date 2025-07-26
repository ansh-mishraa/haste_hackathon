import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.tsx';

interface SupplierRegistrationProps {
  onClose: () => void;
  onSuccess: (supplierId: string) => void;
}

const SupplierRegistration: React.FC<SupplierRegistrationProps> = ({ onClose, onSuccess }) => {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    businessName: '',
    businessRegNumber: '',
    gstNumber: '',
    contactPerson: '',
    email: '',
    deliveryAreas: [] as string[],
    productCategories: [] as string[],
    bankAccount: '',
    businessAddress: '',
    latitude: '',
    longitude: ''
  });

  const availableAreas = [
    'FC Road, Pune',
    'Koregaon Park, Pune',
    'Camp, Pune',
    'Shivaji Nagar, Pune',
    'Baner, Pune',
    'Hinjewadi, Pune',
    'Kothrud, Pune',
    'Kalyani Nagar, Pune'
  ];

  const productCategories = [
    'Vegetables',
    'Fruits',
    'Spices',
    'Oils',
    'Grains',
    'Dairy',
    'Bread',
    'Ready-to-Cook',
    'Sweeteners',
    'Ingredients'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMultiSelect = (name: string, value: string) => {
    setFormData(prev => {
      const currentArray = prev[name as keyof typeof prev] as string[];
      const isSelected = currentArray.includes(value);
      
      return {
        ...prev,
        [name]: isSelected 
          ? currentArray.filter(item => item !== value)
          : [...currentArray, value]
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/suppliers`, formData);

      // Store user data in AuthContext
      const supplierData = {
        id: response.data.id,
        type: 'supplier' as const,
        name: response.data.contactPerson,
        phone: response.data.phone,
        businessName: response.data.businessName,
        contactPerson: response.data.contactPerson,
        isVerified: response.data.isVerified
      };
      
      login(supplierData);

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
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Join as Supplier</h3>
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
                onChange={handleChange}
                className="flex-1 focus:ring-blue-500 focus:border-blue-500 block w-full rounded-none rounded-r-md sm:text-sm border-gray-300"
                placeholder="9876543210"
              />
            </div>
          </div>

          {/* Business Name */}
          <div>
            <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
              Business Name *
            </label>
            <input
              type="text"
              name="businessName"
              id="businessName"
              required
              value={formData.businessName}
              onChange={handleChange}
              className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              placeholder="e.g., Sharma Wholesale Traders"
            />
          </div>

          {/* Contact Person */}
          <div>
            <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700">
              Contact Person *
            </label>
            <input
              type="text"
              name="contactPerson"
              id="contactPerson"
              required
              value={formData.contactPerson}
              onChange={handleChange}
              className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              placeholder="Full name of contact person"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              placeholder="supplier@example.com"
            />
          </div>

          {/* Business Address */}
          <div>
            <label htmlFor="businessAddress" className="block text-sm font-medium text-gray-700">
              Business Address *
            </label>
            <textarea
              name="businessAddress"
              id="businessAddress"
              required
              rows={3}
              value={formData.businessAddress}
              onChange={handleChange}
              className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              placeholder="Complete business address with pincode"
            />
          </div>

          {/* Bank Account */}
          <div>
            <label htmlFor="bankAccount" className="block text-sm font-medium text-gray-700">
              Bank Account Number *
            </label>
            <input
              type="text"
              name="bankAccount"
              id="bankAccount"
              required
              value={formData.bankAccount}
              onChange={handleChange}
              className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              placeholder="Bank account for payments"
            />
          </div>

          {/* Delivery Areas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delivery Areas * (Select areas you can deliver to)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {availableAreas.map((area) => (
                <label key={area} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.deliveryAreas.includes(area)}
                    onChange={() => handleMultiSelect('deliveryAreas', area)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{area}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Product Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Categories * (Select what you supply)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {productCategories.map((category) => (
                <label key={category} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.productCategories.includes(category)}
                    onChange={() => handleMultiSelect('productCategories', category)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{category}</span>
                </label>
              ))}
            </div>
          </div>

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
              disabled={isLoading || formData.deliveryAreas.length === 0 || formData.productCategories.length === 0}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Creating Account...' : 'Join as Supplier'}
            </button>
          </div>
        </form>

        {/* Info Note */}
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Your supplier account will be verified automatically for this demo. 
            You'll start receiving group orders from vendors in your delivery areas.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SupplierRegistration; 