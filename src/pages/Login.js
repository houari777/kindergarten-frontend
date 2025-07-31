import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from 'firebase/config';
import { useAuth } from 'contexts/AuthContext';

function Login() {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const from = location.state?.from?.pathname || '/';

  // Redirect if user is already logged in
  useEffect(() => {
    if (currentUser) {
      navigate(from, { replace: true });
    }
  }, [currentUser, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      console.log('Attempting to sign in with:', { 
        email: email,
        timestamp: new Date().toISOString() 
      });
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful, user:', {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        emailVerified: userCredential.user.emailVerified
      });
      
      // The onAuthStateChanged in AuthContext will handle the redirect
    } catch (err) {
      console.error('Login error:', {
        code: err.code,
        message: err.message,
        email: email,
        timestamp: new Date().toISOString()
      });
      
      let errorMessage = 'Failed to log in. ';
      
      switch (err.code) {
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password. Please check your credentials.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password. Please try again.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed login attempts. Please try again later or reset your password.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled. Please contact support.';
          break;
        default:
          errorMessage += `Error: ${err.message}`;
      }
      
      setError(errorMessage);
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