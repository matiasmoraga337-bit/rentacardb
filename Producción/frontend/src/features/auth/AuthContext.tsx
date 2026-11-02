import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getToken, setToken } from '@/lib/api';
import * as authApi from './api';
import type { Sesion, Usuario } from './api';

export type ModoActivo = 'CLIENTE' | 'PROVEEDOR' | 'ADMIN';

interface AuthContextValue {
  usuario: Usuario | null;
  cargando: boolean;
  modoActivo: ModoActivo | null;
  setModoActivo: (modo: ModoActivo | null) => void;
  login: (email: string, password: string) => Promise<void>;
  loginConSesion: (sesion: Sesion) => void;
  refreshUser: () => Promise<Usuario>;
  logout: () => void;
}

const MODO_KEY = 'rentacardb:modo';

function leerModo(): ModoActivo | null {
  if (typeof window === 'undefined') return null;
  const value = window.localStorage.getItem(MODO_KEY);
  return value === 'CLIENTE' || value === 'PROVEEDOR' || value === 'ADMIN' ? value : null;
}

function modoValido(modo: ModoActivo | null, roles: string[]): ModoActivo | null {
  return modo && roles.includes(modo) ? modo : null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState<boolean>(Boolean(getToken()));
  const [modoActivo, setModoState] = useState<ModoActivo | null>(() => leerModo());

  useEffect(() => {
    if (!getToken()) return;
    authApi
      .me()
      .then((user) => {
        setUsuario(user);
        setModoState((actual) => modoValido(actual, user.roles));
      })
      .catch(() => setToken(null))
      .finally(() => setCargando(false));
  }, []);

  const setModoActivo = (modo: ModoActivo | null): void => {
    setModoState(modo);
    if (typeof window !== 'undefined') {
      if (modo) window.localStorage.setItem(MODO_KEY, modo);
      else window.localStorage.removeItem(MODO_KEY);
    }
  };

  const loginConSesion = (sesion: Sesion): void => {
    setToken(sesion.token);
    setUsuario(sesion.usuario);
    setModoActivo(modoValido(leerModo(), sesion.usuario.roles));
  };

  const login = async (email: string, password: string): Promise<void> => {
    const sesion = await authApi.login(email, password);
    setUsuario(sesion.usuario);
    setModoActivo(modoValido(leerModo(), sesion.usuario.roles));
  };

  const refreshUser = async (): Promise<Usuario> => {
    const user = await authApi.me();
    setUsuario(user);
    setModoState((actual) => modoValido(actual, user.roles));
    return user;
  };

  const logout = (): void => {
    authApi.logout();
    setUsuario(null);
    setModoActivo(null);
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        cargando,
        modoActivo,
        setModoActivo,
        login,
        loginConSesion,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
