import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getToken, setToken } from '@/lib/api';
import * as authApi from './api';
import type { Usuario } from './api';

interface AuthContextValue {
  usuario: Usuario | null;
  cargando: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState<boolean>(Boolean(getToken()));

  useEffect(() => {
    if (!getToken()) return;
    authApi
      .me()
      .then(setUsuario)
      .catch(() => setToken(null))
      .finally(() => setCargando(false));
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const sesion = await authApi.login(email, password);
    setUsuario(sesion.usuario);
  };

  const logout = (): void => {
    authApi.logout();
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
