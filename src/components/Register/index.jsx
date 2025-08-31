// src/components/Register/index.jsx
import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './styles.module.css';
import api from '../../utils/api';

// HTML pattern (pour feedback natif si jamais activé) + regex JS
const namePattern = "[A-Za-zÀ-ÖØ-öø-ÿ' -]+";
const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[^\s]{8,}$/; // pas d'espace

const sanitizeName = (value) => {
  return value
    .replace(/[0-9]/g, '')      // retire chiffres
    .replace(/\s{2,}/g, ' ')    // espaces multiples -> un espace
    .replace(/^ +| +$/g, '');   // trim manuel pour garder contrôle
};

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    confirmEmail: '',
    password: '',
    confirmPassword: ''
  });

  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    email: false,
    confirmEmail: false,
    password: false,
    confirmPassword: false
  });

  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    confirmEmail: '',
    password: '',
    confirmPassword: ''
  });

  const [formError, setFormError] = useState(''); // uniquement pour erreurs serveur
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // --- Validation par champ ---
  const validateField = (name, value, state) => {
    const v = (value ?? '').toString();

    switch (name) {
      case 'firstName': {
        if (!v.trim()) return 'First name is required';
        if (v.length < 2) return 'First name must be at least 2 characters';
        if (v.length > 50) return 'First name must be at most 50 characters';
        if (!nameRegex.test(v)) return "Only letters, spaces, hyphens, apostrophes";
        return '';
      }
      case 'lastName': {
        if (!v.trim()) return 'Last name is required';
        if (v.length < 2) return 'Last name must be at least 2 characters';
        if (v.length > 50) return 'Last name must be at most 50 characters';
        if (!nameRegex.test(v)) return "Only letters, spaces, hyphens, apostrophes";
        return '';
      }
      case 'email': {
        if (!v.trim()) return 'Email is required';
        if (!emailRegex.test(v)) return 'Enter a valid email address';
        if (state.confirmEmail && v !== state.confirmEmail) return 'Email does not match confirmation';
        return '';
      }
      case 'confirmEmail': {
        if (!v.trim()) return 'Please confirm your email';
        if (!emailRegex.test(v)) return 'Enter a valid email address';
        if (state.email && v !== state.email) return 'Email confirmation does not match';
        return '';
      }
      case 'password': {
        if (!v) return 'Password is required';
        if (!passwordRegex.test(v)) {
          return 'Min 8 chars, with uppercase, lowercase, number, and no spaces';
        }
        if (state.confirmPassword && v !== state.confirmPassword) {
          return 'Password does not match confirmation';
        }
        return '';
      }
      case 'confirmPassword': {
        if (!v) return 'Please confirm your password';
        if (state.password && v !== state.password) return 'Password confirmation does not match';
        return '';
      }
      default:
        return '';
    }
  };

  const validateAll = (state) => {
    const nextErrors = Object.fromEntries(
      Object.entries(state).map(([k, v]) => [k, validateField(k, v, state)])
    );
    setErrors(nextErrors);
    return nextErrors;
  };

  // --- Handlers ---
  const handleChange = (e) => {
    const { name } = e.target;
    let { value } = e.target;

    if (name === 'firstName' || name === 'lastName') {
      value = sanitizeName(value);
    } else if (name === 'email' || name === 'confirmEmail') {
      value = value.trimStart(); // pas d'espace en tête
    }

    const nextState = { ...formData, [name]: value };
    setFormData(nextState);

    // validation live si champ déjà touché
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value, nextState) }));
      // ré-valider le pair associé
      if (name === 'email' && touched.confirmEmail) {
        setErrors((prev) => ({ ...prev, confirmEmail: validateField('confirmEmail', nextState.confirmEmail, nextState) }));
      }
      if (name === 'confirmEmail' && touched.email) {
        setErrors((prev) => ({ ...prev, email: validateField('email', nextState.email, nextState) }));
      }
      if (name === 'password' && touched.confirmPassword) {
        setErrors((prev) => ({ ...prev, confirmPassword: validateField('confirmPassword', nextState.confirmPassword, nextState) }));
      }
      if (name === 'confirmPassword' && touched.password) {
        setErrors((prev) => ({ ...prev, password: validateField('password', nextState.password, nextState) }));
      }
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, formData[name], formData) }));
  };

  // Bloque la frappe des chiffres
  const blockDigitsOnKeyDown = (e) => {
    if (/\d/.test(e.key)) e.preventDefault();
  };

  // Nettoie le collage sur noms
  const handleNamePaste = (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text');
    const cleaned = sanitizeName(text);
    const targetName = e.currentTarget.name;
    const nextState = { ...formData, [targetName]: cleaned };
    setFormData(nextState);
    if (touched[targetName]) {
      setErrors((prev) => ({ ...prev, [targetName]: validateField(targetName, cleaned, nextState) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validation finale
    const nextErrors = validateAll(formData);
    const hasError = Object.values(nextErrors).some((msg) => msg);
    if (hasError) return;

    try {
      setLoading(true);
      const response = await api.post('/api/auth/register', {
        nom: formData.lastName.trim(),
        prenom: formData.firstName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        acceptTerms: true
      });

      if (response?.data?.success) {
        navigate('/email-sent', { state: { email: formData.email.trim() } });
      } else {
        setFormError('Unexpected server response');
      }
    } catch (err) {
      console.error('Registration error:', err);
      if (err.response?.data?.message) {
        setFormError(err.response.data.message);
      } else if (err.code === 'ERR_NETWORK') {
        setFormError('Connection error. Please check if the backend server is running.');
      } else {
        setFormError('An error occurred during registration');
      }
    } finally {
      setLoading(false);
    }
  };

  const isSubmitDisabled = useMemo(() => {
    // désactivé si champs vides OU erreurs présentes OU loading
    const anyEmpty = Object.values(formData).some((v) => !String(v).trim());
    const anyError = Object.values(errors).some((v) => v);
    return anyEmpty || anyError || loading;
  }, [formData, errors, loading]);

  const renderFieldError = (name) =>
    touched[name] && errors[name] ? (
      <p id={`${name}-error`} className={styles.field_error} role="alert">
        {errors[name]}
      </p>
    ) : null;

  return (
    <div className={styles.auth_container}>
      <div className={styles.auth_left}>
        <div className={styles.logo_container}>
          <img src="/images/Logo.png" alt="ThrowBack Logo" className={styles.logo} />
        </div>

        <form onSubmit={handleSubmit} className={styles.auth_form} noValidate>
          {formError && <div className={styles.error_message}>{formError}</div>}

          <div className={styles.form_row}>
            <div className={styles.form_group}>
              <label htmlFor="firstName">First Name :</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                placeholder="Enter your name.."
                value={formData.firstName}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={blockDigitsOnKeyDown}
                onPaste={handleNamePaste}
                inputMode="text"
                pattern={namePattern}
                maxLength={50}
                title="Letters only (spaces, hyphens, apostrophes allowed)"
                className={`${styles.form_input} ${styles.light_bg}`}
                autoComplete="given-name"
                aria-invalid={Boolean(touched.firstName && errors.firstName)}
                aria-describedby={touched.firstName && errors.firstName ? 'firstName-error' : undefined}
              />
              {renderFieldError('firstName')}
            </div>

            <div className={styles.form_group}>
              <label htmlFor="lastName">Last Name :</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                placeholder="Enter your name.."
                value={formData.lastName}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={blockDigitsOnKeyDown}
                onPaste={handleNamePaste}
                inputMode="text"
                pattern={namePattern}
                maxLength={50}
                title="Letters only (spaces, hyphens, apostrophes allowed)"
                className={`${styles.form_input} ${styles.light_bg}`}
                autoComplete="family-name"
                aria-invalid={Boolean(touched.lastName && errors.lastName)}
                aria-describedby={touched.lastName && errors.lastName ? 'lastName-error' : undefined}
              />
              {renderFieldError('lastName')}
            </div>
          </div>

          <div className={styles.form_row}>
            <div className={styles.form_group}>
              <label htmlFor="email">Email :</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${styles.form_input} ${styles.light_bg}`}
                autoComplete="email"
                aria-invalid={Boolean(touched.email && errors.email)}
                aria-describedby={touched.email && errors.email ? 'email-error' : undefined}
              />
              {renderFieldError('email')}
            </div>

            <div className={styles.form_group}>
              <label htmlFor="confirmEmail">Confirm Email :</label>
              <input
                type="email"
                id="confirmEmail"
                name="confirmEmail"
                placeholder="Enter your email"
                value={formData.confirmEmail}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${styles.form_input} ${styles.light_bg}`}
                autoComplete="email"
                aria-invalid={Boolean(touched.confirmEmail && errors.confirmEmail)}
                aria-describedby={touched.confirmEmail && errors.confirmEmail ? 'confirmEmail-error' : undefined}
              />
              {renderFieldError('confirmEmail')}
            </div>
          </div>

          <div className={styles.form_row}>
            <div className={styles.form_group}>
              <label htmlFor="password">Password :</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="xxxxxxxx"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${styles.form_input} ${styles.light_bg}`}
                autoComplete="new-password"
                aria-invalid={Boolean(touched.password && errors.password)}
                aria-describedby={touched.password && errors.password ? 'password-error' : undefined}
              />
              {renderFieldError('password')}
            </div>

            <div className={styles.form_group}>
              <label htmlFor="confirmPassword">Confirm Password :</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="xxxxxxxx"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${styles.form_input} ${styles.light_bg}`}
                autoComplete="new-password"
                aria-invalid={Boolean(touched.confirmPassword && errors.confirmPassword)}
                aria-describedby={touched.confirmPassword && errors.confirmPassword ? 'confirmPassword-error' : undefined}
              />
              {renderFieldError('confirmPassword')}
            </div>
          </div>

          <button
            type="submit"
            className={`${styles.btn} ${styles.btn_primary} ${styles.btn_block}`}
            disabled={isSubmitDisabled}
          >
            {loading ? 'Processing...' : 'Sign up now'}
          </button>

          <div className={styles.divider}>
            <span>OR</span>
          </div>

          <Link to="/login" className={`${styles.btn} ${styles.btn_outline} ${styles.btn_block}`}>
            Login now
          </Link>
        </form>
      </div>

      <div className={styles.auth_right}>
        <img
          src="/images/banniere_gauche.png"
          alt="ThrowBack Music Experience"
          className={styles.music_collage}
        />
      </div>
    </div>
  );
};

export default Register;
