import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
  PlusIcon,
  UserGroupIcon,
  CreditCardIcon,
  ShoppingCartIcon,
  TruckIcon,
  ChartBarIcon,
  ClockIcon,
  CurrencyRupeeIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import toast from 'react-hot-toast';

const VendorDashboard: React.FC = () => {
  const { id: vendorId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch vendor dashboard data
  const { data: dashboardData, isLoading } = useQuery(
    ['vendorDashboard', vendorId],
    async () => {
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/vendors/${vendorId}/dashboard`);
      return response.data;
    },
    {
      enabled: !!vendorId,
      refetchInterval: 30000 // Refresh every 30 seconds
    }
  );

  // Fetch vendor details
  const { data: vendor } = useQuery(
    ['vendor', vendorId],
    async () => {
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/vendors/${vendorId}`);
      return response.data;
    },
    { enabled: !!vendorId }
  );

  const getTrustScoreColor = (score: number) => {
    if (score >= 90) return 'trust-score-excellent';
    if (score >= 75) return 'trust-score-good';
    if (score >= 60) return 'trust-score-average';
    return 'trust-score-poor';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-300 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 mobile-padding">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {vendor?.name}!
              </h1>
              <p className="text-gray-600">
                {vendor?.businessType} • {vendor?.businessLocation}
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={() => navigate(`/vendor/${vendorId}/order/create`)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Order
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Today's Orders */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ShoppingCartIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Today's Orders
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {dashboardData?.stats?.todaysOrdersCount || 0}
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-3">
                <div className="text-sm text-gray-500">
                  Total: {formatCurrency(dashboardData?.stats?.todaysOrderValue || 0)}
                </div>
              </div>
            </div>
          </div>

          {/* Credit Info */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CreditCardIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Available Credit
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatCurrency((dashboardData?.creditInfo?.availableCredit || 0) - (dashboardData?.creditInfo?.usedCredit || 0))}
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Trust Score</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getTrustScoreColor(dashboardData?.creditInfo?.trustScore || 0)}`}>
                    {dashboardData?.creditInfo?.trustScore || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Total Savings */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyRupeeIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Savings
                    </dt>
                    <dd className="text-lg font-medium text-green-600">
                      {formatCurrency(dashboardData?.totalSavings || 0)}
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-3">
                <div className="text-sm text-gray-500">
                  Through group buying
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => navigate(`/vendor/${vendorId}/order/create`)}
                className="quick-action-btn flex flex-col items-center justify-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100"
              >
                <PlusIcon className="h-8 w-8 text-blue-600 mb-2" />
                <span className="text-sm font-medium text-blue-900">Create Order</span>
              </button>
              
              <button
                onClick={() => navigate('/products')}
                className="quick-action-btn flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg hover:bg-green-100"
              >
                <ShoppingCartIcon className="h-8 w-8 text-green-600 mb-2" />
                <span className="text-sm font-medium text-green-900">Browse Products</span>
              </button>
              
              <button
                className="quick-action-btn flex flex-col items-center justify-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100"
              >
                <UserGroupIcon className="h-8 w-8 text-orange-600 mb-2" />
                <span className="text-sm font-medium text-orange-900">Find Groups</span>
              </button>
              
              <button
                className="quick-action-btn flex flex-col items-center justify-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100"
              >
                <CreditCardIcon className="h-8 w-8 text-purple-600 mb-2" />
                <span className="text-sm font-medium text-purple-900">Payments</span>
              </button>
            </div>
          </div>
        </div>

        {/* Active Groups */}
        {dashboardData?.activeGroups && dashboardData.activeGroups.length > 0 && (
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Active Groups ({dashboardData.activeGroups.length})
              </h3>
              <div className="space-y-4">
                {dashboardData.activeGroups.map((membership: any) => (
                  <div
                    key={membership.id}
                    className="border border-gray-200 rounded-lg p-4 hover-lift cursor-pointer"
                    onClick={() => navigate(`/group/${membership.group.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {membership.group.name || `Group ${membership.group.id.slice(0, 8)}`}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {membership.group.memberships?.length || 0} members • {membership.group.pickupLocation}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium group-${membership.group.status.toLowerCase()}`}>
                          {membership.group.status}
                        </span>
                        <ChartBarIcon className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        {dashboardData?.recentTransactions && dashboardData.recentTransactions.length > 0 && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Recent Transactions
              </h3>
              <div className="space-y-4">
                {dashboardData.recentTransactions.map((transaction: any) => (
                  <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
                    <div className="flex items-center">
                      <div className={`payment-icon payment-${transaction.method.toLowerCase()}`}>
                        {transaction.method === 'UPI' ? 'U' : transaction.method === 'CASH' ? 'C' : 'CR'}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {transaction.type.replace('_', ' ')}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(transaction.amount)}
                      </p>
                      <p className={`text-xs ${transaction.status === 'COMPLETED' ? 'text-green-600' : transaction.status === 'FAILED' ? 'text-red-600' : 'text-yellow-600'}`}>
                        {transaction.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!dashboardData?.activeGroups || dashboardData.activeGroups.length === 0) && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-8 sm:px-6 text-center">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No active groups yet</h3>
              <p className="mt-2 text-sm text-gray-500">
                Start by creating your first order or joining an existing group to begin saving money!
              </p>
              <div className="mt-6">
                <button
                  onClick={() => navigate(`/vendor/${vendorId}/order/create`)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create Your First Order
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorDashboard; 