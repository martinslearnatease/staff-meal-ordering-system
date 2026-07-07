import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';

export const useProtectedRoute = (allowedRoles = []) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
      navigate('/unauthorized');
    }
  }, [isAuthenticated, user, navigate, allowedRoles]);

  return { user, isAuthenticated };
};
