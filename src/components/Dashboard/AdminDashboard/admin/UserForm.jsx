import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import styles from './styles.module.css';

// Configuration de l'URL de l'API
const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const UserForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // States
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  
  // Form state
  const [user, setUser] = useState({
    prenom: '',
    nom: '',
    email: '',
    password: '',
    role: 'user',
    statut_compte: 'ACTIF',
    bio: '',
    telephone: '',
    date_naissance: '',
    ville: '',
    adresse: '',
    code_postal: '',
    pays: '',
    genre: '',
    compte_prive: false,
    statut_verification: true
  });

  // Fonction pour obtenir les en-têtes d'authentification
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      console.error("No authentication token found");
      setError("Authentication required. Please login again.");
      return null;
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  // Reset form in creation mode
  useEffect(() => {
    if (!id) {
      setUser({
        prenom: '',
        nom: '',
        email: '',
        password: '',
        role: 'user',
        statut_compte: 'ACTIF',
        bio: '',
        telephone: '',
        date_naissance: '',
        ville: '',
        adresse: '',
        code_postal: '',
        pays: '',
        genre: '',
        compte_prive: false,
        statut_verification: true
      });
    }
  }, [id]);

  // Load user data if in edit mode - Version améliorée
  useEffect(() => {
    if (id) {
      setLoading(true);
      
      const headers = getAuthHeaders();
      if (!headers) {
        setLoading(false);
        return;
      }
      
      const url = `${API_BASE_URL}/api/admin/users/${id}`;
      console.log("Fetching user data from:", url);
      
      fetch(url, { headers })
        .then(res => {
          console.log("User fetch response:", res.status);
          
          if (!res.ok) {
            return res.json().then(data => {
              throw new Error(data.message || `Error ${res.status}: ${res.statusText}`);
            }).catch(err => {
              if (err.name === 'SyntaxError') {
                throw new Error(`Error ${res.status}: ${res.statusText}`);
              }
              throw err;
            });
          }
          return res.json();
        })
        .then(data => {
          console.log("User data received:", data ? "Yes" : "No");
          
          // Accept { user: {...} } or {...}
          const userData = data.user || data;
          
          if (userData && userData.email) {
            setUser({
              prenom: userData.prenom || '',
              nom: userData.nom || '',
              email: userData.email || '',
              password: '', // Never pre-fill password
              role: userData.role || 'user',
              statut_compte: userData.statut_compte || 'ACTIF',
              bio: userData.bio || '',
              telephone: userData.telephone || '',
              date_naissance: userData.date_naissance ? new Date(userData.date_naissance).toISOString().split('T')[0] : '',
              ville: userData.ville || '',
              adresse: userData.adresse || '',
              code_postal: userData.code_postal || '',
              pays: userData.pays || '',
              genre: userData.genre || '',
              compte_prive: userData.compte_prive || false,
              statut_verification: userData.statut_verification || false
            });
          } else {
            throw new Error("Invalid user data received");
          }
        })
        .catch(err => {
          console.error("Error loading user:", err);
          setError(`Error loading user: ${err.message}`);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id]);

  // Form validation
  const validateForm = () => {
    const errors = {};
    
    if (!user.prenom.trim()) errors.prenom = "First name is required";
    if (!user.nom.trim()) errors.nom = "Last name is required";
    
    if (!user.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(user.email)) {
      errors.email = "Invalid email format";
    }
    
    if (!id && !user.password) {
      errors.password = "Password is required for new users";
    } else if (user.password && user.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form submission - Version améliorée
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to first error
      const firstError = document.querySelector(`.${styles.error_feedback}`);
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    setError('');
    setIsSaving(true);

    const headers = getAuthHeaders();
    if (!headers) {
      setIsSaving(false);
      return;
    }

    // Prepare data
    const payload = { ...user };
    
    // If in edit mode and password field is empty, don't send it
    if (id && !user.password) {
      delete payload.password;
    }
    
    // Adjust dates
    if (payload.date_naissance) {
      payload.date_naissance = new Date(payload.date_naissance).toISOString();
    }

    // Convert booleans
    payload.compte_prive = Boolean(payload.compte_prive);
    payload.statut_verification = Boolean(payload.statut_verification);

    const url = id ? `${API_BASE_URL}/api/admin/users/${id}` : `${API_BASE_URL}/api/admin/users/create`;
    const method = id ? 'PUT' : 'POST';

    try {
      console.log(`Sending ${method} request to ${url}`);
      
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload)
      });

      console.log("Form submission response:", response.status);
      
      const data = await response.json().catch(() => ({
        success: false,
        message: `Server returned ${response.status} without valid JSON`
      }));
      
      if (!response.ok) {
        throw new Error(data.error || data.message || `Error ${response.status}`);
      }
      
      // Redirect after success
      navigate('/admin/users', { 
        state: { 
          successMessage: id 
            ? `User ${user.prenom} ${user.nom} has been updated successfully` 
            : `User ${user.prenom} ${user.nom} has been created successfully` 
        } 
      });
    } catch (err) {
      console.error("Error saving:", err);
      setError(err.message || "An error occurred while saving");
      window.scrollTo(0, 0); // Scroll to top to see error message
    } finally {
      setIsSaving(false);
    }
  };

  // Field change handler
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Special handling for checkboxes
    if (type === 'checkbox') {
      setUser(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setUser(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error for field when user starts modifying it
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={styles.loading_container}>
        <div className={styles.loader}></div>
        <p>Loading user data...</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <h1 className={styles.page_title}>
        {id ? `Edit user` : 'Create user'}
      </h1>

      {error && (
        <div className={styles.error_message}>
          <i className="fas fa-exclamation-circle"></i>
          {error}
          <button 
            className={styles.close_message} 
            onClick={() => setError('')}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      <div className={styles.form_container}>
        <div className={styles.form_card}>
          <form onSubmit={handleSubmit}>
            <div className={styles.form_section}>
              <h3 className={styles.section_title}>
                <i className="fas fa-user-circle"></i> Basic Information
              </h3>
              
              <div className={styles.form_row}>
                <div className={styles.form_group}>
                  <label htmlFor="prenom" className={styles.form_label}>First Name *</label>
                  <input
                    type="text"
                    id="prenom"
                    name="prenom"
                    className={`${styles.form_control} ${formErrors.prenom ? styles.is_invalid : ''}`}
                    value={user.prenom}
                    onChange={handleChange}
                  />
                  {formErrors.prenom && (
                    <div className={styles.error_feedback}>{formErrors.prenom}</div>
                  )}
                </div>

                <div className={styles.form_group}>
                  <label htmlFor="nom" className={styles.form_label}>Last Name *</label>
                  <input
                    type="text"
                    id="nom"
                    name="nom"
                    className={`${styles.form_control} ${formErrors.nom ? styles.is_invalid : ''}`}
                    value={user.nom}
                    onChange={handleChange}
                  />
                  {formErrors.nom && (
                    <div className={styles.error_feedback}>{formErrors.nom}</div>
                  )}
                </div>
              </div>

              <div className={styles.form_group}>
                <label htmlFor="email" className={styles.form_label}>Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className={`${styles.form_control} ${formErrors.email ? styles.is_invalid : ''}`}
                  value={user.email}
                  onChange={handleChange}
                  autoComplete="off"
                />
                {formErrors.email && (
                  <div className={styles.error_feedback}>{formErrors.email}</div>
                )}
              </div>

              <div className={styles.form_row}>
                <div className={styles.form_group}>
                  <label htmlFor="telephone" className={styles.form_label}>Phone</label>
                  <input
                    type="tel"
                    id="telephone"
                    name="telephone"
                    className={styles.form_control}
                    value={user.telephone}
                    onChange={handleChange}
                  />
                </div>

                <div className={styles.form_group}>
                  <label htmlFor="date_naissance" className={styles.form_label}>Date of Birth</label>
                  <input
                    type="date"
                    id="date_naissance"
                    name="date_naissance"
                    className={styles.form_control}
                    value={user.date_naissance}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className={styles.form_group}>
                <label htmlFor="genre" className={styles.form_label}>Gender</label>
                <select
                  id="genre"
                  name="genre"
                  className={styles.form_control}
                  value={user.genre}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  <option value="Homme">Male</option>
                  <option value="Femme">Female</option>
                  <option value="Autre">Other</option>
                </select>
              </div>
            </div>

            <div className={styles.form_section}>
              <h3 className={styles.section_title}>
                <i className="fas fa-map-marker-alt"></i> Address
              </h3>
              
              <div className={styles.form_group}>
                <label htmlFor="adresse" className={styles.form_label}>Address</label>
                <input
                  type="text"
                  id="adresse"
                  name="adresse"
                  className={styles.form_control}
                  value={user.adresse}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.form_row}>
                <div className={styles.form_group}>
                  <label htmlFor="ville" className={styles.form_label}>City</label>
                  <input
                    type="text"
                    id="ville"
                    name="ville"
                    className={styles.form_control}
                    value={user.ville}
                    onChange={handleChange}
                  />
                </div>

                <div className={styles.form_group}>
                  <label htmlFor="code_postal" className={styles.form_label}>Postal Code</label>
                  <input
                    type="text"
                    id="code_postal"
                    name="code_postal"
                    className={styles.form_control}
                    value={user.code_postal}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className={styles.form_group}>
                <label htmlFor="pays" className={styles.form_label}>Country</label>
                <input
                  type="text"
                  id="pays"
                  name="pays"
                  className={styles.form_control}
                  value={user.pays}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className={styles.form_section}>
              <h3 className={styles.section_title}>
                <i className="fas fa-shield-alt"></i> Account & Security
              </h3>
              
              <div className={styles.form_group}>
                <label htmlFor="password" className={styles.form_label}>
                  {id ? 'New password (leave empty to keep current)' : 'Password *'}
                </label>
                <div className={styles.password_group}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    className={`${styles.form_control} ${formErrors.password ? styles.is_invalid : ''}`}
                    value={user.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className={styles.password_toggle}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i className={`fas fa-${showPassword ? 'eye-slash' : 'eye'}`}></i>
                  </button>
                </div>
                {formErrors.password && (
                  <div className={styles.error_feedback}>{formErrors.password}</div>
                )}
                <div className={styles.form_hint}>
                  Password must be at least 6 characters.
                </div>
              </div>

              <div className={styles.form_row}>
                <div className={styles.form_group}>
                  <label htmlFor="role" className={styles.form_label}>Role *</label>
                  <select
                    id="role"
                    name="role"
                    className={styles.form_control}
                    value={user.role}
                    onChange={handleChange}
                  >
                    <option value="user">Standard User</option>
                    <option value="admin">Administrator</option>
                    <option value="superadmin">Super Administrator</option>
                  </select>
                  <div className={styles.form_hint}>
                    Administrators have access to the admin panel.
                  </div>
                </div>

                <div className={styles.form_group}>
                  <label htmlFor="statut_compte" className={styles.form_label}>Status *</label>
                  <select
                    id="statut_compte"
                    name="statut_compte"
                    className={styles.form_control}
                    value={user.statut_compte}
                    onChange={handleChange}
                  >
                    <option value="ACTIF">Active</option>
                    <option value="INACTIF">Inactive</option>
                    <option value="VERROUILLE">Locked</option>
                    <option value="SUSPENDU">Suspended</option>
                    <option value="SUPPRIME">Deleted</option>
                  </select>
                </div>
              </div>

              <div className={styles.form_row}>
                <div className={styles.form_group}>
                  <div className={styles.checkbox_group}>
                    <input
                      type="checkbox"
                      id="statut_verification"
                      name="statut_verification"
                      checked={user.statut_verification}
                      onChange={handleChange}
                    />
                    <label htmlFor="statut_verification">Email verified</label>
                  </div>
                  <div className={styles.form_hint}>
                    If unchecked, the user will need to verify their email before logging in.
                  </div>
                </div>

                <div className={styles.form_group}>
                  <div className={styles.checkbox_group}>
                    <input
                      type="checkbox"
                      id="compte_prive"
                      name="compte_prive"
                      checked={user.compte_prive}
                      onChange={handleChange}
                    />
                    <label htmlFor="compte_prive">Private account</label>
                  </div>
                  <div className={styles.form_hint}>
                    If checked, the user's profile will only be visible to friends.
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.form_section}>
              <h3 className={styles.section_title}>
                <i className="fas fa-info-circle"></i> Additional Information
              </h3>
              
              <div className={styles.form_group}>
                <label htmlFor="bio" className={styles.form_label}>Biography</label>
                <textarea
                  id="bio"
                  name="bio"
                  className={styles.form_control}
                  value={user.bio}
                  onChange={handleChange}
                  rows="4"
                />
                <div className={styles.form_hint}>
                  A short description of the user (optional).
                </div>
              </div>
            </div>

            <div className={styles.form_actions}>
              <Link
                to={id ? `/admin/users/${id}` : '/admin/users'}
                className={`${styles.btn} ${styles.btn_secondary}`}
              >
                <i className="fas fa-arrow-left"></i>
                Cancel
              </Link>
              <button 
                type="submit" 
                className={`${styles.btn} ${styles.btn_primary}`} 
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <span className={styles.spinner}></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i>
                    {id ? 'Save changes' : 'Create user'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserForm;