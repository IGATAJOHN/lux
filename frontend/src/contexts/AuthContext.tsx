import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, userApi } from '@/services/api';
import { toast } from '@/hooks/use-toast';

interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  role: 'guest' | 'admin' | 'staff';
  unique_id?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await userApi.getProfile();
          setUser(response.data);
        } catch (error) {
          localStorage.removeItem('token');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);
      localStorage.setItem('token', response.data.access_token);

      const userResponse = await userApi.getProfile();
      setUser(userResponse.data);

      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
      return userResponse.data;
    } catch (error: any) {
      let message = 'Login failed. Please try again.';
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          message = error.response.data.detail;
        } else if (Array.isArray(error.response.data.detail)) {
          // Pydantic error array
          message = error.response.data.detail
            .map((err: any) => err.msg || 'Invalid input')
            .join(', ');
        } else if (typeof error.response.data.detail === 'object') {
          message = JSON.stringify(error.response.data.detail);
        }
      }

      toast({
        title: 'Login Failed',
        description: message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      await authApi.register({
        ...data,
        role: data.role || 'guest',
      });

      toast({
        title: 'Registration Successful',
        description: 'Your account has been created. Please log in.',
      });
    } catch (error: any) {
      let message = 'Registration failed. Please try again.';
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          message = error.response.data.detail;
        } else if (Array.isArray(error.response.data.detail)) {
          message = error.response.data.detail
            .map((err: any) => err.msg || 'Invalid input')
            .join(', ');
        } else {
          message = JSON.stringify(error.response.data.detail);
        }
      }

      toast({
        title: 'Registration Failed',
        description: message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
