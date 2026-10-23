import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.me().then(({ user }) => setUser(user)).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);
  const value = {
    user, loading,
    async login(form) { const result = await api.login(form); setUser(result.user); return result.user; },
    async register(form) { const result = await api.register(form); setUser(result.user); return result.user; },
    async logout() { try { await api.logout(); } finally { setUser(null); } }
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
