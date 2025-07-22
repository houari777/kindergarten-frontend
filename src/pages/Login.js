import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';

function Login() {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await api.post('/auth/login', { email, password }, null);
      if (data.success) {
        localStorage.setItem('token', data.token);
        window.location.href = '/'; // Redirect to home page
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '100px auto', padding: 24, border: '1px solid #eee', borderRadius: 8, direction: i18n.language === 'ar' ? 'rtl' : 'ltr' }}>
      <h2>{t('Login')}</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>{t('Email')}</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', marginBottom: 12 }} />
        </div>
        <div>
          <label>{t('Password')}</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', marginBottom: 12 }} />
        </div>
        {error && <div style={{ color: 'red', marginBottom: 12 }}>{t(error)}</div>}
        <button type="submit" style={{ width: '100%' }}>{t('Login')}</button>
      </form>
    </div>
  );
}

export default Login; 