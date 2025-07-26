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

  // Load user from localStorage on initialization
  useEffect(() => {
    const savedUser = localStorage.getItem('vendorcircle_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        // Validate the saved user data
        if (userData.id && userData.type && userData.name && userData.phone) {
          setUser(userData);
        } else {
          // Invalid saved data, remove it
          localStorage.removeItem('vendorcircle_user');
        }
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('vendorcircle_user');
      }
    }
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('vendorcircle_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('vendorcircle_user');
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
    getUserId,
    getUserType,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 