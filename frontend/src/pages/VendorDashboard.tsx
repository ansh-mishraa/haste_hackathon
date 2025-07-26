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

const API_URL = 'http://localhost:5000';

// Create Group Modal Component
const CreateGroupModal: React.FC<{
  vendorId: string;
  onClose: () => void;
  onGroupCreated: (groupId: string) => void;
}> = ({ vendorId, onClose, onGroupCreated }) => {
  const [groupForm, setGroupForm] = useState({
    name: '',
    pickupLocation: '',
    targetPickupTime: '',
    maxMembers: 20,
    description: ''
  });

  const handleCreateGroup = async () => {
    if (!groupForm.name || !groupForm.pickupLocation || !groupForm.targetPickupTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const groupData = {
        name: groupForm.name,
        targetPickupTime: groupForm.targetPickupTime,
        pickupLocation: groupForm.pickupLocation,
        maxMembers: groupForm.maxMembers,
        creatorVendorId: vendorId,
        description: groupForm.description
      };

      const response = await axios.post(`${API_URL}/api/groups`, groupData);
      onGroupCreated(response.data.id);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create group');
    }
  };

  const getMinDatetime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 2);
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-medium text-gray-900">Create New Group</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Group Name *</label>
            <input
              type="text"
              value={groupForm.name}
              onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Morning Vegetable Group - MG Road"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Location *</label>
            <input
              type="text"
              value={groupForm.pickupLocation}
              onChange={(e) => setGroupForm(prev => ({ ...prev, pickupLocation: e.target.value }))}
              placeholder="e.g., MG Road Market, Near Metro Station"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Date & Time *</label>
            <input
              type="datetime-local"
              value={groupForm.targetPickupTime}
              onChange={(e) => setGroupForm(prev => ({ ...prev, targetPickupTime: e.target.value }))}
              min={getMinDatetime()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Members</label>
            <select
              value={groupForm.maxMembers}
              onChange={(e) => setGroupForm(prev => ({ ...prev, maxMembers: Number(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={5}>5 members</option>
              <option value={10}>10 members</option>
              <option value={15}>15 members</option>
              <option value={20}>20 members</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
            <textarea
              value={groupForm.description}
              onChange={(e) => setGroupForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your group, preferred suppliers, quality requirements, etc."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateGroup}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create Group
          </button>
        </div>
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
      const response = await axios.get(`${API_URL}/api/groups/suggestions/${vendorId}?radius=${searchRadius}`);
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
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Search Radius (km)</label>
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
                    <h4 className="font-medium text-gray-900">{group.name || `Group ${group.id.slice(0, 8)}`}</h4>
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
      const response = await axios.get(`${API_URL}/api/vendors/${vendorId}`);
      return response.data;
    }
  );

  const { data: pendingPayments } = useQuery(
    ['pendingPayments', vendorId],
    async () => {
      const response = await axios.get(`${API_URL}/api/payments?vendorId=${vendorId}&status=PENDING`);
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
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
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

// Bids Modal Component
const BidsModal: React.FC<{
  vendorId: string;
  bids: any[];
  onClose: () => void;
  onBidAction: () => void;
}> = ({ vendorId, bids, onClose, onBidAction }) => {
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
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleAcceptBid = async (bidId: string) => {
    try {
      await axios.put(`${API_URL}/api/bids/${bidId}/accept`);
      toast.success('Bid accepted successfully!');
      onBidAction();
    } catch (error) {
      toast.error('Failed to accept bid');
    }
  };

  const handleRejectBid = async (bidId: string) => {
    try {
      await axios.put(`${API_URL}/api/bids/${bidId}/reject`);
      toast.success('Bid rejected');
      onBidAction();
    } catch (error) {
      toast.error('Failed to reject bid');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-medium text-gray-900">Incoming Bids</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {bids.length === 0 ? (
          <div className="text-center py-12">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No bids yet</h3>
            <p className="mt-2 text-sm text-gray-500">
              Suppliers will send bids for your orders. They'll appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {bids.map((bid: any) => (
              <div key={bid.id} className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">{bid.supplier?.businessName}</h4>
                    <p className="text-sm text-gray-600">Order #{bid.order?.id?.slice(0, 8)}</p>
                    <p className="text-sm text-gray-600">Rating: ⭐ {bid.supplier?.rating || 5.0}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    bid.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    bid.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {bid.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Bid Amount</p>
                    <p className="text-lg font-semibold text-green-600">{formatCurrency(bid.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Delivery Time</p>
                    <p className="font-medium">{formatDate(bid.deliveryTime)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Valid Until</p>
                    <p className="font-medium">{formatDate(bid.validUntil)}</p>
                  </div>
                </div>

                {bid.message && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Message</p>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded">{bid.message}</p>
                  </div>
                )}

                {bid.status === 'PENDING' && (
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleAcceptBid(bid.id)}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                    >
                      Accept Bid
                    </button>
                    <button
                      onClick={() => handleRejectBid(bid.id)}
                      className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Order History Modal Component
const OrderHistoryModal: React.FC<{
  vendorId: string;
  orders: any[];
  onClose: () => void;
}> = ({ vendorId, orders, onClose }) => {
  const navigate = useNavigate();
  
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800';
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-medium text-gray-900">Order History</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCartIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No orders yet</h3>
            <p className="mt-2 text-sm text-gray-500">
              Your order history will appear here once you place your first order.
            </p>
            <button
              onClick={() => {
                onClose();
                navigate(`/vendor/${vendorId}/order/create`);
              }}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Create Your First Order
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => (
              <div key={order.id} className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">Order #{order.id.slice(0, 8)}</h4>
                    <p className="text-sm text-gray-600">Created: {formatDate(order.createdAt)}</p>
                    {order.group && (
                      <p className="text-sm text-blue-600">Group Order: {order.group.name || 'Unnamed Group'}</p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="text-lg font-semibold">{formatCurrency(order.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payment Status</p>
                    <p className={`font-medium ${
                      order.paymentStatus === 'COMPLETED' ? 'text-green-600' : 
                      order.paymentStatus === 'FAILED' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {order.paymentStatus}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Bids Received</p>
                    <p className="font-medium">{order.bids?.length || 0}</p>
                  </div>
                </div>

                {order.items && order.items.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-2">Order Items</p>
                    <div className="bg-gray-50 p-3 rounded space-y-1">
                      {order.items.slice(0, 3).map((item: any, index: number) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{item.product?.name || item.productId}</span>
                          <span>{item.quantity} {item.unit} × {formatCurrency(item.pricePerUnit)}</span>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <p className="text-xs text-gray-500">... and {order.items.length - 3} more items</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex space-x-3">
                  {order.bids && order.bids.length > 0 && (
                    <button className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 text-sm">
                      View Bids ({order.bids.length})
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const VendorDashboard: React.FC = () => {
  const { id: vendorId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, getUserId, logout } = useAuth();
  const [showGroupFinder, setShowGroupFinder] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showBidsModal, setShowBidsModal] = useState(false);
  const [showOrderHistoryModal, setShowOrderHistoryModal] = useState(false);

  // Get authenticated user's vendor ID
  const authenticatedVendorId = getUserId();

  // Validate authentication and vendor access
  useEffect(() => {
    if (!isAuthenticated || !authenticatedVendorId) {
      toast.error('Please login to access your dashboard.');
      navigate('/', { replace: true });
      return;
    }

    if (user?.type !== 'vendor') {
      toast.error('Access denied. Vendor account required.');
      navigate('/', { replace: true });
      return;
    }

    if (vendorId && vendorId !== authenticatedVendorId) {
      toast.error('Access denied. You can only access your own dashboard.');
      navigate(`/vendor/${authenticatedVendorId}/dashboard`, { replace: true });
      return;
    }

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

  const currentVendorId = authenticatedVendorId;

  // Fetch vendor dashboard data
  const { data: dashboardData, isLoading } = useQuery(
    ['vendorDashboard', currentVendorId],
    async () => {
      const response = await axios.get(`${API_URL}/api/vendors/${currentVendorId}/dashboard`);
      return response.data;
    },
    {
      enabled: !!currentVendorId,
      refetchInterval: 30000,
      onError: (error: any) => {
        if (error.response?.status === 404) {
          toast.error('Vendor not found. Please login again.');
          logout();
          navigate('/', { replace: true });
        }
      }
    }
  );

  // Fetch vendor details
  const { data: vendor } = useQuery(
    ['vendor', currentVendorId],
    async () => {
      const response = await axios.get(`${API_URL}/api/vendors/${currentVendorId}`);
      return response.data;
    },
    { 
      enabled: !!currentVendorId,
      onError: (error: any) => {
        if (error.response?.status === 404) {
          toast.error('Vendor not found. Please login again.');
          logout();
          navigate('/', { replace: true });
        }
      }
    }
  );

  // Fetch vendor's orders with bids
  const { data: vendorOrders } = useQuery(
    ['vendorOrders', currentVendorId],
    async () => {
      const response = await axios.get(`${API_URL}/api/orders?vendorId=${currentVendorId}&includeBids=true`);
      return response.data;
    },
    { 
      enabled: !!currentVendorId,
      refetchInterval: 30000
    }
  );

  // Fetch incoming bids for vendor's orders
  const { data: incomingBids } = useQuery(
    ['vendorBids', currentVendorId],
    async () => {
      const response = await axios.get(`${API_URL}/api/vendors/${currentVendorId}/bids`);
      return response.data;
    },
    { 
      enabled: !!currentVendorId,
      refetchInterval: 30000
    }
  );

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
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Home
              </button>
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                  toast.success('Logged out successfully');
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Logout
              </button>
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
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
            </div>
          </div>

          {/* Pending Bids */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-6 w-6 text-orange-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Pending Bids
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {incomingBids?.filter((bid: any) => bid.status === 'PENDING')?.length || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Total Orders */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-purple-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Orders
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {vendorOrders?.length || 0}
                    </dd>
                  </dl>
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
            <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
              <button
                onClick={() => navigate(`/vendor/${currentVendorId}/order/create`)}
                className="quick-action-btn flex flex-col items-center justify-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100"
              >
                <PlusIcon className="h-8 w-8 text-blue-600 mb-2" />
                <span className="text-sm font-medium text-blue-900">Create Order</span>
              </button>
              
              <button
                onClick={() => setShowBidsModal(true)}
                className="quick-action-btn flex flex-col items-center justify-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100"
              >
                <ChartBarIcon className="h-8 w-8 text-orange-600 mb-2" />
                <span className="text-sm font-medium text-orange-900">View Bids</span>
              </button>
              
              <button
                onClick={() => setShowOrderHistoryModal(true)}
                className="quick-action-btn flex flex-col items-center justify-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100"
              >
                <ClockIcon className="h-8 w-8 text-purple-600 mb-2" />
                <span className="text-sm font-medium text-purple-900">Order History</span>
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
                className="quick-action-btn flex flex-col items-center justify-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100"
              >
                <UserGroupIcon className="h-8 w-8 text-yellow-600 mb-2" />
                <span className="text-sm font-medium text-yellow-900">Create Group</span>
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
                className="quick-action-btn flex flex-col items-center justify-center p-4 bg-rose-50 rounded-lg hover:bg-rose-100"
              >
                <CreditCardIcon className="h-8 w-8 text-rose-600 mb-2" />
                <span className="text-sm font-medium text-rose-900">Payments</span>
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

        {/* Modals */}
        {showBidsModal && (
          <BidsModal 
            vendorId={currentVendorId!}
            bids={incomingBids || []}
            onClose={() => setShowBidsModal(false)}
            onBidAction={() => {
              queryClient.invalidateQueries(['vendorBids', currentVendorId]);
              queryClient.invalidateQueries(['vendorDashboard', currentVendorId]);
            }}
          />
        )}

        {showOrderHistoryModal && (
          <OrderHistoryModal 
            vendorId={currentVendorId!}
            orders={vendorOrders || []}
            onClose={() => setShowOrderHistoryModal(false)}
          />
        )}

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

        {showPaymentModal && (
          <PaymentModal 
            vendorId={currentVendorId!}
            onClose={() => setShowPaymentModal(false)}
            onPaymentComplete={() => {
              setShowPaymentModal(false);
              queryClient.invalidateQueries(['vendorDashboard', currentVendorId]);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default VendorDashboard; 