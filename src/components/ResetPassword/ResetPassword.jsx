import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import './ResetPassword.css'; // ✅ CSS global (PAS "styles.module.css")

function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { clearError } = useAuth();

  // Récupération robuste du token (même si Render passe un moment par /index.html)
  useEffect(() => {
    clearError();
    setError('');

    const fromRouter = new URLSearchParams(location.search || '');
    let t = fromRouter.get('token');

    if (!t && typeof window !== 'undefined') {
      const sp = new URL(window.location.href).searchParams;
      t = sp.get('token');
    }

    setToken(t || '');
    setMsg(fromRouter.get('message') || '');

    // Debug utile si nécessaire
    // console.log('[ResetPassword] token:', t);
  }, [location.search, clearError]);

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setError("Lien invalide ou expiré. Merci de relancer 'Mot de passe oublié'.");
      return;
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const { data } = await api.put('/api/auth/reset-password', { token, password });
      if (data?.success) {
        setDone(true);
        setMsg(data.message || 'Mot de passe réinitialisé.');
        setTimeout(() => {
          navigate('/login?message=Password reset successful. You can now sign in.', { replace: true });
        }, 1800);
      } else {
        setError(data?.message || 'Une erreur est survenue.');
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Une erreur s'est produite lors de la réinitialisation. Veuillez réessayer."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-container">
      <div className="reset-password-form-container">
        <h2>Réinitialisation du mot de passe</h2>

        {msg && !error && !done && (
          <div className="info-message">
            <p>{msg}</p>
          </div>
        )}
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        {done ? (
          <div className="success-message">
            <p>Votre mot de passe a été réinitialisé avec succès !</p>
            <p>Redirection vers la page de connexion…</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="password">Nouveau mot de passe</label>
              <input
                id="password"
                type="password"
                name="new-password"
                autoComplete="new-password"
                placeholder="Entrez votre nouveau mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                // ✅ on NE bloque plus la saisie (seul le bouton de submit est bloqué)
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirm">Confirmer le mot de passe</label>
              <input
                id="confirm"
                type="password"
                name="confirm-password"
                autoComplete="new-password"
                placeholder="Confirmez votre nouveau mot de passe"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="reset-button"
              // 🔒 on bloque seulement le SUBMIT si pas de token ou en chargement
              disabled={loading || !token}
            >
              {loading ? 'Réinitialisation…' : 'Réinitialiser le mot de passe'}
            </button>
          </form>
        )}

        <div className="form-footer">
          <a href="/login">Retour à la connexion</a>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
