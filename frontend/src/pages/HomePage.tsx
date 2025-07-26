import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserIcon, 
  BuildingStorefrontIcon,
  CurrencyRupeeIcon,
  UsersIcon,
  TruckIcon,
  ClockIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.tsx';
import VendorRegistration from '../components/VendorRegistration.tsx';
import SupplierRegistration from '../components/SupplierRegistration.tsx';

const HomePage: React.FC = () => {
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginType, setLoginType] = useState<'vendor' | 'supplier'>('vendor');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const features = [
    {
      icon: UsersIcon,
      title: 'Group Buying',
      description: 'Form groups with nearby vendors to buy ingredients in bulk and save money'
    },
    {
      icon: CurrencyRupeeIcon,
      title: 'Pay Later System',
      description: 'Buy now, pay after your daily sales with our smart credit system'
    },
    {
      icon: TruckIcon,
      title: 'Supplier Network',
      description: 'Connect with verified suppliers who bid for your group orders'
    },
    {
      icon: ClockIcon,
      title: 'Real-time Updates',
      description: 'Chat with group members and track orders in real-time'
    }
  ];

  const stats = [
    { label: 'Active Vendors', value: '2,500+' },
    { label: 'Groups Formed', value: '800+' },
    { label: 'Money Saved', value: '₹50L+' },
    { label: 'Verified Suppliers', value: '150+' }
  ];

  const handleVendorLogin = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter your mobile number');
      return;
    }

    if (phoneNumber.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    setIsLoggingIn(true);
    try {
      const vendorResponse = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/vendors/by-phone/${phoneNumber}`);
      if (vendorResponse.data) {
        const vendorData = {
          id: vendorResponse.data.id,
          type: 'vendor' as const,
          name: vendorResponse.data.name,
          phone: vendorResponse.data.phone,
          businessType: vendorResponse.data.businessType,
          businessLocation: vendorResponse.data.businessLocation,
          trustScore: vendorResponse.data.trustScore,
          isVerified: vendorResponse.data.isVerified
        };
        
        // Store user data in context and localStorage
        login(vendorData);
        
        toast.success(`Welcome back, ${vendorData.name}! Redirecting to your dashboard...`);
        navigate(`/vendor/${vendorData.id}/dashboard`);
        return;
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast.error('No vendor account found with this mobile number. Please register as a vendor first.');
      } else {
        toast.error('Failed to login. Please try again.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSupplierLogin = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter your mobile number');
      return;
    }

    if (phoneNumber.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    setIsLoggingIn(true);
    try {
      const supplierResponse = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/suppliers/by-phone/${phoneNumber}`);
      if (supplierResponse.data) {
        const supplierData = {
          id: supplierResponse.data.id,
          type: 'supplier' as const,
          name: supplierResponse.data.contactPerson,
          phone: supplierResponse.data.phone,
          businessName: supplierResponse.data.businessName,
          contactPerson: supplierResponse.data.contactPerson,
          isVerified: supplierResponse.data.isVerified
        };
        
        // Store user data in context and localStorage
        login(supplierData);
        
        toast.success(`Welcome back, ${supplierData.name}! Redirecting to your dashboard...`);
        navigate(`/supplier/${supplierData.id}/dashboard`);
        return;
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast.error('No supplier account found with this mobile number. Please register as a supplier first.');
      } else {
        toast.error('Failed to login. Please try again.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLoginSubmit = () => {
    if (loginType === 'vendor') {
      handleVendorLogin();
    } else {
      handleSupplierLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">Group Buying for</span>{' '}
                  <span className="block text-blue-600 xl:inline">Street Food Vendors</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Join forces with nearby vendors to buy ingredients in bulk, save money, 
                  and access smart credit solutions. VendorCircle makes group buying simple and profitable.
                </p>
                
                {/* Login Section */}
                {!showLogin ? (
                  <div className="mt-5 sm:mt-8">
                    <div className="bg-white p-4 rounded-lg shadow-md max-w-md mx-auto lg:mx-0">
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Already have an account?</h3>
                      <div className="space-y-2">
                        <button
                          onClick={() => {
                            setLoginType('vendor');
                            setShowLogin(true);
                          }}
                          className="w-full flex items-center justify-center px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                        >
                          <UserIcon className="w-4 h-4 mr-2" />
                          Login as Vendor
                        </button>
                        <button
                          onClick={() => {
                            setLoginType('supplier');
                            setShowLogin(true);
                          }}
                          className="w-full flex items-center justify-center px-4 py-2 border border-green-600 text-green-600 rounded-md hover:bg-green-50 transition-colors"
                        >
                          <BuildingStorefrontIcon className="w-4 h-4 mr-2" />
                          Login as Supplier
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 sm:mt-8">
                    <div className="bg-white p-4 rounded-lg shadow-md max-w-md mx-auto lg:mx-0">
                      <h3 className="text-lg font-medium text-gray-900 mb-3">
                        Login as {loginType === 'vendor' ? 'Vendor' : 'Supplier'}
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mobile Number
                          </label>
                          <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            placeholder="Enter 10-digit mobile number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            maxLength={10}
                          />
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={handleLoginSubmit}
                            disabled={isLoggingIn}
                            className={`flex-1 py-2 px-4 rounded-md text-white disabled:opacity-50 flex items-center justify-center ${
                              loginType === 'vendor' 
                                ? 'bg-blue-600 hover:bg-blue-700' 
                                : 'bg-green-600 hover:bg-green-700'
                            }`}
                          >
                            {isLoggingIn ? (
                              'Logging in...'
                            ) : (
                              <>
                                Login
                                <ArrowRightIcon className="w-4 h-4 ml-2" />
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setShowLogin(false);
                              setPhoneNumber('');
                            }}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                        <div className="flex justify-center">
                          <button
                            onClick={() => {
                              setLoginType(loginType === 'vendor' ? 'supplier' : 'vendor');
                              setPhoneNumber('');
                            }}
                            className="text-sm text-gray-500 hover:text-gray-700"
                          >
                            Switch to {loginType === 'vendor' ? 'Supplier' : 'Vendor'} Login
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* CTA Buttons */}
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="text-center lg:text-left">
                    <p className="text-sm text-gray-500 mb-3">New to VendorCircle? Join now:</p>
                    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                      <button
                        onClick={() => setShowVendorForm(true)}
                        className="flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <UserIcon className="w-5 h-5 mr-2" />
                        Join as Vendor
                      </button>
                      <button
                        onClick={() => setShowSupplierForm(true)}
                        className="flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
                      >
                        <BuildingStorefrontIcon className="w-5 h-5 mr-2" />
                        Join as Supplier
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
        
        {/* Hero Image */}
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 flex items-center">
  <img src="https://happay.com/blog/wp-content/uploads/sites/12/2023/04/vendor-management-system.webp" alt="img" />
</div>

      </div>

      {/* Stats Section */}
      {/* <div className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Trusted by Street Food Vendors Across India
            </h2>
            <p className="mt-3 text-xl text-gray-500 sm:mt-4">
              Join thousands of vendors who are already saving money through group buying
            </p>
          </div>
          <dl className="mt-10 text-center sm:max-w-3xl sm:mx-auto sm:grid sm:grid-cols-2 sm:gap-8 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col">
                <dt className="order-2 mt-2 text-lg leading-6 font-medium text-gray-500">
                  {stat.label}
                </dt>
                <dd className="order-1 text-5xl font-extrabold text-blue-600">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div> */}

      {/* Features Section */}
      <div className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to grow your business
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Our platform provides all the tools street food vendors need to reduce costs and increase profits
            </p>
          </div>

          <div className="mt-10">
            <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              {features.map((feature) => (
                <div key={feature.title} className="relative">
                  <dt>
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                      <feature.icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">{feature.title}</p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-gray-500">{feature.description}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* How it Works */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">How it Works</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Simple steps to start saving
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col rounded-lg shadow-lg overflow-hidden">
              <div className="flex-1 bg-white p-6 flex flex-col justify-between">
                <div className="flex-1">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-lg mb-4">
                    1
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Create or Join Groups
                  </h3>
                  <p className="mt-3 text-base text-gray-500">
                    Form buying groups with nearby vendors or join existing ones. More members means better prices!
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col rounded-lg shadow-lg overflow-hidden">
              <div className="flex-1 bg-white p-6 flex flex-col justify-between">
                <div className="flex-1">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-lg mb-4">
                    2
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Place Group Orders
                  </h3>
                  <p className="mt-3 text-base text-gray-500">
                    Select ingredients you need and add them to your group order. Split quantities and costs automatically.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col rounded-lg shadow-lg overflow-hidden">
              <div className="flex-1 bg-white p-6 flex flex-col justify-between">
                <div className="flex-1">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-lg mb-4">
                    3
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Save Money
                  </h3>
                  <p className="mt-3 text-base text-gray-500">
                    Suppliers bid on your group order. Choose the best deal and save 10-20% on your ingredient costs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Modals */}
      {showVendorForm && (
        <VendorRegistration 
          onClose={() => setShowVendorForm(false)}
          onSuccess={(vendorId) => {
            setShowVendorForm(false);
            navigate(`/vendor/${vendorId}/dashboard`);
          }}
        />
      )}

      {showSupplierForm && (
        <SupplierRegistration 
          onClose={() => setShowSupplierForm(false)}
          onSuccess={(supplierId) => {
            setShowSupplierForm(false);
            navigate(`/supplier/${supplierId}/dashboard`);
          }}
        />
      )}
    </div>
  );
};

export default HomePage; 