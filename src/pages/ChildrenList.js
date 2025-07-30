import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Input, 
  Select, 
  Form, 
  message, 
  Modal, 
  Table,
  Tag,
  Space,
  Upload,
  Row,
  Col,
  Card,
  Avatar
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  UserOutlined, 
  UploadOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { db, storage } from '../firebase/config';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  addDoc,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const { Option } = Select;

function ChildrenList() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
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

  // Memoize the class name lookup for better performance
  const getClassName = (classId) => {
    const cls = classes.find(c => c.id === classId);
    return cls ? cls.name : '-';
  };

  // Memoize the filtered children to prevent unnecessary recalculations
  const filteredChildren = children.filter(child => {
    if (!child) return false;
    
    const matchesName = !searchName || 
      (child.name && child.name.toLowerCase().includes(searchName.toLowerCase()));
    
    const matchesClass = !searchClass || 
      (child.classId && child.classId === searchClass);
    
    const matchesAge = !searchAge || 
      (child.age && child.age.toString() === searchAge.toString());
    
    const matchesParent = !searchParent || 
      (child.parentName && child.parentName.toLowerCase().includes(searchParent.toLowerCase()));
    
    const matchesHealth = !searchHealth || 
      (child.health && child.health.toLowerCase().includes(searchHealth.toLowerCase()));
    
    return matchesName && matchesClass && matchesAge && matchesParent && matchesHealth;
  });

  // Memoized export to PDF function
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFont('Arial');
    doc.setFontSize(20);
    doc.text('قائمة الأطفال', 105, 15, { align: 'center' });
    
    // Add date
    doc.setFontSize(10);
    doc.text(`تاريخ التصدير: ${new Date().toLocaleDateString('ar-EG')}`, 200, 10, { align: 'right' });
    
    // Prepare data for the table
    const tableColumn = ['الاسم', 'العمر', 'الصف', 'ولي الأمر', 'الحالة'];
    const tableRows = [];
    
    filteredChildren.forEach(child => {
      const className = getClassName(child.classId);
      
      const childData = [
        child.name || '',
        child.age || '',
        className,
        child.parentName || '',
        child.status || 'نشط'
      ];
      tableRows.push(childData);
    });
    
    // Add table to PDF
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 25,
      styles: { 
        font: 'Arial',
        fontStyle: 'normal',
        textColor: [0, 0, 0],
        halign: 'center',
        cellPadding: 3,
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        textDirection: 'rtl',
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { top: 30 },
      didDrawPage: function (data) {
        // Footer
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        doc.text('© روضة الأطفال - جميع الحقوق محفوظة', data.settings.margin.left, pageHeight - 10);
      }
    });
    
    // Save the PDF
    doc.save('قائمة_الأطفال.pdf');
  };

  // Debounced search handler
  const handleSearchChange = debounce(({ name, value }) => {
    switch (name) {
      case 'name':
        setSearchName(value);
        break;
      case 'class':
        setSearchClass(value);
        break;
      case 'age':
        setSearchAge(value);
        break;
      case 'parent':
        setSearchParent(value);
        break;
      case 'health':
        setSearchHealth(value);
        break;
      default:
        break;
    }
  }, 300);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      handleSearchChange.cancel();
    };
  }, [handleSearchChange]);

  // Real-time listener for children data
  useEffect(() => {
    setLoading(true);
    setError('');
    
    const childrenRef = collection(db, 'children');
    const q = query(childrenRef, orderBy('createdAt', 'desc')); // Default ordering
    
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const childrenData = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          childrenData.push({ 
            id: doc.id, 
            ...data,
            // Ensure timestamps are properly converted
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt)
          });
        });
        
        setChildren(childrenData);
        setLoading(false);
      },
      (error) => {
        console.error('Error in children listener:', error);
        setError(t('حدث خطأ في تحديث بيانات الأطفال'));
        setLoading(false);
      }
    );
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [t]);

  // Real-time listener for classes
  useEffect(() => {
    const classesRef = collection(db, 'classes');
    const q = query(classesRef, orderBy('name'));
    
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const classesData = [];
        querySnapshot.forEach((doc) => {
          classesData.push({ 
            id: doc.id, 
            ...doc.data(),
            // Ensure timestamps are properly converted
            createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt)
          });
        });
        setClasses(classesData);
      },
      (error) => {
        console.error('Error in classes listener:', error);
        message.error(t('حدث خطأ في تحميل الفصول'));
      }
    );
    
    return () => unsubscribe();
  }, [t]);

  // Real-time listener for teachers
  useEffect(() => {
    const teachersRef = collection(db, 'users');
    const q = query(
      teachersRef, 
      where('role', '==', 'teacher'),
      orderBy('name')
    );
    
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const teachersData = [];
        querySnapshot.forEach((doc) => {
          teachersData.push({ 
            id: doc.id, 
            ...doc.data(),
            // Ensure timestamps are properly converted
            createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt)
          });
        });
        setAllTeachers(teachersData);
      },
      (error) => {
        console.error('Error in teachers listener:', error);
        message.error(t('حدث خطأ في تحميل بيانات المعلمين'));
      }
    );
    
    return () => unsubscribe();
  }, [t]);

  // No need for manual data loading as we're using real-time listeners
  // The listeners are set up in their respective useEffect hooks above

  // Memoized search handler for form submission
  const handleSearch = (e) => {
    e.preventDefault();
    // Trigger any pending debounced updates immediately
    handleSearchChange.flush();
  };

  // Handle individual search input changes with debouncing
  const handleSearchInputChange = (e) => {
    const { name, value } = e.target;
    handleSearchChange({ name, value });
  };

  // Compress image before upload
  const compressImage = (file, maxWidth = 800, quality = 0.7) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          
          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress image
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to blob with specified quality
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(file); // Fallback to original if compression fails
                return;
              }
              
              // Create new file with compressed blob
              const compressedFile = new File(
                [blob],
                file.name,
                { type: 'image/jpeg', lastModified: Date.now() }
              );
              
              resolve(compressedFile);
            },
            'image/jpeg',
            quality
          );
        };
      };
      
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e, type, imageType = 'image') => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      message.error(t('نوع الملف غير مدعوم. يرجى تحميل صورة (JPEG, PNG, GIF, WebP)'));
      return;
    }
    
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      message.error(t('حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت'));
      return;
    }
    
    try {
      // Show loading state
      message.loading(t('جاري معالجة الصورة...'), 0);
      
      // Compress image
      const compressedFile = await compressImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const update = {
          [imageType]: compressedFile,
          [`${imageType}Preview`]: reader.result,
          [`${imageType}Name`]: compressedFile.name,
          [`${imageType}Size`]: (compressedFile.size / 1024 / 1024).toFixed(2) + ' MB'
        };
        
        if (type === 'add') {
          setNewChild(prev => ({ ...prev, ...update }));
        } else {
          setEditChild(prev => ({ ...prev, ...update }));
        }
        
        message.destroy();
        message.success(t('تم تحميل الصورة بنجاح'));
      };
      
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('Error processing image:', error);
      message.destroy();
      message.error(t('حدث خطأ أثناء معالجة الصورة'));
    }
  };

  // Upload file to Firebase Storage with progress tracking
  const uploadFile = async (file, path) => {
    if (!file) return '';
    
    const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    return new Promise((resolve, reject) => {
      uploadTask.on('state_changed',
        (snapshot) => {
          // Track upload progress
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% done`);
          // You can add a progress indicator here if needed
        },
        (error) => {
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error) {
            console.error('Error getting download URL:', error);
            reject(error);
          }
        }
      );
    });
  };

  // Validate child data before submission
  const validateChildData = (data) => {
    const errors = [];
    
    // Required fields
    if (!data.name || data.name.trim().length < 2) {
      errors.push(t('يجب إدخال اسم صحيح للطفل (حرفان على الأقل)'));
    }
    
    if (!data.classId) {
      errors.push(t('يجب اختيار فصل للطفل'));
    }
    
    // Age validation
    const age = parseInt(data.age);
    if (isNaN(age) || age < 1 || age > 18) {
      errors.push(t('يجب إدخال عمر صحيح بين 1 و 18'));
    }
    
    // Parent IDs validation
    if (data.parentIds) {
      const parentIds = data.parentIds.split(',').map(id => id.trim());
      const invalidIds = parentIds.filter(id => !/^[a-zA-Z0-9]+$/.test(id));
      
      if (invalidIds.length > 0) {
        errors.push(t('يجب أن تتكون أرقام أولياء الأمور من أحرف وأرقام فقط'));
      }
    }
    
    // Image validation (if required)
    if (data.requireImage && !data.image) {
      errors.push(t('يجب تحميل صورة للطفل'));
    }
    
    return errors;
  };

  const handleAddChild = async () => {
    // Validate form data
    const validationErrors = validateChildData({
      ...newChild,
      requireImage: false // Set to true if image is required
    });
    
    if (validationErrors.length > 0) {
      setAddError(validationErrors.join('\n'));
      return;
    }

    setAddLoading(true);
    setAddError('');
    
    // Show loading message
    const hideLoading = message.loading(t('جاري إضافة الطفل...'), 0);
    
    try {
      // Upload files in parallel with error handling for each upload
      const uploadPromises = [];
      
      if (newChild.image) {
        uploadPromises.push(
          uploadFile(newChild.image, 'children')
            .then(url => ({ type: 'image', url }))
            .catch(error => ({ type: 'image', error }))
        );
      } else {
        uploadPromises.push(Promise.resolve({ type: 'image', url: '' }));
      }
      
      if (newChild.healthRecordImage) {
        uploadPromises.push(
          uploadFile(newChild.healthRecordImage, 'health_records')
            .then(url => ({ type: 'healthRecord', url }))
            .catch(error => ({ type: 'healthRecord', error }))
        );
      } else {
        uploadPromises.push(Promise.resolve({ type: 'healthRecord', url: '' }));
      }
      
      if (newChild.guardianAuthImage) {
        uploadPromises.push(
          uploadFile(newChild.guardianAuthImage, 'guardian_auth')
            .then(url => ({ type: 'guardianAuth', url }))
            .catch(error => ({ type: 'guardianAuth', error }))
        );
      } else {
        uploadPromises.push(Promise.resolve({ type: 'guardianAuth', url: '' }));
      }
      
      // Wait for all uploads to complete
      const uploadResults = await Promise.all(uploadPromises);
      
      // Check for upload errors
      const uploadErrors = uploadResults
        .filter(result => result.error)
        .map(result => {
          console.error(`Error uploading ${result.type}:`, result.error);
          return t(`خطأ في تحميل ملف ${result.type}`);
        });
      
      if (uploadErrors.length > 0) {
        throw new Error(uploadErrors.join('\n'));
      }
      
      // Extract URLs from successful uploads
      const uploads = uploadResults.reduce((acc, result) => {
        if (result.url) {
          acc[`${result.type}Url`] = result.url;
        }
        return acc;
      }, {});
      
      // Prepare child data with proper data types
      const childData = {
        name: newChild.name.trim(),
        age: parseInt(newChild.age) || 0,
        classId: newChild.classId,
        parentIds: newChild.parentIds 
          ? newChild.parentIds.split(',').map(id => id.trim()).filter(Boolean)
          : [],
        health: newChild.health?.trim() || '',
        status: 'نشط',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...uploads
      };
      
      // Add child to Firestore with error handling for Firestore operations
      const docRef = await addDoc(collection(db, 'children'), childData);
      
      // Log the new child ID for debugging
      console.log('Added child with ID:', docRef.id);
      
      // Show success message with the child's name
      message.success(`${t('تمت إضافة الطفل')} "${childData.name}" ${t('بنجاح')}`);
      
      // Reset form
      setShowAdd(false);
      setNewChild({ 
        name: '', 
        age: '', 
        classId: '', 
        parentIds: '', 
        image: null, 
        healthRecordImage: null,
        guardianAuthImage: null,
        health: '' 
      });
      
    } catch (err) {
      console.error('Error in handleAddChild:', err);
      
      // More specific error messages
      let errorMessage = t('حدث خطأ أثناء إضافة الطفل');
      
      if (err.code) {
        switch (err.code) {
          case 'storage/unauthorized':
            errorMessage = t('ليس لديك صلاحية لتحميل الملفات');
            break;
          case 'storage/retry-limit-exceeded':
            errorMessage = t('انتهت مهلة اتصال الخادم. يرجى المحاولة مرة أخرى');
            break;
          case 'permission-denied':
            errorMessage = t('تم رفض الإذن. يرجى التأكد من الصلاحيات');
            break;
          default:
            errorMessage = err.message || errorMessage;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setAddError(errorMessage);
      message.error(errorMessage);
    } finally {
      hideLoading();
      setAddLoading(false);
    }
  };

  const handleEditChild = async (values) => {
    setEditLoading(true);
    setEditError('');
    
    try {
      const updateData = {
        name: values.name,
        age: parseInt(values.age),
        classId: values.classId,
        parentIds: values.parentIds || '',
        health: values.health || '',
        updatedAt: new Date().toISOString()
      };
      
      // Handle file uploads if new files are provided
      if (editChild.image) {
        const imageRef = ref(storage, `children/${Date.now()}_${editChild.image.name}`);
        await uploadBytes(imageRef, editChild.image);
        updateData.imageUrl = await getDownloadURL(imageRef);
      }
      
      if (editChild.healthRecordImage) {
        const healthRef = ref(storage, `health_records/${Date.now()}_${editChild.healthRecordImage.name}`);
        await uploadBytes(healthRef, editChild.healthRecordImage);
        updateData.healthRecordUrl = await getDownloadURL(healthRef);
      }
      
      if (editChild.guardianAuthImage) {
        const authRef = ref(storage, `guardian_auth/${Date.now()}_${editChild.guardianAuthImage.name}`);
        await uploadBytes(authRef, editChild.guardianAuthImage);
        updateData.guardianAuthUrl = await getDownloadURL(authRef);
      }
      
      // Update the document in Firestore
      const childRef = doc(db, 'children', editChild.id);
      await updateDoc(childRef, updateData);
      
      message.success(t('تم تحديث بيانات الطفل بنجاح'));
      setShowEdit(false);
      setEditChild(null);
      // No need to fetch children as the real-time listener will update the UI
    } catch (error) {
      console.error('Error updating child:', error);
      setEditError(t('حدث خطأ أثناء تحديث بيانات الطفل'));
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteChild = async () => {
    if (!deleteId) return;
    
    setDeleteLoading(true);
    try {
      // Delete the document from Firestore
      await deleteDoc(doc(db, 'children', deleteId));
      
      message.success(t('تم حذف الطفل بنجاح'));
      setDeleteId(null);
      // No need to fetch children as the real-time listener will update the UI
    } catch (error) {
      console.error('Error deleting child:', error);
      message.error(t('حدث خطأ أثناء حذف الطفل'));
    } finally {
      setDeleteLoading(false);
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

  return (
    <div style={{ maxWidth: '100%', margin: '40px auto', padding: 24, fontFamily: 'Tajawal, Arial, sans-serif' }}>
      <h2 style={{ marginBottom: 24, fontWeight: 700, fontSize: 28, color: '#1976d2', textAlign: i18n.language === 'ar' ? 'right' : 'left', fontFamily: 'Tajawal, Arial, sans-serif' }}>{t('Children Management')}</h2>
      
      {/* Search and Filter Section */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Input 
            placeholder={t('Search by name')} 
            name="name"
            value={searchName} 
            onChange={handleSearchInputChange} 
            style={{ width: 200, marginRight: 8 }} 
            allowClear
          />
          <Input 
            placeholder={t('Search by class')} 
            name="class"
            value={searchClass} 
            onChange={handleSearchInputChange} 
            style={{ width: 150, marginRight: 8 }} 
            allowClear
          />
          <Input 
            placeholder={t('Search by age')} 
            name="age"
            value={searchAge} 
            onChange={handleSearchInputChange} 
            style={{ width: 120, marginRight: 8 }} 
            type="number"
            min="1"
            max="18"
            allowClear
          />
          <Input 
            placeholder={t('Search by parent')} 
            name="parent"
            value={searchParent} 
            onChange={handleSearchInputChange} 
            style={{ width: 200, marginRight: 8 }} 
            allowClear
          />
          <Input 
            placeholder={t('Search by health')} 
            name="health"
            value={searchHealth} 
            onChange={handleSearchInputChange} 
            style={{ width: 180, marginRight: 16 }} 
            allowClear
          />
          <Button type="primary" onClick={handleSearch}>{t('Search')}</Button>
          <Button onClick={() => { 
            setSearchName(''); 
            setSearchClass(''); 
            setSearchAge(''); 
            setSearchParent(''); 
            setSearchHealth(''); 
            // Reset will automatically trigger a re-render with the cleared filters
          }}>
            {t('Reset')}
          </Button>
        </div>
        <div>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'pdf',
                  icon: <FilePdfOutlined />,
                  label: t('Export as PDF'),
                  onClick: exportToPDF
                }
              ]
            }}
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
                      style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover', boxShadow: '0 1px 4px #b0bec5' }} 
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
              {filteredChildren.map((child) => {
                const childClass = classes && child.classId ? classes.find((cls) => cls.id === child.classId) : null;
                const teacherName = childClass && Array.isArray(childClass.teacherIds) && childClass.teacherIds.length > 0
                  ? allTeachers && allTeachers.length > 0
                    ? (() => {
                        const teacher = allTeachers.find((t) => t.id === childClass.teacherIds[0]);
                        return teacher ? teacher.name : childClass.teacherIds[0];
                      })()
                    : childClass.teacherIds[0]
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