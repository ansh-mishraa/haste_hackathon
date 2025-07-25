import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

const ProductCatalog: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Fetch products
  const { data: products, isLoading } = useQuery(
    ['products', searchTerm, selectedCategory],
    async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/products?${params}`);
      return response.data;
    }
  );

  // Fetch categories
  const { data: categories } = useQuery(
    'productCategories',
    async () => {
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/products/categories`);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-300 rounded-lg"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">Product Catalog</h1>
          <p className="text-gray-600 mt-2">
            Browse ingredients for street food vendors
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search products..."
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="block py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                {categories?.map((category: string) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products?.map((product: any) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow hover-lift overflow-hidden"
            >
              {/* Product Image */}
              <div className="h-48 bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-6xl">
                    {product.category === 'Vegetables' && '🥬'}
                    {product.category === 'Spices' && '🌶️'}
                    {product.category === 'Oils' && '🛢️'}
                    {product.category === 'Dairy' && '🥛'}
                    {product.category === 'Grains' && '🌾'}
                    {product.category === 'Bread' && '🍞'}
                    {(!['Vegetables', 'Spices', 'Oils', 'Dairy', 'Grains', 'Bread'].includes(product.category)) && '🥘'}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {product.category}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(product.marketPrice)}
                    </p>
                    <p className="text-sm text-gray-500">
                      per {product.unit}
                    </p>
                  </div>
                </div>

                {product.description && (
                  <p className="text-sm text-gray-600 mt-2">
                    {product.description}
                  </p>
                )}

                {/* Add to Order Button */}
                <button className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200">
                  Add to Order
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {products && products.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No products found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}

        {/* Seed Products Button */}
        <div className="mt-8 text-center">
          <button
            onClick={async () => {
              try {
                await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/products/seed`);
                window.location.reload();
              } catch (error) {
                console.error('Error seeding products:', error);
              }
            }}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Load Sample Products
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCatalog; 