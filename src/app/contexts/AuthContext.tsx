/**
 * Authentication Context
 * 
 * Provides authentication state and methods throughout the application
 * Uses React Context API for state management
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState } from '../types';
import { dataService } from '../services/DataService';

interface SignupData {
  email: string;
  username: string;
  password: string;
  name: string;
  companyName?: string;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUserProfile: (user: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USER_KEY = 'auth_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        const userJson = localStorage.getItem(AUTH_USER_KEY);

        if (token && userJson) {
          const user = JSON.parse(userJson);
          
          // Validate token with backend
          const response = await dataService.validateToken(token);
          
          if (response.success && response.data) {
            setAuthState({
              user: response.data,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            // Invalid token, clear storage
            localStorage.removeItem(AUTH_TOKEN_KEY);
            localStorage.removeItem(AUTH_USER_KEY);
            setAuthState({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
          }
        } else {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Failed to initialize authentication',
        });
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await dataService.authenticate(email, password);

      if (response.success && response.data) {
        const user = response.data;
        
        // Token is now stored by ApiDataService.authenticate() when using database mode.
        // For mock mode, create a simple token.
        const existingToken = localStorage.getItem(AUTH_TOKEN_KEY);
        if (!existingToken) {
          localStorage.setItem(AUTH_TOKEN_KEY, btoa(user.id));
        }
        
        // Store user in localStorage
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));

        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: response.error || 'Authentication failed',
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'An unexpected error occurred',
      });
    }
  };

  const signup = async (data: SignupData) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      const { apiFetch } = await import('../services/apiClient');
      const res = await apiFetch<{
        success: boolean;
        data?: { user: User; token: string };
        error?: string;
      }>('/auth/signup', { method: 'POST', body: data, noAuth: true });

      if (res.success && res.data) {
        const user = res.data.user;

        localStorage.setItem(AUTH_TOKEN_KEY, res.data.token);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));

        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: res.error || 'Signup failed',
        });
      }
    } catch (error) {
      console.error('Signup error:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'An unexpected error occurred',
      });
    }
  };

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  };

  const refreshUser = async () => {
    if (!authState.user) return;

    try {
      const response = await dataService.getUserById(authState.user.id);
      
      if (response.success && response.data) {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.data));
        setAuthState(prev => ({
          ...prev,
          user: response.data!,
        }));
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const updateUserProfile = async (user: User) => {
    try {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      setAuthState(prev => ({
        ...prev,
        user,
      }));
    } catch (error) {
      console.error('Failed to update user profile:', error);
    }
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    signup,
    logout,
    refreshUser,
    updateUserProfile,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}