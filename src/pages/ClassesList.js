import React, { useEffect, useState } from 'react';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Button, Modal, Spin, Select, message } from 'antd';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

function ClassesList() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newClass, setNewClass] = useState({ name: '', description: '' });
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editClass, setEditClass] = useState(null);
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [allChildren, setAllChildren] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedChildren, setSelectedChildren] = useState([]);
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [showClassDetails, setShowClassDetails] = useState(false);
  const [classDetails, setClassDetails] = useState(null);

  // Fetch classes from Firestore
  useEffect(() => {
    console.log('Setting up classes listener...');
    setLoading(true);
    
    const unsubscribe = onSnapshot(
      collection(db, 'classes'),
      (snapshot) => {
        console.log('Classes snapshot received, docs count:', snapshot.docs.length);
        const classesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('Classes data:', classesData);
        setClasses(classesData);
        setLoading(false);
        setError('');
      },
      (error) => {
        console.error('Error in classes listener:', error);
        setError('Failed to load classes: ' + error.message);
        setLoading(false);
      }
    );

    return () => {
      console.log('Cleaning up classes listener');
      unsubscribe();
    };
  }, []);

  // Fetch children and teachers for member management
  useEffect(() => {
    console.log('Setting up children and teachers listeners...');
    
    // Listen to children
    const childrenUnsubscribe = onSnapshot(
      collection(db, 'enfants'),
      (snapshot) => {
        const childrenData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('Children data for classes:', childrenData);
        setAllChildren(childrenData);
      },
      (error) => {
        console.error('Error fetching children:', error);
      }
    );

    // Listen to teachers
    const teachersQuery = query(collection(db, 'users'), where('role', '==', 'teacher'));
    const teachersUnsubscribe = onSnapshot(
      teachersQuery,
      (snapshot) => {
        const teachersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('Teachers data for classes:', teachersData);
        setAllTeachers(teachersData);
      },
      (error) => {
        console.error('Error fetching teachers:', error);
      }
    );

    return () => {
      childrenUnsubscribe();
      teachersUnsubscribe();
    };
  }, []);

  const handleAddClass = async (e) => {
    e.preventDefault();
    setAddError('');
    setAddLoading(true);
    
    try {
      console.log('Adding new class:', newClass);
      await addDoc(collection(db, 'classes'), {
        name: newClass.name,
        description: newClass.description,
        childrenIds: [],
        teacherIds: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      message.success('Class added successfully');
      setNewClass({ name: '', description: '' });
      setShowAdd(false);
    } catch (error) {
      console.error('Error adding class:', error);
      setAddError('Failed to add class: ' + error.message);
    } finally {
      setAddLoading(false);
    }
  };

  const handleEditClass = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditLoading(true);
    
    try {
      console.log('Updating class:', editClass);
      await updateDoc(doc(db, 'classes', editClass.id), {
        name: editClass.name,
        description: editClass.description,
        childrenIds: editClass.childrenIds || [],
        teacherIds: editClass.teacherIds || [],
        updatedAt: new Date()
      });
      
      message.success('Class updated successfully');
      setShowEdit(false);
      setEditClass(null);
    } catch (error) {
      console.error('Error updating class:', error);
      setEditError('Failed to update class: ' + error.message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteClass = async (classId) => {
    if (!classId) {
      setDeleteId(null);
      return;
    }
    
    setDeleteLoading(true);
    
    try {
      console.log('Deleting class:', classId);
      await deleteDoc(doc(db, 'classes', classId));
      message.success('Class deleted successfully');
      setDeleteId(null);
    } catch (error) {
      console.error('Error deleting class:', error);
      message.error('Failed to delete class: ' + error.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const openMembersModal = (cls) => {
    setSelectedClass(cls);
    setSelectedChildren(cls.childrenIds || []);
    setSelectedTeachers(cls.teacherIds || []);
    setShowMembersModal(true);
  };

  const handleSaveMembers = async () => {
    setMembersLoading(true);
    
    try {
      console.log('Updating class members:', { selectedChildren, selectedTeachers });
      await updateDoc(doc(db, 'classes', selectedClass.id), {
        childrenIds: selectedChildren,
        teacherIds: selectedTeachers,
        updatedAt: new Date()
      });
      
      message.success('Class members updated successfully');
      setShowMembersModal(false);
    } catch (error) {
      console.error('Error updating class members:', error);
      message.error('Failed to update class members: ' + error.message);
    } finally {
      setMembersLoading(false);
    }
  };

  const openClassDetails = (cls) => {
    setClassDetails(cls);
    setShowClassDetails(true);
  };

  return (
    <div style={{ maxWidth: '100%', margin: '40px auto', padding: 24, fontFamily: 'Tajawal, Arial, sans-serif' }}>
      <h2 style={{ marginBottom: 24, fontWeight: 700, fontSize: 28, color: '#1976d2', textAlign: 'right', fontFamily: 'Tajawal, Arial, sans-serif' }}>إدارة الفصول</h2>
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
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
                <textarea value={newClass.description} onChange={e => setNewClass({ ...newClass, description: e.target.value })} style={{ width: '100%' }} />
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
            <h3>تعديل الفصل</h3>
            <form onSubmit={handleEditClass}>
              <div>
                <label>اسم الفصل:</label>
                <input value={editClass.name} onChange={e => setEditClass({ ...editClass, name: e.target.value })} required style={{ width: '100%' }} />
              </div>
              <div>
                <label>الوصف:</label>
                <textarea value={editClass.description} onChange={e => setEditClass({ ...editClass, description: e.target.value })} style={{ width: '100%' }} />
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
            <h3 style={{ marginTop: 0, color: '#d32f2f' }}>تأكيد حذف الفصل</h3>
            <p style={{ marginBottom: '24px' }}>هل أنت متأكد أنك تريد حذف هذا الفصل؟ لا يمكن التراجع عن هذا الإجراء.</p>
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
                onClick={() => handleDeleteClass(deleteId)} 
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
      {loading ? <div>جاري التحميل...</div> : (
        <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(25, 118, 210, 0.07)', padding: 0, marginTop: 16 }}>
          <table style={{ minWidth: 1000, width: '100%', borderCollapse: 'collapse', fontSize: 16, fontFamily: 'Tajawal, Arial, sans-serif' }}>
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', color: '#fff' }}>
                <th style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 600, fontSize: 16, borderBottom: 'none' }}>اسم الفصل</th>
                <th style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 600, fontSize: 16, borderBottom: 'none' }}>الوصف</th>
                <th style={{ padding: '16px 20px', textAlign: 'center', fontWeight: 600, fontSize: 16, borderBottom: 'none' }}>عدد الأطفال</th>
                <th style={{ padding: '16px 20px', textAlign: 'center', fontWeight: 600, fontSize: 16, borderBottom: 'none' }}>المعلم</th>
                <th style={{ padding: '16px 20px', textAlign: 'center', fontWeight: 600, fontSize: 16, borderBottom: 'none' }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((cls) => (
                <tr key={cls.id} style={{ borderBottom: '1px solid #f0f0f0', transition: 'background-color 0.2s' }}>
                  <td style={{ padding: '16px 20px', fontWeight: 500, color: '#333' }}>{cls.name}</td>
                  <td style={{ padding: '16px 20px', color: '#666', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cls.description}</td>
                  <td style={{ padding: '16px 20px', textAlign: 'center', fontWeight: 500, color: '#1976d2' }}>
                    {Array.isArray(cls.childrenIds) ? cls.childrenIds.length : 0}
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'center', color: '#666' }}>
                    {Array.isArray(cls.teacherIds) && cls.teacherIds.length > 0 ? (() => {
                      const teacher = allTeachers.find(t => t.id === cls.teacherIds[0]);
                      return teacher ? teacher.name : cls.teacherIds[0];
                    })() : '-'}
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => { setEditClass(cls); setShowEdit(true); }}
                        style={{ borderColor: '#1976d2', color: '#1976d2' }}
                      >
                        تعديل
                      </Button>
                      <Button
                        size="small"
                        onClick={() => openMembersModal(cls)}
                        style={{ borderColor: '#4caf50', color: '#4caf50' }}
                      >
                        إدارة الأعضاء
                      </Button>
                      <Button
                        size="small"
                        onClick={() => openClassDetails(cls)}
                        style={{ borderColor: '#ff9800', color: '#ff9800' }}
                      >
                        التفاصيل
                      </Button>
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => setDeleteId(cls.id)}
                      >
                        حذف
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <style>{`
.class-row:hover {
  background: #f8f9ff !important;
  transition: background 0.2s;
}
`}</style>
      {/* Modal pour gérer les membres de la classe */}
      <Modal
        title={`إدارة أعضاء الفصل: ${selectedClass?.name || ''}`}
        open={showMembersModal}
        onCancel={() => setShowMembersModal(false)}
        onOk={handleSaveMembers}
        okText="حفظ"
        cancelText="إلغاء"
        confirmLoading={membersLoading}
      >
        <Spin spinning={membersLoading}>
          <div style={{ marginBottom: 16 }}>
            <label>الأطفال في الفصل:</label>
            <Select
              mode="multiple"
              showSearch
              style={{ width: '100%' }}
              value={selectedChildren}
              onChange={setSelectedChildren}
              placeholder="اختر الأطفال..."
              optionFilterProp="children"
              filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}
            >
              {allChildren.map(child => (
                <Select.Option key={child.id} value={child.id}>{child.name}</Select.Option>
              ))}
            </Select>
          </div>
          <div>
            <label>المعلم في الفصل:</label>
            <Select
              showSearch
              style={{ width: '100%' }}
              value={selectedTeachers[0] || undefined}
              onChange={val => setSelectedTeachers(val ? [val] : [])}
              placeholder="اختر المعلم..."
              optionFilterProp="children"
              filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}
              allowClear
            >
              {allTeachers.map(teacher => (
                <Select.Option key={teacher.id} value={teacher.id}>{teacher.name}</Select.Option>
              ))}
            </Select>
          </div>
        </Spin>
      </Modal>
      {/* Modal de détails de la classe */}
      <Modal
        title={`تفاصيل الفصل: ${classDetails?.name || ''}`}
        open={showClassDetails}
        onCancel={() => setShowClassDetails(false)}
        footer={null}
      >
        <div style={{ marginBottom: 12 }}><b>عدد الأطفال :</b> {Array.isArray(classDetails?.childrenIds) ? classDetails.childrenIds.length : 0}</div>
        <div style={{ marginBottom: 12 }}><b>المعلم :</b> {Array.isArray(classDetails?.teacherIds) && classDetails.teacherIds.length > 0 ? (() => {
          const teacher = allTeachers.find(t => t.id === classDetails.teacherIds[0]);
          return teacher ? teacher.name : classDetails.teacherIds[0];
        })() : '-'}</div>
        <div style={{ marginBottom: 8 }}><b>قائمة الأطفال :</b></div>
        <ul style={{ paddingLeft: 20 }}>
          {Array.isArray(classDetails?.childrenIds) && classDetails.childrenIds.length > 0 ?
            classDetails.childrenIds.map(cid => {
              const child = allChildren.find(c => c.id === cid);
              return <li key={cid}>{child ? child.name : cid}</li>;
            }) : <li>-</li>}
        </ul>
      </Modal>
    </div>
  );
}

export default ClassesList;