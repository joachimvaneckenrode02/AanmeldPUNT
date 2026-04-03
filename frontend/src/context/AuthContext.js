import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`);
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
    const { token: newToken, user: userData } = response.data;
    localStorage.setItem('token', newToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const register = async (name, email, password, confirmPassword, schoolCode) => {
    const response = await axios.post(`${API_URL}/api/auth/register`, {
      name,
      email,
      password,
      confirmPassword,
      schoolCode
    });
    const { token: newToken, user: userData } = response.data;
    localStorage.setItem('token', newToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const switchSchool = async (schoolId) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/switch-school?schoolId=${schoolId}`);
      const { token: newToken, user: userData } = response.data;
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      setToken(newToken);
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Failed to switch school:', error);
      throw error;
    }
  };

  const joinSchool = async (schoolCode) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/join-school?schoolCode=${schoolCode}`);
      const { token: newToken, user: userData } = response.data;
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      setToken(newToken);
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Failed to join school:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  const isAdmin = () => user?.role === 'admin' || user?.role === 'superadmin';
  const isSuperAdmin = () => user?.role === 'superadmin';
  const isEducator = () => user?.role === 'educator';
  const isTeacher = () => user?.role === 'teacher';
  const canManageAttendance = () => user?.role === 'admin' || user?.role === 'educator' || user?.role === 'superadmin';

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      switchSchool,
      joinSchool,
      logout,
      isAdmin,
      isSuperAdmin,
      isEducator,
      isTeacher,
      canManageAttendance,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
