// components/Dashboard/AdminDashboard/Profile/MyProfile.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../../utils/api';
import styles from './MyProfile.module.css';

/* ---------- Reusable ---------- */
function Skeleton({ rows = 3 }) {
  return (
    <div className={styles.skeleton}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={styles.skeletonRow} />
      ))}
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className={styles.stat}>
      <div className={styles.statIcon}><i className={icon} /></div>
      <div className={styles.statInfo}>
        <div className={styles.statValue}>{value ?? '—'}</div>
        <div className={styles.statLabel}>{label}</div>
      </div>
    </div>
  );
}

/* ---------- Change Password ---------- */
function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const canSubmit =
    currentPassword &&
    newPassword &&
    confirmPassword &&
    newPassword === confirmPassword &&
    newPassword.length >= 6;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true); setMessage(null); setError(null);
    try {
      // Ajuste la route si nécessaire côté backend
      const { data } = await api.put('/api/auth/change-password', { currentPassword, newPassword });
      setMessage(data?.message || 'Password changed successfully');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Unable to change password';
      setError(msg);
    } finally { setLoading(false); }
  };

  return (
    <div className={`${styles.card} ${styles.security}`}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}><i className="fas fa-lock" /> Change Password</h2>
        <p className={styles.cardHintSmall}>Minimum 6 characters. Make it unique and strong.</p>
      </div>

      <form onSubmit={onSubmit} className={styles.form}>
        <label className={styles.inputGroup}>
          <span>Current password</span>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </label>
        <label className={styles.inputGroup}>
          <span>New password</span>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 6 characters"
            required
          />
        </label>
        <label className={styles.inputGroup}>
          <span>Confirm new password</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat new password"
            required
          />
        </label>

        {newPassword && confirmPassword && newPassword !== confirmPassword && (
          <div className={styles.inlineError}>
            <i className="fas fa-exclamation-triangle" /> Passwords do not match
          </div>
        )}

        {error && <div className={styles.alertError}><i className="fas fa-times-circle" /> {error}</div>}
        {message && <div className={styles.alertSuccess}><i className="fas fa-check-circle" /> {message}</div>}

        <div className={styles.actions}>
          <button className={styles.primaryBtn} type="submit" disabled={!canSubmit || loading}>
            {loading ? (<><i className="fas fa-spinner fa-spin" /> Updating...</>) : (<><i className="fas fa-key" /> Update Password</>)}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ---------- Edit Profile ---------- */
function EditProfile({ me, onUpdated }) {
  const [form, setForm] = useState({
    telephone: me?.telephone || '',
    pays: me?.pays || '',
    ville: me?.ville || '',
    adresse: me?.adresse || '',
    code_postal: me?.code_postal || '',
    genre: me?.genre || '',
    date_naissance: me?.date_naissance ? new Date(me.date_naissance).toISOString().slice(0, 10) : '',
    bio: me?.bio || '',
    profession: me?.profession || '',
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  const updateField = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg(null); setErr(null);
    try {
      const res = await api.put('/api/users/profile', form);
      const data = res?.data?.data || res?.data || {};
      setMsg('Profile updated');
      onUpdated?.(data);
    } catch (e2) {
      setErr(e2?.response?.data?.message || 'Unable to update profile');
    } finally { setSaving(false); }
  };

  return (
    <div className={`${styles.card} ${styles.contact}`}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}><i className="fas fa-id-card" /> Contact & Profile</h2>
        <span className={styles.badgeTip}>Editable</span>
      </div>
      <form className={styles.form} onSubmit={submit}>
        <div className={styles.twoCols}>
          <label className={styles.inputGroup}>
            <span>Phone</span>
            <input value={form.telephone} onChange={(e) => updateField('telephone', e.target.value)} placeholder="Phone" />
          </label>
          <label className={styles.inputGroup}>
            <span>Country</span>
            <input value={form.pays} onChange={(e) => updateField('pays', e.target.value)} placeholder="Country" />
          </label>
        </div>
        <div className={styles.twoCols}>
          <label className={styles.inputGroup}>
            <span>City</span>
            <input value={form.ville} onChange={(e) => updateField('ville', e.target.value)} placeholder="City" />
          </label>
          <label className={styles.inputGroup}>
            <span>Postal Code</span>
            <input value={form.code_postal} onChange={(e) => updateField('code_postal', e.target.value)} placeholder="Postal code" />
          </label>
        </div>
        <label className={styles.inputGroup}>
          <span>Address</span>
          <input value={form.adresse} onChange={(e) => updateField('adresse', e.target.value)} placeholder="Address" />
        </label>
        <div className={styles.twoCols}>
          <label className={styles.inputGroup}>
            <span>Gender</span>
            <input value={form.genre} onChange={(e) => updateField('genre', e.target.value)} placeholder="Gender" />
          </label>
          <label className={styles.inputGroup}>
            <span>Date of Birth</span>
            <input type="date" value={form.date_naissance} onChange={(e) => updateField('date_naissance', e.target.value)} />
          </label>
        </div>
        <label className={styles.inputGroup}>
          <span>Profession</span>
          <input value={form.profession} onChange={(e) => updateField('profession', e.target.value)} placeholder="Profession" />
        </label>
        <label className={styles.inputGroup}>
          <span>Bio</span>
          <textarea rows={3} value={form.bio} onChange={(e) => updateField('bio', e.target.value)} placeholder="Short bio" />
        </label>

        {err && <div className={styles.alertError}><i className="fas fa-times-circle" /> {err}</div>}
        {msg && <div className={styles.alertSuccess}><i className="fas fa-check-circle" /> {msg}</div>}

        <div className={styles.actions}>
          <button className={styles.primaryBtn} disabled={saving}>
            {saving ? (<><i className="fas fa-spinner fa-spin" /> Saving...</>) : (<><i className="fas fa-save" /> Save Changes</>)}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ---------- Privacy / Account ---------- */
function SecurityExtras() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [privacy, setPrivacy] = useState(null);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [busyDisable, setBusyDisable] = useState(false);
  const [busyDelete, setBusyDelete] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/api/users/profile/privacy');
        setPrivacy(data?.data || data || {});
      } catch {
        setPrivacy(null); // pas de privacy sur ce serveur
      } finally { setLoading(false); }
    })();
  }, []);

  const updatePrivacy = async () => {
    if (!privacy) return;
    setSaving(true); setMsg(null); setErr(null);
    try {
      await api.put('/api/users/profile/privacy', privacy);
      setMsg('Privacy settings updated');
    } catch (e2) {
      setErr(e2?.response?.data?.message || 'Unable to update privacy');
    } finally { setSaving(false); }
  };

  const disableAccount = async () => {
    if (!window.confirm('Disable your account?')) return;
    setBusyDisable(true);
    try {
      await api.put('/api/users/profile/disable');
      alert('Your account has been disabled.');
      window.location.href = '/logout';
    } catch (e2) {
      alert(e2?.response?.data?.message || e2?.message || 'Unable to disable account');
    } finally { setBusyDisable(false); }
  };

  const deleteAccount = async () => {
    const c = window.prompt('Type DELETE to confirm account deletion');
    if (String(c).toUpperCase() !== 'DELETE') return;
    setBusyDelete(true);
    try {
      await api.delete('/api/users/profile');
      alert('Account deleted.');
      window.location.href = '/logout';
    } catch (e2) {
      alert(e2?.response?.data?.message || e2?.message || 'Unable to delete account');
    } finally { setBusyDelete(false); }
  };

  if (loading) return <div className={styles.card}><Skeleton rows={4} /></div>;

  return (
    <div className={`${styles.card} ${styles.privacy}`}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}><i className="fas fa-user-shield" /> Privacy & Account</h2>
        <span className={styles.badgeTip}>Security</span>
      </div>

      {privacy && Object.keys(privacy).length > 0 ? (
        <div className={styles.form}>
          {Object.entries(privacy).map(([k, v]) =>
            typeof v === 'boolean' ? (
              <label key={k} className={styles.switchRow}>
                <span className={styles.switchLabel}>{k.replace(/_/g, ' ')}</span>
                <input
                  type="checkbox"
                  checked={!!privacy[k]}
                  onChange={(e) => setPrivacy((p) => ({ ...p, [k]: e.target.checked }))}
                />
              </label>
            ) : null
          )}

          {err && <div className={styles.alertError}><i className="fas fa-times-circle" /> {err}</div>}
          {msg && <div className={styles.alertSuccess}><i className="fas fa-check-circle" /> {msg}</div>}

          <div className={styles.actions}>
            <button className={styles.primaryBtn} onClick={updatePrivacy} disabled={saving}>
              {saving ? (<><i className="fas fa-spinner fa-spin" /> Saving...</>) : (<><i className="fas fa-shield-alt" /> Save Privacy</>)}
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.smallMuted}>Privacy settings are not available on this server.</div>
      )}

      <div className={styles.divider} />

      <div className={styles.dangerZone}>
        <h3>Danger zone</h3>
        <div className={styles.actionsWrap}>
          <button className={styles.warnBtn} onClick={disableAccount} disabled={busyDisable}>
            {busyDisable ? (<><i className="fas fa-spinner fa-spin" /> Disabling...</>) : (<><i className="fas fa-user-slash" /> Disable account</>)}
          </button>
          <button className={styles.dangerBtn} onClick={deleteAccount} disabled={busyDelete}>
            {busyDelete ? (<><i className="fas fa-spinner fa-spin" /> Deleting...</>) : (<><i className="fas fa-trash" /> Delete account</>)}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Main ---------- */
export default function MyProfile() {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get('/api/users/profile/me');
        if (!mounted) return;
        setMe(data?.data || data || null);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load profile');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const initials = useMemo(() => {
    const f = me?.prenom?.[0] || me?.nom?.[0] || 'A';
    const l = me?.nom?.[0] || me?.prenom?.[0] || 'D';
    return `${String(f)}${String(l)}`.toUpperCase();
  }, [me]);

  const uploadAvatar = async (file) => {
    if (!file) return;
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const res = await api.post('/api/users/profile/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const updated = res?.data?.data || res?.data || {};
      setMe((m) => ({ ...m, ...updated }));
    } catch (e) {
      alert(e?.response?.data?.message || 'Avatar upload failed');
    } finally { setAvatarUploading(false); }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}><h1>My Profile</h1></div>
        <div className={styles.gridA}>
          <section className={`${styles.card} ${styles.overview}`}><Skeleton rows={6} /></section>
          <section className={`${styles.card} ${styles.security}`}><Skeleton rows={6} /></section>
          <section className={`${styles.card} ${styles.contact}`}><Skeleton rows={9} /></section>
          <section className={`${styles.card} ${styles.privacy}`}><Skeleton rows={6} /></section>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}><h1>My Profile</h1></div>
        <div className={styles.errorBox}>
          <i className="fas fa-exclamation-triangle" /> {error}
          <div className={styles.actions}>
            <button className={styles.secondaryBtn} onClick={() => window.location.reload()}>
              <i className="fas fa-sync" /> Retry
            </button>
            <Link to="/login" className={styles.linkBtn}><i className="fas fa-sign-in-alt" /> Log in</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>My Profile</h1>
        <p className={styles.subtitle}>Manage your admin account details and security.</p>
      </div>

      {/* GRID 2×2 FIXE */}
      <div className={styles.gridA}>
        {/* Row 1: Overview */}
        <section className={`${styles.card} ${styles.overview}`}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}><i className="fas fa-user-circle" /> Overview</h2>
          </div>
          <div className={styles.avatarRow}>
            {me?.photo_profil ? (
              <img src={me.photo_profil} alt="Avatar" className={styles.avatarImg} />
            ) : (
              <div className={styles.avatar}>{initials}</div>
            )}
            <div className={styles.avatarMeta}>
              <div className={`${styles.nameLine} ${styles.truncate}`} title={`${me?.prenom || ''} ${me?.nom || ''}`}>
                {me?.prenom} {me?.nom}
              </div>
              <div className={styles.roleLine}>
                <i className="fas fa-shield-alt" /> {me?.role ? String(me.role).charAt(0).toUpperCase() + String(me.role).slice(1) : 'Administrator'}
              </div>
              <div className={styles.actionsStack}>
                <button className={styles.ghostBtn} onClick={() => fileRef.current?.click()} disabled={avatarUploading}>
                  {avatarUploading ? (<><i className="fas fa-spinner fa-spin" /> Uploading...</>) : (<><i className="fas fa-camera" /> Change avatar</>)}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => uploadAvatar(e.target.files?.[0])}
                />
              </div>
            </div>
          </div>
          <div className={styles.meta}>
            <Stat
                icon="fas fa-check-circle"
                label="Verification"
                value={me?.statut_verification ? 'Verified' : 'Not verified'}
                hint="Email/phone confirmation status"
            />
            <Stat
                icon="fas fa-user-lock"
                label="Account Status"
                value={me?.statut_compte || '—'}
                hint="Active, suspended or disabled"
            />
            <Stat
                icon="fas fa-sign-in-alt"
                label="Last Login"
                value={me?.derniere_connexion ? new Date(me.derniere_connexion).toLocaleString() : '—'}
                hint="Shown in your local timezone"
            />
            <Stat
                icon="fas fa-user-shield"
                label="Role"
                value={me?.role ? String(me.role).charAt(0).toUpperCase() + String(me.role).slice(1) : '—'}
                hint="Administrative permissions"
            />
            <Stat
                icon="fas fa-map-marker-alt"
                label="Location"
                value={[me?.ville, me?.pays].filter(Boolean).join(', ') || '—'}
                hint="City & country (optional)"
            />
            <Stat
                    icon="fas fa-calendar-check"
                    label="Member Since"
                    value={
                    me?.createdAt
                        ? new Date(me.createdAt).toLocaleDateString()
                        : me?.created_at
                        ? new Date(me.created_at).toLocaleDateString()
                        : me?.date_creation
                        ? new Date(me.date_creation).toLocaleDateString()
                        : '—'
                    }
                    hint="Account creation date"
                />
                <Stat
                icon="fas fa-envelope"
                label="Email"
                value={me?.email || '—'}
                hint="Primary contact address"
            />
            </div>


        </section>

       {/* Row 2: Privacy & Account */}
        <SecurityExtras />

        {/* Row 2: Contact & Profile */}
        <EditProfile me={me} onUpdated={(u) => setMe((m) => ({ ...m, ...u }))} />


        {/* Row 1: Security (Change Password) */}
        <ChangePasswordCard /> 

      </div>
    </div>
  );
}
