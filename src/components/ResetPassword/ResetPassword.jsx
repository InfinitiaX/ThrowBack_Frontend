import React, { useEffect, useRef, useState } from 'react';
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

  const location = useLocation();
  const navigate = useNavigate();
  const { clearError } = useAuth();

  // ✅ Debug: Log des états
  useEffect(() => {
    console.log('🔍 Debug ResetPassword - États:', {
      token: token ? 'présent' : 'absent',
      loading,
      done,
      error,
      msg
    });
  }, [token, loading, done, error, msg]);

  // Récupération robuste du token
  useEffect(() => {
    clearError();
    setError('');

    const fromRouter = new URLSearchParams(location.search || '');
    let t = fromRouter.get('token');
    if (!t && typeof window !== 'undefined') {
      t = new URL(window.location.href).searchParams.get('token');
    }

    console.log('🔍 Token récupéré:', t ? 'présent' : 'absent');
    setToken(t || '');
    setMsg(fromRouter.get('message') || '');

    // ✅ Autofocus amélioré avec vérification
    const focusFirstInput = () => {
      try {
        if (passwordRef.current) {
          console.log('🔍 Tentative de focus sur le premier input');
          passwordRef.current.focus();
          
          // ✅ Test si l'input peut recevoir la saisie
          passwordRef.current.addEventListener('focus', () => {
            console.log('✅ Input focusé avec succès');
          });
          
          passwordRef.current.addEventListener('input', () => {
            console.log('✅ Saisie détectée dans l\'input');
          });
        }
      } catch (err) {
        console.error('❌ Erreur de focus:', err);
      }
    };

    // ✅ Attendre que le DOM soit complètement rendu
    setTimeout(focusFirstInput, 100);
  }, [location.search, clearError]);

  const handleSubmit = async (e) => {
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
  };

  // ✅ Gestion du clic pour debug
  const handleInputClick = (inputName) => {
    console.log(`🔍 Clic détecté sur ${inputName}`);
  };

  // ✅ Gestion des changements pour debug
  const handleInputChange = (inputName, value) => {
    console.log(`🔍 Changement détecté sur ${inputName}:`, value.length, 'caractères');
  };

  return (
    <div className="reset-password-container">
      <div className="reset-password-form-container">
        <h2>Réinitialisation du mot de passe</h2>

        {/* ✅ Debug info (à retirer en production) */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ 
            background: '#f0f0f0', 
            padding: '10px', 
            marginBottom: '15px',
            fontSize: '12px',
            fontFamily: 'monospace'
          }}>
            <strong>Debug:</strong><br/>
            Token: {token ? '✅ Présent' : '❌ Absent'}<br/>
            Loading: {loading ? '✅' : '❌'}<br/>
            Done: {done ? '✅' : '❌'}
          </div>
        )}

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
                disabled={loading}
                onClick={() => handleInputClick('password')}
                onChange={(e) => handleInputChange('password', e.target.value)}
                style={{
                  // ✅ Styles forcés pour debug
                  pointerEvents: 'auto',
                  userSelect: 'auto',
                  cursor: loading ? 'not-allowed' : 'text'
                }}
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
                onClick={() => handleInputClick('confirm')}
                onChange={(e) => handleInputChange('confirm', e.target.value)}
                style={{
                  // ✅ Styles forcés pour debug
                  pointerEvents: 'auto',
                  userSelect: 'auto',
                  cursor: loading ? 'not-allowed' : 'text'
                }}
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