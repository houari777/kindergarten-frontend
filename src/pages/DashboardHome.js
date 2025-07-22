import React, { useEffect, useState } from 'react';

function DashboardHome() {
  const [stats, setStats] = useState({ children: 0, parents: 0, staff: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    async function fetchStats() {
      setLoading(true);
      setError('');
      try {
        const [childrenRes, parentsRes, staffRes] = await Promise.all([
          fetch('http://localhost:5001/api/children', { headers: { Authorization: 'Bearer ' + token } }),
          fetch('http://localhost:5001/api/users?role=parent', { headers: { Authorization: 'Bearer ' + token } }),
          fetch('http://localhost:5001/api/users?role=teacher', { headers: { Authorization: 'Bearer ' + token } })
        ]);
        const childrenData = await childrenRes.json();
        const parentsData = await parentsRes.json();
        const staffData = await staffRes.json();
        setStats({
          children: childrenData.children?.length || 0,
          parents: parentsData.users?.length || 0,
          staff: staffData.users?.length || 0
        });
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) return <div style={{ margin: 40 }}>جاري التحميل...</div>;
  if (error) return <div style={{ color: 'red', margin: 40 }}>{error}</div>;

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: 24 }}>
      <h2>لوحة التحكم الرئيسية</h2>
      <div style={{ display: 'flex', gap: 24, marginTop: 32 }}>
        <div style={{ flex: 1, background: '#f5f5f5', padding: 24, borderRadius: 8 }}>
          <h3>عدد الأطفال</h3>
          <div style={{ fontSize: 32, fontWeight: 'bold' }}>{stats.children}</div>
        </div>
        <div style={{ flex: 1, background: '#f5f5f5', padding: 24, borderRadius: 8 }}>
          <h3>عدد أولياء الأمور</h3>
          <div style={{ fontSize: 32, fontWeight: 'bold' }}>{stats.parents}</div>
        </div>
        <div style={{ flex: 1, background: '#f5f5f5', padding: 24, borderRadius: 8 }}>
          <h3>عدد الموظفين</h3>
          <div style={{ fontSize: 32, fontWeight: 'bold' }}>{stats.staff}</div>
        </div>
      </div>
    </div>
  );
}

export default DashboardHome; 