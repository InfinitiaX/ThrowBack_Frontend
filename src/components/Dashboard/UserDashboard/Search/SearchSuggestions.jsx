import React, { useEffect, useMemo } from 'react';
import styles from './SearchSuggestions.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVideo, faList, faUser } from '@fortawesome/free-solid-svg-icons';

const typeIcon = {
  video: faVideo,
  playlist: faList,
  artist: faUser,
};

function highlight(text, query) {
  if (!query) return text;
  const i = text.toLowerCase().indexOf(query.toLowerCase());
  if (i === -1) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark>{text.slice(i, i + query.length)}</mark>
      {text.slice(i + query.length)}
    </>
  );
}

const SearchSuggestions = ({
  visible,
  query,
  suggestions,
  activeIndex,
  onHover,
  onPick,
  emptyText = 'No suggestions',
}) => {
  const hasItems = useMemo(() => suggestions && suggestions.length > 0, [suggestions]);

  useEffect(() => {
    // Prevent body scroll when suggestions open on mobile
    document.body.style.overflow = visible ? 'hidden' : '';
    return () => (document.body.style.overflow = '');
  }, [visible]);

  if (!visible) return null;

  return (
    <div className={styles.dropdown} role="listbox" aria-label="Search suggestions">
      {hasItems ? (
        suggestions.map((s, idx) => (
          <button
            key={`${s.type}-${s.text}-${idx}`}
            className={`${styles.item} ${idx === activeIndex ? styles.active : ''}`}
            onMouseEnter={() => onHover(idx)}
            onMouseDown={(e) => {
              e.preventDefault(); // prevent input blur before click
              onPick(s);
            }}
            role="option"
            aria-selected={idx === activeIndex}
            title={s.text}
          >
            <span className={styles.iconWrap}>
              <FontAwesomeIcon icon={typeIcon[s.type] || faVideo} />
            </span>
            <span className={styles.text}>{highlight(s.text, query)}</span>
            <span className={styles.badge}>{s.type}</span>
          </button>
        ))
      ) : (
        <div className={styles.empty}>{emptyText}</div>
      )}
    </div>
  );
};

export default SearchSuggestions;
