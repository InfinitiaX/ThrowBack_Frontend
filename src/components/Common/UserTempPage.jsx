// src/components/Common/UserTempPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const UserTempPage = ({ title }) => {
  return (
    <div style={{ 
      padding: '40px 20px', 
      textAlign: 'center', 
      color: '#8b0000',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1 style={{ 
        fontSize: '2rem', 
        marginBottom: '20px',
        color: '#8b0000'
      }}>
        {title}
      </h1>
      
      <div style={{
        background: 'rgba(139, 0, 0, 0.05)',
        borderRadius: '12px',
        padding: '30px',
        marginBottom: '30px',
        border: '1px solid rgba(139, 0, 0, 0.1)'
      }}>
        <p style={{ 
          fontSize: '1.1rem', 
          marginBottom: '15px',
          lineHeight: '1.6'
        }}>
          This feature is currently under development. Stay tuned to discover this new experience soon!
        </p>
        
        <p style={{ 
          fontSize: '1.1rem',
          marginBottom: '25px',
          lineHeight: '1.6'
        }}>
          We are actively working to bring you an exceptional nostalgic music experience.
        </p>
        
        <div style={{
          width: '100px',
          height: '8px',
          background: 'rgba(139, 0, 0, 0.2)',
          margin: '0 auto 25px',
          borderRadius: '4px'
        }}></div>
        
        <p style={{ 
          fontWeight: 'bold',
          marginBottom: '10px'
        }}>
          In the meantime, check out these other available features:
        </p>
        
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '15px',
          marginTop: '20px'
        }}>
          <Link to="/dashboard/videos" style={{
            padding: '10px 20px',
            background: '#8b0000',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}>ThrowBack Videos</Link>
          
          <Link to="/dashboard/shorts" style={{
            padding: '10px 20px',
            background: '#8b0000',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}>ThrowBack Shorts</Link>
          
          <Link to="/dashboard/podcast" style={{
            padding: '10px 20px',
            background: '#8b0000',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}>Weekly Podcast</Link>
          
          <Link to="/dashboard/playlists" style={{
            padding: '10px 20px',
            background: '#8b0000',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}>Your Playlists</Link>
        </div>
      </div>
    </div>
  );
};

export default UserTempPage;