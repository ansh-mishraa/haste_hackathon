import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { MagnifyingGlassIcon, FunnelIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import toast from 'react-hot-toast';

// Custom hook for debouncing values
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const ProductCatalog: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, getUserId } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  
  // Debounce search term to prevent excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500); // 500ms delay
  
  // Get authenticated user's vendor ID
  const vendorId = getUserId();

  // Validate authentication
  React.useEffect(() => {
    // Don't do anything while authentication is loading
    if (isLoading) {
      return;
    }

    if (!isAuthenticated || !vendorId) {
      toast.error('Please login to browse products.');
      navigate('/', { replace: true });
      return;
    }

    // Only vendors can browse products for ordering
    if (user?.type !== 'vendor') {
      toast.error('Only vendors can browse products for ordering.');
      navigate('/', { replace: true });
      return;
    }
  }, [isLoading, isAuthenticated, vendorId, user, navigate]);

  // Check if we should enable queries
  const shouldEnableQueries = !isLoading && isAuthenticated && vendorId && user?.type === 'vendor';

  // Fetch products with debounced search
  const { data: products, isLoading: isProductsLoading } = useQuery(
    ['products', debouncedSearchTerm, selectedCategory],
    async () => {
      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/products?${params}`);
      return response.data;
    },
    {
      enabled: shouldEnableQueries
    }
  );

  // Fetch categories
  const { data: categories } = useQuery(
    'productCategories',
    async () => {
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/products/categories`);
      return response.data;
    },
    {
      enabled: shouldEnableQueries
    }
  );

  // Show loading if not authenticated
  if (isLoading || (!isAuthenticated || !vendorId || user?.type !== 'vendor')) {
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

  const handleAddToOrder = (product: any) => {
    const existingItem = cart.find(item => item.productId === product.id);
    if (existingItem) {
      setCart(items => 
        items.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart(items => [...items, {
        productId: product.id,
        product,
        quantity: 1,
        unit: product.unit,
        pricePerUnit: product.marketPrice
      }]);
    }
    toast.success(`${product.name} added to cart`);
  };

  const removeFromCart = (productId: string) => {
    setCart(items => items.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(items =>
      items.map(item =>
        item.productId === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.quantity * item.pricePerUnit), 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Please add some products to your cart');
      return;
    }
    
    // Navigate to order creation with pre-filled cart
    const cartData = encodeURIComponent(JSON.stringify(cart));
    navigate(`/vendor/${vendorId}/order/create?cart=${cartData}`);
  };

  // Show loading indicator when search is being typed but not yet debounced
  const isSearching = searchTerm !== debouncedSearchTerm;

  if (isProductsLoading) {
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
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search products..."
                />
                {/* Search Loading Indicator */}
                {isSearching && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                  </div>
                )}
              </div>
              {isSearching && (
                <p className="text-xs text-gray-500 mt-1">Searching...</p>
              )}
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="block py-2 px-5 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories  </option>
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
                <button 
                  onClick={() => handleAddToOrder(product)}
                  className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
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
        {/* <div className="mt-8 text-center">
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
        </div> */}

        {/* Floating Cart Button */}
        {cart.length > 0 && (
          <div className="fixed bottom-6 right-6 z-50">
            <button
              onClick={handleCheckout}
              className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <div className="flex items-center">
                <ShoppingCartIcon className="h-6 w-6" />
                <span className="ml-2 bg-white text-blue-600 rounded-full px-2 py-1 text-sm font-medium">
                  {cart.length}
                </span>
              </div>
            </button>
          </div>
        )}

        {/* Cart Summary Modal - Show when cart has items */}
        {cart.length > 0 && (
          <div className="fixed bottom-24 right-6 z-40 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
            <h3 className="font-medium text-gray-900 mb-3">Cart Summary</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.productId} className="flex items-center justify-between text-sm">
                  <div className="flex-1">
                    <span className="font-medium">{item.product.name}</span>
                    <div className="text-gray-500">
                      {item.quantity} × {formatCurrency(item.pricePerUnit)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="text-gray-400 hover:text-gray-600 w-6 h-6 flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="text-gray-400 hover:text-gray-600 w-6 h-6 flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span>{formatCurrency(getTotalAmount())}</span>
              </div>
              <button
                onClick={handleCheckout}
                className="w-full mt-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 text-sm"
              >
                Create Order
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCatalog; 