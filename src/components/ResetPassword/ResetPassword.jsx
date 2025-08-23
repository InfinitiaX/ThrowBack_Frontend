import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import './ResetPassword.css'; // CSS global

function ResetPassword() {
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);

  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { clearError } = useAuth();

  // Récupération robuste du token (même si Render a renvoyé /index.html)
  useEffect(() => {
    clearError();
    setError('');

    const fromRouter = new URLSearchParams(location.search || '');
    let t = fromRouter.get('token');
    if (!t && typeof window !== 'undefined') {
      t = new URL(window.location.href).searchParams.get('token');
    }

    setToken(t || '');
    setMsg(fromRouter.get('message') || '');

    // Autofocus après montage (utile si une extension bloque le focus initial)
    setTimeout(() => {
      try {
        passwordRef.current?.focus();
      } catch {}
    }, 0);
  }, [location.search, clearError]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const password = passwordRef.current?.value || '';
    const confirm = confirmRef.current?.value || '';

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
          <div className="info-message"><p>{msg}</p></div>
        )}
        {error && (
          <div className="error-message"><p>{error}</p></div>
        )}

        {done ? (
          <div className="success-message">
            <p>Votre mot de passe a été réinitialisé avec succès !</p>
            <p>Redirection vers la page de connexion…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} autoComplete="off" noValidate>
            <div className="form-group">
              <label htmlFor="password">Nouveau mot de passe</label>
              <input
                id="password"
                ref={passwordRef}
                type="password"
                name="new-password"
                placeholder="Entrez votre nouveau mot de passe"
                autoComplete="new-password"
                disabled={loading}      /* on ne bloque plus la saisie à cause du token */
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirm">Confirmer le mot de passe</label>
              <input
                id="confirm"
                ref={confirmRef}
                type="password"
                name="confirm-password"
                placeholder="Confirmez votre nouveau mot de passe"
                autoComplete="new-password"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="reset-button"
              disabled={loading || !token}  /* on bloque seulement le SUBMIT */
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
