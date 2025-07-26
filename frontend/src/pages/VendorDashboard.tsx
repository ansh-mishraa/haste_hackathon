import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from 'react-query';
import { useAuth } from '../context/AuthContext.tsx';
import {
  PlusIcon,
  MinusIcon,
  UserGroupIcon,
  CreditCardIcon,
  ShoppingCartIcon,
  ChartBarIcon,
  ClockIcon,
  CurrencyRupeeIcon,
  XMarkIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import toast from 'react-hot-toast';

const VendorDashboard: React.FC = () => {
  const { id: vendorId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, getUserId, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showGroupFinder, setShowGroupFinder] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);

  // Get authenticated user's vendor ID
  const authenticatedVendorId = getUserId();

  // Validate authentication and vendor access
  useEffect(() => {
    if (!isAuthenticated || !authenticatedVendorId) {
      toast.error('Please login to access your dashboard.');
      navigate('/', { replace: true });
      return;
    }

    // Check if user is a vendor
    if (user?.type !== 'vendor') {
      toast.error('Access denied. Vendor account required.');
      navigate('/', { replace: true });
      return;
    }

    // Check if URL vendorId matches authenticated user's ID
    if (vendorId && vendorId !== authenticatedVendorId) {
      toast.error('Access denied. You can only access your own dashboard.');
      navigate(`/vendor/${authenticatedVendorId}/dashboard`, { replace: true });
      return;
    }

    // If no vendorId in URL, redirect to correct URL
    if (!vendorId) {
      navigate(`/vendor/${authenticatedVendorId}/dashboard`, { replace: true });
      return;
    }
  }, [isAuthenticated, authenticatedVendorId, user, vendorId, navigate]);

  // Show loading spinner while validating
  if (!isAuthenticated || !authenticatedVendorId || user?.type !== 'vendor') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Use authenticated vendor ID for all operations
  const currentVendorId = authenticatedVendorId;

  // Fetch vendor dashboard data
  const { data: dashboardData, isLoading, error } = useQuery(
    ['vendorDashboard', currentVendorId],
    async () => {
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/vendors/${currentVendorId}/dashboard`);
      return response.data;
    },
    {
      enabled: !!currentVendorId,
      refetchInterval: 30000, // Refresh every 30 seconds
      onError: (error: any) => {
        if (error.response?.status === 404) {
          toast.error('Vendor not found. Please login again.');
          logout(); // Clear invalid session
          navigate('/', { replace: true });
        }
      }
    }
  );

  // Fetch vendor details
  const { data: vendor } = useQuery(
    ['vendor', currentVendorId],
    async () => {
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/vendors/${currentVendorId}`);
      return response.data;
    },
    { 
      enabled: !!currentVendorId,
      onError: (error: any) => {
        if (error.response?.status === 404) {
          toast.error('Vendor not found. Please login again.');
          logout(); // Clear invalid session
          navigate('/', { replace: true });
        }
      }
    }
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
                onClick={() => navigate(`/vendor/${currentVendorId}/order/create`)}
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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <button
                onClick={() => navigate(`/vendor/${currentVendorId}/order/create`)}
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
                onClick={() => setShowCreateGroupModal(true)}
                className="quick-action-btn flex flex-col items-center justify-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100"
              >
                <UserGroupIcon className="h-8 w-8 text-orange-600 mb-2" />
                <span className="text-sm font-medium text-orange-900">Create Group</span>
              </button>
              
              <button
                onClick={() => setShowGroupFinder(true)}
                className="quick-action-btn flex flex-col items-center justify-center p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100"
              >
                <UserGroupIcon className="h-8 w-8 text-indigo-600 mb-2" />
                <span className="text-sm font-medium text-indigo-900">Find Groups</span>
              </button>
              
              <button
                onClick={() => setShowPaymentModal(true)}
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
                  onClick={() => navigate(`/vendor/${currentVendorId}/order/create`)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create Your First Order
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Group Modal */}
        {showCreateGroupModal && (
          <CreateGroupModal
            vendorId={currentVendorId!}
            onClose={() => setShowCreateGroupModal(false)}
                          onGroupCreated={(groupId) => {
                setShowCreateGroupModal(false);
                toast.success('Group created successfully!');
                navigate(`/group/${groupId}`);
                queryClient.invalidateQueries(['vendorDashboard', currentVendorId]);
              }}
          />
        )}

        {/* Group Finder Modal */}
        {showGroupFinder && (
          <GroupFinderModal 
            vendorId={currentVendorId!}
            onClose={() => setShowGroupFinder(false)}
                          onJoinGroup={(groupId) => {
                setShowGroupFinder(false);
                navigate(`/group/${groupId}`);
              }}
          />
        )}

        {/* Payment Modal */}
        {showPaymentModal && (
          <PaymentModal 
            vendorId={currentVendorId!}
            onClose={() => setShowPaymentModal(false)}
            onPaymentComplete={() => {
              setShowPaymentModal(false);
              // Refresh vendor data
              queryClient.invalidateQueries(['vendorDashboard', currentVendorId]);
            }}
          />
        )}
      </div>
    </div>
  );
};

// Group Finder Modal Component
const GroupFinderModal: React.FC<{
  vendorId: string;
  onClose: () => void;
  onJoinGroup: (groupId: string) => void;
}> = ({ vendorId, onClose, onJoinGroup }) => {
  const [searchRadius, setSearchRadius] = useState(2);
  
  const { data: availableGroups, isLoading } = useQuery(
    ['groupSuggestions', vendorId, searchRadius],
    async () => {
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/groups/suggestions/${vendorId}?radius=${searchRadius}`);
      return response.data;
    }
  );

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Find Groups to Join</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Radius (km)
          </label>
          <select
            value={searchRadius}
            onChange={(e) => setSearchRadius(parseInt(e.target.value))}
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={1}>1 km</option>
            <option value={2}>2 km</option>
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
          </select>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Finding groups...</p>
          </div>
        ) : availableGroups && availableGroups.length > 0 ? (
          <div className="space-y-4">
            {availableGroups.map((group: any) => (
              <div key={group.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {group.name || `Group ${group.id.slice(0, 8)}`}
                    </h4>
                    <p className="text-sm text-gray-600 flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      {group.pickupLocation}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {formatDate(group.targetPickupTime)}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                    {group.status}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    {group.memberships?.length || 0} / {group.maxMembers} members
                  </div>
                  <button
                    onClick={() => onJoinGroup(group.id)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
                  >
                    Join Group
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No groups found</h3>
            <p className="mt-2 text-sm text-gray-500">
              No groups are currently forming in your area. Try increasing the search radius or create your own group.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Payment Modal Component
const PaymentModal: React.FC<{
  vendorId: string;
  onClose: () => void;
  onPaymentComplete: () => void;
}> = ({ vendorId, onClose, onPaymentComplete }) => {
  const { data: vendor } = useQuery(
    ['vendor', vendorId],
    async () => {
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/vendors/${vendorId}`);
      return response.data;
    }
  );

  const { data: pendingPayments } = useQuery(
    ['pendingPayments', vendorId],
    async () => {
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/payments?vendorId=${vendorId}&status=PENDING`);
      return response.data;
    }
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Payment Dashboard</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Credit Summary */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Available Credit</p>
              <p className="text-lg font-semibold text-blue-600">
                {formatCurrency((vendor?.availableCredit || 0) - (vendor?.usedCredit || 0))}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Used Credit</p>
              <p className="text-lg font-semibold text-orange-600">
                {formatCurrency(vendor?.usedCredit || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Pending Payments */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Pending Payments</h4>
          {pendingPayments && pendingPayments.length > 0 ? (
            <div className="space-y-3">
              {pendingPayments.map((payment: any) => (
                <div key={payment.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium">{payment.type.replace('_', ' ')}</p>
                    <p className="text-sm text-gray-600">
                      Due: {new Date(payment.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                    <button
                      onClick={() => {
                        onClose();
                        // Navigate to payment page
                        window.location.href = `/payment/${payment.id}?vendorId=${vendorId}&orderId=${payment.orderId}`;
                      }}
                      className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    >
                      Pay Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No pending payments</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <button
            onClick={() => {
              onClose();
              // Navigate to create order with pay later
              window.location.href = `/vendor/${vendorId}/order/create`;
            }}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
          >
            Order with Pay Later
          </button>
          <button
            onClick={onClose}
            className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Create Group Modal Component
const CreateGroupModal: React.FC<{
  vendorId: string;
  onClose: () => void;
  onGroupCreated: (groupId: string) => void;
}> = ({ vendorId, onClose, onGroupCreated }) => {
  const [step, setStep] = useState(1);
  const [groupForm, setGroupForm] = useState({
    name: '',
    pickupLocation: '',
    targetPickupTime: '',
    minMembers: 3,
    maxMembers: 20,
    description: ''
  });
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch popular products for initial order
  const { data: products } = useQuery(
    'popularProducts',
    async () => {
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/products?limit=20`);
      return response.data;
    }
  );

  const addProduct = (product: any) => {
    const existingItem = selectedProducts.find(item => item.productId === product.id);
    if (existingItem) {
      setSelectedProducts(items => 
        items.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setSelectedProducts(items => [...items, {
        productId: product.id,
        product,
        quantity: 1,
        unit: product.unit,
        pricePerUnit: product.marketPrice
      }]);
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setSelectedProducts(items => items.filter(item => item.productId !== productId));
      return;
    }
    setSelectedProducts(items =>
      items.map(item =>
        item.productId === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const calculateTotalAmount = () => {
    return selectedProducts.reduce((total, item) => total + (item.quantity * item.pricePerUnit), 0);
  };

  const calculatePerMemberCost = () => {
    const total = calculateTotalAmount();
    return total / groupForm.maxMembers;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleCreateGroup = async () => {
    if (step === 1) {
      // Validate step 1
      if (!groupForm.name || !groupForm.pickupLocation || !groupForm.targetPickupTime) {
        toast.error('Please fill in all required fields');
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      setIsCreating(true);
      try {
        // Create group with initial order items
        const groupData = {
          name: groupForm.name,
          targetPickupTime: groupForm.targetPickupTime,
          pickupLocation: groupForm.pickupLocation,
          pickupLatitude: 0, // Would be filled by location picker in real app
          pickupLongitude: 0,
          minMembers: groupForm.minMembers,
          maxMembers: groupForm.maxMembers,
          creatorVendorId: vendorId,
          initialOrderItems: selectedProducts.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unit: item.unit,
            pricePerUnit: item.pricePerUnit
          }))
        };

        const response = await axios.post(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/groups`,
          groupData
        );

        onGroupCreated(response.data.id);
      } catch (error: any) {
        console.error('Group creation error:', error);
        toast.error(error.response?.data?.error || 'Failed to create group');
      } finally {
        setIsCreating(false);
      }
    }
  };

  const getMinDatetime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 2); // Minimum 2 hours from now
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-medium text-gray-900">Create New Group</h3>
            <div className="flex items-center mt-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                1
              </div>
              <div className={`w-12 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                2
              </div>
              <span className="ml-3 text-sm text-gray-500">
                Step {step} of 2: {step === 1 ? 'Group Details' : 'Add Products & Preview'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Morning Vegetable Group - MG Road"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pickup Location *
                </label>
                <input
                  type="text"
                  value={groupForm.pickupLocation}
                  onChange={(e) => setGroupForm(prev => ({ ...prev, pickupLocation: e.target.value }))}
                  placeholder="e.g., MG Road Market, Near Metro Station"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pickup Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={groupForm.targetPickupTime}
                  onChange={(e) => setGroupForm(prev => ({ ...prev, targetPickupTime: e.target.value }))}
                  min={getMinDatetime()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Members
                </label>
                <select
                  value={groupForm.maxMembers}
                  onChange={(e) => setGroupForm(prev => ({ ...prev, maxMembers: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={5}>5 members</option>
                  <option value={10}>10 members</option>
                  <option value={15}>15 members</option>
                  <option value={20}>20 members</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={groupForm.description}
                onChange={(e) => setGroupForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your group, preferred suppliers, quality requirements, etc."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Group Benefits</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Better bulk pricing with more members</li>
                <li>• Split delivery costs among group members</li>
                <li>• Build trust network with local vendors</li>
                <li>• Coordinate pickup timing with others</li>
              </ul>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">{groupForm.name}</h4>
              <p className="text-sm text-gray-600">
                📍 {groupForm.pickupLocation} • 🕐 {new Date(groupForm.targetPickupTime).toLocaleDateString('en-IN', { 
                  weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
                })} • 👥 Max {groupForm.maxMembers} members
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Product Selection */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Add Products to Group Order</h4>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {products?.map((product: any) => (
                    <div key={product.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300">
                      <div className="flex-1">
                        <h5 className="font-medium text-sm">{product.name}</h5>
                        <p className="text-xs text-gray-500">{formatCurrency(product.marketPrice)}/{product.unit}</p>
                      </div>
                      <button
                        onClick={() => addProduct(product)}
                        className="bg-blue-600 text-white p-1 rounded hover:bg-blue-700"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected Products & Cost Breakdown */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Order Summary & Cost Split</h4>
                {selectedProducts.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No products selected yet</p>
                ) : (
                  <div className="space-y-4">
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {selectedProducts.map((item) => (
                        <div key={item.productId} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <div className="flex-1">
                            <h6 className="text-sm font-medium">{item.product.name}</h6>
                            <p className="text-xs text-gray-500">{formatCurrency(item.pricePerUnit)}/{item.unit}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <MinusIcon className="h-4 w-4" />
                            </button>
                            <span className="w-8 text-center text-sm">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <PlusIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between text-lg font-semibold">
                        <span>Total Amount:</span>
                        <span>{formatCurrency(calculateTotalAmount())}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Cost per member (max {groupForm.maxMembers}):</span>
                        <span>{formatCurrency(calculatePerMemberCost())}</span>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-sm text-green-800">
                          💰 Each member saves ~15-25% compared to individual buying!
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-between">
          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Back
            </button>
          )}
          <div className="flex space-x-3 ml-auto">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateGroup}
              disabled={isCreating}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isCreating ? 'Creating...' : step === 1 ? 'Next: Add Products' : 'Create Group'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard; 