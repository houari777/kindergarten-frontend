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
      const response = await fetch('https://kindergarten-backend-s82q.onrender.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (data.success) {
        // Store the token if it's in the response
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        // Redirect to home page
        window.location.href = '/';
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Network error. Please try again.');
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