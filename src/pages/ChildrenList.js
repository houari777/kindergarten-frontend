import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Input, 
  Select, 
  Form, 
  message, 
  Badge,
  Dropdown,
  Table,
  Space,
  Card,
  Avatar
} from 'antd';
import { 
  FileTextOutlined,
  MessageOutlined,
  DownOutlined,
  FilePdfOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { db, storage } from '../../firebase';
import { 
  collection, 
  query, 
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import debounce from 'lodash/debounce';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const { Option } = Select;

function ChildrenList() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  
  // Data state
  const [children, setChildren] = useState([]);
  const [classes, setClasses] = useState([]);
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  
  // Form state
  const [form] = Form.useForm();
  const [editingChild, setEditingChild] = useState(null);
  
  // Search and filter states
  const [searchText, setSearchText] = useState('');
  const [classFilter, setClassFilter] = useState('');
  
  // Delete state
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    fetchChildren();
    fetchClasses();
    fetchParents();
  }, []);

  const fetchChildren = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'enfants'), orderBy('name'));
      const querySnapshot = await getDocs(q);
      const childrenData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setChildren(childrenData);
    } catch (error) {
      console.error('Error fetching children:', error);
      message.error(t('Failed to fetch children'));
    }
    setLoading(false);
  };

  const fetchClasses = async () => {
    try {
      const q = query(collection(db, 'classes'));
      const querySnapshot = await getDocs(q);
      const classesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClasses(classesData);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchParents = async () => {
    try {
      const q = query(collection(db, 'parents'));
      const querySnapshot = await getDocs(q);
      const parentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setParents(parentsData);
    } catch (error) {
      console.error('Error fetching parents:', error);
    }
  };

  // Handle search with debounce
  const handleSearch = debounce((value) => {
    setSearchText(value);
  }, 300);

  // Filter children based on search and filters
  const filteredChildren = children.filter(child => {
    const matchesSearch = child.name?.toLowerCase().includes(searchText.toLowerCase()) || 
                         child.id?.includes(searchText);
    const matchesClass = !classFilter || child.classId === classFilter;
    return matchesSearch && matchesClass;
  });

  // Handle delete child
  const handleDelete = async () => {
    if (!deleteId) return;
    
    setDeleteLoading(true);
    try {
      await deleteDoc(doc(db, 'enfants', deleteId));
      message.success(t('Child deleted successfully'));
      fetchChildren();
      setIsDeleteModalVisible(false);
    } catch (error) {
      console.error('Error deleting child:', error);
      message.error(t('Failed to delete child'));
    }
    setDeleteLoading(false);
  };

  // Table columns
  const columns = [
    {
      title: t('Name'),
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <Avatar 
            src={record.photoURL} 
            icon={<FileTextOutlined />} 
          />
          {text}
        </Space>
      ),
    },
    {
      title: t('Class'),
      dataIndex: 'classId',
      key: 'class',
      render: (classId) => {
        const classInfo = classes.find(c => c.id === classId);
        return classInfo?.name || '-';
      },
    },
    {
      title: t('Status'),
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Badge 
          status={status === 'active' ? 'success' : 'default'} 
          text={status === 'active' ? t('Active') : t('Inactive')} 
        />
      ),
    },
    {
      title: t('Actions'),
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<MessageOutlined />} 
            onClick={() => navigate(`/child/${record.id}/reports`)}
          >
            {t('Reports')}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ 
      maxWidth: '100%', 
      margin: '40px auto', 
      padding: 24, 
      fontFamily: 'Tajawal, Arial, sans-serif' 
    }}>
         <Card>
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Input
              placeholder={t('Search children...')}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ width: 200 }}
            />
            <Select
              placeholder={t('Filter by class')}
              style={{ width: 200 }}
              onChange={setClassFilter}
              allowClear
            >
              {classes.map(cls => (
                <Option key={cls.id} value={cls.id}>
                  {cls.name}
                </Option>
              ))}
            </Select>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={filteredChildren}
          rowKey="id"
          loading={loading}
          scroll={{ x: true }}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        title={t('Confirm Delete')}
        open={isDeleteModalVisible}
        onOk={handleDelete}
        confirmLoading={deleteLoading}
        onCancel={() => setIsDeleteModalVisible(false)}
        okText={t('Delete')}
        cancelText={t('Cancel')}
        okButtonProps={{ danger: true }}
      >
        <p>{t('Are you sure you want to delete this child? This action cannot be undone.')}</p>
      </Modal>
    </div>
  );
}

export default ChildrenList;