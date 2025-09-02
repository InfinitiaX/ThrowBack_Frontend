import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ApiRedirect = ({ endpoint }) => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    const performRedirect = async () => {
      try {
        setLoading(true);
        // Construire l'URL dynamiquement en remplaçant les paramètres
        let apiUrl = endpoint;
        Object.keys(params).forEach(param => {
          apiUrl = apiUrl.replace(`:${param}`, params[param]);
        });
        
        console.log(`🔄 Redirection API: ${apiUrl}`);
        
        // Appeler l'API backend
        const backendUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';
        const fullUrl = `${backendUrl}${apiUrl}`;
        
        console.log(`📡 Appel API: ${fullUrl}`);
        
        // Suivre manuellement les redirections avec axios
        const response = await axios.get(fullUrl, { 
          maxRedirects: 0,
          validateStatus: status => status >= 200 && status < 400
        });
        
        console.log(`📡 Réponse API:`, response);
        
        // Vérifier si la réponse contient une redirection
        if (response.request && response.request.responseURL) {
          const redirectUrl = response.request.responseURL;
          console.log(`🔄 URL de redirection détectée: ${redirectUrl}`);
          
          try {
            // Analyser l'URL de redirection
            const urlObj = new URL(redirectUrl);
            const redirectPath = urlObj.pathname + urlObj.search;
            console.log(`🔄 Chemin de redirection: ${redirectPath}`);
            
            // IMPORTANT: Vérifier si c'est une redirection vers reset-password
            if (urlObj.pathname.includes('reset-password') || urlObj.search.includes('token=')) {
              console.log(`🔑 Redirection vers reset-password détectée`);
              const token = urlObj.searchParams.get('token');
              
              if (token) {
                console.log(`🔑 Token trouvé: ${token}`);
                navigate(`/reset-password?token=${token}`);
                return;
              }
            }
            
            // Redirection générale
            console.log(`🔄 Redirection vers: ${redirectPath}`);
            navigate(redirectPath);
          } catch (parseError) {
            console.error('Erreur lors de l\'analyse de l\'URL de redirection:', parseError);
            window.location.href = redirectUrl; // Fallback à la redirection directe
          }
        } else {
          console.log('Pas de redirection détectée, retour à l\'accueil');
          navigate('/');
        }
      } catch (error) {
        console.error('Erreur de redirection API:', error);
        
        // Gérer les redirections HTTP 302
        if (error.response && (error.response.status === 301 || error.response.status === 302)) {
          const location = error.response.headers.location;
          console.log(`🔄 Redirection ${error.response.status} vers: ${location}`);
          
          try {
            // Si location est une URL absolue, extraire l'URL
            let urlObj;
            if (location.startsWith('http')) {
              urlObj = new URL(location);
            } else {
              // Pour les URLs relatives
              const baseUrl = process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3000';
              urlObj = new URL(location, baseUrl);
            }
            
            // IMPORTANT: Vérifier spécifiquement pour reset-password
            if (urlObj.pathname.includes('reset-password')) {
              console.log('🔑 Redirection reset-password détectée');
              const token = urlObj.searchParams.get('token');
              
              if (token) {
                console.log(`🔑 Token trouvé: ${token}`);
                navigate(`/reset-password?token=${token}`);
                return;
              }
            }
            
            // Pour d'autres redirections
            if (location.startsWith('http')) {
              // URL absolue
              const frontendUrl = process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3000';
              if (location.startsWith(frontendUrl)) {
                // URL frontend, extraire le chemin relatif
                const path = location.substring(frontendUrl.length);
                navigate(path);
              } else {
                // URL externe, redirection complète
                window.location.href = location;
              }
            } else {
              // URL relative
              navigate(location);
            }
          } catch (parseError) {
            console.error('Erreur lors de l\'analyse de l\'URL de redirection:', parseError);
            window.location.href = location; // Fallback
          }
        } else {
          setError('Une erreur est survenue lors de la redirection');
          setTimeout(() => navigate('/'), 3000);
        }
      } finally {
        setLoading(false);
      }
    };
    
    performRedirect();
  }, [endpoint, navigate, params]);
  
  // Afficher un message de chargement ou d'erreur pendant la redirection
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh', 
      textAlign: 'center',
      padding: '20px',
      background: 'linear-gradient(180deg, #b31217 0%, #430000 100%)',
      color: 'white'
    }}>
      {error ? (
        <div>
          <h1>Erreur</h1>
          <p>{error}</p>
          <p>Redirection vers l'accueil...</p>
        </div>
      ) : (
        <div>
          <h1>Redirection en cours...</h1>
          <p>Veuillez patienter pendant que nous vous redirigeons...</p>
          {loading && (
            <div className="loader" style={{
              width: '48px',
              height: '48px',
              border: '5px solid #FFF',
              borderBottomColor: '#b31217',
              borderRadius: '50%',
              display: 'inline-block',
              boxSizing: 'border-box',
              animation: 'rotation 1s linear infinite',
              margin: '20px auto'
            }}></div>
          )}
          <style>{`
            @keyframes rotation {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default ApiRedirect;