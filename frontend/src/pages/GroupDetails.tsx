import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../context/AuthContext.tsx';
import {
  ChatBubbleLeftRightIcon,
  UsersIcon,
  ShoppingCartIcon,
  MapPinIcon,
  ClockIcon,
  CurrencyRupeeIcon,
  PaperAirplaneIcon,
  TruckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useSocket } from '../context/SocketContext.tsx';

const GroupDetails: React.FC = () => {
  const { id: groupId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const socket = useSocket();
  const { user, isAuthenticated, getUserId } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [newMessage, setNewMessage] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get vendorId from auth context instead of URL
  const vendorId = getUserId();

  // Validate authentication and redirect if not logged in
  React.useEffect(() => {
    if (!isAuthenticated || !vendorId) {
      toast.error('Please login to access group details.');
      navigate('/', { replace: true });
      return;
    }

    // Only vendors can view group details
    if (user?.type !== 'vendor') {
      toast.error('Only vendors can access group details.');
      navigate('/', { replace: true });
      return;
    }
  }, [isAuthenticated, vendorId, user, navigate]);

  // Show loading if not authenticated
  if (!isAuthenticated || !vendorId || user?.type !== 'vendor') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Fetch group details
  const { data: group, isLoading } = useQuery(
    ['group', groupId],
    async () => {
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/groups/${groupId}`);
      return response.data;
    },
    {
      enabled: !!groupId,
      refetchInterval: 30000
    }
  );

  // Fetch group messages
  const { data: messages, refetch: refetchMessages } = useQuery(
    ['groupMessages', groupId],
    async () => {
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/groups/${groupId}/messages`);
      return response.data;
    },
    {
      enabled: !!groupId,
      refetchInterval: 5000 // More frequent for chat
    }
  );

  // Join group mutation
  const joinGroupMutation = useMutation(
    async () => {
      if (!vendorId) {
        throw new Error('Invalid vendor ID. Please login again.');
      }
      
      const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/groups/${groupId}/join`, {
        vendorId
      });
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Successfully joined the group!');
        queryClient.invalidateQueries(['group', groupId]);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to join group');
      }
    }
  );

  // Leave group mutation
  const leaveGroupMutation = useMutation(
    async () => {
      const response = await axios.delete(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/groups/${groupId}/leave`, {
        data: { vendorId }
      });
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Left the group successfully');
        navigate('/vendor/' + vendorId + '/dashboard');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to leave group');
      }
    }
  );

  // Confirm group mutation
  const confirmGroupMutation = useMutation(
    async () => {
      const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/groups/${groupId}/confirm`);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Group confirmed! Suppliers can now bid on your orders.');
        queryClient.invalidateQueries(['group', groupId]);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to confirm group');
      }
    }
  );

  // Send message mutation
  const sendMessageMutation = useMutation(
    async (message: string) => {
      const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/groups/${groupId}/messages`, {
        vendorId,
        message,
        messageType: 'TEXT'
      });
      return response.data;
    },
    {
      onSuccess: () => {
        setNewMessage('');
        refetchMessages();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to send message');
      }
    }
  );

  // Socket event listeners
  useEffect(() => {
    if (socket && groupId) {
      socket.emit('join_group', groupId);

      socket.on('new_message', (message) => {
        refetchMessages();
      });

      socket.on('member_joined', () => {
        queryClient.invalidateQueries(['group', groupId]);
        refetchMessages();
      });

      socket.on('member_left', () => {
        queryClient.invalidateQueries(['group', groupId]);
        refetchMessages();
      });

      socket.on('group_confirmed', () => {
        queryClient.invalidateQueries(['group', groupId]);
        toast.success('Group has been confirmed! Suppliers can now bid.');
      });

      return () => {
        socket.off('new_message');
        socket.off('member_joined');
        socket.off('member_left');
        socket.off('group_confirmed');
      };
    }
  }, [socket, groupId, queryClient, refetchMessages]);

  // Auto scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const isGroupMember = group?.memberships?.some((m: any) => m.vendorId === vendorId);
  const canJoin = group?.status === 'FORMING' && !isGroupMember && 
                 group?.memberships?.length < group?.maxMembers;
  const canConfirm = group?.status === 'FORMING' && 
                    group?.memberships?.length >= group?.minMembers;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && isGroupMember) {
      sendMessageMutation.mutate(newMessage.trim());
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-96 bg-gray-300 rounded-lg"></div>
              <div className="h-96 bg-gray-300 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Group Not Found</h2>
          <p className="text-gray-600 mb-4">The group you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 mobile-padding">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <button
              onClick={() => navigate(-1)}
              className="mr-4 p-2 rounded-md hover:bg-gray-100"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {group.name || `Group ${group.id.slice(0, 8)}`}
              </h1>
              <p className="text-gray-600 flex items-center">
                <MapPinIcon className="h-4 w-4 mr-1" />
                {group.pickupLocation}
              </p>
            </div>
          </div>

          {/* Status and Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                group.status === 'FORMING' ? 'bg-yellow-100 text-yellow-800' :
                group.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                group.status === 'BIDDING' ? 'bg-purple-100 text-purple-800' :
                group.status === 'ORDERED' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {group.status}
              </span>
              <span className="text-sm text-gray-600">
                {group.memberships?.length || 0} / {group.maxMembers} members
              </span>
            </div>

            <div className="mt-4 sm:mt-0 flex space-x-2">
              {canJoin && (
                <button
                  onClick={() => joinGroupMutation.mutate()}
                  disabled={joinGroupMutation.isLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {joinGroupMutation.isLoading ? 'Joining...' : 'Join Group'}
                </button>
              )}
              
              {isGroupMember && group.status === 'FORMING' && (
                <button
                  onClick={() => leaveGroupMutation.mutate()}
                  disabled={leaveGroupMutation.isLoading}
                  className="border border-red-300 text-red-700 px-4 py-2 rounded-md hover:bg-red-50 disabled:opacity-50"
                >
                  Leave Group
                </button>
              )}

              {canConfirm && isGroupMember && (
                <button
                  onClick={() => confirmGroupMutation.mutate()}
                  disabled={confirmGroupMutation.isLoading}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {confirmGroupMutation.isLoading ? 'Confirming...' : 'Confirm Group'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Navigation Tabs */}
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 px-6">
                  {[
                    { id: 'overview', name: 'Overview', icon: UsersIcon },
                    { id: 'orders', name: 'Orders', icon: ShoppingCartIcon },
                    { id: 'chat', name: 'Chat', icon: ChatBubbleLeftRightIcon }
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
                    {/* Group Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium text-gray-900 mb-2">Pickup Details</h3>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <MapPinIcon className="h-4 w-4 mr-2" />
                            {group.pickupLocation}
                          </div>
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-2" />
                            {formatDate(group.targetPickupTime)}
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium text-gray-900 mb-2">Group Stats</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Value:</span>
                            <span className="font-medium">{formatCurrency(group.totalValue || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Est. Savings:</span>
                            <span className="font-medium text-green-600">{formatCurrency(group.estimatedSavings || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Members:</span>
                            <span className="font-medium">{group.memberships?.length || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Group Members */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Group Members</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {group.memberships?.map((membership: any) => (
                          <div key={membership.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                                {membership.vendor.name.charAt(0)}
                              </div>
                            </div>
                            <div className="ml-3">
                              <p className="font-medium text-gray-900">{membership.vendor.name}</p>
                              <p className="text-sm text-gray-600">{membership.vendor.businessType}</p>
                            </div>
                            {membership.isConfirmed && (
                              <CheckCircleIcon className="ml-auto h-5 w-5 text-green-500" />
                            )}
                          </div>
                        )) || (
                          <p className="text-gray-500 col-span-2 text-center py-4">No members yet</p>
                        )}
                      </div>
                    </div>

                    {/* Warning if not enough members */}
                    {group.status === 'FORMING' && group.memberships?.length < group.minMembers && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex">
                          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">
                              More members needed
                            </h3>
                            <p className="text-sm text-yellow-700 mt-1">
                              This group needs at least {group.minMembers - (group.memberships?.length || 0)} more members to be confirmed.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Orders Tab */}
                {activeTab === 'orders' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-900">Group Orders</h3>
                      {isGroupMember && (
                        <button
                          onClick={() => navigate(`/vendor/${vendorId}/order/create?groupId=${groupId}`)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                        >
                          Add Order
                        </button>
                      )}
                    </div>

                    {/* Consolidated Order Summary */}
                    {group.consolidatedOrder && group.consolidatedOrder.length > 0 && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-3">Consolidated Order</h4>
                        <div className="space-y-2">
                          {group.consolidatedOrder.map((item: any, index: number) => (
                            <div key={index} className="flex justify-between items-center">
                              <div>
                                <span className="font-medium">{item.product.name}</span>
                                <span className="text-sm text-gray-600 ml-2">
                                  ({item.quantity} {item.unit})
                                </span>
                              </div>
                              <span className="font-medium">{formatCurrency(item.totalPrice)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Individual Orders */}
                    <div className="space-y-4">
                      {group.orders?.map((order: any) => (
                        <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-medium text-gray-900">
                                Order by {order.vendor?.name}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {order.vendor?.businessType} • {formatDate(order.createdAt)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{formatCurrency(order.totalAmount)}</p>
                              <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                                order.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                                order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                          </div>

                          {/* Order Items */}
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

                          {/* Bids for this order */}
                          {order.bids && order.bids.length > 0 && (
                            <div className="mt-3 p-3 bg-green-50 rounded">
                              <p className="text-sm font-medium text-green-800">
                                {order.bids.length} bid(s) received
                              </p>
                              <p className="text-sm text-green-700">
                                Best bid: {formatCurrency(order.bids[0]?.totalAmount)} by {order.bids[0]?.supplier?.businessName}
                              </p>
                            </div>
                          )}
                        </div>
                      )) || (
                        <div className="text-center py-8">
                          <ShoppingCartIcon className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-4 text-lg font-medium text-gray-900">No orders yet</h3>
                          <p className="mt-2 text-sm text-gray-500">
                            {isGroupMember 
                              ? 'Add your first order to get started'
                              : 'Join the group to add orders'
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Chat Tab */}
                {activeTab === 'chat' && (
                  <div>
                    {isGroupMember ? (
                      <div className="h-96 flex flex-col">
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                          {messages?.map((message: any) => (
                            <div
                              key={message.id}
                              className={`flex ${message.vendorId === vendorId ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                                message.vendorId === vendorId
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-200 text-gray-900'
                              }`}>
                                {message.vendorId !== vendorId && (
                                  <p className="text-xs opacity-75 mb-1">{message.vendor?.name}</p>
                                )}
                                <p className="text-sm">{message.message}</p>
                                <p className={`text-xs mt-1 ${
                                  message.vendorId === vendorId ? 'text-blue-100' : 'text-gray-500'
                                }`}>
                                  {formatDate(message.createdAt)}
                                </p>
                              </div>
                            </div>
                          )) || (
                            <p className="text-gray-500 text-center py-8">No messages yet. Start the conversation!</p>
                          )}
                          <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <form onSubmit={handleSendMessage} className="flex space-x-2">
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={sendMessageMutation.isLoading}
                          />
                          <button
                            type="submit"
                            disabled={!newMessage.trim() || sendMessageMutation.isLoading}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                          >
                            <PaperAirplaneIcon className="h-5 w-5" />
                          </button>
                        </form>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900">Join to Chat</h3>
                        <p className="mt-2 text-sm text-gray-500">
                          Join this group to participate in the group chat.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Group Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium">{group.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Members:</span>
                  <span className="font-medium">{group.memberships?.length || 0} / {group.maxMembers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Value:</span>
                  <span className="font-medium">{formatCurrency(group.totalValue || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated Savings:</span>
                  <span className="font-medium text-green-600">{formatCurrency(group.estimatedSavings || 0)}</span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Timeline</h3>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-600">Group created</span>
                </div>
                
                {group.status !== 'FORMING' && (
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-gray-600">Group confirmed</span>
                  </div>
                )}

                {group.status === 'BIDDING' && (
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    <span className="text-gray-600">Suppliers bidding</span>
                  </div>
                )}

                {group.status === 'ORDERED' && (
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                    <span className="text-gray-600">Orders placed</span>
                  </div>
                )}

                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-gray-300 rounded-full mr-3"></div>
                  <span className="text-gray-400">Pickup scheduled</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {isGroupMember && (
                  <>
                    <button
                      onClick={() => navigate(`/vendor/${vendorId}/order/create?groupId=${groupId}`)}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
                    >
                      Add Order
                    </button>
                    <button
                      onClick={() => setActiveTab('chat')}
                      className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 text-sm"
                    >
                      Open Chat
                    </button>
                  </>
                )}
                
                {!isGroupMember && canJoin && (
                  <button
                    onClick={() => joinGroupMutation.mutate()}
                    disabled={joinGroupMutation.isLoading}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
                  >
                    {joinGroupMutation.isLoading ? 'Joining...' : 'Join Group'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupDetails; 