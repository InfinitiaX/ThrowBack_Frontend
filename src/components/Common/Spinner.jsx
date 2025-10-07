import React from 'react';
import styles from './Spinner.module.css';

const Spinner = ({ size = 'medium', color = 'primary' }) => {
  const sizeClass = 
    size === 'small' ? styles.small :
    size === 'large' ? styles.large :
    styles.medium;
    
  const colorClass = 
    color === 'secondary' ? styles.secondary :
    color === 'light' ? styles.light :
    styles.primary;
    
  return (
    <div className={`${styles.spinnerContainer} ${sizeClass} ${colorClass}`}>
      <div className={styles.spinner}></div>
    </div>
  );
};

export default Spinner;