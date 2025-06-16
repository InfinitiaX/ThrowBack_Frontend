import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const PrivateAdminRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  // Vérification simplifiée avec le rôle unique
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  if (!isAuthenticated) {
    // Rediriger vers la page de connexion si non authentifié
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    // Rediriger vers le dashboard utilisateur si non admin
    return <Navigate to="/dashboard" replace />;
  }

  // Si l'utilisateur est authentifié et admin, afficher le contenu protégé
  return children;
};

export default PrivateAdminRoute;