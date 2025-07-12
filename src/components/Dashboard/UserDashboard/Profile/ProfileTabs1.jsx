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
      const response = await fetch('/api/users/preferences', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error retrieving preferences');
      }
      
      const result = await response.json();
      if (result.success && result.data) {
        setPreferencesData(result.data);
      }
    } catch (error) {
      console.error('Error:', error);
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

  // Fixed handlePreferencesChange function for checkboxes
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

    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await fetch('/api/users/profile/photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error uploading photo');
      }

      const result = await response.json();
      setBioData(prev => ({
        ...prev,
        [type]: result.data.photo_profil
      }));
    } catch (error) {
      console.error('Error uploading photo:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(filteredFormData)
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.message || 'Error updating profile');
      }
      const result = await response.json();
      setUser(result.data);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleBioSubmit = async (e) => {
    e.preventDefault();
    try {
      const filteredBioData = Object.fromEntries(
        Object.entries(bioData)
          .filter(([k, v]) => v !== "" && v !== null && v !== undefined)
      );
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(filteredBioData)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error updating bio');
      }
      const result = await response.json();
      setUser(result.data);
      setIsEditingBio(false);
    } catch (error) {
      console.error('Error updating bio:', error);
    }
  };

  // Fixed handlePreferencesSubmit function
  const handlePreferencesSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/users/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(preferencesData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error updating preferences');
      }
      
      const result = await response.json();
      if (result.success) {
        setPreferencesData(result.data);
        setIsEditingPreferences(false); // This should toggle the button back to "Edit"
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      // Show error to user
      alert('Error saving preferences. Please try again.');
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
                      <option value="AD">Andorra</option>
                      <option value="AO">Angola</option>
                      <option value="AR">Argentina</option>
                      <option value="AM">Armenia</option>
                      <option value="AU">Australia</option>
                      <option value="AT">Austria</option>
                      <option value="AZ">Azerbaijan</option>
                      <option value="BS">Bahamas</option>
                      <option value="BH">Bahrain</option>
                      <option value="BD">Bangladesh</option>
                      <option value="BY">Belarus</option>
                      <option value="BE">Belgium</option>
                      <option value="BJ">Benin</option>
                      <option value="BT">Bhutan</option>
                      <option value="BO">Bolivia</option>
                      <option value="BA">Bosnia and Herzegovina</option>
                      <option value="BW">Botswana</option>
                      <option value="BR">Brazil</option>
                      <option value="BN">Brunei</option>
                      <option value="BG">Bulgaria</option>
                      <option value="BF">Burkina Faso</option>
                      <option value="BI">Burundi</option>
                      <option value="KH">Cambodia</option>
                      <option value="CM">Cameroon</option>
                      <option value="CA">Canada</option>
                      <option value="CV">Cape Verde</option>
                      <option value="CF">Central African Republic</option>
                      <option value="TD">Chad</option>
                      <option value="CL">Chile</option>
                      <option value="CN">China</option>
                      <option value="CO">Colombia</option>
                      <option value="KM">Comoros</option>
                      <option value="CG">Congo</option>
                      <option value="CD">Congo (DRC)</option>
                      <option value="CR">Costa Rica</option>
                      <option value="CI">Côte d'Ivoire</option>
                      <option value="HR">Croatia</option>
                      <option value="CU">Cuba</option>
                      <option value="CY">Cyprus</option>
                      <option value="CZ">Czech Republic</option>
                      <option value="DK">Denmark</option>
                      <option value="DJ">Djibouti</option>
                      <option value="DM">Dominica</option>
                      <option value="DO">Dominican Republic</option>
                      <option value="EC">Ecuador</option>
                      <option value="EG">Egypt</option>
                      <option value="SV">El Salvador</option>
                      <option value="GQ">Equatorial Guinea</option>
                      <option value="ER">Eritrea</option>
                      <option value="EE">Estonia</option>
                      <option value="SZ">Eswatini</option>
                      <option value="ET">Ethiopia</option>
                      <option value="FJ">Fiji</option>
                      <option value="FI">Finland</option>
                      <option value="FR">France</option>
                      <option value="GA">Gabon</option>
                      <option value="GM">Gambia</option>
                      <option value="GE">Georgia</option>
                      <option value="DE">Germany</option>
                      <option value="GH">Ghana</option>
                      <option value="GR">Greece</option>
                      <option value="GD">Grenada</option>
                      <option value="GT">Guatemala</option>
                      <option value="GN">Guinea</option>
                      <option value="GW">Guinea-Bissau</option>
                      <option value="GY">Guyana</option>
                      <option value="HT">Haiti</option>
                      <option value="HN">Honduras</option>
                      <option value="HU">Hungary</option>
                      <option value="IS">Iceland</option>
                      <option value="IN">India</option>
                      <option value="ID">Indonesia</option>
                      <option value="IR">Iran</option>
                      <option value="IQ">Iraq</option>
                      <option value="IE">Ireland</option>
                      <option value="IL">Israel</option>
                      <option value="IT">Italy</option>
                      <option value="JM">Jamaica</option>
                      <option value="JP">Japan</option>
                      <option value="JO">Jordan</option>
                      <option value="KZ">Kazakhstan</option>
                      <option value="KE">Kenya</option>
                      <option value="KI">Kiribati</option>
                      <option value="KW">Kuwait</option>
                      <option value="KG">Kyrgyzstan</option>
                      <option value="LA">Laos</option>
                      <option value="LV">Latvia</option>
                      <option value="LB">Lebanon</option>
                      <option value="LS">Lesotho</option>
                      <option value="LR">Liberia</option>
                      <option value="LY">Libya</option>
                      <option value="LI">Liechtenstein</option>
                      <option value="LT">Lithuania</option>
                      <option value="LU">Luxembourg</option>
                      <option value="MG">Madagascar</option>
                      <option value="MW">Malawi</option>
                      <option value="MY">Malaysia</option>
                      <option value="MV">Maldives</option>
                      <option value="ML">Mali</option>
                      <option value="MT">Malta</option>
                      <option value="MH">Marshall Islands</option>
                      <option value="MR">Mauritania</option>
                      <option value="MU">Mauritius</option>
                      <option value="MX">Mexico</option>
                      <option value="FM">Micronesia</option>
                      <option value="MD">Moldova</option>
                      <option value="MC">Monaco</option>
                      <option value="MN">Mongolia</option>
                      <option value="ME">Montenegro</option>
                      <option value="MA">Morocco</option>
                      <option value="MZ">Mozambique</option>
                      <option value="MM">Myanmar</option>
                      <option value="NA">Namibia</option>
                      <option value="NR">Nauru</option>
                      <option value="NP">Nepal</option>
                      <option value="NL">Netherlands</option>
                      <option value="NZ">New Zealand</option>
                      <option value="NI">Nicaragua</option>
                      <option value="NE">Niger</option>
                      <option value="NG">Nigeria</option>
                      <option value="NO">Norway</option>
                      <option value="OM">Oman</option>
                      <option value="PK">Pakistan</option>
                      <option value="PW">Palau</option>
                      <option value="PS">Palestine</option>
                      <option value="PA">Panama</option>
                      <option value="PG">Papua New Guinea</option>
                      <option value="PY">Paraguay</option>
                      <option value="PE">Peru</option>
                      <option value="PH">Philippines</option>
                      <option value="PL">Poland</option>
                      <option value="PT">Portugal</option>
                      <option value="QA">Qatar</option>
                      <option value="RO">Romania</option>
                      <option value="RU">Russia</option>
                      <option value="RW">Rwanda</option>
                      <option value="KN">Saint Kitts and Nevis</option>
                      <option value="LC">Saint Lucia</option>
                      <option value="VC">Saint Vincent and the Grenadines</option>
                      <option value="WS">Samoa</option>
                      <option value="SM">San Marino</option>
                      <option value="ST">Sao Tome and Principe</option>
                      <option value="SA">Saudi Arabia</option>
                      <option value="SN">Senegal</option>
                      <option value="RS">Serbia</option>
                      <option value="SC">Seychelles</option>
                      <option value="SL">Sierra Leone</option>
                      <option value="SG">Singapore</option>
                      <option value="SK">Slovakia</option>
                      <option value="SI">Slovenia</option>
                      <option value="SB">Solomon Islands</option>
                      <option value="SO">Somalia</option>
                      <option value="ZA">South Africa</option>
                      <option value="KR">South Korea</option>
                      <option value="SS">South Sudan</option>
                      <option value="ES">Spain</option>
                      <option value="LK">Sri Lanka</option>
                      <option value="SD">Sudan</option>
                      <option value="SR">Suriname</option>
                      <option value="SE">Sweden</option>
                      <option value="CH">Switzerland</option>
                      <option value="SY">Syria</option>
                      <option value="TW">Taiwan</option>
                      <option value="TJ">Tajikistan</option>
                      <option value="TZ">Tanzania</option>
                      <option value="TH">Thailand</option>
                      <option value="TL">Timor-Leste</option>
                      <option value="TG">Togo</option>
                      <option value="TO">Tonga</option>
                      <option value="TT">Trinidad and Tobago</option>
                      <option value="TN">Tunisia</option>
                      <option value="TR">Turkey</option>
                      <option value="TM">Turkmenistan</option>
                      <option value="TV">Tuvalu</option>
                      <option value="UG">Uganda</option>
                      <option value="UA">Ukraine</option>
                      <option value="AE">United Arab Emirates</option>
                      <option value="GB">United Kingdom</option>
                      <option value="US">United States</option>
                      <option value="UY">Uruguay</option>
                      <option value="UZ">Uzbekistan</option>
                      <option value="VU">Vanuatu</option>
                      <option value="VA">Vatican City</option>
                      <option value="VE">Venezuela</option>
                      <option value="VN">Vietnam</option>
                      <option value="YE">Yemen</option>
                      <option value="ZM">Zambia</option>
                      <option value="ZW">Zimbabwe</option>
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
                    <button type="submit" className={styles.saveButton}>
                      Save
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
                        src={bioData.photo_profil || '/images/default-avatar.png'} 
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
                          >
                            Change Picture
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
                    <button type="submit" className={styles.saveButton}>
                      Save
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
                  <div className={styles.formGroup}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="notif_nouveaux_amis"
                        checked={preferencesData.notif_nouveaux_amis}
                        onChange={handlePreferencesChange}
                        disabled={!isEditingPreferences}
                        className={styles.checkbox}
                      />
                      New friends
                    </label>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="notif_messages"
                        checked={preferencesData.notif_messages}
                        onChange={handlePreferencesChange}
                        disabled={!isEditingPreferences}
                        className={styles.checkbox}
                      />
                      Messages
                    </label>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="notif_commentaires"
                        checked={preferencesData.notif_commentaires}
                        onChange={handlePreferencesChange}
                        disabled={!isEditingPreferences}
                        className={styles.checkbox}
                      />
                      Comments
                    </label>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="notif_mentions"
                        checked={preferencesData.notif_mentions}
                        onChange={handlePreferencesChange}
                        disabled={!isEditingPreferences}
                        className={styles.checkbox}
                      />
                      Mentions
                    </label>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="notif_evenements"
                        checked={preferencesData.notif_evenements}
                        onChange={handlePreferencesChange}
                        disabled={!isEditingPreferences}
                        className={styles.checkbox}
                      />
                      Events
                    </label>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="notif_recommendations"
                        checked={preferencesData.notif_recommendations}
                        onChange={handlePreferencesChange}
                        disabled={!isEditingPreferences}
                        className={styles.checkbox}
                      />
                      Recommendations
                    </label>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="notif_email"
                        checked={preferencesData.notif_email}
                        onChange={handlePreferencesChange}
                        disabled={!isEditingPreferences}
                        className={styles.checkbox}
                      />
                      Email notifications
                    </label>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="notif_push"
                        checked={preferencesData.notif_push}
                        onChange={handlePreferencesChange}
                        disabled={!isEditingPreferences}
                        className={styles.checkbox}
                      />
                      Push notifications
                    </label>
                  </div>
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