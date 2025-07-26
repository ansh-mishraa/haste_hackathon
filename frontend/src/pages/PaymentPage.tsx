import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../context/AuthContext.tsx';
import {
  CreditCardIcon,
  BanknotesIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowLeftIcon,
  QrCodeIcon,
  DevicePhoneMobileIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import toast from 'react-hot-toast';

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  available: boolean;
}

const PaymentPage: React.FC = () => {
  const { id: paymentId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, getUserId } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<string>('UPI');
  const [upiId, setUpiId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Get authenticated user's vendor ID
  const vendorId = getUserId();

  // Validate authentication
  React.useEffect(() => {
    if (!isAuthenticated || !vendorId) {
      toast.error('Please login to access payment page.');
      navigate('/', { replace: true });
      return;
    }

    // Only vendors can make payments
    if (user?.type !== 'vendor') {
      toast.error('Only vendors can access payment page.');
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

  // Mock vendor ID (in real app, this would come from auth context)
  const orderId = new URLSearchParams(window.location.search).get('orderId');

  // Fetch payment details
  const { data: payment, isLoading } = useQuery(
    ['payment', paymentId],
    async () => {
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/payments/${paymentId}`);
      return response.data;
    },
    {
      enabled: !!paymentId
    }
  );

  // Fetch vendor credit info
  const { data: vendor } = useQuery(
    ['vendor', vendorId],
    async () => {
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/vendors/${vendorId}`);
      return response.data;
    },
    { enabled: !!vendorId }
  );

  // Process payment mutation
  const processPaymentMutation = useMutation(
    async (paymentData: any) => {
      const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/payments/process`, paymentData);
      return response.data;
    },
    {
      onSuccess: (data) => {
        toast.success('Payment processed successfully!');
        queryClient.invalidateQueries(['payment', paymentId]);
        queryClient.invalidateQueries(['vendor', vendorId]);
        
        // Redirect based on payment result
        setTimeout(() => {
          navigate(`/vendor/${vendorId}/dashboard`);
        }, 2000);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Payment failed. Please try again.');
        setIsProcessing(false);
      }
    }
  );

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'UPI',
      name: 'UPI Payment',
      description: 'Pay instantly using UPI ID or QR code',
      icon: QrCodeIcon,
      available: true
    },
    {
      id: 'CARD',
      name: 'Credit/Debit Card',
      description: 'Pay securely with your card',
      icon: CreditCardIcon,
      available: true
    },
    {
      id: 'PAY_LATER',
      name: 'Pay Later (Credit)',
      description: `Available credit: ₹${((vendor?.availableCredit || 0) - (vendor?.usedCredit || 0)).toLocaleString()}`,
      icon: ClockIcon,
      available: vendor ? (vendor.availableCredit - vendor.usedCredit) >= (payment?.amount || 0) : false
    },
    {
      id: 'BANK_TRANSFER',
      name: 'Bank Transfer',
      description: 'Transfer directly from your bank account',
      icon: BanknotesIcon,
      available: true
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handlePayment = async () => {
    if (!payment) return;

    setIsProcessing(true);

    const paymentData = {
      paymentId: payment.id,
      vendorId,
      orderId,
      amount: payment.amount,
      method: selectedMethod,
      upiId: selectedMethod === 'UPI' ? upiId : undefined
    };

    // Simulate different payment flows
    switch (selectedMethod) {
      case 'PAY_LATER':
        // Immediate success for pay later
        processPaymentMutation.mutate(paymentData);
        break;
        
      case 'UPI':
        if (!upiId) {
          toast.error('Please enter your UPI ID');
          setIsProcessing(false);
          return;
        }
        // Simulate UPI payment delay
        setTimeout(() => {
          processPaymentMutation.mutate(paymentData);
        }, 2000);
        break;
        
      case 'CARD':
        // Simulate card payment processing
        setTimeout(() => {
          processPaymentMutation.mutate(paymentData);
        }, 3000);
        break;
        
      case 'BANK_TRANSFER':
        // Simulate bank transfer
        setTimeout(() => {
          processPaymentMutation.mutate(paymentData);
        }, 4000);
        break;
        
      default:
        setIsProcessing(false);
        toast.error('Please select a payment method');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="h-6 bg-gray-300 rounded w-1/2 mb-4"></div>
              <div className="h-20 bg-gray-300 rounded mb-4"></div>
              <div className="h-10 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mock payment data if not found (for demo purposes)
  const mockPayment = {
    id: paymentId,
    amount: 1500,
    type: 'ORDER_PAYMENT',
    status: 'PENDING',
    order: {
      id: orderId,
      totalAmount: 1500,
      vendor: {
        name: 'Demo Vendor'
      }
    }
  };

  const currentPayment = payment || mockPayment;

  return (
    <div className="min-h-screen bg-gray-50 mobile-padding">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              <h1 className="text-2xl font-bold text-gray-900">Complete Payment</h1>
              <p className="text-gray-600">Pay securely for your order</p>
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Summary</h2>
          
          <div className="border-b border-gray-200 pb-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Order Total:</span>
              <span className="font-medium">{formatCurrency(currentPayment.amount)}</span>
            </div>
            
            {currentPayment.order && (
              <div className="text-sm text-gray-500">
                Order ID: {currentPayment.order.id?.slice(0, 8)}...
              </div>
            )}
          </div>

          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Amount to Pay:</span>
            <span className="text-blue-600">{formatCurrency(currentPayment.amount)}</span>
          </div>
        </div>

        {/* Payment Status */}
        {currentPayment.status !== 'PENDING' && (
          <div className={`border rounded-lg p-4 mb-6 ${
            currentPayment.status === 'COMPLETED' 
              ? 'bg-green-50 border-green-200' 
              : currentPayment.status === 'FAILED'
              ? 'bg-red-50 border-red-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-center">
              {currentPayment.status === 'COMPLETED' ? (
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
              ) : (
                <ExclamationCircleIcon className="h-5 w-5 text-yellow-500 mr-2" />
              )}
              <span className={`font-medium ${
                currentPayment.status === 'COMPLETED' ? 'text-green-800' : 'text-yellow-800'
              }`}>
                Payment {currentPayment.status.toLowerCase()}
              </span>
            </div>
          </div>
        )}

        {/* Payment Methods */}
        {currentPayment.status === 'PENDING' && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Choose Payment Method</h2>
            
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedMethod === method.id
                      ? 'border-blue-500 bg-blue-50'
                      : method.available
                      ? 'border-gray-200 hover:border-gray-300'
                      : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                  }`}
                  onClick={() => method.available && setSelectedMethod(method.id)}
                >
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 p-2 rounded-lg ${
                      selectedMethod === method.id ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <method.icon className={`h-5 w-5 ${
                        selectedMethod === method.id ? 'text-blue-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center">
                        <h3 className={`font-medium ${
                          selectedMethod === method.id ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {method.name}
                        </h3>
                        {!method.available && (
                          <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                            Not Available
                          </span>
                        )}
                      </div>
                      <p className={`text-sm ${
                        selectedMethod === method.id ? 'text-blue-700' : 'text-gray-600'
                      }`}>
                        {method.description}
                      </p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      selectedMethod === method.id
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedMethod === method.id && (
                        <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment Form */}
        {currentPayment.status === 'PENDING' && selectedMethod && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Details</h2>
            
            {selectedMethod === 'UPI' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    UPI ID
                  </label>
                  <div className="flex">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="your@upi"
                        className="w-full border-gray-300 rounded-l-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex items-center px-3 border border-l-0 border-gray-300 rounded-r-md bg-gray-50">
                      <DevicePhoneMobileIcon className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">How UPI Payment Works:</h4>
                  <ol className="text-sm text-blue-800 space-y-1">
                    <li>1. Enter your UPI ID</li>
                    <li>2. Click "Pay Now" to initiate payment</li>
                    <li>3. You'll receive a UPI request on your phone</li>
                    <li>4. Approve the payment in your UPI app</li>
                  </ol>
                </div>
              </div>
            )}

            {selectedMethod === 'PAY_LATER' && (
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Pay Later Benefits:</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• No immediate payment required</li>
                    <li>• Pay after your daily sales</li>
                    <li>• Build your trust score with on-time payments</li>
                    <li>• Available credit: {formatCurrency((vendor?.availableCredit || 0) - (vendor?.usedCredit || 0))}</li>
                  </ul>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">Payment Terms:</h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Payment due within 24 hours</li>
                    <li>• Late payment may affect your trust score</li>
                    <li>• Interest charges apply after 7 days</li>
                  </ul>
                </div>
              </div>
            )}

            {selectedMethod === 'CARD' && (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Secure Card Payment:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Your card details are secure and encrypted</li>
                    <li>• Supports all major credit and debit cards</li>
                    <li>• Instant payment confirmation</li>
                    <li>• PCI DSS compliant payment processing</li>
                  </ul>
                </div>
              </div>
            )}

            {selectedMethod === 'BANK_TRANSFER' && (
              <div className="space-y-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-2">Bank Transfer Details:</h4>
                  <div className="text-sm text-purple-800 space-y-1">
                    <p><strong>Account Name:</strong> VendorCircle Platform</p>
                    <p><strong>Account Number:</strong> 1234567890</p>
                    <p><strong>IFSC Code:</strong> DEMO0001234</p>
                    <p><strong>Bank:</strong> Demo Bank Ltd.</p>
                  </div>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Please include your order ID ({currentPayment.order?.id?.slice(0, 8)}...) in the transfer reference.
                    Payment verification may take 2-4 hours.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {currentPayment.status === 'PENDING' && (
          <div className="flex space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handlePayment}
              disabled={isProcessing || !selectedMethod || 
                       (selectedMethod === 'UPI' && !upiId) ||
                       !paymentMethods.find(m => m.id === selectedMethod)?.available}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                `Pay ${formatCurrency(currentPayment.amount)}`
              )}
            </button>
          </div>
        )}

        {/* Security Notice */}
        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <div className="flex items-start">
            <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-1">Secure Payment</p>
              <p>
                Your payment information is protected with bank-level security. 
                VendorCircle uses industry-standard encryption to keep your data safe.
              </p>
            </div>
          </div>
        </div>

        {/* Payment Success State */}
        {currentPayment.status === 'COMPLETED' && (
          <div className="text-center">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-6">
              Your payment of {formatCurrency(currentPayment.amount)} has been processed successfully.
            </p>
            <button
              onClick={() => navigate(`/vendor/${vendorId}/dashboard`)}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-medium"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentPage; 