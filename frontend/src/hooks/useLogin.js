import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import { useAuth } from './useAuth';

export const useLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (credentials) => {
    try {
      setLoading(true);
      const response = await authAPI.login(credentials);
      const { user, accessToken, refreshToken } = response.data.data;

      login(user, accessToken, refreshToken);
      toast.success('Login successful!');

      // Redirect based on role
      const roleRoutes = {
        admin: '/admin/dashboard',
        staff: '/staff/dashboard',
        chef: '/chef/dashboard',
      };

      navigate(roleRoutes[user.role] || '/');
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { handleLogin, loading };
};
