// src/components/Dashboard/UserDashboard/Profile/ProfileTabs.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../contexts/AuthContext';
import api from '../../../../utils/api';
import styles from './ProfileTabs.module.css';

const MAX_IMG = 5 * 1024 * 1024; // 5MB

const ProfileTabs = () => {
  const { user, setUser, token } = useAuth();
  const navigate = useNavigate();

  // Onglet actif
  const [activeTab, setActiveTab] = useState('civilite');

  // États communs
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Edition par onglet
  const [isEditing, setIsEditing] = useState(false); // civilité
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);

  // -------- Helpers
  const getImageUrl = (path) => {
    if (!path) return '/images/default-avatar.png';
    if (String(path).startsWith('http')) return path;
    const backend = (process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com')
      .trim()
      .replace(/\/+$/, '');
    const normalized = String(path).startsWith('/') ? path : `/${path}`;
    return `${backend}${normalized}`.replace(/\s+/g, '');
  };

  const syncUserData = (updated) => {
    setUser((prev) => ({ ...prev, ...updated }));
    try {
      const current = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...current, ...updated }));
    } catch {}
  };

  // -------- CIVILITÉ
  const [indicatif, setIndicatif] = useState('+221');
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    date_naissance: '',
    ville: '',
    adresse: '',
    code_postal: '',
    pays: '',
    genre: '',
  });

  useEffect(() => {
    setFormData({
      prenom: user?.prenom || '',
      nom: user?.nom || '',
      email: user?.email || '',
      telephone: user?.telephone ? user.telephone.replace(/^\+\d{1,4}/, '') : '',
      date_naissance: user?.date_naissance ? String(user.date_naissance).slice(0, 10) : '',
      ville: user?.ville || '',
      adresse: user?.adresse || '',
      code_postal: user?.code_postal || '',
      pays: user?.pays || '',
      genre: user?.genre ? String(user.genre).toUpperCase() : '',
    });

    if (user?.telephone?.startsWith('+')) {
      const m = user.telephone.match(/^(\+\d{1,4})/);
      setIndicatif(m ? m[1] : '+221');
    } else {
      setIndicatif('+221');
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmitCivilite = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const filtered = Object.fromEntries(
        Object.entries(formData).filter(([k, v]) => k !== 'email' && v !== '' && v !== null && v !== undefined)
      );
      if (filtered.telephone) filtered.telephone = `${indicatif}${filtered.telephone}`;
      if (filtered.genre) filtered.genre = String(filtered.genre).toUpperCase();

      const resp = await api.put('/api/users/profile', filtered);
      if (resp?.data?.success) {
        syncUserData(resp.data.data);
        setIsEditing(false);
        setSuccess('Profil mis à jour avec succès');
      } else {
        throw new Error(resp?.data?.message || 'Réponse invalide');
      }
    } catch (err) {
      setError('Erreur lors de la mise à jour: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  // -------- BIO (avec upload différé)
  const [bioData, setBioData] = useState({
    bio: '',
    profession: '',
    photo_profil: '',
    compte_prive: false,
  });

  const photoProfilRef = useRef(null);
  const [pendingPhoto, setPendingPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');

  useEffect(() => {
    setBioData({
      bio: user?.bio || '',
      profession: user?.profession || '',
      photo_profil: user?.photo_profil || '',
      compte_prive: user?.compte_prive === true,
    });
  }, [user]);

  const handleBioChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBioData((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const selectProfilePhoto = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) return setError('Image seulement');
    if (f.size > MAX_IMG) return setError('Image trop volumineuse (max 5MB)');
    setError('');
    setPendingPhoto(f);
    setPhotoPreview(URL.createObjectURL(f));
  };

  const handleSubmitBio = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      // 1) uploader la photo si sélectionnée
      if (pendingPhoto) {
        const fd = new FormData();
        fd.append('photo', pendingPhoto);
        const up = await api.post('/api/users/profile/photo', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true,
        });
        if (!up?.data?.success) throw new Error('Upload photo échoué');
        const updated = up.data.data;
        setBioData((prev) => ({ ...prev, photo_profil: updated.photo_profil }));
        syncUserData({ photo_profil: updated.photo_profil });
        setPendingPhoto(null);
        setPhotoPreview('');
      }

      // 2) mettre à jour bio/profession/compte_prive
      const payload = {
        bio: bioData.bio || '',
        profession: bioData.profession || '',
        compte_prive: !!bioData.compte_prive,
      };
      const resp = await api.put('/api/users/profile', payload);
      if (resp?.data?.success) {
        syncUserData(resp.data.data);
        setIsEditingBio(false);
        setSuccess('Bio mise à jour avec succès');
      } else {
        throw new Error(resp?.data?.message || 'Réponse invalide');
      }
    } catch (err) {
      setError('Erreur lors de la mise à jour: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  // -------- PRÉFÉRENCES
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
    theme: 'auto',
  });

  const fetchPreferences = async () => {
    try {
      setIsLoading(true);
      setError('');
      const resp = await api.get('/api/users/preferences');
      if (resp?.data?.success && resp.data.data) {
        setPreferencesData(resp.data.data);
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

  const handlePreferencesChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      // tableaux multi-choix
      if (name === 'genres_preferes' || name === 'decennies_preferees') {
        setPreferencesData((prev) => {
          let arr = Array.isArray(prev[name]) ? [...prev[name]] : [];
          if (checked && !arr.includes(value)) arr.push(value);
          if (!checked && arr.includes(value)) arr = arr.filter((v) => v !== value);
          return { ...prev, [name]: arr };
        });
      } else {
        setPreferencesData((prev) => ({ ...prev, [name]: checked }));
      }
    } else if (name === 'artistes_preferes') {
      const artistsArray = value.split(',').map((a) => a.trim()).filter(Boolean);
      setPreferencesData((prev) => ({ ...prev, [name]: artistsArray }));
    } else {
      setPreferencesData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmitPreferences = async (e) => {
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
      } else {
        throw new Error(resp?.data?.message || 'Réponse invalide');
      }
    } catch (err) {
      setError('Erreur lors de la mise à jour: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  // -------- UI
  const tabs = [
    { id: 'civilite', label: 'Personal' },
    { id: 'bio', label: 'Bio' },
    { id: 'preferences', label: 'Preferences' },
  ];

  return (
    <>
      <button onClick={() => navigate(-1)} className={styles.backButton}>← Back</button>

      <div className={styles.tabsContainer}>
        <h1 className={styles.pageTitle}>Informations</h1>

        {error && <div className={styles.errorMessage}>{error}</div>}
        {success && <div className={styles.successMessage}>{success}</div>}
        {isLoading && <div className={styles.loadingIndicator}>Loading...</div>}

        <div className={styles.tabs}>
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`${styles.tab} ${activeTab === t.id ? styles.active : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className={styles.tabContent}>
          {/* ---- CIVILITÉ ---- */}
          {activeTab === 'civilite' && (
            <div className={styles.tabPanel}>
              <div className={styles.tabHeader}>
                <h2>Personal Information</h2>
                <button className={styles.editButton} onClick={() => setIsEditing((v) => !v)}>
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              </div>

              <form onSubmit={handleSubmitCivilite} className={styles.form}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label htmlFor="prenom">First Name</label>
                    <input id="prenom" name="prenom" value={formData.prenom} onChange={handleInputChange} disabled={!isEditing} className={styles.input} />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="nom">Last Name</label>
                    <input id="nom" name="nom" value={formData.nom} onChange={handleInputChange} disabled={!isEditing} className={styles.input} />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="email">Email</label>
                    <input id="email" name="email" value={formData.email} onChange={handleInputChange} disabled className={styles.input} />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="telephone">Phone</label>
                    <div className={styles.inline}>
                      <select id="indicatif" value={indicatif} onChange={(e) => setIndicatif(e.target.value)} disabled={!isEditing} className={styles.input} style={{ maxWidth: 120 }}>
                        <option value="+1">+1 (US/CA)</option>
                        <option value="+33">+33 (FR)</option>
                        <option value="+221">+221 (SN)</option>
                        <option value="+44">+44 (UK)</option>
                        <option value="+49">+49 (DE)</option>
                        <option value="+213">+213 (DZ)</option>
                        <option value="+212">+212 (MA)</option>
                        <option value="+225">+225 (CI)</option>
                        <option value="+216">+216 (TN)</option>
                        <option value="+237">+237 (CM)</option>
                      </select>
                      <input id="telephone" name="telephone" value={formData.telephone} onChange={handleInputChange} disabled={!isEditing} className={styles.input} />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="date_naissance">Birth Date</label>
                    <input type="date" id="date_naissance" name="date_naissance" value={formData.date_naissance} onChange={handleInputChange} disabled={!isEditing} className={styles.input} />
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
                      <option value="SN">Senegal</option>
                      <option value="FR">France</option>
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="GB">United Kingdom</option>
                      <option value="DZ">Algeria</option>
                      <option value="MA">Morocco</option>
                      <option value="CI">Ivory Coast</option>
                      <option value="TN">Tunisia</option>
                      <option value="CM">Cameroon</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="ville">City</label>
                    <input id="ville" name="ville" value={formData.ville} onChange={handleInputChange} disabled={!isEditing} className={styles.input} />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="adresse">Address</label>
                    <input id="adresse" name="adresse" value={formData.adresse} onChange={handleInputChange} disabled={!isEditing} className={styles.input} />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="code_postal">Postal Code</label>
                    <input id="code_postal" name="code_postal" value={formData.code_postal} onChange={handleInputChange} disabled={!isEditing} className={styles.input} />
                  </div>
                </div>

                {isEditing && (
                  <div className={styles.formActions}>
                    <button type="submit" className={styles.saveButton} disabled={isLoading}>{isLoading ? 'Saving…' : 'Save'}</button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* ---- BIO ---- */}
          {activeTab === 'bio' && (
            <div className={`${styles.tabPanel} ${styles.bioPanel}`}>
              <div className={styles.tabHeader}>
                <h2>Biography</h2>
                <button className={styles.editButton} onClick={() => setIsEditingBio((v) => !v)}>
                  {isEditingBio ? 'Cancel' : 'Edit'}
                </button>
              </div>

              <form onSubmit={handleSubmitBio} className={styles.form}>
                <div className={styles.formGrid}>
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label>Profile Picture</label>
                    <div className={styles.photoUpload}>
                      <img
                        src={photoPreview || getImageUrl(bioData.photo_profil)}
                        alt="Profile"
                        className={styles.photoPreview}
                      />
                      {isEditingBio && (
                        <div className={styles.photoActions}>
                          <input
                            type="file"
                            ref={photoProfilRef}
                            accept="image/*"
                            onChange={selectProfilePhoto}
                            className={styles.photoInput}
                          />
                          <button
                            type="button"
                            onClick={() => photoProfilRef.current?.click()}
                            className={styles.uploadButton}
                            disabled={isLoading}
                          >
                            {isLoading ? 'Uploading…' : 'Change Picture'}
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
                      rows="3"
                      value={bioData.bio}
                      onChange={handleBioChange}
                      disabled={!isEditingBio}
                      className={styles.textarea}
                      placeholder="A short description about yourself…"
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
                    />
                  </div>

                  <div className={styles.formGroupCheckbox}>
                    <input
                      type="checkbox"
                      id="compte_prive"
                      name="compte_prive"
                      checked={!!bioData.compte_prive}
                      onChange={handleBioChange}
                      disabled={!isEditingBio}
                    />
                    <label htmlFor="compte_prive">Private account</label>
                  </div>
                </div>

                {isEditingBio && (
                  <div className={styles.formActions}>
                    <button type="submit" className={styles.saveButton} disabled={isLoading}>
                      {isLoading ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* ---- PRÉFÉRENCES ---- */}
          {activeTab === 'preferences' && (
            <div className={styles.tabPanel}>
              <div className={styles.tabHeader}>
                <h2>Preferences</h2>
                <button className={styles.editButton} onClick={() => setIsEditingPreferences((v) => !v)}>
                  {isEditingPreferences ? 'Cancel' : 'Edit'}
                </button>
              </div>

              <form onSubmit={handleSubmitPreferences} className={styles.form}>
                <h3 className={styles.sectionTitle}>Music Preferences</h3>

                <div className={styles.formGroup}>
                  <label>Favorite genres</label>
                  <div className={styles.checkboxGrid}>
                    {['pop','rock','hiphop','jazz','soul','reggae','electro','rnb'].map((g) => (
                      <label key={g} className={styles.checkboxItem}>
                        <input
                          type="checkbox"
                          name="genres_preferes"
                          value={g}
                          checked={preferencesData.genres_preferes?.includes(g)}
                          onChange={handlePreferencesChange}
                          disabled={!isEditingPreferences}
                        />
                        <span>{g.toUpperCase()}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Favorite decades</label>
                  <div className={styles.checkboxGrid}>
                    {['60s','70s','80s','90s','2000s','2010s','2020s'].map((d) => (
                      <label key={d} className={styles.checkboxItem}>
                        <input
                          type="checkbox"
                          name="decennies_preferees"
                          value={d}
                          checked={preferencesData.decennies_preferees?.includes(d)}
                          onChange={handlePreferencesChange}
                          disabled={!isEditingPreferences}
                        />
                        <span>{d}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="artistes_preferes">Favorite artists (comma separated)</label>
                  <input
                    id="artistes_preferes"
                    name="artistes_preferes"
                    value={(preferencesData.artistes_preferes || []).join(', ')}
                    onChange={handlePreferencesChange}
                    disabled={!isEditingPreferences}
                    className={styles.input}
                  />
                </div>

                <h3 className={styles.sectionTitle}>Notifications</h3>
                <div className={styles.checkboxGrid}>
                  {[
                    ['notif_nouveaux_amis', 'New friends'],
                    ['notif_messages', 'Messages'],
                    ['notif_commentaires', 'Comments'],
                    ['notif_mentions', 'Mentions'],
                    ['notif_evenements', 'Events'],
                    ['notif_recommendations', 'Recommendations'],
                    ['notif_email', 'Email'],
                    ['notif_push', 'Push'],
                  ].map(([key, label]) => (
                    <label key={key} className={styles.checkboxItem}>
                      <input
                        type="checkbox"
                        name={key}
                        checked={!!preferencesData[key]}
                        onChange={handlePreferencesChange}
                        disabled={!isEditingPreferences}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>

                <h3 className={styles.sectionTitle}>Privacy & Display</h3>
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
                      <option value="public">Public</option>
                      <option value="amis">Friends</option>
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
                      <option value="public">Public</option>
                      <option value="amis">Friends</option>
                      <option value="prive">Only me</option>
                    </select>
                  </div>

                  <div className={styles.formGroupCheckbox}>
                    <input
                      type="checkbox"
                      id="partage_automatique"
                      name="partage_automatique"
                      checked={!!preferencesData.partage_automatique}
                      onChange={handlePreferencesChange}
                      disabled={!isEditingPreferences}
                    />
                    <label htmlFor="partage_automatique">Auto share new memories</label>
                  </div>

                  <div className={styles.formGroupCheckbox}>
                    <input
                      type="checkbox"
                      id="autoriser_suggestions_amis"
                      name="autoriser_suggestions_amis"
                      checked={!!preferencesData.autoriser_suggestions_amis}
                      onChange={handlePreferencesChange}
                      disabled={!isEditingPreferences}
                    />
                    <label htmlFor="autoriser_suggestions_amis">Allow friend suggestions</label>
                  </div>

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
                      <option value="auto">Auto</option>
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </div>
                </div>

                {isEditingPreferences && (
                  <div className={styles.formActions}>
                    <button type="submit" className={styles.saveButton} disabled={isLoading}>
                      {isLoading ? 'Saving…' : 'Save'}
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
