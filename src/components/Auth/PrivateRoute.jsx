// src/components/Auth/PrivateRoute.jsx
import React, { useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { user, token, isLoading } = useAuth();
  const location = useLocation();

  // Vérification simplifiée des permissions avec un rôle unique
  const hasPermission = useMemo(() => {
    if (allowedRoles.length === 0) return true;
    return user?.role && allowedRoles.includes(user.role);
  }, [allowedRoles, user?.role]);

  if (isLoading) {
    return <div className="loading">Chargement...</div>;
  }

  if (!token || !user) {
    // Sauvegarder l'URL d'origine pour redirection après login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasPermission) {
    // Redirige tous les users refusés vers le dashboard user
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default React.memo(PrivateRoute);