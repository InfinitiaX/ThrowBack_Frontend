// src/components/Common/NotFoundRedirect.jsx
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function NotFoundRedirect() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const search = location.search || '';
    const params = new URLSearchParams(search);
    const token = params.get('token');

    // Si Render a renvoyé /index.html?token=..., on ré-achemine vers la bonne page
    if (token) {
      navigate(`/reset-password${search}`, { replace: true });
    } else {
      // sinon on garde la query (message d’erreur éventuel) et on va au login
      navigate(`/login${search}`, { replace: true });
    }
  }, [location, navigate]);

  return null; // rien à afficher, c’est juste une redirection
}
