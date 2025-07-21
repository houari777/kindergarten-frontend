import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n, t } = useTranslation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // تغيير اللغة
  const handleLanguageChange = (e) => {
    i18n.changeLanguage(e.target.value);
    // تغيير اتجاه الصفحة حسب اللغة
    if (e.target.value === 'ar') {
      document.body.dir = 'rtl';
    } else {
      document.body.dir = 'ltr';
    }
  };

  // ضبط الاتجاه عند التحميل الأول
  React.useEffect(() => {
    document.body.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  // إخفاء الشريط في صفحة تسجيل الدخول
  if (location.pathname === '/login') return null;

  return (
    <nav style={{ background: '#1976d2', color: '#fff', padding: '0 32px', display: 'flex', alignItems: 'center', gap: 32, minHeight: 64, boxShadow: '0 2px 8px rgba(25,118,210,0.10)' }}>
      <div style={{ fontWeight: 'bold', fontSize: 24, letterSpacing: 1, marginRight: 16 }}>
        {t('روضتي | نظام الإدارة', 'روضتي | نظام الإدارة')}
      </div>
      <Link to="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 'bold', fontSize: 18 }}>{t('Dashboard')}</Link>
      <Link to="/children" style={{ color: '#fff', textDecoration: 'none', fontSize: 16 }}>{t('Children Management')}</Link>
      <Link to="/users" style={{ color: '#fff', textDecoration: 'none', fontSize: 16 }}>{t('Users Management')}</Link>
      <Link to="/teachers" style={{ color: '#fff', textDecoration: 'none', fontSize: 16 }}>{t('Teachers', 'إدارة المعلمين')}</Link>
      <Link to="/classes" style={{ color: '#fff', textDecoration: 'none', fontSize: 16 }}>{t('Class', 'إدارة الفصول')}</Link>
      <Link to="/bills" style={{ color: '#fff', textDecoration: 'none', fontSize: 16 }}>{t('Bills')}</Link>
      <Link to="/notifications" style={{ color: '#fff', textDecoration: 'none', fontSize: 16 }}>{t('Notifications')}</Link>
      <select onChange={handleLanguageChange} value={i18n.language} style={{ marginLeft: 16, padding: '4px 12px', borderRadius: 6, border: 'none', fontWeight: 'bold', fontSize: 15, background: '#fff', color: '#1976d2', cursor: 'pointer' }}>
        <option value="ar">العربية</option>
        <option value="fr">Français</option>
      </select>
      <button onClick={handleLogout} style={{ marginLeft: 'auto', background: '#fff', color: '#1976d2', border: 'none', borderRadius: 6, padding: '8px 20px', cursor: 'pointer', fontWeight: 'bold', fontSize: 16 }}>{t('Logout')}</button>
    </nav>
  );
}

export default Navbar; 