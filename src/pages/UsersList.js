import React, { useEffect, useState } from 'react';
import api from '../utils/api';

function UsersList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchRole, setSearchRole] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'parent' });
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const token = localStorage.getItem('token');

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      let endpoint = '/users';
      const params = [];
      if (searchName) params.push(`name=${encodeURIComponent(searchName)}`);
      if (searchEmail) params.push(`email=${encodeURIComponent(searchEmail)}`);
      if (searchRole) params.push(`role=${encodeURIComponent(searchRole)}`);
      if (params.length) endpoint += '?' + params.join('&');
      const data = await api.get(endpoint, token);
      if (data.success) {
        setUsers(data.users);
      } else {
        setError(data.message || 'حدث خطأ');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setAddError('');
    setAddLoading(true);
    try {
      const data = await api.post('/auth/signup', newUser, token);
      if (data.success) {
        setShowAdd(false);
        setNewUser({ name: '', email: '', password: '', role: 'parent' });
        setSuccessMsg('تمت إضافة المستخدم بنجاح');
        fetchUsers();
      } else {
        setAddError(data.message || 'فشل الإضافة');
      }
    } catch (err) {
      setAddError('Network error');
    } finally {
      setAddLoading(false);
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditLoading(true);
    try {
      const data = await api.put(`/users/${editUser.id}`, editUser, token);
      if (data.success) {
        setShowEdit(false);
        setEditUser(null);
        setSuccessMsg('تم تعديل المستخدم بنجاح');
        fetchUsers();
      } else {
        setEditError(data.message || 'فشل التعديل');
      }
    } catch (err) {
      setEditError('Network error');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    setDeleteLoading(true);
    setSuccessMsg('');
    try {
      const data = await api.delete(`/users/${id}`, token);
      if (data.success) {
        setSuccessMsg('تم حذف المستخدم بنجاح');
        fetchUsers();
      }
    } catch (err) {}
    setDeleteId(null);
    setDeleteLoading(false);
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 24 }}>
      <h2>إدارة المستخدمين</h2>
      {successMsg && <div style={{ color: 'green', marginBottom: 12 }}>{successMsg}</div>}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <input placeholder="بحث بالاسم" value={searchName} onChange={e => setSearchName(e.target.value)} />
        <input placeholder="بحث بالبريد الإلكتروني" value={searchEmail} onChange={e => setSearchEmail(e.target.value)} />
        <select value={searchRole} onChange={e => setSearchRole(e.target.value)}>
          <option value="">كل الأدوار</option>
          <option value="parent">ولي أمر</option>
          <option value="teacher">معلم</option>
          <option value="admin">إدارة</option>
        </select>
        <button type="submit">بحث</button>
        <button type="button" onClick={() => { setSearchName(''); setSearchEmail(''); setSearchRole(''); fetchUsers(); }}>إعادة تعيين</button>
        <button type="button" style={{ marginLeft: 'auto' }} onClick={() => setShowAdd(true)}>+ إضافة مستخدم</button>
      </form>
      {showAdd && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 8, minWidth: 350, position: 'relative' }}>
            <button onClick={() => setShowAdd(false)} style={{ position: 'absolute', top: 8, right: 8 }}>X</button>
            <h3>إضافة مستخدم جديد</h3>
            <form onSubmit={handleAddUser}>
              <div>
                <label>الاسم:</label>
                <input value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} required style={{ width: '100%' }} />
              </div>
              <div>
                <label>البريد الإلكتروني:</label>
                <input type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} required style={{ width: '100%' }} />
              </div>
              <div>
                <label>كلمة المرور:</label>
                <input type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} required style={{ width: '100%' }} />
              </div>
              <div>
                <label>الدور:</label>
                <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} style={{ width: '100%' }}>
                  <option value="parent">ولي أمر</option>
                  <option value="teacher">معلم</option>
                  <option value="admin">إدارة</option>
                </select>
              </div>
              {addError && <div style={{ color: 'red', margin: '8px 0' }}>{addError}</div>}
              <button type="submit" disabled={addLoading} style={{ width: '100%', marginTop: 12 }}>إضافة</button>
            </form>
          </div>
        </div>
      )}
      {showEdit && editUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 8, minWidth: 350, position: 'relative' }}>
            <button onClick={() => setShowEdit(false)} style={{ position: 'absolute', top: 8, right: 8 }}>X</button>
            <h3>تعديل بيانات المستخدم</h3>
            <form onSubmit={handleEditUser}>
              <div>
                <label>الاسم:</label>
                <input value={editUser.name} onChange={e => setEditUser({ ...editUser, name: e.target.value })} required style={{ width: '100%' }} />
              </div>
              <div>
                <label>الدور:</label>
                <select value={editUser.role} onChange={e => setEditUser({ ...editUser, role: e.target.value })} style={{ width: '100%' }}>
                  <option value="parent">ولي أمر</option>
                  <option value="teacher">معلم</option>
                  <option value="admin">إدارة</option>
                </select>
              </div>
              {editError && <div style={{ color: 'red', margin: '8px 0' }}>{editError}</div>}
              <button type="submit" disabled={editLoading} style={{ width: '100%', marginTop: 12 }}>حفظ التعديلات</button>
            </form>
          </div>
        </div>
      )}
      {deleteId && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 8, minWidth: 350, position: 'relative' }}>
            <h3>تأكيد حذف المستخدم</h3>
            <p>هل أنت متأكد أنك تريد حذف هذا المستخدم؟</p>
            <button onClick={() => handleDeleteUser(deleteId)} disabled={deleteLoading} style={{ color: 'red', marginRight: 8 }}>تأكيد الحذف</button>
            <button onClick={() => setDeleteId(null)} disabled={deleteLoading}>إلغاء</button>
          </div>
        </div>
      )}
      {loading ? <div>جاري التحميل...</div> : error ? <div style={{ color: 'red' }}>{error}</div> : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th>الاسم</th>
              <th>البريد الإلكتروني</th>
              <th>الدور</th>
              <th>تاريخ الإنشاء</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.createdAt ? new Date(user.createdAt._seconds * 1000).toLocaleDateString() : '-'}</td>
                <td>
                  <button onClick={() => { setEditUser({ ...user }); setShowEdit(true); }}>تعديل</button>
                  <button style={{ color: 'red', marginRight: 8 }} onClick={() => setDeleteId(user.id)}>حذف</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default UsersList; 