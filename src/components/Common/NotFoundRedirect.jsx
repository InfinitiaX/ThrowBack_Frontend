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


    if (token) {
      navigate(`/reset-password${search}`, { replace: true });
    } else {

      navigate(`/login${search}`, { replace: true });
    }
  }, [location, navigate]);

  return null
}
