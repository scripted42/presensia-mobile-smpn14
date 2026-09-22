import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../api/client';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from AsyncStorage on startup
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('auth_token');
        const storedUser = await AsyncStorage.getItem('auth_user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));

          // Validate token with server in background
          client.get('/auth/me')
            .then((res) => {
              if (res.data?.success && res.data?.data) {
                const refreshedUser = res.data.data;
                setUser(refreshedUser);
                AsyncStorage.setItem('auth_user', JSON.stringify(refreshedUser));
              }
            })
            .catch(() => {
              // If token expired (401), clean up
            });
        }
      } catch (e) {
        console.warn('Failed to restore session:', e);
      } finally {
        setLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const login = async (loginIdentifier, password) => {
    try {
      const response = await client.post('/auth/login', {
        login: loginIdentifier,
        password: password,
      });

      if (response.data?.success && response.data?.data) {
        const { user: userData, token: authToken } = response.data.data;
        setUser(userData);
        setToken(authToken);

        await AsyncStorage.setItem('auth_token', authToken);
        await AsyncStorage.setItem('auth_user', JSON.stringify(userData));

        return { success: true, user: userData };
      }
      return { success: false, message: response.data?.message || 'Login gagal.' };
    } catch (error) {
      return {
        success: false,
        message: error.formattedMessage || error.response?.data?.message || 'Login gagal.',
      };
    }
  };

  const logout = async () => {
    try {
      await client.post('/auth/logout').catch(() => {});
    } finally {
      setUser(null);
      setToken(null);
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('auth_user');
    }
  };

  const refreshUser = async () => {
    try {
      const res = await client.get('/auth/me');
      if (res.data?.success && res.data?.data) {
        setUser(res.data.data);
        await AsyncStorage.setItem('auth_user', JSON.stringify(res.data.data));
      }
    } catch (e) {
      console.warn('Error refreshing user:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        refreshUser,
        isStudent: user?.user_type === 'student',
        isTeacher: user?.user_type === 'employee' || user?.user_type === 'teacher',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
