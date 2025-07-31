import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from 'firebase/config';
import { message } from 'antd';

function UsersList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'parent' });
  const [editUser, setEditUser] = useState(null);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchRole, setSearchRole] = useState('');

  // Fetch users from Firestore
  useEffect(() => {
    console.log('Setting up users listener...');
    setLoading(true);
    
    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        console.log('Users snapshot received, docs count:', snapshot.docs.length);
        const usersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('Users data:', usersData);
        setUsers(usersData);
        setLoading(false);
        setError('');
      },
      (error) => {
        console.error('Error in users listener:', error);
        setError('Failed to load users: ' + error.message);
        setLoading(false);
      }
    );

    return () => {
      console.log('Cleaning up users listener');
      unsubscribe();
    };
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    setAddError('');
    setAddLoading(true);
    
    try {
      console.log('Adding new user:', newUser);
      await addDoc(collection(db, 'users'), {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      message.success('User added successfully');
      setNewUser({ name: '', email: '', password: '', role: 'parent' });
      setShowAdd(false);
    } catch (error) {
      console.error('Error adding user:', error);
      setAddError('Failed to add user: ' + error.message);
    } finally {
      setAddLoading(false);
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditLoading(true);
    
    try {
      console.log('Updating user:', editUser);
      await updateDoc(doc(db, 'users', editUser.id), {
        name: editUser.name,
        email: editUser.email,
        role: editUser.role,
        updatedAt: new Date()
      });
      
      message.success('User updated successfully');
      setShowEdit(false);
      setEditUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
      setEditError('Failed to update user: ' + error.message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    setDeleteLoading(true);
    
    try {
      console.log('Deleting user:', userId);
      await deleteDoc(doc(db, 'users', userId));
      message.success('User deleted successfully');
      setDeleteId(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      message.error('Failed to delete user: ' + error.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const filteredUsers = users.filter(user => 
      (searchName === '' || user.name.includes(searchName)) && 
      (searchEmail === '' || user.email.includes(searchEmail)) && 
      (searchRole === '' || user.role === searchRole)
    );
    setUsers(filteredUsers);
  };

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 24 }}>
      <h2>إدارة المستخدمين</h2>
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
        <button type="button" onClick={() => { setSearchName(''); setSearchEmail(''); setSearchRole(''); setUsers(users); }}>إعادة تعيين</button>
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
            {users && users.length > 0 ? users.map(user => (
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
            )) : <tr><td colSpan={5}>لا يوجد بيانات</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default UsersList;