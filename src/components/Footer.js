import React from 'react';

function Footer() {
  return (
    <footer style={{
      background: '#1976d2',
      color: '#fff',
      textAlign: 'center',
      padding: '18px 0 12px 0',
      fontSize: 16,
      borderRadius: '16px 16px 0 0',
      marginTop: 40,
      letterSpacing: 1,
    }}>
      جميع الحقوق محفوظة &copy; DJEBBOURI HOUARI {new Date().getFullYear()}
    </footer>
  );
}

export default Footer; 