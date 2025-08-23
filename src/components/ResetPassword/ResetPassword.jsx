import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import './ResetPassword.css';

function ResetPassword() {
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);

  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [initialized, setInitialized] = useState(false); // ✅ Évite les re-renders

  const location = useLocation();
  const navigate = useNavigate();
  const { clearError } = useAuth();

  // ✅ Mémoisation de clearError pour éviter les re-renders
  const memoizedClearError = useCallback(() => {
    if (clearError) clearError();
  }, [clearError]);

  // ✅ Initialisation unique du composant
  useEffect(() => {
    if (initialized) return; // ✅ Évite les re-initialisations

    console.log('🚀 Initialisation du composant ResetPassword');
    
    // Clear des erreurs
    memoizedClearError();
    setError('');

    // Récupération du token
    const fromRouter = new URLSearchParams(location.search || '');
    let t = fromRouter.get('token');
    if (!t && typeof window !== 'undefined') {
      t = new URL(window.location.href).searchParams.get('token');
    }

    console.log('🔍 Token récupéré:', t ? 'présent' : 'absent');
    setToken(t || '');
    setMsg(fromRouter.get('message') || '');
    setInitialized(true); // ✅ Marque comme initialisé

    // ✅ Focus initial unique
    const focusFirstInput = () => {
      try {
        if (passwordRef.current) {
          console.log('🔍 Focus initial sur le premier input');
          passwordRef.current.focus();
        }
      } catch (err) {
        console.error('❌ Erreur de focus:', err);
      }
    };

    setTimeout(focusFirstInput, 200);
  }, []); // ✅ Dépendances vides = exécution unique

  // ✅ Gestionnaire de soumission optimisé
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    const password = passwordRef.current?.value || '';
    const confirm = confirmRef.current?.value || '';

    console.log('🔍 Tentative de soumission:', {
      passwordLength: password.length,
      confirmLength: confirm.length,
      token: token ? 'présent' : 'absent'
    });

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
      console.log('🚀 Envoi de la requête de réinitialisation...');
      
      const { data } = await api.put('/api/auth/reset-password', { token, password });
      
      if (data?.success) {
        console.log('✅ Réinitialisation réussie');
        setDone(true);
        setMsg(data.message || 'Mot de passe réinitialisé.');
        setTimeout(() => {
          navigate('/login?message=Password reset successful. You can now sign in.', { replace: true });
        }, 1800);
      } else {
        setError(data?.message || 'Une erreur est survenue.');
      }
    } catch (err) {
      console.error('❌ Erreur de réinitialisation:', err);
      setError(
        err?.response?.data?.message ||
          "Une erreur s'est produite lors de la réinitialisation. Veuillez réessayer."
      );
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  // ✅ Gestionnaires d'événements simplifiés (sans re-render)
  const handlePasswordFocus = useCallback(() => {
    console.log('🔍 Focus sur le champ mot de passe');
  }, []);

  const handleConfirmFocus = useCallback(() => {
    console.log('🔍 Focus sur le champ confirmation');
  }, []);

  const handlePasswordChange = useCallback((e) => {
    console.log('🔍 Changement mot de passe:', e.target.value.length, 'caractères');
  }, []);

  const handleConfirmChange = useCallback((e) => {
    console.log('🔍 Changement confirmation:', e.target.value.length, 'caractères');
  }, []);

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
                disabled={loading || !token}
                onFocus={handlePasswordFocus}
                onChange={handlePasswordChange}
                key="password-input" // ✅ Force le re-mount si nécessaire
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
                disabled={loading || !token}
                onFocus={handleConfirmFocus}
                onChange={handleConfirmChange}
                key="confirm-input" // ✅ Force le re-mount si nécessaire
              />
            </div>

            <button
              type="submit"
              className="reset-button"
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