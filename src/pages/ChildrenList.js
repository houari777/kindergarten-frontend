import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Table, 
  Button, 
  Input, 
  Space, 
  Card, 
  Typography, 
  Avatar, 
  Tag, 
  message,
  Modal,
  Form,
  Select,
  Upload,
  Row,
  Col,
  Badge,
  Dropdown,
  Menu
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  UserOutlined,
  UploadOutlined,
  FileTextOutlined,
  MessageOutlined,
  FilePdfOutlined,
  DownOutlined
} from '@ant-design/icons';
// Import jsPDF and autoTable with proper initialization
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const { Title, Text } = Typography;
const { Option } = Select;

// Sample data for demonstration
const sampleData = [
  {
    id: '1',
    name: 'أحمد محمد',
    age: 5,
    class: 'الروضة أ',
    parent: 'محمد أحمد',
    status: 'نشط',
    lastCheckIn: '2023-07-17T08:30:00',
  },
  {
    id: '2',
    name: 'سارة خالد',
    age: 4,
    class: 'الروضة ب',
    parent: 'خالد إبراهيم',
    status: 'نشط',
    lastCheckIn: '2023-07-17T08:45:00',
  },
];

function ChildrenList() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const token = localStorage.getItem('token');
  
  // Data state
  const [children, setChildren] = useState([]);
  const [classes, setClasses] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Search state
  const [searchName, setSearchName] = useState('');
  const [searchClass, setSearchClass] = useState('');
  const [searchAge, setSearchAge] = useState('');
  const [searchParent, setSearchParent] = useState('');
  const [searchHealth, setSearchHealth] = useState('');
  
  // Add child state
  const [showAdd, setShowAdd] = useState(false);
  const [newChild, setNewChild] = useState({ 
    name: '', 
    age: '', 
    classId: '', 
    parentIds: '', 
    image: null, 
    healthRecordImage: null,
    guardianAuthImage: null,
    health: '' 
  });
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  
  // Edit child state
  const [showEdit, setShowEdit] = useState(false);
  const [editChild, setEditChild] = useState(null);
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  
  // Delete state
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchChildren = async () => {
    setLoading(true);
    setError('');
    try {
      let url = 'http://localhost:5001/api/children';
      const params = [];
      if (searchName) params.push(`name=${encodeURIComponent(searchName)}`);
      if (searchClass) params.push(`classId=${encodeURIComponent(searchClass)}`);
      if (searchAge) params.push(`age=${encodeURIComponent(searchAge)}`);
      if (searchParent) params.push(`parentName=${encodeURIComponent(searchParent)}`);
      if (searchHealth) params.push(`health=${encodeURIComponent(searchHealth)}`);
      if (params.length) url += '?' + params.join('&');
      const res = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      if (data.success) {
        setChildren(data.children);
      } else {
        setError(data.message || t('حدث خطأ'));
      }
    } catch (err) {
      setError(t('Network error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/classes', {
        headers: { Authorization: 'Bearer ' + token }
      });
      const data = await res.json();
      if (data.success) {
        setClasses(data.classes || []);
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/teachers', {
        headers: { Authorization: 'Bearer ' + token }
      });
      const data = await res.json();
      if (data.success) {
        setAllTeachers(data.teachers || []);
      }
    } catch (err) {
      console.error('Error fetching teachers:', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchChildren(),
          fetchClasses(),
          fetchTeachers()
        ]);
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
    // eslint-disable-next-line
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchChildren();
  };

  const handleImageUpload = (e, type, imageType = 'image') => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const update = {};
        update[imageType] = file; // Store the file object for form submission
        update[`${imageType}Preview`] = reader.result; // Store the data URL for preview
        
        if (type === 'add') {
          setNewChild({ ...newChild, ...update });
        } else {
          setEditChild({ ...editChild, ...update });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddChild = async (values) => {
    try {
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('age', values.age);
      formData.append('classId', values.classId);
      if (values.parentIds) {
        formData.append('parentIds', values.parentIds);
      }
      if (values.health) {
        formData.append('health', values.health);
      }
      if (newChild.image) {
        formData.append('image', newChild.image);
      }
      if (newChild.healthRecordImage) {
        formData.append('healthRecordImage', newChild.healthRecordImage);
      }
      if (newChild.guardianAuthImage) {
        formData.append('guardianAuthImage', newChild.guardianAuthImage);
      }

      const response = await fetch('http://localhost:5001/api/children', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });
      
      const data = await response.json();
      if (data.success) {
        message.success(t('تمت إضافة الطفل بنجاح'));
        setShowAdd(false);
        setNewChild({ name: '', age: '', classId: '', parentIds: '', image: null, healthRecordImage: null, guardianAuthImage: null });
        fetchChildren();
      } else {
        message.error(data.message || 'حدث خطأ أثناء إضافة الطفل');
      }
    } catch (error) {
      console.error('Error adding child:', error);
      message.error('حدث خطأ أثناء إضافة الطفل');
    }
  };

  const handleEditChild = async (values) => {
    try {
      setEditLoading(true);
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('age', values.age);
      formData.append('classId', values.classId);
      if (values.parentIds) formData.append('parentIds', values.parentIds);
      if (values.health) formData.append('health', values.health);

      // Handle file uploads if any
      if (editChild.image) formData.append('image', editChild.image);
      if (editChild.healthRecordImage) formData.append('healthRecordImage', editChild.healthRecordImage);
      if (editChild.guardianAuthImage) formData.append('guardianAuthImage', editChild.guardianAuthImage);
      const res = await fetch(`http://localhost:5001/api/children/${editChild.id}`, {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer ' + token
        },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setShowEdit(false);
        setEditChild(null);
        setSuccessMsg(t('تم تعديل الطفل بنجاح'));
        fetchChildren();
      } else {
        setEditError(data.message || t('فشل التعديل'));
      }
    } catch (err) {
      setEditError(t('Network error'));
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteChild = async (id) => {
    setDeleteLoading(true);
    setSuccessMsg('');
    try {
      const res = await fetch(`http://localhost:5001/api/children/${id}`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + token }
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(t('تم حذف الطفل بنجاح'));
        fetchChildren();
      }
    } catch (err) {}
    setDeleteId(null);
    setDeleteLoading(false);
  };

  // Filter children based on search criteria
  const filteredChildren = children.filter(child => {
    const matchesName = searchName ? child.name && child.name.toLowerCase().includes(searchName.toLowerCase()) : true;
    const matchesClass = searchClass ? child.classId === searchClass : true;
    const matchesAge = searchAge ? String(child.age) === searchAge : true;
    const matchesParent = searchParent ? (child.parentNames?.join(',').toLowerCase().includes(searchParent.toLowerCase())) : true;
    const matchesHealth = searchHealth ? (child.health && child.health.toLowerCase().includes(searchHealth.toLowerCase())) : true;
    return matchesName && matchesClass && matchesAge && matchesParent && matchesHealth;
  });

  const exportToPDF = () => {
    try {
      // Create a new jsPDF instance
      const doc = new jsPDF();
      
      // Set document title
      doc.setFontSize(18);
      doc.text('تقرير الأطفال', 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      
      // Prepare data for the table
      const tableColumn = ['الاسم', 'العمر', 'الصف', 'المعلم', 'الحالة الصحية'];
      const tableRows = [];
      
      // Add data to table rows
      filteredChildren.forEach(child => {
        const childClass = classes && child.classId ? classes.find(cls => cls.id === child.classId) : null;
        const teacherName = childClass && Array.isArray(childClass.teacherIds) && childClass.teacherIds.length > 0
          ? (allTeachers && allTeachers.length > 0
            ? (() => {
                const teacher = allTeachers.find(t => t.id === childClass.teacherIds[0]);
                return teacher ? teacher.name : childClass.teacherIds[0];
              })()
            : childClass.teacherIds[0])
          : '-';
          
        const rowData = [
          child.name || '-',
          child.age || '-',
          childClass ? childClass.name : '-',
          teacherName,
          child.health || '-'
        ];
        tableRows.push(rowData);
      });
      
      // Add table using autoTable plugin - using jsPDF's autoTable method
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 30,
        styles: { 
          font: 'tajawal',
          fontStyle: 'normal',
          fontSize: 10,
          cellPadding: 3,
          textColor: [0, 0, 0],
          lineColor: [0, 0, 0],
          lineWidth: 0.1,
          halign: 'right',
          rtl: true
        },
        headStyles: {
          fillColor: [25, 118, 210],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'right'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { top: 30 }
      });
      
      // Add footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(
          `صفحة ${i} من ${pageCount}`,
          doc.internal.pageSize.width - 30,
          doc.internal.pageSize.height - 10
        );
      }
      
      // Save the PDF
      doc.save('children_report.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      message.error('فشل في إنشاء ملف PDF. الرجاء المحاولة مرة أخرى.');
    }
  };

  const handleSendMessageToParent = async (child) => {
    const parentId = child.parentIds[0]; // Assuming the first parent is the primary guardian
    if (!parentId) {
      message.error(t('No parent ID found for this child.'));
      return;
    }

    const messageContent = `Hello ${child.parentNames[0]}, your child ${child.name} is doing well.`; // Example message

    try {
      const res = await fetch(`http://localhost:5001/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token
        },
        body: JSON.stringify({
          senderId: 'system', // Assuming a system sender
          receiverId: parentId,
          content: messageContent
        })
      });
      const data = await res.json();
      if (data.success) {
        message.success(t('Message sent successfully to parent!'));
      } else {
        message.error(data.message || t('Failed to send message to parent.'));
      }
    } catch (err) {
      message.error(t('Network error sending message.'));
    }
  };

  const handleEditClick = (child) => {
    setEditChild({
      id: child.id,
      name: child.name,
      age: child.age,
      classId: child.classId,
      parentIds: child.parentIds ? child.parentIds.join(',') : '',
      health: child.health || '',
      image: null,
      existingImage: child.image || null,
      healthRecordImage: null,
      existingHealthRecordImage: child.healthRecordImage || null,
      guardianAuthImage: null,
      existingGuardianAuthImage: child.guardianAuthImage || null
    });
    setShowEdit(true);
  };

  return (
    <div style={{ maxWidth: '100%', margin: '40px auto', padding: 24, fontFamily: 'Tajawal, Arial, sans-serif' }}>
      <h2 style={{ marginBottom: 24, fontWeight: 700, fontSize: 28, color: '#1976d2', textAlign: i18n.language === 'ar' ? 'right' : 'left', fontFamily: 'Tajawal, Arial, sans-serif' }}>{t('Children Management')}</h2>
      {successMsg && <div style={{ color: 'green', marginBottom: 12 }}>{successMsg}</div>}
      
      {/* Search and Filter Section */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Input 
            placeholder={t('Search by Name')} 
            value={searchName} 
            onChange={e => setSearchName(e.target.value)} 
            style={{ width: 160 }} 
          />
          <Input 
            placeholder={t('Search by Class')} 
            value={searchClass} 
            onChange={e => setSearchClass(e.target.value)} 
            style={{ width: 120 }} 
          />
          <Input 
            placeholder={t('Age')} 
            value={searchAge} 
            onChange={e => setSearchAge(e.target.value)} 
            style={{ width: 80 }} 
          />
          <Input 
            placeholder={t('Parent')} 
            value={searchParent} 
            onChange={e => setSearchParent(e.target.value)} 
            style={{ width: 140 }} 
          />
          <Input 
            placeholder={t('Health Status')} 
            value={searchHealth} 
            onChange={e => setSearchHealth(e.target.value)} 
            style={{ width: 120 }} 
          />
          <Button type="primary" onClick={fetchChildren}>{t('Search')}</Button>
          <Button onClick={() => { 
            setSearchName(''); 
            setSearchClass(''); 
            setSearchAge(''); 
            setSearchParent(''); 
            setSearchHealth(''); 
            fetchChildren(); 
          }}>
            {t('Reset')}
          </Button>
        </div>
        <div>
          <Dropdown
            overlay={
              <Menu>
                <Menu.Item key="pdf" icon={<FilePdfOutlined />} onClick={exportToPDF}>
                  {t('Export as PDF')}
                </Menu.Item>
              </Menu>
            }
            trigger={['click']}
          >
            <Button type="primary" style={{ marginRight: 8 }}>
              {t('Export')} <DownOutlined />
            </Button>
          </Dropdown>
          <Button type="primary" onClick={() => setShowAdd(true)}>
            {t('Add Child')}
          </Button>
        </div>
      </div>

      {/* Add Child Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 8, minWidth: 350, position: 'relative' }}>
            <button onClick={() => setShowAdd(false)} style={{ position: 'absolute', top: 8, right: 8 }}>{t('Close')}</button>
            <h3>{t('Add New Child')}</h3>
            <Form onFinish={handleAddChild}>
              <Form.Item 
                label={t('Name')}
                name="name"
                rules={[{ required: true, message: t('Please input the name!') }]}
              >
                <Input />
              </Form.Item>
              <Form.Item 
                label={t('Age')}
                name="age"
                rules={[{ required: true, message: t('Please input the age!') }]}
              >
                <Input type="number" />
              </Form.Item>
              <Form.Item 
                label={t('Class')}
                name="classId"
                rules={[{ required: true, message: t('Please input the class!') }]}
              >
                <Input />
              </Form.Item>
              <Form.Item label={t('Parent IDs (comma-separated)')}>
                <Input value={newChild.parentIds} onChange={e => setNewChild({ ...newChild, parentIds: e.target.value })} />
              </Form.Item>
              <Form.Item label={t('صورة الطفل')}>
                <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'add', 'image')} />
              </Form.Item>
              <Form.Item label={t('صورة الدفتر الصحي')}>
                <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'add', 'healthRecordImage')} />
              </Form.Item>
              <Form.Item label={t('صورة تصريح الولي')}>
                <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'add', 'guardianAuthImage')} />
              </Form.Item>
              <Form.Item label={t('Health Status')}>
                <Input value={newChild.health} onChange={e => setNewChild({ ...newChild, health: e.target.value })} />
              </Form.Item>
              {addError && <div style={{ color: 'red', margin: '8px 0' }}>{addError}</div>}
              <Button type="primary" htmlType="submit" loading={addLoading} style={{ marginTop: 16 }}>{t('Add')}</Button>
            </Form>
          </div>
        </div>
      )}
      {showEdit && editChild && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 8, minWidth: 350, position: 'relative' }}>
            <button onClick={() => setShowEdit(false)} style={{ position: 'absolute', top: 8, right: 8 }}>{t('Close')}</button>
            <h3>{t('Edit Child Details')}</h3>
            <Form 
              onFinish={handleEditChild}
              initialValues={{
                name: editChild.name,
                age: editChild.age,
                classId: editChild.classId,
                parentIds: editChild.parentIds,
                health: editChild.health
              }}
            >
              <Form.Item 
                label={t('Name')}
                name="name"
                rules={[{ required: true, message: t('Please input the name!') }]}
              >
                <Input />
              </Form.Item>
              <Form.Item 
                label={t('Age')}
                name="age"
                rules={[{ required: true, message: t('Please input the age!') }]}
              >
                <Input type="number" />
              </Form.Item>
              <Form.Item 
                label={t('Class')}
                name="classId"
                rules={[{ required: true, message: t('Please input the class!') }]}
              >
                <Input />
              </Form.Item>
              <Form.Item label={t('Parent IDs (comma-separated)')}>
                <Input value={editChild.parentIds} onChange={e => setEditChild({ ...editChild, parentIds: e.target.value })} />
              </Form.Item>
              <Form.Item label={t('صورة الطفل')}>
                {editChild.existingImage && (
                  <div style={{ marginBottom: 10 }}>
                    <img 
                      src={editChild.existingImage} 
                      alt="Current" 
                      style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover' }} 
                    />
                  </div>
                )}
                <Input type="file" accept="image/*" onChange={(e) => setEditChild({...editChild, image: e.target.files[0]})} />
              </Form.Item>
              <Form.Item label={t('صورة الدفتر الصحي')}>
                {editChild.existingHealthRecordImage && (
                  <div style={{ marginBottom: 10 }}>
                    <img 
                      src={editChild.existingHealthRecordImage} 
                      alt="Health Record" 
                      style={{ width: 50, height: 50, objectFit: 'cover' }} 
                    />
                  </div>
                )}
                <Input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setEditChild({...editChild, healthRecordImage: e.target.files[0]})} 
                />
              </Form.Item>
              <Form.Item label={t('صورة تصريح الولي')}>
                {editChild.existingGuardianAuthImage && (
                  <div style={{ marginBottom: 10 }}>
                    <img 
                      src={editChild.existingGuardianAuthImage} 
                      alt="Guardian Authorization" 
                      style={{ width: 50, height: 50, objectFit: 'cover' }} 
                    />
                  </div>
                )}
                <Input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setEditChild({...editChild, guardianAuthImage: e.target.files[0]})} 
                />
              </Form.Item>
              <Form.Item label={t('Health Status')}>
                <Input value={editChild.health} onChange={e => setEditChild({ ...editChild, health: e.target.value })} />
              </Form.Item>
              {editError && <div style={{ color: 'red', margin: '8px 0' }}>{editError}</div>}
              <Button type="primary" htmlType="submit" loading={editLoading} style={{ marginTop: 16 }}>{t('Save Changes')}</Button>
            </Form>
          </div>
        </div>
      )}
      {deleteId && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 8, minWidth: 350, position: 'relative' }}>
            <h3>{t('Confirm Child Deletion')}</h3>
            <p>{t('Are you sure you want to delete this child?')}</p>
            <Button onClick={() => handleDeleteChild(deleteId)} disabled={deleteLoading} style={{ color: 'red', marginRight: 8 }}>{t('Confirm Deletion')}</Button>
            <Button onClick={() => setDeleteId(null)} disabled={deleteLoading}>{t('Cancel')}</Button>
          </div>
        </div>
      )}
      {loading ? (
        <div>{t('Loading', 'جاري التحميل...')}</div>
      ) : error ? (
        <div style={{ color: 'red' }}>{error}</div>
      ) : (
        <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(25, 118, 210, 0.07)', padding: 0 }}>
          <table style={{ minWidth: 1100, width: '100%', borderCollapse: 'collapse', fontSize: 16, fontFamily: 'Tajawal, Arial, sans-serif' }}>
            <thead>
              <tr style={{ background: '#f5f5f5', fontWeight: 700, fontSize: 17 }}>
                <th style={{ padding: '12px 8px', textAlign: 'center' }}>الصورة</th>
                <th style={{ padding: '12px 8px', textAlign: 'center' }}>الاسم</th>
                <th style={{ padding: '12px 8px', textAlign: 'center' }}>العمر</th>
                <th style={{ padding: '12px 8px', textAlign: 'center' }}>الصف</th>
                <th style={{ padding: '12px 8px', textAlign: 'center' }}>ولي الأمر</th>
                <th style={{ padding: '12px 8px', textAlign: 'center' }}>الحالة الصحية</th>
                <th style={{ padding: '12px 8px', textAlign: 'center' }}>الدفتر الصحي</th>
                <th style={{ padding: '12px 8px', textAlign: 'center' }}>تصريح ولي الأمر</th>
                <th style={{ padding: '12px 8px', textAlign: 'center' }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredChildren.map(child => {
                const childClass = classes && child.classId ? classes.find(cls => cls.id === child.classId) : null;
                const teacherName = childClass && Array.isArray(childClass.teacherIds) && childClass.teacherIds.length > 0
                  ? (allTeachers && allTeachers.length > 0
                    ? (() => {
                        const teacher = allTeachers.find(t => t.id === childClass.teacherIds[0]);
                        return teacher ? teacher.name : childClass.teacherIds[0];
                      })()
                    : childClass.teacherIds[0])
                  : '-';
                return (
                <tr key={child.id} style={{ borderBottom: '1px solid #e3eaf2' }}>
                  <td style={{ textAlign: 'center', padding: 8 }}>{child.image ? <img src={child.image} alt={t('Child Image')} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', boxShadow: '0 1px 4px #b0bec5' }} /> : '-'}</td>
                  <td style={{ textAlign: 'center', padding: 8 }}>{child.name}</td>
                  <td style={{ textAlign: 'center', padding: 8 }}>{child.age}</td>
                  <td style={{ textAlign: 'center', padding: 8 }}>
                      {childClass ? <Badge color={childClass.id === 'A' ? 'blue' : childClass.id === 'B' ? 'orange' : 'green'} text={childClass.name} /> : '-'}
                  </td>
                    <td style={{ textAlign: 'center', padding: 8 }}>{teacherName}</td>
                  <td style={{ textAlign: 'center', padding: 8 }}>
                    {child.health ? <Badge color={child.health === 'سليم' || child.health === 'صحي' ? 'green' : 'orange'} text={child.health} /> : '-'}
                  </td>
                  <td style={{ textAlign: 'center', padding: 8 }}>
                    {child.healthRecordImage ? (
                      <img 
                        src={child.healthRecordImage} 
                        alt="Health Record" 
                        style={{ 
                          width: '50px', 
                          height: '50px', 
                          objectFit: 'cover',
                          cursor: 'pointer'
                        }}
                        onClick={() => window.open(child.healthRecordImage, '_blank')}
                      />
                    ) : 'غير متوفر'}
                  </td>
                  <td style={{ textAlign: 'center', padding: 8 }}>
                    {child.guardianAuthImage ? (
                      <img 
                        src={child.guardianAuthImage} 
                        alt="Guardian Authorization" 
                        style={{ 
                          width: '50px', 
                          height: '50px', 
                          objectFit: 'cover',
                          cursor: 'pointer'
                        }}
                        onClick={() => window.open(child.guardianAuthImage, '_blank')}
                      />
                    ) : 'غير متوفر'}
                  </td>
                  <td style={{ textAlign: 'center', padding: 8 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                      <Button type="link" icon={<EditOutlined />} style={{ color: '#1976d2', fontWeight: 600, width: '100%', textAlign: 'right' }} onClick={() => { setEditChild({ ...child, parentIds: (child.parentIds || []).join(','), newImage: null }); setShowEdit(true); }}>تعديل</Button>
                      <Button type="link" icon={<DeleteOutlined />} danger style={{ fontWeight: 600, width: '100%', textAlign: 'right' }} onClick={() => setDeleteId(child.id)}>حذف</Button>
                      <Button type="link" icon={<FileTextOutlined />} style={{ color: '#43a047', fontWeight: 600, width: '100%', textAlign: 'right' }} onClick={() => navigate(`/reports/${child.id}`)}>التقارير</Button>
                      {child.parentIds && child.parentIds.length > 0 && (
                        <Button type="link" icon={<MessageOutlined />} style={{ color: '#ff9800', fontWeight: 600, width: '100%', textAlign: 'right' }} onClick={() => handleSendMessageToParent(child)}>إرسال رسالة</Button>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ChildrenList; 