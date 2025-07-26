import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../context/AuthContext.tsx';
import {
  ChartBarIcon,
  CurrencyRupeeIcon,
  DocumentTextIcon,
  TruckIcon,
  ClockIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  PlusIcon,
  BanknotesIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import toast from 'react-hot-toast';

const SupplierDashboard: React.FC = () => {
  const { id: supplierId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading, getUserId, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [bidModal, setBidModal] = useState<{ isOpen: boolean; order: any }>({ isOpen: false, order: null });

  // Get authenticated user's supplier ID
  const authenticatedSupplierId = getUserId();
  const currentSupplierId = authenticatedSupplierId;

  // Check if we should enable queries
  const shouldEnableQueries = !isLoading && isAuthenticated && authenticatedSupplierId && user?.type === 'supplier';

  // Fetch supplier dashboard data
  const { data: dashboardData, isLoading: isDashboardLoading, error } = useQuery(
    ['supplierDashboard', currentSupplierId],
    async () => {
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/suppliers/${currentSupplierId}/dashboard`);
      return response.data;
    },
    {
      enabled: shouldEnableQueries && !!currentSupplierId,
      refetchInterval: 30000, // Refresh every 30 seconds
      onError: (error: any) => {
        if (error.response?.status === 404) {
          toast.error('Supplier not found. Please login again.');
          logout(); // Clear invalid session
          navigate('/', { replace: true });
        }
      }
    }
  );

  // Fetch supplier details
  const { data: supplier } = useQuery(
    ['supplier', currentSupplierId],
    async () => {
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/suppliers/${currentSupplierId}`);
      return response.data;
    },
    { 
      enabled: shouldEnableQueries && !!currentSupplierId,
      onError: (error: any) => {
        if (error.response?.status === 404) {
          toast.error('Supplier not found. Please login again.');
          logout(); // Clear invalid session
          navigate('/', { replace: true });
        }
      }
    }
  );

  // Fetch available orders for bidding
  const { data: availableOrders } = useQuery(
    ['availableOrders', currentSupplierId],
    async () => {
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/suppliers/${currentSupplierId}/available-orders`);
      return response.data;
    },
    { enabled: shouldEnableQueries && !!currentSupplierId }
  );

  // Fetch supplier bids
  const { data: supplierBids } = useQuery(
    ['supplierBids', currentSupplierId],
    async () => {
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/suppliers/${currentSupplierId}/bids`);
      return response.data;
    },
    { enabled: shouldEnableQueries && !!currentSupplierId }
  );

  // Validate authentication and supplier access
  useEffect(() => {
    // Don't do anything while authentication is loading
    if (isLoading) {
      return;
    }

    if (!isAuthenticated || !authenticatedSupplierId) {
      toast.error('Please login to access your dashboard.');
      navigate('/', { replace: true });
      return;
    }

    // Check if user is a supplier
    if (user?.type !== 'supplier') {
      toast.error('Access denied. Supplier account required.');
      navigate('/', { replace: true });
      return;
    }

    // Check if URL supplierId matches authenticated user's ID
    if (supplierId && supplierId !== authenticatedSupplierId) {
      toast.error('Access denied. You can only access your own dashboard.');
      navigate(`/supplier/${authenticatedSupplierId}/dashboard`, { replace: true });
      return;
    }

    // If no supplierId in URL, redirect to correct URL
    if (!supplierId) {
      navigate(`/supplier/${authenticatedSupplierId}/dashboard`, { replace: true });
      return;
    }
  }, [isLoading, isAuthenticated, authenticatedSupplierId, user, supplierId, navigate]);

  // Create bid mutation
  const createBidMutation = useMutation(
    async (bidData: any) => {
      const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/suppliers/bids`, bidData);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Bid submitted successfully!');
        queryClient.invalidateQueries(['availableOrders', currentSupplierId]);
        queryClient.invalidateQueries(['supplierBids', currentSupplierId]);
        setBidModal({ isOpen: false, order: null });
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to submit bid');
      }
    }
  );

  // Update order status mutation
  const updateOrderStatusMutation = useMutation(
    async ({ orderId, status }: { orderId: string; status: string }) => {
      const response = await axios.put(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/orders/${orderId}/status`, {
        status,
        supplierId: currentSupplierId
      });
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Order status updated successfully!');
        queryClient.invalidateQueries(['supplierDashboard', currentSupplierId]);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to update order status');
      }
    }
  );

  // Show loading spinner while validating
  if (isLoading || (!isAuthenticated || !authenticatedSupplierId || user?.type !== 'supplier')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isLoading ? 'Loading...' : 'Validating access...'}
          </p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleBidSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const bidData = {
      orderId: bidModal.order.id,
      supplierId: currentSupplierId,
      totalAmount: parseFloat(formData.get('totalAmount') as string),
      message: formData.get('message') as string,
      deliveryTime: formData.get('deliveryTime') as string,
      validityHours: 24
    };

    createBidMutation.mutate(bidData);
  };

  // Show error if supplier not found
  if (error && (error as any).response?.status === 404) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Supplier not found</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  if (isDashboardLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
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
                {supplier?.businessName} Dashboard
              </h1>
              <p className="text-gray-600">
                {supplier?.contactPerson} • Rating: {supplier?.rating?.toFixed(1)}⭐
              </p>
            </div>
            <div className="mt-4 sm:mt-0 text-right">
              <div className="text-sm text-gray-500">Total Orders</div>
              <div className="text-2xl font-bold text-blue-600">{supplier?.totalOrders || 0}</div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DocumentTextIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending Bids</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {dashboardData?.stats?.pendingBidsCount || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TruckIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Orders</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {dashboardData?.stats?.activeOrdersCount || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyRupeeIcon className="h-6 w-6 text-orange-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Today's Revenue</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatCurrency(dashboardData?.stats?.todaysRevenue || 0)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BanknotesIcon className="h-6 w-6 text-purple-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatCurrency(dashboardData?.totalRevenue || 0)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview', icon: ChartBarIcon },
                { id: 'available-orders', name: 'Available Orders', icon: DocumentTextIcon },
                { id: 'my-bids', name: 'My Bids', icon: ClockIcon },
                { id: 'active-orders', name: 'Active Orders', icon: TruckIcon }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <tab.icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Recent Activity */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {dashboardData?.todaysOrders?.map((order: any) => (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">Order from {order.vendor?.name}</p>
                          <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(order.totalAmount)}</p>
                          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                            order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                            order.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    )) || (
                      <p className="text-gray-500 text-center py-8">No recent orders</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Available Orders Tab */}
            {activeTab === 'available-orders' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Orders Available for Bidding</h3>
                  <span className="text-sm text-gray-500">
                    {availableOrders?.length || 0} orders available
                  </span>
                </div>
                
                <div className="space-y-4">
                  {availableOrders?.map((order: any) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {order.vendor?.name} - {order.vendor?.businessType}
                          </h4>
                          <p className="text-sm text-gray-500">{order.vendor?.businessLocation}</p>
                          {order.group && (
                            <p className="text-sm text-blue-600 font-medium">
                              Group Order • {order.group.pickupLocation}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold">{formatCurrency(order.totalAmount)}</p>
                          {order.group && (
                            <p className="text-sm text-green-600">Group Discount Available</p>
                          )}
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="mb-3">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Items Required:</h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {order.items?.map((item: any) => (
                            <div key={item.id} className="text-sm bg-gray-50 p-2 rounded">
                              <span className="font-medium">{item.product.name}</span>
                              <span className="text-gray-500 ml-1">
                                ({item.quantity} {item.unit})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Existing Bids */}
                      {order.bids && order.bids.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-600">
                            {order.bids.length} bid(s) received • Lowest: {formatCurrency(order.bids[0]?.totalAmount)}
                          </p>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          <ClockIcon className="inline h-4 w-4 mr-1" />
                          {order.group ? `Pickup: ${formatDate(order.group.targetPickupTime)}` : 'Individual Order'}
                        </div>
                        <button
                          onClick={() => setBidModal({ isOpen: true, order })}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                        >
                          <PlusIcon className="inline h-4 w-4 mr-1" />
                          Place Bid
                        </button>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8">
                      <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-4 text-lg font-medium text-gray-900">No orders available</h3>
                      <p className="mt-2 text-sm text-gray-500">
                        New orders will appear here when vendors create them in your delivery areas.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* My Bids Tab */}
            {activeTab === 'my-bids' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">My Bids</h3>
                
                <div className="space-y-4">
                  {supplierBids?.map((bid: any) => (
                    <div key={bid.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            Bid for {bid.order.vendor?.name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            Submitted: {formatDate(bid.createdAt)}
                          </p>
                          {bid.order.group && (
                            <p className="text-sm text-blue-600">
                              Group Order at {bid.order.group.pickupLocation}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold">{formatCurrency(bid.totalAmount)}</p>
                          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                            bid.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                            bid.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                            bid.status === 'EXPIRED' ? 'bg-gray-100 text-gray-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {bid.status}
                          </span>
                        </div>
                      </div>

                      {bid.message && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-600">
                            <strong>Message:</strong> {bid.message}
                          </p>
                        </div>
                      )}

                      <div className="text-sm text-gray-500">
                        <ClockIcon className="inline h-4 w-4 mr-1" />
                        Delivery: {formatDate(bid.deliveryTime)} • Valid until: {formatDate(bid.validUntil)}
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8">
                      <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-4 text-lg font-medium text-gray-900">No bids yet</h3>
                      <p className="mt-2 text-sm text-gray-500">
                        Your bids on orders will appear here.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Active Orders Tab */}
            {activeTab === 'active-orders' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Active Orders</h3>
                
                <div className="space-y-4">
                  {dashboardData?.activeOrders?.map((order: any) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            Order from {order.vendor?.name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {order.vendor?.businessType} • {order.vendor?.businessLocation}
                          </p>
                          <p className="text-sm text-gray-500">
                            Order placed: {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold">{formatCurrency(order.totalAmount)}</p>
                          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                            order.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'PREPARING' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'READY_FOR_PICKUP' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Items:</h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {order.items?.map((item: any) => (
                            <div key={item.id} className="text-sm bg-gray-50 p-2 rounded">
                              <span className="font-medium">{item.product.name}</span>
                              <span className="text-gray-500 ml-1">
                                ({item.quantity} {item.unit})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Status Update Buttons */}
                      <div className="flex space-x-2">
                        {order.status === 'CONFIRMED' && (
                          <button
                            onClick={() => updateOrderStatusMutation.mutate({ orderId: order.id, status: 'PREPARING' })}
                            className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
                          >
                            Start Preparing
                          </button>
                        )}
                        {order.status === 'PREPARING' && (
                          <button
                            onClick={() => updateOrderStatusMutation.mutate({ orderId: order.id, status: 'READY_FOR_PICKUP' })}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                          >
                            Ready for Pickup
                          </button>
                        )}
                        {order.status === 'READY_FOR_PICKUP' && (
                          <button
                            onClick={() => updateOrderStatusMutation.mutate({ orderId: order.id, status: 'DELIVERED' })}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                          >
                            Mark Delivered
                          </button>
                        )}
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8">
                      <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-4 text-lg font-medium text-gray-900">No active orders</h3>
                      <p className="mt-2 text-sm text-gray-500">
                        Orders you're fulfilling will appear here.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bid Modal */}
        {bidModal.isOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Place Bid</h3>
                <button
                  onClick={() => setBidModal({ isOpen: false, order: null })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium">{bidModal.order?.vendor?.name}</h4>
                <p className="text-sm text-gray-600">
                  {bidModal.order?.vendor?.businessType} • {bidModal.order?.vendor?.businessLocation}
                </p>
                <p className="text-sm font-medium">
                  Order Value: {formatCurrency(bidModal.order?.totalAmount)}
                </p>
              </div>

              <form onSubmit={handleBidSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Your Bid Amount (₹) *
                  </label>
                  <input
                    type="number"
                    name="totalAmount"
                    required
                    step="0.01"
                    min="1"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your competitive price"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Delivery Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="deliveryTime"
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Message (Optional)
                  </label>
                  <textarea
                    name="message"
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Any special notes or terms..."
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setBidModal({ isOpen: false, order: null })}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createBidMutation.isLoading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {createBidMutation.isLoading ? 'Submitting...' : 'Submit Bid'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierDashboard; 