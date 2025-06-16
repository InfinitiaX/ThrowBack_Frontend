import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api';

// --- TYPES D'ACTIONS ---
const AUTH_ACTIONS = {
  LOGIN_START:    'LOGIN_START',
  LOGIN_SUCCESS:  'LOGIN_SUCCESS',
  LOGIN_FAILURE:  'LOGIN_FAILURE',
  LOGOUT:         'LOGOUT',
  LOAD_USER:      'LOAD_USER',
  CLEAR_ERROR:    'CLEAR_ERROR'
};

// --- ÉTAT INITIAL ---
const initialState = {
  token:           localStorage.getItem('token'),
  user:            null,
  isAuthenticated: false,
  isLoading:       false,
  error:           null
};

// --- RÉDUCTEUR ---
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return { ...state, isLoading: true, error: null };
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        token:           action.payload.token,
        user:            action.payload.user,
        isAuthenticated: true,
        isLoading:       false,
        error:           null
      };
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        token:           null,
        user:            null,
        isAuthenticated: false,
        isLoading:       false,
        error:           action.payload
      };
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        token:           null,
        user:            null,
        isAuthenticated: false,
        isLoading:       false,
        error:           null
      };
    case AUTH_ACTIONS.LOAD_USER:
      return {
        ...state,
        user:            action.payload,
        isAuthenticated: true,
        isLoading:       false
      };
    case AUTH_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
    default:
      return state;
  }
}

// --- CONTEXTE ---
const AuthContext = createContext();

// --- PROVIDER ---
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const tokenRef = useRef(state.token);

  useEffect(() => {
    tokenRef.current = state.token;
  }, [state.token]);

  // Charge le profil complet depuis /api/auth/me
  const loadUser = useCallback(async () => {
    if (!tokenRef.current) return;
    try {
      const res = await api.get('/api/auth/me');
      if (res.data.success) {
        const full = res.data.data;
        // Utiliser les données telles quelles - contient maintenant 'role' au lieu de 'roles'
        const userData = { ...full, id: full._id, _id: full._id };
        dispatch({ type: AUTH_ACTIONS.LOAD_USER, payload: userData });
      }
    } catch(err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      }
    }
  }, []);

  // Configure l'en-tête d'autorisation
  useEffect(() => {
    if (state.token) {
      api.defaults.headers.common.Authorization = `Bearer ${state.token}`;
      loadUser();
    } else {
      delete api.defaults.headers.common.Authorization;
    }
  }, [state.token, loadUser]);

  const login = (token, partialUser) => {
    localStorage.setItem('token', token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    dispatch({
      type: AUTH_ACTIONS.LOGIN_SUCCESS,
      payload: { token, user: partialUser }
    });
    loadUser();
  };

  const logout = async () => {
    try {
      if (state.token) {
        await api.post('/api/auth/logout');
      }
    } catch (err) {
      console.error('Erreur logout:', err);
    } finally {
      localStorage.removeItem('token');
      delete api.defaults.headers.common.Authorization;
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  const startLogin = () => dispatch({ type: AUTH_ACTIONS.LOGIN_START });
  const setError = err => dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: err });
  const clearError = () => dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

  const setUser = (user) => {
    dispatch({ type: AUTH_ACTIONS.LOAD_USER, payload: user });
  };

  return (
    <AuthContext.Provider value={{
      token:           state.token,
      user:            state.user,
      isAuthenticated: state.isAuthenticated,
      isLoading:       state.isLoading,
      error:           state.error,
      login,
      logout,
      loadUser,
      startLogin,
      setError,
      clearError,
      setUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

export default AuthContext;