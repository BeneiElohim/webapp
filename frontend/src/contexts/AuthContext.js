import React, { createContext, useState, useEffect } from 'react';
import api from '../api';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);

  const login = async (username, password) => {
    const formParams = new URLSearchParams();
    formParams.append('username', username);
    formParams.append('password', password);

    const res = await api.post(
      '/token',
      formParams.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const t = res.data.access_token;
    localStorage.setItem('token', t);
    api.defaults.headers.common['Authorization'] = `Bearer ${t}`;
    setToken(t);
    try {
      const [adminRes, userRes] = await Promise.all([
        api.get('/users/me/is-admin'),
        api.get('/users/me')
      ]);
      
      setIsAdmin(adminRes.data.is_admin);
      setUser(userRes.data);
      // Log admin status for debugging
      console.log(`User ${userRes.data.username} logged in. Admin: ${adminRes.data.is_admin}`);
    } catch (err) {
      setIsAdmin(false);
      setUser(null);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setIsAdmin(false);
    setUser(null);
  };

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      Promise.all([
        api.get('/users/me/is-admin'),
        api.get('/users/me')
      ])
        .then(([adminRes, userRes]) => {
          setIsAdmin(adminRes.data.is_admin);
          setUser(userRes.data);
          console.log(`User ${userRes.data.username} loaded. Admin: ${adminRes.data.is_admin}`);
        })
        .catch(() => {
          setIsAdmin(false);
          setUser(null);
        });
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, isAdmin, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}