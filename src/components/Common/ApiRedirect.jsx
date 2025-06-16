// src/components/Common/ApiRedirect.jsx
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

const ApiRedirect = ({ endpoint }) => {
  const params = useParams();
  
  useEffect(() => {
    let url = `${process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com'}${endpoint}`;
    
    // Replace placeholders with actual values
    Object.keys(params).forEach(key => {
      url = url.replace(`:${key}`, params[key]);
    });
    
    window.location.href = url;
  }, [endpoint, params]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <h2>Redirecting...</h2>
        <p>Please wait while we redirect you...</p>
      </div>
    </div>
  );
};

export default ApiRedirect;