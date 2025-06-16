// src/components/Common/PrivateRoute.jsx (vérifié)
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { user, token, loading } = useAuth();
  const location = useLocation();

  // Temporairement désactiver la vérification pour /admin
  if (location.pathname.startsWith('/admin')) {
    return children;
  }

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  if (!token || !user) {
    // Sauvegarder l'URL d'origine pour redirection après login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Vérification simplifiée avec le rôle unique
  if (allowedRoles.length > 0) {
    const userRole = user.role || '';
    const hasPermission = allowedRoles.some(role => 
      userRole.toLowerCase() === role.toLowerCase()
    );

    if (!hasPermission) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export default PrivateRoute;