import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import styles from './ProfileTabs.module.css';
import { useNavigate } from 'react-router-dom';
import api from '../../../../utils/api'; 

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
    compte_prive: user.compte_prive === true
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
    if (path.startsWith('http')) return path;
    
    // Assurez-vous que le chemin commence par un slash
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    
    // Utiliser l'URL complète du backend
    const backendUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';
    const fullUrl = `${backendUrl}${normalizedPath}`;
    
    // Pour déboguer
    console.log("Image URL constructed:", fullUrl);
    
    return fullUrl;
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
      compte_prive: user.compte_prive === true
    });
    
    if (user.telephone && user.telephone.startsWith('+')) {
      const match = user.telephone.match(/^(\+\d{1,4})/);
      setIndicatif(match ? match[1] : '+221');
    } else {
      setIndicatif('+221');
    }
  }, [user]);

  // Function to load preferences using api.js
  const fetchPreferences = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await api.get('/api/users/preferences');
      
      if (response.data.success && response.data.data) {
        setPreferencesData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      setError('Impossible de charger les préférences: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsLoading(false);
    }
  };

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
        setPreferencesData(prev => ({
          ...prev,
          [name]: checked
        }));
      }
    } else if (name === 'artistes_preferes') {
      const artistsArray = value.split(',').map(artist => artist.trim()).filter(artist => artist !== '');
      setPreferencesData(prev => ({
        ...prev,
        [name]: artistsArray
      }));
    } else {
      setPreferencesData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Upload photo using api.js with FormData
  const handlePhotoUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('photo', file);

      // Log pour déboguer
      console.log("Uploading photo to:", '/api/users/profile/photo');
      
      // Utilisation de l'API centralisée avec gestion automatique du token
      const response = await api.post('/api/users/profile/photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true // Important pour CORS
      });

      if (response.data.success) {
        const photoUrl = response.data.data.photo_profil;
        console.log("Received photo URL:", photoUrl);
        
        setBioData(prev => ({
          ...prev,
          [type]: photoUrl
        }));
        
        setUser(prev => ({
          ...prev,
          photo_profil: photoUrl
        }));
        
        setSuccess('Photo mise à jour avec succès');
        
        // Mettre à jour localStorage
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({
          ...userData,
          photo_profil: photoUrl
        }));
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      setError('Erreur lors de l\'upload: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  // Submit profile using api.js
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
      
      if (filteredFormData.telephone) {
        filteredFormData.telephone = `${indicatif}${filteredFormData.telephone}`;
      }
      
      console.log('🔄 Updating profile with data:', filteredFormData);
      
      const response = await api.put('/api/users/profile', filteredFormData);
      
      if (response.data.success) {
        setUser(response.data.data);
        setIsEditing(false);
        setSuccess('Profil mis à jour avec succès');
        
        // Mettre à jour localStorage
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({
          ...userData,
          ...response.data.data
        }));
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Erreur lors de la mise à jour: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  // Submit bio using api.js
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
      
      const response = await api.put('/api/users/profile', filteredBioData);
      
      if (response.data.success) {
        setUser(response.data.data);
        setIsEditingBio(false);
        setSuccess('Bio mise à jour avec succès');
        
        // Mettre à jour localStorage
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({
          ...userData,
          ...response.data.data
        }));
      }
    } catch (error) {
      console.error('Error updating bio:', error);
      setError('Erreur lors de la mise à jour: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  // Submit preferences using api.js
  const handlePreferencesSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await api.put('/api/users/preferences', preferencesData);
      
      if (response.data.success) {
        setPreferencesData(response.data.data);
        setIsEditingPreferences(false);
        setSuccess('Préférences mises à jour avec succès');
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      setError('Erreur lors de la mise à jour: ' + (error.response?.data?.message || error.message));
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
                  <div className={styles.formGroup}>
                    <label htmlFor="date_naissance">Birth Date</label>
                    <input
                      type="date"
                      id="date_naissance"
                      name="date_naissance"
                      value={formData.date_naissance}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="genre">Gender</label>
                    <select
                      id="genre"
                      name="genre"
                      value={formData.genre}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={styles.input}
                    >
                      <option value="">-- Select --</option>
                      <option value="HOMME">Male</option>
                      <option value="FEMME">Female</option>
                      <option value="AUTRE">Other</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="pays">Country</label>
                    <select
                      id="pays"
                      name="pays"
                      value={formData.pays}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={styles.input}
                    >
                      <option value="">-- Select Country --</option>
                      <option value="AF">Afghanistan</option>
                      <option value="AL">Albania</option>
                      <option value="DZ">Algeria</option>
                      {/* Ajoutez tous les autres pays comme dans l'original */}
                      <option value="SN">Senegal</option>
                      <option value="US">United States</option>
                      <option value="FR">France</option>
                      <option value="CA">Canada</option>
                      <option value="GB">United Kingdom</option>
                      {/* ... tous les autres pays */}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="ville">City</label>
                    <input
                      type="text"
                      id="ville"
                      name="ville"
                      value={formData.ville}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="adresse">Address</label>
                    <input
                      type="text"
                      id="adresse"
                      name="adresse"
                      value={formData.adresse}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="code_postal">Postal Code</label>
                    <input
                      type="text"
                      id="code_postal"
                      name="code_postal"
                      value={formData.code_postal}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={styles.input}
                    />
                  </div>
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
                        crossOrigin="anonymous" // Ajouter cet attribut
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

                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label htmlFor="bio">Short Bio</label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={bioData.bio}
                      onChange={handleBioChange}
                      disabled={!isEditingBio}
                      className={styles.textarea}
                      placeholder="A short description about yourself..."
                      rows="3"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="profession">Profession</label>
                    <input
                      type="text"
                      id="profession"
                      name="profession"
                      value={bioData.profession}
                      onChange={handleBioChange}
                      disabled={!isEditingBio}
                      className={styles.input}
                      placeholder="Your profession"
                    />
                  </div>

                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="compte_prive"
                        checked={bioData.compte_prive}
                        onChange={handleBioChange}
                        disabled={!isEditingBio}
                        className={styles.checkbox}
                      />
                      Private Account
                    </label>
                  </div>
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
          
          {activeTab === 'preferences' && (
            <div className={styles.tabPanel}>
              <div className={styles.tabHeader}>
                <h2>Preferences</h2>
                <button 
                  className={styles.editButton}
                  onClick={() => setIsEditingPreferences(!isEditingPreferences)}
                >
                  {isEditingPreferences ? 'Cancel' : 'Edit'}
                </button>
              </div>
              <form onSubmit={handlePreferencesSubmit} className={styles.form}>
                {/* Music Preferences */}
                <h3 className={styles.sectionTitle}>Music Preferences</h3>
                <div className={styles.formGrid}>
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label>Favorite Genres</label>
                    <div className={styles.checkboxGroup}>
                      {['rock', 'pop', 'jazz', 'classical', 'hip-hop', 'rap', 'r&b', 'soul', 'funk', 
                        'disco', 'electro', 'blues'].map(genre => (
                        <label key={genre} className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            name="genres_preferes"
                            value={genre}
                            checked={preferencesData.genres_preferes.includes(genre)}
                            onChange={handlePreferencesChange}
                            disabled={!isEditingPreferences}
                            className={styles.checkbox}
                          />
                          {genre.charAt(0).toUpperCase() + genre.slice(1)}
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label>Favorite Decades</label>
                    <div className={styles.checkboxGroup}>
                      {['60s', '70s', '80s', '90s', '2000s', '2010s', '2020s'].map(decade => (
                        <label key={decade} className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            name="decennies_preferees"
                            value={decade}
                            checked={preferencesData.decennies_preferees.includes(decade)}
                            onChange={handlePreferencesChange}
                            disabled={!isEditingPreferences}
                            className={styles.checkbox}
                          />
                          {decade}
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label htmlFor="artistes_preferes">Favorite Artists</label>
                    <input
                      type="text"
                      id="artistes_preferes"
                      name="artistes_preferes"
                      value={preferencesData.artistes_preferes.join(', ')}
                      onChange={handlePreferencesChange}
                      disabled={!isEditingPreferences}
                      className={styles.input}
                      placeholder="Michael Jackson, Queen, Madonna..."
                    />
                    <small className={styles.helperText}>Separate names with commas</small>
                  </div>
                </div>
                
                {/* Notification Preferences */}
                <h3 className={styles.sectionTitle}>Notifications</h3>
                <div className={styles.formGrid}>
                  {[
                    { key: 'notif_nouveaux_amis', label: 'New friends' },
                    { key: 'notif_messages', label: 'Messages' },
                    { key: 'notif_commentaires', label: 'Comments' },
                    { key: 'notif_mentions', label: 'Mentions' },
                    { key: 'notif_evenements', label: 'Events' },
                    { key: 'notif_recommendations', label: 'Recommendations' },
                    { key: 'notif_email', label: 'Email notifications' },
                    { key: 'notif_push', label: 'Push notifications' }
                  ].map(({ key, label }) => (
                    <div key={key} className={styles.formGroup}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          name={key}
                          checked={preferencesData[key]}
                          onChange={handlePreferencesChange}
                          disabled={!isEditingPreferences}
                          className={styles.checkbox}
                        />
                        {label}
                      </label>
                    </div>
                  ))}
                </div>
                
                {/* Privacy Preferences */}
                <h3 className={styles.sectionTitle}>Privacy</h3>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label htmlFor="qui_peut_voir_mes_playlists">Who can see my playlists</label>
                    <select
                      id="qui_peut_voir_mes_playlists"
                      name="qui_peut_voir_mes_playlists"
                      value={preferencesData.qui_peut_voir_mes_playlists}
                      onChange={handlePreferencesChange}
                      disabled={!isEditingPreferences}
                      className={styles.input}
                    >
                      <option value="public">Everyone</option>
                      <option value="amis">Friends only</option>
                      <option value="prive">Only me</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="qui_peut_voir_mon_activite">Who can see my activity</label>
                    <select
                      id="qui_peut_voir_mon_activite"
                      name="qui_peut_voir_mon_activite"
                      value={preferencesData.qui_peut_voir_mon_activite}
                      onChange={handlePreferencesChange}
                      disabled={!isEditingPreferences}
                      className={styles.input}
                    >
                      <option value="public">Everyone</option>
                      <option value="amis">Friends only</option>
                      <option value="prive">Only me</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="partage_automatique"
                        checked={preferencesData.partage_automatique}
                        onChange={handlePreferencesChange}
                        disabled={!isEditingPreferences}
                        className={styles.checkbox}
                      />
                      Automatically share my listening activity
                    </label>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="autoriser_suggestions_amis"
                        checked={preferencesData.autoriser_suggestions_amis}
                        onChange={handlePreferencesChange}
                        disabled={!isEditingPreferences}
                        className={styles.checkbox}
                      />
                      Allow friend suggestions
                    </label>
                  </div>
                </div>
                
                {/* Display Preferences */}
                <h3 className={styles.sectionTitle}>Display</h3>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label htmlFor="langue">Language</label>
                    <select
                      id="langue"
                      name="langue"
                      value={preferencesData.langue}
                      onChange={handlePreferencesChange}
                      disabled={!isEditingPreferences}
                      className={styles.input}
                    >
                      <option value="en">English</option>
                      <option value="fr">Français</option>
                      <option value="es">Español</option>
                      <option value="de">Deutsch</option>
                      <option value="it">Italiano</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="theme">Theme</label>
                    <select
                      id="theme"
                      name="theme"
                      value={preferencesData.theme}
                      onChange={handlePreferencesChange}
                      disabled={!isEditingPreferences}
                      className={styles.input}
                    >
                      <option value="clair">Light</option>
                      <option value="sombre">Dark</option>
                      <option value="auto">Automatic (system setting)</option>
                    </select>
                  </div>
                </div>
                
                {isEditingPreferences && (
                  <div className={styles.formActions}>
                    <button type="submit" className={styles.saveButton} disabled={isLoading}>
                      {isLoading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ProfileTabs;