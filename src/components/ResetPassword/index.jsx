import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import './styles.module.css';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    return p.get('message') || '';
  });
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { clearError } = useAuth();

  useEffect(() => {
    setError('');
    clearError();
    const params = new URLSearchParams(location.search);
    const t = params.get('token');
    if (t) setToken(t);
    else setError("Aucun token de réinitialisation trouvé. Reprenez la procédure.");
  }, [location.search, clearError]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) return setError('Les mots de passe ne correspondent pas.');
    if (password.length < 6) return setError('Le mot de passe doit contenir au moins 6 caractères.');

    try {
      setLoading(true);
      const { data } = await api.put('/api/auth/reset-password', { token, password });
      if (data?.success) {
        setDone(true);
        setError('');
        setMsg(data.message || 'Password reset successful.');
        setTimeout(() => navigate('/login?message=Password reset successful. You can now sign in.'), 2500);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la réinitialisation. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-container">
      <div className="reset-password-form-container">
        <h2>Réinitialisation du mot de passe</h2>

        {msg && !error && !done && <div className="info-message"><p>{msg}</p></div>}
        {error && <div className="error-message"><p>{error}</p></div>}

        {done ? (
          <div className="success-message">
            <p>Votre mot de passe a été réinitialisé avec succès !</p>
            <p>Redirection vers la page de connexion...</p>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label>Nouveau mot de passe</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required disabled={!token || loading} />
            </div>
            <div className="form-group">
              <label>Confirmer le mot de passe</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required disabled={!token || loading} />
            </div>
            <button type="submit" className="reset-button" disabled={!token || loading}>
              {loading ? 'Réinitialisation...' : 'Réinitialiser'}
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
