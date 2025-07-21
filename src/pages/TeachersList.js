import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

function TeachersList() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newTeacher, setNewTeacher] = useState({ name: '', email: '', password: '', phone: '' });
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editTeacher, setEditTeacher] = useState(null);
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const fetchTeachers = async () => {
    setLoading(true);
    setError('');
    let isMounted = true;
    
    try {
      const data = await api.get('/users?role=teacher', token);
      if (!isMounted) return;
      
      if (data && data.success) {
        setTeachers(data.users || []);
      } else {
        setError(data?.message || 'حدث خطأ في تحميل بيانات المعلمين');
      }
    } catch (err) {
      if (isMounted) {
        setError('حدث خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى لاحقاً');
        console.error('Error fetching teachers:', err);
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
    
    return () => { isMounted = false; };
  };

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    setAddError('');
    setAddLoading(true);
    try {
      const data = await api.post('/auth/signup', { ...newTeacher, role: 'teacher', confirmPassword: newTeacher.password, fromTeachersPage: true }, token);
      if (data.success) {
        setShowAdd(false);
        setNewTeacher({ name: '', email: '', password: '', phone: '' });
        setSuccessMsg('تمت إضافة المعلم بنجاح');
        await fetchTeachers();
      } else {
        setAddError(data.message || 'فشل الإضافة');
      }
    } catch (err) {
      setAddError('Network error');
    } finally {
      setAddLoading(false);
    }
  };

  const handleEditTeacher = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditLoading(true);
    try {
      const data = await api.put(`/users/${editTeacher.id || editTeacher._id}`, { ...editTeacher, role: 'teacher' }, token);
      if (data.success) {
        setShowEdit(false);
        setEditTeacher(null);
        setSuccessMsg('تم تعديل بيانات المعلم بنجاح');
        await fetchTeachers();
      } else {
        setEditError(data.message || 'فشل التعديل');
      }
    } catch (err) {
      setEditError('Network error');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteTeacher = async (id) => {
    if (!id) {
      setDeleteId(null);
      return;
    }
    
    setDeleteLoading(true);
    setSuccessMsg('');
    
    try {
      const data = await api.delete(`/users/${id}`, token);
      if (data && data.success) {
        setSuccessMsg('تم حذف المعلم بنجاح');
        await fetchTeachers();
      } else {
        setError(data?.message || 'حدث خطأ أثناء حذف المعلم');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال بالخادم');
      console.error('Error deleting teacher:', err);
    } finally {
      setDeleteId(null);
      setDeleteLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    
    const loadData = async () => {
      await fetchTeachers();
    };
    
    loadData();
    
    // Clear success message after 5 seconds
    const timer = successMsg ? setTimeout(() => setSuccessMsg(''), 5000) : null;
    
    return () => {
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line
  }, [token, successMsg]);

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 24 }}>
      <h2>إدارة المعلمين</h2>
      {successMsg && <div style={{ color: 'green', marginBottom: 12 }}>{successMsg}</div>}
      <button onClick={() => setShowAdd(true)} style={{ marginBottom: 16 }}>+ إضافة معلم</button>
      {showAdd && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 8, minWidth: 350, position: 'relative' }}>
            <button onClick={() => setShowAdd(false)} style={{ position: 'absolute', top: 8, right: 8 }}>X</button>
            <h3>إضافة معلم جديد</h3>
            <form onSubmit={handleAddTeacher}>
              <div>
                <label>الاسم:</label>
                <input value={newTeacher.name} onChange={e => setNewTeacher({ ...newTeacher, name: e.target.value })} required style={{ width: '100%' }} />
              </div>
              <div>
                <label>البريد الإلكتروني:</label>
                <input type="email" value={newTeacher.email} onChange={e => setNewTeacher({ ...newTeacher, email: e.target.value })} required style={{ width: '100%' }} />
              </div>
              <div>
                <label>الهاتف:</label>
                <input value={newTeacher.phone} onChange={e => setNewTeacher({ ...newTeacher, phone: e.target.value })} style={{ width: '100%' }} />
              </div>
              <div>
                <label>كلمة المرور:</label>
                <input type="password" value={newTeacher.password} onChange={e => setNewTeacher({ ...newTeacher, password: e.target.value })} required style={{ width: '100%' }} />
              </div>
              {addError && <div style={{ color: 'red', margin: '8px 0' }}>{addError}</div>}
              <button type="submit" disabled={addLoading} style={{ width: '100%', marginTop: 12 }}>إضافة</button>
            </form>
          </div>
        </div>
      )}
      {showEdit && editTeacher && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 8, minWidth: 350, position: 'relative' }}>
            <button onClick={() => setShowEdit(false)} style={{ position: 'absolute', top: 8, right: 8 }}>X</button>
            <h3>تعديل بيانات المعلم</h3>
            <form onSubmit={handleEditTeacher}>
              <div>
                <label>الاسم:</label>
                <input value={editTeacher.name} onChange={e => setEditTeacher({ ...editTeacher, name: e.target.value })} required style={{ width: '100%' }} />
              </div>
              <div>
                <label>البريد الإلكتروني:</label>
                <input type="email" value={editTeacher.email} onChange={e => setEditTeacher({ ...editTeacher, email: e.target.value })} required style={{ width: '100%' }} />
              </div>
              <div>
                <label>الهاتف:</label>
                <input value={editTeacher.phone} onChange={e => setEditTeacher({ ...editTeacher, phone: e.target.value })} style={{ width: '100%' }} />
              </div>
              {editError && <div style={{ color: 'red', margin: '8px 0' }}>{editError}</div>}
              <button type="submit" disabled={editLoading} style={{ width: '100%', marginTop: 12 }}>حفظ التعديلات</button>
            </form>
          </div>
        </div>
      )}
      {deleteId && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', minWidth: '350px', maxWidth: '90%', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
            <h3 style={{ marginTop: 0, color: '#d32f2f' }}>تأكيد حذف المعلم</h3>
            <p style={{ marginBottom: '24px' }}>هل أنت متأكد أنك تريد حذف هذا المعلم؟ لا يمكن التراجع عن هذا الإجراء.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setDeleteId(null)} 
                disabled={deleteLoading}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ddd',
                  background: '#fff',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  opacity: deleteLoading ? 0.6 : 1
                }}
              >
                إلغاء
              </button>
              <button 
                onClick={() => handleDeleteTeacher(deleteId)} 
                disabled={deleteLoading}
                style={{
                  padding: '8px 16px',
                  background: '#d32f2f',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  opacity: deleteLoading ? 0.6 : 1
                }}
              >
                {deleteLoading ? 'جاري الحذف...' : 'تأكيد الحذف'}
              </button>
            </div>
          </div>
        </div>
      )}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>جاري تحميل بيانات المعلمين...</div>
      ) : error ? (
        <div style={{ color: 'red', padding: '10px', backgroundColor: '#ffebee', borderRadius: '4px', margin: '10px 0' }}>
          {error}
          <button onClick={fetchTeachers} style={{ marginRight: '10px', cursor: 'pointer' }}>إعادة المحاولة</button>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th>الاسم</th>
              <th>البريد الإلكتروني</th>
              <th>الهاتف</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map(teacher => (
              <tr key={teacher.id || teacher._id}>
                <td>{teacher.name}</td>
                <td>{teacher.email}</td>
                <td>{teacher.phone}</td>
                <td>
                  <button onClick={() => { setEditTeacher(teacher); setShowEdit(true); }} style={{ marginRight: 8 }}>تعديل</button>
                  <button onClick={() => setDeleteId(teacher.id || teacher._id)} style={{ color: 'red' }}>حذف</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default TeachersList; 