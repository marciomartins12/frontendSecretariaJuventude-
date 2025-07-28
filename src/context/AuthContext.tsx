import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthState } from '@/types';
import { api } from '@/services/api';

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Verificar se há um token válido no localStorage
    const token = localStorage.getItem('auth-token');
    const savedUser = localStorage.getItem('auth-user');
    
    if (token && savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setAuthState({
          isAuthenticated: true,
          user
        });
      } catch (error) {
        localStorage.removeItem('auth-token');
        localStorage.removeItem('auth-user');
      }
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await api.login(username, password);
      
      const newAuthState: AuthState = {
        isAuthenticated: true,
        user: { username: response.user.username }
      };
      
      setAuthState(newAuthState);
      localStorage.setItem('auth-user', JSON.stringify(newAuthState.user));
      return true;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAuthState({
      isAuthenticated: false,
      user: null,
    });
    api.logout();
    localStorage.removeItem('auth-user');
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, loading }}>
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
