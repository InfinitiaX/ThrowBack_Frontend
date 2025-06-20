import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import styles from './ProfileTabs.module.css';
import { useNavigate } from 'react-router-dom';

const ProfileTabs = () => {
  const { user, setUser, token } = useAuth();
  const [activeTab, setActiveTab] = useState('civilite');
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    prenom: user.prenom || '',
    nom: user.nom || '',
    email: user.email || '',
    telephone: user.telephone ? (user.telephone.replace(/^\+\d{1,4}/, '')) : '',
    date_naissance: user.date_naissance ? user.date_naissance.slice(0, 10) : '',
    ville: user.ville || '',
    adresse: user.adresse || '',
    code_postal: user.code_postal || '',
    pays: user.pays || '',
    genre: user.genre ? user.genre.toUpperCase() : ''
  });

  const [bioData, setBioData] = useState({
    bio: user.bio || '',
    profession: user.profession || '',
    photo_profil: user.photo_profil || '',
    compte_prive: user.compte_prive === true // force booléen
  });

  const [preferencesData, setPreferencesData] = useState({
    // Music preferences
    genres_preferes: [],
    decennies_preferees: [],
    artistes_preferes: [],
    
    // Notification preferences
    notif_nouveaux_amis: true,
    notif_messages: true,
    notif_commentaires: true,
    notif_mentions: true,
    notif_evenements: true,
    notif_recommendations: true,
    notif_email: true,
    notif_push: true,
    
    // Privacy preferences
    qui_peut_voir_mes_playlists: 'public',
    qui_peut_voir_mon_activite: 'public',
    partage_automatique: false,
    autoriser_suggestions_amis: true,
    
    // Display preferences
    langue: 'en',
    theme: 'auto'
  });

  const [indicatif, setIndicatif] = useState(user.indicatif || "+221");

  const photoProfilRef = useRef(null);
  const navigate = useNavigate();

  // Fonction pour convertir les chemins relatifs en URLs absolues
  const getImageUrl = (path) => {
    if (!path) return '/images/default-avatar.png';
    
    // Si l'URL est déjà absolue, la retourner telle quelle
    if (path.startsWith('http')) return path;
    
    // Sinon, préfixer avec l'URL du backend
    const backendUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';
    return `${backendUrl}${path}`;
  };

  useEffect(() => {
    setFormData({
      prenom: user.prenom || '',
      nom: user.nom || '',
      email: user.email || '',
      telephone: user.telephone ? (user.telephone.replace(/^\+\d{1,4}/, '')) : '',
      date_naissance: user.date_naissance ? user.date_naissance.slice(0, 10) : '',
      ville: user.ville || '',
      adresse: user.adresse || '',
      code_postal: user.code_postal || '',
      pays: user.pays || '',
      genre: user.genre ? user.genre.toUpperCase() : ''
    });
    setBioData({
      bio: user.bio || '',
      profession: user.profession || '',
      photo_profil: user.photo_profil || '',
      compte_prive: user.compte_prive === true // force booléen
    });
    // Deduce prefix from phone number if present, otherwise +221 by default
    if (user.telephone && user.telephone.startsWith('+')) {
      const match = user.telephone.match(/^(\+\d{1,4})/);
      setIndicatif(match ? match[1] : '+221');
    } else {
      setIndicatif('+221');
    }
  }, [user]);

  // Function to load preferences
  const fetchPreferences = async () => {
    try {
      setIsLoading(true);
      const backendUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';
      const response = await fetch(`${backendUrl}/api/users/preferences`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error retrieving preferences: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      if (result.success && result.data) {
        setPreferencesData(result.data);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      setError('Impossible de charger les préférences: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Load preferences when tab changes
  useEffect(() => {
    if (activeTab === 'preferences') {
      fetchPreferences();
    }
  }, [activeTab, token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBioChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBioData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePreferencesChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name === 'genres_preferes' || name === 'decennies_preferees') {
        // Handle multi-select checkboxes
        setPreferencesData(prev => {
          let updatedValues = [...(prev[name] || [])];
          
          if (checked && !updatedValues.includes(value)) {
            updatedValues.push(value);
          } else if (!checked && updatedValues.includes(value)) {
            updatedValues = updatedValues.filter(item => item !== value);
          }
          
          return { ...prev, [name]: updatedValues };
        });
      } else {
        // Handle simple boolean checkboxes
        setPreferencesData(prev => ({
          ...prev,
          [name]: checked
        }));
      }
    } else if (name === 'artistes_preferes') {
      // Handle artists input (comma-separated)
      const artistsArray = value.split(',').map(artist => artist.trim()).filter(artist => artist !== '');
      setPreferencesData(prev => ({
        ...prev,
        [name]: artistsArray
      }));
    } else {
      // Handle other inputs (select dropdowns, etc.)
      setPreferencesData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handlePhotoUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('photo', file);

      const backendUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';
      const response = await fetch(`${backendUrl}/api/users/profile/photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const responseText = await response.text();
        console.error('Error response:', responseText);
        
        let errorMessage = 'Error uploading photo';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      if (result.success) {
        setBioData(prev => ({
          ...prev,
          [type]: result.data.photo_profil
        }));
        
        // Mettre à jour également l'utilisateur dans le contexte
        setUser(prev => ({
          ...prev,
          photo_profil: result.data.photo_profil
        }));
        
        setSuccess('Photo mise à jour avec succès');
      } else {
        throw new Error(result.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      setError('Erreur lors de l\'upload: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const filteredFormData = Object.fromEntries(
        Object.entries(formData)
          .filter(([k, v]) => k !== "email" && v !== "" && v !== null && v !== undefined)
      );
      // Add prefix to phone if field is filled
      if (filteredFormData.telephone) {
        filteredFormData.telephone = `${indicatif}${filteredFormData.telephone}`;
      }
      console.log('Body sent:', filteredFormData);
      
      const backendUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';
      const response = await fetch(`${backendUrl}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(filteredFormData)
      });
      
      // Vérifier si la réponse est OK
      if (!response.ok) {
        const responseText = await response.text();
        console.error('Error response:', responseText);
        
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
        }
        
        throw new Error(errorMessage);
      }
      
      // Vérifier le type de contenu
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Non-JSON response:', await response.text());
        throw new Error('Server did not respond with JSON');
      }
      
      const result = await response.json();
      if (result.success) {
        setUser(result.data);
        setIsEditing(false);
        setSuccess('Profil mis à jour avec succès');
        
        // Mettre à jour localStorage
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({
          ...userData,
          ...result.data
        }));
      } else {
        throw new Error(result.message || 'Update failed');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Erreur lors de la mise à jour: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBioSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const filteredBioData = Object.fromEntries(
        Object.entries(bioData)
          .filter(([k, v]) => v !== "" && v !== null && v !== undefined)
      );
      
      const backendUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';
      const response = await fetch(`${backendUrl}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(filteredBioData)
      });
      
      // Vérifier si la réponse est OK
      if (!response.ok) {
        const responseText = await response.text();
        console.error('Error response:', responseText);
        
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
        }
        
        throw new Error(errorMessage);
      }
      
      // Vérifier le type de contenu
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Non-JSON response:', await response.text());
        throw new Error('Server did not respond with JSON');
      }
      
      const result = await response.json();
      if (result.success) {
        setUser(result.data);
        setIsEditingBio(false);
        setSuccess('Bio mise à jour avec succès');
        
        // Mettre à jour localStorage
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({
          ...userData,
          ...result.data
        }));
      } else {
        throw new Error(result.message || 'Update failed');
      }
    } catch (error) {
      console.error('Error updating bio:', error);
      setError('Erreur lors de la mise à jour: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferencesSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const backendUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';
      const response = await fetch(`${backendUrl}/api/users/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(preferencesData)
      });
      
      // Vérifier si la réponse est OK
      if (!response.ok) {
        const responseText = await response.text();
        console.error('Error response:', responseText);
        
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
        }
        
        throw new Error(errorMessage);
      }
      
      // Vérifier le type de contenu
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Non-JSON response:', await response.text());
        throw new Error('Server did not respond with JSON');
      }
      
      const result = await response.json();
      if (result.success) {
        setPreferencesData(result.data);
        setIsEditingPreferences(false);
        setSuccess('Préférences mises à jour avec succès');
      } else {
        throw new Error(result.message || 'Update failed');
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      setError('Erreur lors de la mise à jour: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'civilite', label: 'Personal' },
    { id: 'bio', label: 'Bio' },
    { id: 'preferences', label: 'Preferences' }
  ];

  return (
    <>
      <button onClick={() => navigate(-1)} className={styles.backButton}>← Back</button>
      <div className={styles.tabsContainer}>
        <h1 style={{textAlign: 'center', fontSize: '2rem', fontWeight: 700, marginBottom: 24, color: '#333'}}>Information</h1>
        
        {error && <div className={styles.errorMessage}>{error}</div>}
        {success && <div className={styles.successMessage}>{success}</div>}
        {isLoading && <div className={styles.loadingIndicator}>Chargement...</div>}
        
        <div className={styles.tabs}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className={styles.tabContent}>
          {activeTab === 'civilite' && (
            <div className={styles.tabPanel}>
              <div className={styles.tabHeader}>
                <h2>Personal Information</h2>
                <button 
                  className={styles.editButton}
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              </div>
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label htmlFor="prenom">First Name</label>
                    <input
                      type="text"
                      id="prenom"
                      name="prenom"
                      value={formData.prenom}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="nom">Last Name</label>
                    <input
                      type="text"
                      id="nom"
                      name="nom"
                      value={formData.nom}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="telephone">Phone</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <select
                        id="indicatif"
                        name="indicatif"
                        value={indicatif}
                        onChange={e => setIndicatif(e.target.value)}
                        disabled={!isEditing}
                        className={styles.input}
                        style={{ maxWidth: 100 }}
                      >
                        <option value="+1">+1 (US/Canada)</option>
                        <option value="+33">+33 (France)</option>
                        <option value="+221">+221 (Senegal)</option>
                        <option value="+44">+44 (UK)</option>
                        <option value="+49">+49 (Germany)</option>
                        <option value="+213">+213 (Algeria)</option>
                        <option value="+212">+212 (Morocco)</option>
                        <option value="+225">+225 (Ivory Coast)</option>
                        <option value="+216">+216 (Tunisia)</option>
                        <option value="+237">+237 (Cameroon)</option>
                      </select>
                      <input
                        type="tel"
                        id="telephone"
                        name="telephone"
                        value={formData.telephone}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className={styles.input}
                        style={{ flex: 1 }}
                      />
                    </div>
                  </div>
                  {/* Autres champs... */}
                </div>
                {isEditing && (
                  <div className={styles.formActions}>
                    <button type="submit" className={styles.saveButton} disabled={isLoading}>
                      {isLoading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}
          {activeTab === 'bio' && (
            <div className={`${styles.tabPanel} ${styles.bioPanel}`}>
              <div className={styles.tabHeader}>
                <h2>Biography</h2>
                <button 
                  className={styles.editButton}
                  onClick={() => setIsEditingBio(!isEditingBio)}
                >
                  {isEditingBio ? 'Cancel' : 'Edit'}
                </button>
              </div>
              <form onSubmit={handleBioSubmit} className={styles.form}>
                <div className={styles.formGrid}>
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label>Profile Picture</label>
                    <div className={styles.photoUpload}>
                      <img 
                        src={getImageUrl(bioData.photo_profil)}
                        alt="Profile Picture" 
                        className={styles.photoPreview}
                      />
                      {isEditingBio && (
                        <div className={styles.photoActions}>
                          <input
                            type="file"
                            ref={photoProfilRef}
                            onChange={(e) => handlePhotoUpload(e, 'photo_profil')}
                            accept="image/*"
                            className={styles.photoInput}
                          />
                          <button 
                            type="button"
                            onClick={() => photoProfilRef.current?.click()}
                            className={styles.uploadButton}
                            disabled={isLoading}
                          >
                            {isLoading ? 'Uploading...' : 'Change Picture'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Autres champs... */}
                </div>
                {isEditingBio && (
                  <div className={styles.formActions}>
                    <button type="submit" className={styles.saveButton} disabled={isLoading}>
                      {isLoading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}
          {/* Onglet Preferences... */}
        </div>
      </div>
    </>
  );
};

export default ProfileTabs;