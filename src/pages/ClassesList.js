import React, { useEffect, useState } from 'react';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Button } from 'antd';

function ClassesList() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newClass, setNewClass] = useState({ name: '', description: '' });
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const [editClass, setEditClass] = useState(null);
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [allChildren, setAllChildren] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);

  const token = localStorage.getItem('token');

  const fetchClasses = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/classes', { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      if (data.success) {
        setClasses(data.classes);
      } else {
        setError(data.message || 'حدث خطأ');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClass = async (e) => {
    e.preventDefault();
    setAddError('');
    setAddLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify(newClass)
      });
      const data = await res.json();
      if (data.success) {
        setShowAdd(false);
        setNewClass({ name: '', description: '' });
        setSuccessMsg('تمت إضافة الفصل بنجاح');
        fetchClasses();
      } else {
        setAddError(data.message || 'فشل الإضافة');
      }
    } catch (err) {
      setAddError('Network error');
    } finally {
      setAddLoading(false);
    }
  };

  const handleEditClass = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/classes/${editClass.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({
          name: editClass.name,
          description: editClass.description,
          childrenIds: editClass.childrenIds || [],
          teacherIds: editClass.teacherIds || []
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowEdit(false);
        setEditClass(null);
        setSuccessMsg('تم تعديل الفصل بنجاح');
        fetchClasses();
      } else {
        setEditError(data.message || 'فشل التعديل');
      }
    } catch (err) {
      setEditError('Network error');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteClass = async (id) => {
    setDeleteLoading(true);
    setSuccessMsg('');
    try {
      const res = await fetch(`http://localhost:5000/api/classes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + token }
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('تم حذف الفصل بنجاح');
        fetchClasses();
      }
    } catch (err) {}
    setDeleteId(null);
    setDeleteLoading(false);
  };

  useEffect(() => {
    fetchClasses();
    // eslint-disable-next-line
  }, []);

  // جلب جميع الأطفال والمعلمين عند تحميل الصفحة (لعرض الأسماء في الجدول)
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [childrenRes, teachersRes] = await Promise.all([
          fetch('http://localhost:5000/api/children', { headers: { Authorization: 'Bearer ' + token } }),
          fetch('http://localhost:5000/api/users?role=teacher', { headers: { Authorization: 'Bearer ' + token } })
        ]);
        const childrenData = await childrenRes.json();
        const teachersData = await teachersRes.json();
        setAllChildren(childrenData.children || []);
        setAllTeachers(teachersData.users || []);
      } catch (err) {
        setAllChildren([]);
        setAllTeachers([]);
      }
    };
    fetchOptions();
  }, [token]);

  return (
    <div style={{ maxWidth: '100%', margin: '40px auto', padding: 24, fontFamily: 'Tajawal, Arial, sans-serif' }}>
      <h2 style={{ marginBottom: 24, fontWeight: 700, fontSize: 28, color: '#1976d2', textAlign: 'right', fontFamily: 'Tajawal, Arial, sans-serif' }}>إدارة الفصول</h2>
      {successMsg && <div style={{ color: 'green', marginBottom: 12 }}>{successMsg}</div>}
      <button style={{ marginBottom: 16 }} onClick={() => setShowAdd(true)}>+ إضافة فصل</button>
      {showAdd && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 8, minWidth: 350, position: 'relative' }}>
            <button onClick={() => setShowAdd(false)} style={{ position: 'absolute', top: 8, right: 8 }}>X</button>
            <h3>إضافة فصل جديد</h3>
            <form onSubmit={handleAddClass}>
              <div>
                <label>اسم الفصل:</label>
                <input value={newClass.name} onChange={e => setNewClass({ ...newClass, name: e.target.value })} required style={{ width: '100%' }} />
              </div>
              <div>
                <label>الوصف:</label>
                <input value={newClass.description} onChange={e => setNewClass({ ...newClass, description: e.target.value })} style={{ width: '100%' }} />
              </div>
              {addError && <div style={{ color: 'red', margin: '8px 0' }}>{addError}</div>}
              <button type="submit" disabled={addLoading} style={{ width: '100%', marginTop: 12 }}>إضافة</button>
            </form>
          </div>
        </div>
      )}
      {showEdit && editClass && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 8, minWidth: 350, position: 'relative' }}>
            <button onClick={() => setShowEdit(false)} style={{ position: 'absolute', top: 8, right: 8 }}>X</button>
            <h3>تعديل بيانات الفصل</h3>
            <form onSubmit={handleEditClass}>
              <div>
                <label>اسم الفصل:</label>
                <input value={editClass.name} onChange={e => setEditClass({ ...editClass, name: e.target.value })} required style={{ width: '100%' }} />
              </div>
              <div>
                <label>الوصف:</label>
                <input value={editClass.description} onChange={e => setEditClass({ ...editClass, description: e.target.value })} style={{ width: '100%' }} />
              </div>
              <div>
                <label>الأطفال في الفصل:</label>
                <select multiple value={editClass.childrenIds || []} onChange={e => setEditClass({ ...editClass, childrenIds: Array.from(e.target.selectedOptions, o => o.value) })} style={{ width: '100%', minHeight: 60 }}>
                  {allChildren.map(child => (
                    <option key={child.id} value={child.id}>{child.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>المعلمون في الفصل:</label>
                <select multiple value={editClass.teacherIds || []} onChange={e => setEditClass({ ...editClass, teacherIds: Array.from(e.target.selectedOptions, o => o.value) })} style={{ width: '100%', minHeight: 60 }}>
                  {allTeachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                  ))}
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
            <h3>تأكيد حذف الفصل</h3>
            <p>هل أنت متأكد أنك تريد حذف هذا الفصل؟</p>
            <button onClick={() => handleDeleteClass(deleteId)} disabled={deleteLoading} style={{ color: 'red', marginRight: 8 }}>تأكيد الحذف</button>
            <button onClick={() => setDeleteId(null)} disabled={deleteLoading}>إلغاء</button>
          </div>
        </div>
      )}
      {loading ? <div>جاري التحميل...</div> : error ? <div style={{ color: 'red' }}>{error}</div> : (
        <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(25, 118, 210, 0.07)', padding: 0, marginTop: 16 }}>
          <table style={{ minWidth: 1000, width: '100%', borderCollapse: 'collapse', fontSize: 16, fontFamily: 'Tajawal, Arial, sans-serif' }}>
            <thead>
              <tr style={{ background: '#f5f5f5', fontWeight: 700, fontSize: 17 }}>
                <th style={{ padding: '12px 8px', textAlign: 'center' }}>اسم الفصل</th>
                <th style={{ padding: '12px 8px', textAlign: 'center' }}>الوصف</th>
                <th style={{ padding: '12px 8px', textAlign: 'center' }}>الأطفال</th>
                <th style={{ padding: '12px 8px', textAlign: 'center' }}>المعلمون</th>
                <th style={{ padding: '12px 8px', textAlign: 'center' }}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {classes.map(cls => (
                <tr key={cls.id} style={{ borderBottom: '1px solid #e3eaf2' }} className="custom-table-row">
                  <td style={{ textAlign: 'center', padding: 8 }}>{cls.name}</td>
                  <td style={{ textAlign: 'center', padding: 8 }}>{cls.description || '-'}</td>
                  <td style={{ textAlign: 'center', padding: 8 }}>{cls.childrenIds && cls.childrenIds.length > 0 ? cls.childrenIds.map(cid => {
                    const child = allChildren.find(c => c.id === cid);
                    return child ? child.name : cid;
                  }).join(', ') : '-'}</td>
                  <td style={{ textAlign: 'center', padding: 8 }}>{cls.teacherIds && cls.teacherIds.length > 0 ? cls.teacherIds.map(tid => {
                    const teacher = allTeachers.find(t => t.id === tid);
                    return teacher ? teacher.name : tid;
                  }).join(', ') : '-'}</td>
                  <td style={{ textAlign: 'center', padding: 8 }}>
                    <Button type="link" icon={<EditOutlined />} style={{ color: '#1976d2', fontWeight: 600 }} onClick={() => { setEditClass({ ...cls }); setShowEdit(true); }}>تعديل</Button>
                    <Button type="link" icon={<DeleteOutlined />} danger style={{ fontWeight: 600 }} onClick={() => setDeleteId(cls.id)}>حذف</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* إضافة CSS مخصص للـ Hover */}
      <style>{`
.custom-table-row:hover {
  background: #e3f2fd !important;
  transition: background 0.2s;
}
`}</style>
    </div>
  );
}

export default ClassesList; 