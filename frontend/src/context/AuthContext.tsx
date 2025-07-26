import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  type: 'vendor' | 'supplier';
  name: string;
  phone: string;
  businessType?: string;
  businessLocation?: string;
  businessName?: string;
  contactPerson?: string;
  trustScore?: number;
  isVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  getUserId: () => string | null;
  getUserType: () => 'vendor' | 'supplier' | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on initialization
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const savedUser = localStorage.getItem('vendorcircle_user');
        const savedTimestamp = localStorage.getItem('vendorcircle_auth_timestamp');
        
        if (savedUser && savedTimestamp) {
          const authTimestamp = parseInt(savedTimestamp);
          const currentTime = Date.now();
          const sessionDuration = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
          
          // Check if session has expired
          if (currentTime - authTimestamp > sessionDuration) {
            // Session expired, clear storage
            localStorage.removeItem('vendorcircle_user');
            localStorage.removeItem('vendorcircle_auth_timestamp');
            setUser(null);
          } else {
            // Session valid, parse user data
            const userData = JSON.parse(savedUser);
            // Validate the saved user data
            if (userData.id && userData.type && userData.name && userData.phone) {
              setUser(userData);
              // Refresh timestamp for activity
              localStorage.setItem('vendorcircle_auth_timestamp', currentTime.toString());
            } else {
              // Invalid saved data, remove it
              localStorage.removeItem('vendorcircle_user');
              localStorage.removeItem('vendorcircle_auth_timestamp');
              setUser(null);
            }
          }
        }
      } catch (error) {
        console.error('Error loading authentication data:', error);
        localStorage.removeItem('vendorcircle_user');
        localStorage.removeItem('vendorcircle_auth_timestamp');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    const timestamp = Date.now().toString();
    localStorage.setItem('vendorcircle_user', JSON.stringify(userData));
    localStorage.setItem('vendorcircle_auth_timestamp', timestamp);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('vendorcircle_user');
    localStorage.removeItem('vendorcircle_auth_timestamp');
  };

  const getUserId = () => {
    return user?.id || null;
  };

  const getUserType = () => {
    return user?.type || null;
  };

  const isAuthenticated = !!user;

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated,
    isLoading,
    getUserId,
    getUserType,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 