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

  const [formData, setFormData] = useState({}); 
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fonction pour convertir les chemins relatifs en URLs absolues - CORRECTED VERSION
  const getImageUrl = (path) => {
    if (!path) return '/images/default-avatar.png';
    
    // Si l'URL est déjà absolue, la retourner telle quelle
    if (path.startsWith('http')) return path;
    
    // Assurez-vous que le chemin commence par un slash
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    
    // Utiliser l'URL complète du backend
    const backendUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';
    
    // Supprimer les espaces potentiels dans l'URL
    return `${backendUrl}${normalizedPath}`.replace(/\s+/g, '');
  };

  // Fonction utilitaire pour synchroniser les données utilisateur
  const syncUserData = (updatedData) => {
    // Mettre à jour le contexte
    setUser(prev => ({
      ...prev,
      ...updatedData
    }));
    
    // Mettre à jour localStorage
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({
        ...userData,
        ...updatedData
      }));
    } catch (error) {
      console.error("Error syncing user data:", error);
    }
  };

  // Protection contre les redirections non désirées
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (saving) {
        // Si un chargement est en cours, empêcher la navigation
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Nettoyer à la désactivation du composant
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [saving]);

  // Safety mechanism to prevent white screens
  useEffect(() => {
    const handleError = (event) => {
      console.error('Unhandled error:', event.error || event.reason);
      setError('Une erreur inattendue s\'est produite. Veuillez réessayer.');
      setSaving(false);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

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

      // Utiliser URL API sans espaces
      const response = await retryOperation(() =>
        api.put('/api/users/profile', payload)
      );

      console.log('Réponse du backend:', response.data);
      if (response.data.success) {
        console.log('Mise à jour du contexte avec:', response.data.data);
        
        // Utiliser la fonction syncUserData pour une mise à jour cohérente
        syncUserData(response.data.data);
        
        setSuccess('Profil mis à jour ✔️');
        
        // Force le composant à rester sur la page actuelle
        setTimeout(() => {
          window.history.pushState(null, '', window.location.pathname);
        }, 100);
      } else {
        setError(response.data.message || 'Réponse du backend sans succès');
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

  // CORRECTED VERSION for photo upload
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
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('type', type);

      // Endpoint approprié
      const endpoint = type === VALID_ACTION_TYPES.PHOTO ? 
        '/api/users/profile/photo' : 
        '/api/users/profile/cover';
      
      console.log("Uploading photo to:", endpoint);
      
      // Utilisation de l'API avec la configuration correcte
      const response = await retryOperation(() =>
        api.post(endpoint, formData, {
          headers: { 
            'Content-Type': 'multipart/form-data' 
          },
          withCredentials: true
        })
      );

      console.log("Response from photo upload:", response.data);

      if (response.data && response.data.success) {
        const updatedUser = response.data.data;
        
        // Mettre à jour l'état local
        if (type === VALID_ACTION_TYPES.PHOTO) {
          setProfilePhoto(updatedUser.photo_profil);
        } else {
          setCoverPhoto(updatedUser.photo_couverture);
        }
        
        // Synchroniser les données utilisateur de façon cohérente
        syncUserData(type === VALID_ACTION_TYPES.PHOTO 
          ? { photo_profil: updatedUser.photo_profil }
          : { photo_couverture: updatedUser.photo_couverture });
        
        setSuccess('Photo mise à jour avec succès');
        
        // Force le composant à rester sur la page actuelle
        setTimeout(() => {
          window.history.pushState(null, '', window.location.pathname);
        }, 100);
      } else {
        throw new Error('Erreur dans la réponse du serveur');
      }
    } catch (err) {
      console.error('Erreur détaillée pour upload photo:', err);
      console.error('Stack:', err.stack);
      
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Erreur lors de l\'upload de la photo. Veuillez réessayer.');
      }
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