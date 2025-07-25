import React from 'react';
import { useParams } from 'react-router-dom';

const GroupDetails: React.FC = () => {
  const { id: groupId } = useParams<{ id: string }>();

  return (
    <div className="min-h-screen bg-gray-50 mobile-padding">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Group Details
          </h1>
          <p className="text-gray-600 mb-6">
            Group ID: {groupId}
          </p>
          <p className="text-sm text-gray-500">
            Group chat, member management, and order coordination features coming soon.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GroupDetails; 