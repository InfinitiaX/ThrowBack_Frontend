import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import './ResetPassword.css'; // ✅ CSS global (pas module)

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

  // Extraire le token de l'URL
  useEffect(() => {
    clearError();
    setError('');

    const params = new URLSearchParams(location.search || window.location.search || '');
    const t = params.get('token') || '';

    if (t) {
      setToken(t.trim());
    } else {
      setToken('');
      setError("Aucun token de réinitialisation trouvé dans l'URL. Veuillez relancer la procédure.");
    }
  }, [location.search, clearError]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setError("Lien invalide ou expiré. Reprenez la procédure 'Mot de passe oublié'.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    try {
      setLoading(true);
      setError('');

      const { data } = await api.put('/api/auth/reset-password', {
        token,
        password,
      });

      if (data?.success) {
        setSuccess(true);
        setTimeout(() => navigate('/login?message=Password reset successful. You can now sign in.'), 2500);
      } else {
        setError(data?.message || "Une erreur est survenue.");
      }
    } catch (err) {
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
            <p>Votre mot de passe a été réinitialisé avec succès !</p>
            <p>Redirection vers la page de connexion...</p>
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
                // ✅ la saisie reste possible même si le token est vide
                disabled={loading}
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
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="reset-button"
              // ✅ on bloque seulement le submit quand nécessaire
              disabled={loading || !token}
            >
              {loading ? "Réinitialisation en cours..." : "Réinitialiser le mot de passe"}
            </button>
          </form>
        )}

        <div className="form-footer">
          <p><a href="/login">Retour à la connexion</a></p>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
