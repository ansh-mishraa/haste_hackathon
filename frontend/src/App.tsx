import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import HomePage from './pages/HomePage';
import VendorDashboard from './pages/VendorDashboard';
import SupplierDashboard from './pages/SupplierDashboard';
import CreateOrder from './pages/CreateOrder';
import GroupDetails from './pages/GroupDetails';
import PaymentPage from './pages/PaymentPage';
import ProductCatalog from './pages/ProductCatalog';
import { SocketProvider } from './context/SocketContext';
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
                  theme: {
                    primary: 'green',
                    secondary: 'black',
                  },
                },
              }}
            />
          </div>
        </Router>
      </SocketProvider>
    </QueryClientProvider>
  );
}

export default App; 