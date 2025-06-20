import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import styles from './userInfo.module.css';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg','image/png','image/gif'];
const COMPRESSION_QUALITY = 0.8;
const VALID_ACTION_TYPES = {
  PHOTO: 'UPLOAD_PHOTO_PROFIL',
  COVER: 'UPLOAD_PHOTO_COUVERTURE'
};

export default function UserInfo({ onBack }) {
  const { user, setUser } = useAuth();
  const isMounted = useRef(true);

  const [formData, setFormData]       = useState({}); 
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [coverPhoto, setCoverPhoto]     = useState(null);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');
  // … tu peux ajouter upload state, crop, preview, etc.

  // Fonction pour convertir les chemins relatifs en URLs absolues
  const getImageUrl = (path) => {
    if (!path) return null;
    
    // Si l'URL est déjà absolue, la retourner telle quelle
    if (path.startsWith('http')) return path;
    
    // Sinon, préfixer avec l'URL du backend
    const backendUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';
    return `${backendUrl}${path}`;
  };

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // À CHAQUE changement de `user`, on resynchronise le formulaire
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const dd = user.date_naissance
      ? new Date(user.date_naissance).toISOString().split('T')[0]
      : '';

    setFormData({
      nom:            user.nom || '',
      prenom:         user.prenom || '',
      email:          user.email || '',
      profession:     user.profession || '',
      telephone:      user.telephone || '',
      date_naissance: dd,
      genre:          (user.genre || 'HOMME').toUpperCase(),
      pays:           user.pays || '',
      ville:          user.ville || '',
      adresse:        user.adresse || '',
      code_postal:    user.code_postal || '',
      bio:            user.bio || ''
    });

    setProfilePhoto(user.photo_profil || null);
    setCoverPhoto(user.photo_couverture || null);
    setLoading(false);
  }, [user]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(f => ({ ...f, [name]: value }));
  };

  const retryOperation = async (fn, retries = MAX_RETRIES) => {
    let err;
    for (let i = 0; i < retries; i++) {
      try { return await fn(); }
      catch (e) {
        err = e;
        await new Promise(r => setTimeout(r, RETRY_DELAY * (i+1)));
      }
    }
    throw err;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // On ne garde que les champs attendus par le backend
      const allowedFields = [
        'nom', 'prenom', 'bio', 'date_naissance', 'genre',
        'pays', 'ville', 'adresse', 'code_postal', 'telephone',
        'profession'
      ];
      const payload = {};
      allowedFields.forEach(k => {
        if (formData[k] !== undefined && formData[k] !== null && formData[k] !== '') {
          payload[k] = k === 'genre' ? formData[k].toUpperCase() : formData[k];
        }
      });

      console.log('==== DEBUG FRONTEND (payload envoyé au backend) ====');
      console.log(payload);

      // Utiliser URL absolue
      const backendUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';
      const res = await retryOperation(() =>
        api.put(`${backendUrl}/api/users/profile`, payload)
      );

      console.log('Réponse du backend:', res.data);
      if (res.data.success) {
        console.log('Mise à jour du contexte avec:', res.data.data);
        setUser(res.data.data);                      // ← re-hydrate le contexte
        localStorage.setItem('user', JSON.stringify(res.data.data)); // ← persiste dans le localStorage
        setSuccess('Profil mis à jour ✔️');
      } else {
        setError(res.data.message || 'Réponse du backend sans succès');
      }
    } catch (err) {
      console.error('Erreur détaillée:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Erreur, réessaye.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (file, type) => {
    if (!file || !ALLOWED_TYPES.includes(file.type)) {
      setError('Format de fichier non supporté');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('Fichier trop volumineux (max 5MB)');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('type', type);

      // Utiliser URL absolue
      const backendUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';
      const endpoint = type === VALID_ACTION_TYPES.PHOTO ? 
        `${backendUrl}/api/users/profile/photo` : 
        `${backendUrl}/api/users/profile/cover`;
      
      const res = await retryOperation(() =>
        api.post(endpoint, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      );

      if (res.data.success) {
        // Mettre à jour l'état local
        if (type === VALID_ACTION_TYPES.PHOTO) {
          setProfilePhoto(res.data.data.photo_profil);
        } else {
          setCoverPhoto(res.data.data.photo_couverture);
        }
        
        // Mettre à jour le contexte utilisateur
        setUser(prev => ({
          ...prev,
          ...(type === VALID_ACTION_TYPES.PHOTO 
            ? { photo_profil: res.data.data.photo_profil }
            : { photo_couverture: res.data.data.photo_couverture })
        }));
        
        // Mettre à jour localStorage
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({
          ...userData,
          ...(type === VALID_ACTION_TYPES.PHOTO 
            ? { photo_profil: res.data.data.photo_profil }
            : { photo_couverture: res.data.data.photo_couverture })
        }));
        
        setSuccess('Photo mise à jour ✔️');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Erreur lors de l\'upload');
    } finally {
      setSaving(false);
    }
  };

  const handleProfilePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) handlePhotoUpload(file, VALID_ACTION_TYPES.PHOTO);
  };

  const handleCoverPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) handlePhotoUpload(file, VALID_ACTION_TYPES.COVER);
  };

  if (loading) return <div>Loading…</div>;
  if (!user?.id) { onBack?.(); return null; }

  return (
    <div className={styles.user_info_container}>
      <button onClick={onBack} className={styles.back_button}>← Retour</button>
      {error   && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.form_grid}>
          <label>
            First Name
            <input
              name="prenom"
              value={formData.prenom}
              onChange={handleChange}
            />
          </label>

          <label>
            Last Name
            <input
              name="nom"
              value={formData.nom}
              onChange={handleChange}
            />
          </label>

          <label>
            Date of Birth
            <input
              type="date"
              name="date_naissance"
              value={formData.date_naissance}
              onChange={handleChange}
            />
          </label>

          <label>
            Gender
            <select
              name="genre"
              value={formData.genre}
              onChange={handleChange}
            >
              <option value="HOMME">Homme</option>
              <option value="FEMME">Femme</option>
              <option value="AUTRE">Autre</option>
            </select>
          </label>

          {/* … autres champs … */}
        </div>

        <button
          type="submit"
          disabled={saving}
          className={styles.submit_button}
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>

      {/* Aperçu photos */}
      <div className={styles.photo_section}>
        <div className={styles.photo_upload}>
          <input
            type="file"
            accept={ALLOWED_TYPES.join(',')}
            onChange={handleProfilePhotoChange}
            id="profile-photo"
            style={{ display: 'none' }}
          />
          <label htmlFor="profile-photo" className={styles.upload_button}>
            {profilePhoto
              ? <img src={getImageUrl(profilePhoto)} alt="Profil" className={styles.profile_photo} />
              : <div className={styles.profile_photo_placeholder}>+</div>
            }
          </label>
        </div>

        <div className={styles.photo_upload}>
          <input
            type="file"
            accept={ALLOWED_TYPES.join(',')}
            onChange={handleCoverPhotoChange}
            id="cover-photo"
            style={{ display: 'none' }}
          />
          <label htmlFor="cover-photo" className={styles.upload_button}>
            {coverPhoto
              ? <img src={getImageUrl(coverPhoto)} alt="Cover" className={styles.cover_photo} />
              : <div className={styles.cover_photo_placeholder}>+</div>
            }
          </label>
        </div>
      </div>
    </div>
  );
}