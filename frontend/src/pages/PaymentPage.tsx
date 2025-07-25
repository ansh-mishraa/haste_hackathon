import React from 'react';
import { useParams } from 'react-router-dom';

const PaymentPage: React.FC = () => {
  const { id: paymentId } = useParams<{ id: string }>();

  return (
    <div className="min-h-screen bg-gray-50 mobile-padding">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Gateway
          </h1>
          <p className="text-gray-600 mb-6">
            Payment ID: {paymentId}
          </p>
          <p className="text-sm text-gray-500">
            Razorpay integration and payment processing features coming soon.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage; 