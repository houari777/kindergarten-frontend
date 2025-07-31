import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import axios from 'axios';
import { useState, useEffect, useCallback } from 'react';

import { Table, Button, Modal, Form, Input, Select, message, DatePicker } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';

import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';
import { useAuth } from '../contexts/AuthContext';

const Users = () => {
  const { t } = useTranslation();
  const { token } = useAuth();
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

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error(t('Failed to load users'));
    }
    setLoading(false);
  }, [token, t]);

  const fetchChildren = useCallback(async () => {
    try {
      const res = await axios.get('/api/children', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChildren(res.data.children || []);
    } catch (error) {
      console.error('Error fetching children:', error);
      message.error(t('Failed to load children data'));
    }
  }, [token, t]);

  useEffect(() => {
    fetchUsers();
    fetchChildren();
  }, [fetchUsers, fetchChildren]);

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter ? user.role === roleFilter : true;
    const matchesStatus = statusFilter ? (user.active === (statusFilter === 'active')) : true;
    const matchesDate = dateFilter ? (user.createdAt && new Date(user.createdAt).toDateString() === dateFilter.format('ddd MMM DD YYYY')) : true;
    return matchesSearch && matchesRole && matchesStatus && matchesDate;
  });

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

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredUsers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    XLSX.writeFile(wb, 'users.xlsx');
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.text('Users Report', 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      
      const tableColumn = ['Name', 'Email', 'Role', 'Status', 'Created At'];
      const tableRows = [];
      
      filteredUsers.forEach(user => {
        const userData = [
          user.name || '-',
          user.email || '-',
          user.role || '-',
          user.status || '-',
          user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'
        ];
        tableRows.push(userData);
      });
      
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 30,
        styles: { 
          fontSize: 10,
          cellPadding: 3,
          textColor: [0, 0, 0],
          lineColor: [0, 0, 0],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { top: 30 }
      });
      
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.width - 30,
          doc.internal.pageSize.height - 10
        );
      }
      
      doc.save('users_report.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      message.error('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <div style={{ maxWidth: '100%', margin: '40px auto', padding: 24, fontFamily: 'Tajawal, Arial, sans-serif' }}>
      <h2 style={{ marginBottom: 24, fontWeight: 700, fontSize: 28, color: '#1976d2', textAlign: t('Users Management') === 'إدارة المستخدمين' ? 'right' : 'left', fontFamily: 'Tajawal, Arial, sans-serif' }}>{t('Users Management')}</h2>
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