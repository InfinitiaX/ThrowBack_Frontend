import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import './styles.module.css'; 

function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { clearError } = useAuth();

  // Extraire le token de l'URL dès le chargement du composant
  useEffect(() => {
    // Réinitialiser l'état
    setError('');
    clearError();
    
    // Extraire le token de l'URL
    const searchParams = new URLSearchParams(location.search);
    const tokenFromUrl = searchParams.get('token');
    
    console.log("🔑 Token extrait de l'URL:", tokenFromUrl);
    
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setError("Aucun token de réinitialisation trouvé dans l'URL. Veuillez réessayer le processus de réinitialisation.");
    }
  }, [location.search, clearError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return setError("Les mots de passe ne correspondent pas.");
    }
    
    if (password.length < 6) {
      return setError("Le mot de passe doit contenir au moins 6 caractères.");
    }
    
    try {
      setLoading(true);
      console.log("🔄 Envoi de la demande de réinitialisation avec token:", token);
      
      const response = await api.put('/api/auth/reset-password', {
        token,
        password
      });
      
      console.log("✅ Réponse reçue:", response.data);
      
      if (response.data.success) {
        setSuccess(true);
        setError('');
        
        // Redirection vers la page de connexion après 3 secondes
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      console.error("❌ Erreur lors de la réinitialisation:", err);
      setError(
        err.response?.data?.message || 
        "Une erreur s'est produite lors de la réinitialisation du mot de passe. Veuillez réessayer."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-container">
      <div className="reset-password-form-container">
        <h2>Réinitialisation du mot de passe</h2>
        
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}
        
        {success ? (
          <div className="success-message">
            <p>Votre mot de passe a été réinitialisé avec succès!</p>
            <p>Vous allez être redirigé vers la page de connexion...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="password">Nouveau mot de passe</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez votre nouveau mot de passe"
                required
                disabled={!token || loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmez votre nouveau mot de passe"
                required
                disabled={!token || loading}
              />
            </div>
            
            <button 
              type="submit" 
              className="reset-button"
              disabled={!token || loading}
            >
              {loading ? "Réinitialisation en cours..." : "Réinitialiser le mot de passe"}
            </button>
          </form>
        )}
        
        <div className="form-footer">
          <p>
            <a href="/login">Retour à la connexion</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;