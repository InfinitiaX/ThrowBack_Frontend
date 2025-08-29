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
  const [initialized, setInitialized] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { clearError } = useAuth();

  const memoizedClearError = useCallback(() => {
    if (clearError) clearError();
  }, [clearError]);

  useEffect(() => {
    if (initialized) return;

    memoizedClearError();
    setError('');

    const fromRouter = new URLSearchParams(location.search || '');
    let t = fromRouter.get('token');
    if (!t && typeof window !== 'undefined') {
      t = new URL(window.location.href).searchParams.get('token');
    }

    setToken(t || '');
    setMsg(fromRouter.get('message') || '');
    setInitialized(true);

    setTimeout(() => {
      if (passwordRef.current) {
        passwordRef.current.focus();
      }
    }, 200);
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    const password = passwordRef.current?.value || '';
    const confirm = confirmRef.current?.value || '';

    if (!token) {
      setError("Invalid or expired link. Please restart 'Forgot Password'.");
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const { data } = await api.put('/api/auth/reset-password', { token, password });

      if (data?.success) {
        setDone(true);
        setMsg(data.message || 'Password reset successfully.');
        setTimeout(() => {
          navigate('/login?message=Password reset successful. You can now sign in.', { replace: true });
        }, 1800);
      } else {
        setError(data?.message || 'An error occurred.');
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'An error occurred during reset. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  return (
    <div className="reset-password-container">
      <div className="reset-password-form-container">
        <h2>Password Reset</h2>

        {msg && !error && !done && (
          <div className="info-message"><p>{msg}</p></div>
        )}
        {error && (
          <div className="error-message"><p>{error}</p></div>
        )}

        {done ? (
          <div className="success-message">
            <p>Your password has been successfully reset!</p>
            <p>Redirecting to the login page…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} autoComplete="off" noValidate>
            <div className="form-group">
              <label htmlFor="password">New Password</label>
              <input
                id="password"
                ref={passwordRef}
                type="password"
                name="new-password"
                placeholder="Enter your new password"
                autoComplete="new-password"
                disabled={loading || !token}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirm">Confirm Password</label>
              <input
                id="confirm"
                ref={confirmRef}
                type="password"
                name="confirm-password"
                placeholder="Confirm your new password"
                autoComplete="new-password"
                disabled={loading || !token}
              />
            </div>

            <button
              type="submit"
              className="reset-button"
              disabled={loading || !token}
            >
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="form-footer">
          <a href="/login">Back to Login</a>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
