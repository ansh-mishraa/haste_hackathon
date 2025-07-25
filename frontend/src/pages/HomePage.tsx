import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserIcon, 
  BuildingStorefrontIcon,
  CurrencyRupeeIcon,
  UsersIcon,
  TruckIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import VendorRegistration from '../components/VendorRegistration';
import SupplierRegistration from '../components/SupplierRegistration';

const HomePage: React.FC = () => {
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const navigate = useNavigate();

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
                
                {/* CTA Buttons */}
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <button
                      onClick={() => setShowVendorForm(true)}
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
                    >
                      <UserIcon className="w-5 h-5 mr-2" />
                      Join as Vendor
                    </button>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <button
                      onClick={() => setShowSupplierForm(true)}
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 md:py-4 md:text-lg md:px-10"
                    >
                      <BuildingStorefrontIcon className="w-5 h-5 mr-2" />
                      Join as Supplier
                    </button>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
        
        {/* Hero Image */}
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <div className="h-56 w-full bg-gradient-to-r from-orange-400 to-red-500 sm:h-72 md:h-96 lg:w-full lg:h-full flex items-center justify-center">
            <div className="text-center text-white">
              <UsersIcon className="w-24 h-24 mx-auto mb-4" />
              <p className="text-xl font-semibold">Bringing Vendors Together</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white">
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
      </div>

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

      {/* How it Works Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:py-20 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">How VendorCircle Works</h2>
            <p className="mt-4 text-lg text-gray-500">
              Simple steps to start saving money through group buying
            </p>
          </div>
          <div className="mt-12 max-w-lg mx-auto grid gap-5 lg:grid-cols-3 lg:max-w-none">
            <div className="flex flex-col rounded-lg shadow-lg overflow-hidden">
              <div className="flex-1 bg-white p-6 flex flex-col justify-between">
                <div className="flex-1">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-lg mb-4">
                    1
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Post Your Needs
                  </h3>
                  <p className="mt-3 text-base text-gray-500">
                    List the ingredients you need daily. Our smart algorithm finds nearby vendors with similar needs.
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
                    Form Groups
                  </h3>
                  <p className="mt-3 text-base text-gray-500">
                    Join groups automatically or create your own. Chat with members and coordinate pickup details.
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