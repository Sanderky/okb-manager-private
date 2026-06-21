import React, { createContext, useContext, type ReactNode } from 'react';
import { useAuthService } from '../services/useAuthService';

type AuthContextType = ReturnType<typeof useAuthService>;

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const authService = useAuthService();

  return (
    <AuthContext.Provider value={authService}>{children}</AuthContext.Provider>
  );
};
