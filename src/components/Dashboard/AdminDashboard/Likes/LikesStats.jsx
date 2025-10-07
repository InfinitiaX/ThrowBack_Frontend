import React from 'react';
import styles from './Likes.module.css';

export default function LikesStats({ stats, loading }) {
  if (loading) {
    return (
      <div className={styles.card} style={{ marginBottom: 16 }}>
        <div className={styles.cardHeader}>
          <h3><i className="fas fa-chart-pie" /> Statistics</h3>
          <span className={styles.badge}>Loading…</span>
        </div>
        <div className={styles.chart}><div className={styles.loadingSpinner} /></div>
      </div>
    );
  }

  if (!stats) return null;

  const byType = stats.byType || [];
  const byAction = stats.byAction || [];
  const last7 = stats.last7Days || [];
  const total = stats.total?.[0]?.count || 0;

  return (
    <div className={styles.statsGrid}>
      {/* By type */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3><i className="fas fa-tags" /> Breakdown by type</h3>
          <span className={styles.badge}>{total} total</span>
        </div>
        <div className={styles.pills}>
          {byType.length === 0 && <span className={styles.count}>No data</span>}
          {byType.map((t) => (
            <span key={t._id} className={styles.pill}>
              <i className="fas fa-tag" /> {t._id || '—'} <span className={styles.count}>{t.count}</span>
            </span>
          ))}
        </div>
      </div>

      {/* By action */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3><i className="fas fa-thumbs-up" /> Breakdown by action</h3>
          <span className={styles.badge}>{total} total</span>
        </div>
        <ul className={styles.topList}>
          {byAction.length === 0 && <li><span>No data</span></li>}
          {byAction.map((a, i) => (
            <li key={a._id}>
              <span><span className={styles.rank}>#{i + 1}</span>{a._id}</span>
              <span className={styles.count}>{a.count}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Activity 7 days */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3><i className="fas fa-calendar-week" /> Activity (7 days)</h3>
          <span className={styles.badge}>
            {last7.reduce((s, d) => s + (d.count || 0), 0)} actions
          </span>
        </div>
        <div className={styles.chart}>
          {last7.length === 0 && <span className={styles.count}>No data</span>}
          {last7.map((d) => (
            <div key={d._id} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 50px', gap: 8, alignItems: 'center', margin: '6px 0' }}>
              <span style={{ color: '#6c757d', fontSize: 12 }}>{d._id}</span>
              <div style={{ background: '#e9ecef', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, d.count * 10)}%`, height: '100%', background: 'linear-gradient(90deg,#b31217,#d32f2f)' }} />
              </div>
              <span className={styles.count}>{d.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
