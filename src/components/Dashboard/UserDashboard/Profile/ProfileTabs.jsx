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

  // 2-temps : photo en attente + preview
  const photoProfilRef = useRef(null);
  const [pendingPhoto, setPendingPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');

  const [preferencesData, setPreferencesData] = useState({
    genres_preferes: [],
    decennies_preferees: [],
    artistes_preferes: [],
    notif_nouveaux_amis: true,
    notif_messages: true,
    notif_commentaires: true,
    notif_mentions: true,
    notif_evenements: true,
    notif_recommendations: true,
    notif_email: true,
    notif_push: true,
    qui_peut_voir_mes_playlists: 'public',
    qui_peut_voir_mon_activite: 'public',
    partage_automatique: false,
    autoriser_suggestions_amis: true,
    langue: 'en',
    theme: 'auto'
  });

  const [indicatif, setIndicatif] = useState(user.indicatif || '+221');
  const navigate = useNavigate();

  const getImageUrl = (path) => {
    if (!path) return '/images/default-avatar.png';
    if (path.startsWith('http')) return path;
    const backend = (process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com').trim().replace(/\/+$/,'');
    const normalized = path.startsWith('/') ? path : `/${path}`;
    const full = `${backend}${normalized}`.replace(/\s+/g, '');
    return full;
  };

  const syncUserData = (updated) => {
    setUser(prev => ({ ...prev, ...updated }));
    try {
      const current = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...current, ...updated }));
    } catch {}
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

  // Préférences (inchangé)
  const fetchPreferences = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await api.get('/api/users/preferences');
      if (response.data.success && response.data.data) {
        setPreferencesData(response.data.data);
      }
    } catch (err) {
      setError('Impossible de charger les préférences: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'preferences') fetchPreferences();
  }, [activeTab, token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
  };

  const handleBioChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBioData(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handlePreferencesChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      if (name === 'genres_preferes' || name === 'decennies_preferees') {
        setPreferencesData(prev => {
          let arr = [...(prev[name] || [])];
          if (checked && !arr.includes(value)) arr.push(value);
          if (!checked && arr.includes(value)) arr = arr.filter(v => v !== value);
          return { ...prev, [name]: arr };
        });
      } else {
        setPreferencesData(prev => ({ ...prev, [name]: checked }));
      }
    } else if (name === 'artistes_preferes') {
      const artistsArray = value.split(',').map(a => a.trim()).filter(Boolean);
      setPreferencesData(prev => ({ ...prev, [name]: artistsArray }));
    } else {
      setPreferencesData(prev => ({ ...prev, [name]: value }));
    }
  };

  // NOUVELLE logique : on stocke le fichier et on montre un preview (pas d’upload ici)
  const selectProfilePhoto = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) return setError('Image seulement');
    if (f.size > 5 * 1024 * 1024) return setError('Max 5MB');
    setError('');
    setPendingPhoto(f);
    setPhotoPreview(URL.createObjectURL(f));
  };

  // Submit profil (civilité)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const filtered = Object.fromEntries(
        Object.entries(formData).filter(([k, v]) => k !== 'email' && v !== '' && v !== null && v !== undefined)
      );
      if (filtered.telephone) filtered.telephone = `${indicatif}${filtered.telephone}`;
      const resp = await api.put('/api/users/profile', filtered);
      if (resp?.data?.success) {
        setUser(resp.data.data);
        setIsEditing(false);
        const current = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...current, ...resp.data.data }));
        setSuccess('Profil mis à jour avec succès');
      }
    } catch (err) {
      setError('Erreur lors de la mise à jour: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  // Submit bio : uploader d’abord la nouvelle photo si présente, puis PUT bio/profession/compte_prive
  const handleBioSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      if (pendingPhoto) {
        const fd = new FormData();
        fd.append('photo', pendingPhoto);
        const up = await api.post('/api/users/profile/photo', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true
        });
        if (!up?.data?.success) throw new Error('Upload photo échoué');
        const updated = up.data.data;
        setBioData(prev => ({ ...prev, photo_profil: updated.photo_profil }));
        setPendingPhoto(null);
        setPhotoPreview('');
        syncUserData({ photo_profil: updated.photo_profil });
      }

      const filtered = Object.fromEntries(
        Object.entries(bioData).filter(([k, v]) =>
          ['bio', 'profession', 'compte_prive'].includes(k) && v !== '' && v !== null && v !== undefined
        )
      );
      const resp = await api.put('/api/users/profile', filtered);
      if (resp?.data?.success) {
        setUser(resp.data.data);
        const current = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...current, ...resp.data.data }));
        setIsEditingBio(false);
        setSuccess('Bio mise à jour avec succès');
      }
    } catch (err) {
      setError('Erreur lors de la mise à jour: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  // Submit préférences (inchangé)
  const handlePreferencesSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const resp = await api.put('/api/users/preferences', preferencesData);
      if (resp?.data?.success) {
        setPreferencesData(resp.data.data);
        setIsEditingPreferences(false);
        setSuccess('Préférences mises à jour avec succès');
      }
    } catch (err) {
      setError('Erreur lors de la mise à jour: ' + (err.response?.data?.message || err.message));
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
        <h1 style={{textAlign: 'center', fontSize: '2rem', fontWeight: 700, marginBottom: 24, color: '#333'}}>Informations</h1>

        {error && <div className={styles.errorMessage}>{error}</div>}
        {success && <div className={styles.successMessage}>{success}</div>}
        {isLoading && <div className={styles.loadingIndicator}>Loading...</div>}

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
                <button className={styles.editButton} onClick={() => setIsEditing(!isEditing)}>
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              </div>
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGrid}>
                  {/* … mêmes champs qu’avant … */}
                  <div className={styles.formGroup}>
                    <label htmlFor="prenom">First Name</label>
                    <input id="prenom" name="prenom" value={formData.prenom} onChange={handleInputChange} disabled={!isEditing} className={styles.input}/>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="nom">Last Name</label>
                    <input id="nom" name="nom" value={formData.nom} onChange={handleInputChange} disabled={!isEditing} className={styles.input}/>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="email">Email</label>
                    <input id="email" name="email" value={formData.email} onChange={handleInputChange} disabled={!isEditing} className={styles.input}/>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="telephone">Phone</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <select id="indicatif" name="indicatif" value={indicatif} onChange={e => setIndicatif(e.target.value)} disabled={!isEditing} className={styles.input} style={{ maxWidth: 100 }}>
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
                      <input id="telephone" name="telephone" value={formData.telephone} onChange={handleInputChange} disabled={!isEditing} className={styles.input} style={{ flex: 1 }}/>
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="date_naissance">Birth Date</label>
                    <input type="date" id="date_naissance" name="date_naissance" value={formData.date_naissance} onChange={handleInputChange} disabled={!isEditing} className={styles.input}/>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="genre">Gender</label>
                    <select id="genre" name="genre" value={formData.genre} onChange={handleInputChange} disabled={!isEditing} className={styles.input}>
                      <option value="">-- Select --</option>
                      <option value="HOMME">Male</option>
                      <option value="FEMME">Female</option>
                      <option value="AUTRE">Other</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="pays">Country</label>
                    <select id="pays" name="pays" value={formData.pays} onChange={handleInputChange} disabled={!isEditing} className={styles.input}>
                      <option value="">-- Select Country --</option>
                      <option value="AF">Afghanistan</option>
                      <option value="AL">Albania</option>
                      <option value="DZ">Algeria</option>
                      <option value="SN">Senegal</option>
                      <option value="US">United States</option>
                      <option value="FR">France</option>
                      <option value="CA">Canada</option>
                      <option value="GB">United Kingdom</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="ville">City</label>
                    <input id="ville" name="ville" value={formData.ville} onChange={handleInputChange} disabled={!isEditing} className={styles.input}/>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="adresse">Address</label>
                    <input id="adresse" name="adresse" value={formData.adresse} onChange={handleInputChange} disabled={!isEditing} className={styles.input}/>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="code_postal">Postal Code</label>
                    <input id="code_postal" name="code_postal" value={formData.code_postal} onChange={handleInputChange} disabled={!isEditing} className={styles.input}/>
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
                <button className={styles.editButton} onClick={() => setIsEditingBio(!isEditingBio)}>
                  {isEditingBio ? 'Cancel' : 'Edit'}
                </button>
              </div>
              <form onSubmit={handleBioSubmit} className={styles.form}>
                <div className={styles.formGrid}>
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label>Profile Picture</label>
                    <div className={styles.photoUpload}>
                      <img
                        src={photoPreview || getImageUrl(bioData.photo_profil)}
                        alt="Profile Picture"
                        className={styles.photoPreview}
                        crossOrigin="anonymous"
                      />
                      {isEditingBio && (
                        <div className={styles.photoActions}>
                          <input
                            type="file"
                            ref={photoProfilRef}
                            onChange={selectProfilePhoto}
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
                      id="profession"
                      name="profession"
                      value={bioData.profession}
                      onChange={handleBioChange}
                      disabled={!isEditingBio}
                      className={styles.input}
                      placeholder="Your profession"
                    />
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
                <button className={styles.editButton} onClick={() => setIsEditingPreferences(!isEditingPreferences)}>
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
               
                
                {isEditingPreferences && (
                  <div className={styles.formActions}>
                    <button type="submit" className={styles.saveButton}>
                      Save
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
