import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import HomePage from './pages/HomePage.tsx';
import VendorDashboard from './pages/VendorDashboard.tsx';
import SupplierDashboard from './pages/SupplierDashboard.tsx';
import CreateOrder from './pages/CreateOrder.tsx';
import GroupDetails from './pages/GroupDetails.tsx';
import PaymentPage from './pages/PaymentPage.tsx';
import ProductCatalog from './pages/ProductCatalog.tsx';
import { SocketProvider } from './context/SocketContext.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { CartProvider } from './context/CartContext.tsx';
import './App.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <SocketProvider>
            <Router>
              <div className="App">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/vendor/:id/dashboard" element={<VendorDashboard />} />
                  <Route path="/vendor/:id/order/create" element={<CreateOrder />} />
                  <Route path="/supplier/:id/dashboard" element={<SupplierDashboard />} />
                  <Route path="/group/:id" element={<GroupDetails />} />
                  <Route path="/payment/:id" element={<PaymentPage />} />
                  <Route path="/products" element={<ProductCatalog />} />
                </Routes>
                <Toaster 
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#363636',
                      color: '#fff',
                    },
                    success: {
                      duration: 3000,
                      style: {
                        background: '#10B981',
                        color: '#fff',
                      },
                    },
                  }}
                />
              </div>
            </Router>
          </SocketProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App; 