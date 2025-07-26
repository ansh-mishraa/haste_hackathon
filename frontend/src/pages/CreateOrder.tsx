import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import { useAuth } from '../context/AuthContext.tsx';
import { PlusIcon, MinusIcon, ShoppingCartIcon, XMarkIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import toast from 'react-hot-toast';

const CreateOrder: React.FC = () => {
  const { id: vendorId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, getUserId } = useAuth();
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('PAY_LATER');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [upiId, setUpiId] = useState('vendor@paytm');
  const [paymentDays, setPaymentDays] = useState(30);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Get authenticated user's vendor ID
  const authenticatedVendorId = getUserId();

  // Validate authentication and vendor access
  useEffect(() => {
    if (isLoading) return; // Wait for auth to load

    if (!isAuthenticated || !authenticatedVendorId) {
      toast.error('Please login to create orders.');
      navigate('/', { replace: true });
      return;
    }

    // Check if user is a vendor
    if (user?.type !== 'vendor') {
      toast.error('Only vendors can create orders.');
      navigate('/', { replace: true });
      return;
    }

    // Check if URL vendorId matches authenticated user's ID
    if (vendorId && vendorId !== authenticatedVendorId) {
      toast.error('Access denied. You can only create orders for your account.');
      navigate(`/vendor/${authenticatedVendorId}/order/create`, { replace: true });
      return;
    }

    // If no vendorId in URL, redirect to correct URL
    if (!vendorId) {
      navigate(`/vendor/${authenticatedVendorId}/order/create`, { replace: true });
      return;
    }
  }, [isLoading, isAuthenticated, authenticatedVendorId, user, vendorId, navigate]);

  // Get cart data and group ID from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const cartData = urlParams.get('cart');
  const groupId = urlParams.get('groupId');

  // Load cart data from URL on component mount
  useEffect(() => {
    if (cartData) {
      try {
        const parsedCart = JSON.parse(decodeURIComponent(cartData));
        setOrderItems(parsedCart);
      } catch (error) {
        console.error('Error parsing cart data:', error);
        toast.error('Invalid cart data');
      }
    }
  }, [cartData]);

  // Fetch vendor data
  const { data: vendorData } = useQuery(
    ['vendor', authenticatedVendorId],
    async () => {
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/vendors/${authenticatedVendorId}`);
      return response.data;
    },
    {
      enabled: !!authenticatedVendorId && isAuthenticated && user?.type === 'vendor'
    }
  );

  // Fetch popular products for fallback
  const { data: products } = useQuery(
    'popularProducts',
    async () => {
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/products?limit=20`);
      return response.data;
    },
    {
      enabled: isAuthenticated && user?.type === 'vendor'
    }
  );

  // Show loading if not authenticated or loading
  if (isLoading || !isAuthenticated || !authenticatedVendorId || user?.type !== 'vendor') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const addProduct = (product: any) => {
    const existingItem = orderItems.find(item => item.productId === product.id);
    if (existingItem) {
      setOrderItems(items => 
        items.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setOrderItems(items => [...items, {
        productId: product.id,
        product,
        quantity: 1,
        unit: product.unit,
        pricePerUnit: product.marketPrice
      }]);
    }
    toast.success(`${product.name} added to order`);
  };

  const removeProduct = (productId: string) => {
    setOrderItems(items => items.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeProduct(productId);
      return;
    }
    setOrderItems(items =>
      items.map(item =>
        item.productId === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => total + (item.quantity * item.pricePerUnit), 0);
  };

  const handleCreateOrder = () => {
    if (orderItems.length === 0) {
      toast.error('Please add at least one product to your order');
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async () => {
    if (paymentMethod === 'PAY_LATER' && !agreedToTerms) {
      toast.error('Please agree to the payment terms');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/orders`, {
        vendorId: authenticatedVendorId,
        groupId: groupId || undefined,
        orderType: groupId ? 'GROUP' : 'INDIVIDUAL',
        paymentMethod,
        paymentDetails: {
          upiId: paymentMethod === 'UPI' ? upiId : undefined,
          paymentDays: paymentMethod === 'PAY_LATER' ? paymentDays : undefined
        },
        items: orderItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unit: item.unit,
          pricePerUnit: item.pricePerUnit
        }))
      });

      setShowPaymentModal(false);
      
      if (groupId) {
        toast.success('Order added to group successfully!');
        navigate(`/group/${groupId}?vendorId=${authenticatedVendorId}`);
      } else {
        toast.success('Order created successfully!');
        navigate(`/vendor/${authenticatedVendorId}/dashboard`);
      }
    } catch (error: any) {
      console.error('Order creation error:', error);
      toast.error(error.response?.data?.error || 'Failed to create order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 mobile-padding">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {groupId ? 'Add Order to Group' : 'Create New Order'}
          </h1>
          <p className="text-gray-600 mt-2">
            {groupId 
              ? 'Add your ingredients to the group order for better pricing'
              : 'Select ingredients for your business'
            }
          </p>
          {groupId && (
            <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              Group Order
            </div>
          )}
          
          {/* Vendor Info */}
          {vendorData && (
            <div className="mt-4 bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Business Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Name:</span>
                  <p className="text-gray-900">{vendorData.name}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Business Type:</span>
                  <p className="text-gray-900">{vendorData.businessType}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Location:</span>
                  <p className="text-gray-900">{vendorData.businessLocation}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Products List */}
          <div className="lg:col-span-2">
            {orderItems.length === 0 && products ? (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Popular Products
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {products?.map((product: any) => (
                      <div
                        key={product.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{product.name}</h3>
                            <p className="text-sm text-gray-500">{product.category}</p>
                            <p className="text-lg font-semibold text-blue-600">
                              {formatCurrency(product.marketPrice)}
                              <span className="text-sm font-normal text-gray-500"> /{product.unit}</span>
                            </p>
                          </div>
                          <button
                            onClick={() => addProduct(product)}
                            className="ml-4 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700"
                          >
                            <PlusIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => navigate('/products')}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Browse All Products
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Items from Product Catalog
                </h2>
                <div className="text-center">
                  <button
                    onClick={() => navigate('/products')}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add More Products
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow sticky top-4">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Order Summary
                </h2>

                {orderItems.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCartIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="text-gray-500 mt-2 mb-4">No items added yet</p>
                    <button
                      onClick={() => navigate('/products')}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Browse Products
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orderItems.map((item) => (
                      <div key={item.productId} className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium">{item.product.name}</h4>
                          <p className="text-sm text-gray-500">
                            {formatCurrency(item.pricePerUnit)} per {item.unit}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="text-gray-400 hover:text-gray-600 p-1"
                          >
                            <MinusIcon className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="text-gray-400 hover:text-gray-600 p-1"
                          >
                            <PlusIcon className="h-4 w-4" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeProduct(item.productId)}
                          className="ml-2 text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}

                    <div className="border-t pt-4">
                      <div className="flex justify-between text-lg font-semibold">
                        <span>Total:</span>
                        <span>{formatCurrency(calculateTotal())}</span>
                      </div>
                    </div>

                    <button
                      onClick={handleCreateOrder}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Proceed to Payment
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Choose Payment Method</h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between">
                    <span>Total Amount:</span>
                    <span className="font-semibold">{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* UPI Payment */}
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="UPI"
                    checked={paymentMethod === 'UPI'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="flex-1">
                    <span className="font-medium">Pay Online (UPI)</span>
                    <p className="text-sm text-gray-500">Pay instantly using UPI</p>
                    {paymentMethod === 'UPI' && (
                      <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium mb-2">Scan QR Code or Use UPI ID:</p>
                        <div className="bg-white p-2 rounded border text-center">
                          <p className="font-mono text-blue-600">{upiId}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </label>

                {/* Cash Payment */}
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="CASH"
                    checked={paymentMethod === 'CASH'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="flex-1">
                    <span className="font-medium">Pay by Cash</span>
                    <p className="text-sm text-gray-500">Pay in cash upon delivery</p>
                  </div>
                </label>

                {/* Pay Later */}
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="PAY_LATER"
                    checked={paymentMethod === 'PAY_LATER'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="flex-1">
                    <span className="font-medium">Pay Later (Credit)</span>
                    <p className="text-sm text-gray-500">Pay within specified days</p>
                    {paymentMethod === 'PAY_LATER' && (
                      <div className="mt-2 p-3 bg-yellow-50 rounded-lg">
                        <div className="mb-3">
                          <label className="block text-sm font-medium mb-1">Payment due in (days):</label>
                          <select 
                            value={paymentDays} 
                            onChange={(e) => setPaymentDays(Number(e.target.value))}
                            className="w-full p-2 border border-gray-300 rounded-md"
                          >
                            <option value={7}>7 days</option>
                            <option value={15}>15 days</option>
                            <option value={30}>30 days</option>
                            <option value={45}>45 days</option>
                          </select>
                        </div>
                        <div className="text-xs text-gray-600 mb-2">
                          <p><strong>Payment Agreement:</strong></p>
                          <p>• Payment is due within {paymentDays} days from delivery</p>
                          <p>• Late payment may incur additional charges</p>
                          <p>• Credit terms are subject to approval</p>
                        </div>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={agreedToTerms}
                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="text-xs">I agree to the payment terms</span>
                        </label>
                      </div>
                    )}
                  </div>
                </label>
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePaymentSubmit}
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Creating Order...' : 'Create Order'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateOrder;
