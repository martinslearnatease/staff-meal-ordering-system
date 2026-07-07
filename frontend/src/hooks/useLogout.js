import { useState } from 'react';
import { useAuth } from './useAuth';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { disconnectSocket } from '../services/socket';
import { useNavigate } from 'react-router-dom';

export const useLogout = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await authAPI.logout();
      disconnectSocket();
      logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      logout();
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  return { handleLogout, loading };
};
