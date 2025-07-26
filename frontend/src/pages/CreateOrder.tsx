import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { PlusIcon, MinusIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import toast from 'react-hot-toast';

const CreateOrder: React.FC = () => {
  const { id: vendorId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('PAY_LATER');
  const [isLoading, setIsLoading] = useState(false);

  // Get cart data and group ID from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const cartData = urlParams.get('cart');
  const groupId = urlParams.get('groupId');

  // Load cart data from URL on component mount
  React.useEffect(() => {
    if (cartData) {
      try {
        const parsedCart = JSON.parse(decodeURIComponent(cartData));
        setOrderItems(parsedCart);
      } catch (error) {
        console.error('Error parsing cart data:', error);
      }
    }
  }, [cartData]);

  // Fetch popular products
  const { data: products } = useQuery(
    'popularProducts',
    async () => {
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/products?limit=20`);
      return response.data;
    }
  );

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

  const handleSubmit = async () => {
    if (orderItems.length === 0) {
      toast.error('Please add at least one product to your order');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/orders`, {
        vendorId,
        groupId: groupId || undefined,
        orderType: groupId ? 'GROUP' : 'INDIVIDUAL',
        paymentMethod,
        items: orderItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unit: item.unit,
          pricePerUnit: item.pricePerUnit
        }))
      });

      if (groupId) {
        toast.success('Order added to group successfully!');
        navigate(`/group/${groupId}?vendorId=${vendorId}`);
      } else {
        toast.success('Order created successfully! Looking for groups...');
        navigate(`/vendor/${vendorId}/dashboard`);
      }
    } catch (error: any) {
      console.error('Order creation error:', error);
      toast.error(error.response?.data?.error || 'Failed to create order');
    } finally {
      setIsLoading(false);
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Products List */}
          <div className="lg:col-span-2">
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
              </div>
            </div>
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
                    <p className="text-gray-500 mt-2">No items added yet</p>
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
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <MinusIcon className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="text-gray-400 hover:text-gray-600"
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

                    {/* Payment Method */}
                    <div className="border-t pt-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Payment Method</h3>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="PAY_LATER"
                            checked={paymentMethod === 'PAY_LATER'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm">Pay Later (Credit)</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="PAY_NOW"
                            checked={paymentMethod === 'PAY_NOW'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm">Pay Now (UPI/Card)</span>
                        </label>
                      </div>
                    </div>

                    <button
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isLoading ? 'Creating Order...' : 'Create Order'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateOrder; 