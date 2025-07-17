import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Modal, Form, Input, Select, message, DatePicker, Badge } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, UnlockOutlined, PoweroffOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useColumns } from './columns';
import { useTranslation } from 'react-i18next';

const Users = () => {
  const { t, i18n } = useTranslation();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(null);
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [children, setChildren] = useState([]);

  const columns = useColumns(children);

  useEffect(() => {
    fetchUsers();
    fetchChildren();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data.users || []);
    } catch (err) {
      message.error(t('Network error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchChildren = async () => {
    try {
      const res = await axios.get('/api/children', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChildren(res.data.children || []);
    } catch (err) {
      setChildren([]);
      message.error(t('Network error'));
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // فلترة متقدمة
  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter ? user.role === roleFilter : true;
    const matchesStatus = statusFilter ? (user.active === (statusFilter === 'active')) : true;
    const matchesDate = dateFilter ? (user.createdAt && new Date(user.createdAt).toDateString() === dateFilter.format('ddd MMM DD YYYY')) : true;
    return matchesSearch && matchesRole && matchesStatus && matchesDate;
  });

  const showModal = (user) => {
    setSelectedUser(user);
    setIsModalVisible(true);
  };

  const handleOk = async () => {
    try {
      await form.validateFields();
      const userData = form.getFieldsValue();
      if (selectedUser) {
        await axios.put(`/api/users/${selectedUser._id}`, userData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        message.success(t('User updated successfully'));
      } else {
        await axios.post('/api/users', userData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        message.success(t('User created successfully'));
      }
      setIsModalVisible(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      message.error(t('Failed to save user'));
    }
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: t('Are you sure you want to delete this user?'),
      onOk: async () => {
        try {
          await axios.delete(`/api/users/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          message.success(t('User deleted successfully'));
          fetchUsers();
        } catch (err) {
          message.error(t('Failed to delete user'));
        }
      },
    });
  };

  const handleAdd = () => {
    setSelectedUser(null);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setSelectedUser(null);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setIsModalVisible(true);
  };

  const handleView = (user) => {
    showModal(user);
  };

  const handleChildren = (user) => {
    showModal(user);
  };

  // تفعيل/تعطيل المستخدم
  const handleToggleActive = async (user) => {
    try {
      await axios.patch(`/api/users/${user._id}/status`, { active: !user.active }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
      message.success(user.active ? t('User deactivated') : t('User activated'));
    } catch (err) {
      message.error(t('Network error'));
    }
  };

  // إعادة تعيين كلمة المرور
  const handleResetPassword = async (user) => {
    try {
      await axios.post(`/api/users/${user._id}/reset-password`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success(t('Password reset link sent'));
    } catch (err) {
      message.error(t('Network error'));
    }
  };

  return (
    <div style={{ maxWidth: '100%', margin: '40px auto', padding: 24, fontFamily: 'Tajawal, Arial, sans-serif' }}>
      <h2 style={{ marginBottom: 24, fontWeight: 700, fontSize: 28, color: '#1976d2', textAlign: i18n.language === 'ar' ? 'right' : 'left', fontFamily: 'Tajawal, Arial, sans-serif' }}>{t('Users Management')}</h2>
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-start' }}>
        <Input
          placeholder={t('Search') + '...'}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          prefix={<SearchOutlined />}
          style={{ width: 180 }}
        />
        <Select
          placeholder={t('Role')}
          value={roleFilter}
          onChange={setRoleFilter}
          allowClear
          style={{ width: 120 }}
        >
          <Select.Option value="">{t('All')}</Select.Option>
          <Select.Option value="parent">{t('Parent')}</Select.Option>
          <Select.Option value="teacher">{t('Teacher')}</Select.Option>
          <Select.Option value="admin">{t('Admin')}</Select.Option>
        </Select>
        <Select
          placeholder={t('Status')}
          value={statusFilter}
          onChange={setStatusFilter}
          allowClear
          style={{ width: 120 }}
        >
          <Select.Option value="">{t('All')}</Select.Option>
          <Select.Option value="active">{t('Active')}</Select.Option>
          <Select.Option value="inactive">{t('Inactive')}</Select.Option>
        </Select>
        <DatePicker
          placeholder={t('Created At')}
          value={dateFilter}
          onChange={setDateFilter}
          style={{ width: 140 }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
          {t('Add')}
        </Button>
        <Button onClick={exportToExcel}>{t('Export to Excel')}</Button>
        <Button onClick={exportToPDF}>{t('Export to PDF')}</Button>
      </div>
      <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(25, 118, 210, 0.07)', padding: 0 }}>
        <Table
          columns={columns}
          dataSource={filteredUsers}
          loading={loading}
          rowKey="_id"
          pagination={{ pageSize: 10 }}
          style={{ minWidth: 1100, width: '100%', fontFamily: 'Tajawal, Arial, sans-serif' }}
          rowClassName={(_, idx) => 'custom-table-row'}
        />
      </div>
      <Modal
        title={selectedUser ? t('Edit') : t('Add')}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={handleOk}
        okText={t('Save')}
        cancelText={t('Cancel')}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item label={t('Name')} name="name" rules={[{ required: true, message: t('Please enter the name') }]}>
            <Input />
          </Form.Item>
          <Form.Item label={t('Email')} name="email" rules={[{ required: true, message: t('Please enter the email') }]}>
            <Input type="email" />
          </Form.Item>
          <Form.Item label={t('Password')} name="password" rules={[{ required: !selectedUser, message: t('Please enter the password') }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item label={t('Role')} name="role" rules={[{ required: true, message: t('Please select user role!') }]}>
            <Select>
              <Select.Option value="parent">{t('Parent')}</Select.Option>
              <Select.Option value="teacher">{t('Teacher')}</Select.Option>
              <Select.Option value="admin">{t('Admin')}</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Users;
 