import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const PrivateAdminRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();


  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  if (!isAuthenticated) {

    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {

    return <Navigate to="/dashboard" replace />;
  }


  return children;
};

export default PrivateAdminRoute;