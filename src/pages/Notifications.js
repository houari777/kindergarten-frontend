import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Button,
  Table,
  Modal,
  Form,
  Input,
  message,
  Tag,
  Select,
} from 'antd';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useTranslation } from 'react-i18next';

const Notifications = () => {
  const { t, i18n } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [userType, setUserType] = useState('teacher');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('all');

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchNotifications();
    fetchUsers(userType);
    // eslint-disable-next-line
  }, [userType]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data.notifications || []);
    } catch (err) {
      message.error(t('Network error'));
    }
    setLoading(false);
  };

  const fetchUsers = async (role) => {
    try {
      const res = await axios.get('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
        params: { role },
      });
      setUsers(res.data.users || []);
    } catch (err) {
      setUsers([]);
    }
  };

  const handleSend = () => {
    form.resetFields();
    setModalVisible(true);
    setUserType('teacher');
    setSelectedUser('all');
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      let tokens = [];
      if (selectedUser === 'all') {
        tokens = users.map(u => u.fcmToken).filter(Boolean);
      } else {
        const user = users.find(u => u.id === selectedUser);
        if (user && user.fcmToken) tokens = [user.fcmToken];
      }
      if (!tokens.length) {
        message.error(t('No valid FCM tokens for sending'));
        return;
      }
      setLoading(true);
      await axios.post('/api/notifications/send', {
        title: values.title,
        body: values.body,
        tokens,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success(t('Notification sent successfully'));
      setModalVisible(false);
      fetchNotifications();
    } catch (err) {
      message.error(t('Error sending notification'));
    }
    setLoading(false);
  };

  // تصدير إلى Excel
  const exportToExcel = () => {
    const exportData = notifications.map(n => ({
      العنوان: n.title,
      النص: n.body,
      'عدد الأجهزة': Array.isArray(n.tokens) ? n.tokens.length : 1,
      الوقت: n.sentAt?.seconds ? new Date(n.sentAt.seconds * 1000).toLocaleString('ar-EG') : '-',
      النتيجة: n.response && n.response.success ? t('Success') : t('Error'),
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'سجل الإشعارات');
    XLSX.writeFile(wb, 'notifications.xlsx');
  };

  // تصدير إلى PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    const exportData = notifications.map(n => [
      n.title,
      n.body,
      Array.isArray(n.tokens) ? n.tokens.length : 1,
      n.sentAt?.seconds ? new Date(n.sentAt.seconds * 1000).toLocaleString('ar-EG') : '-',
      n.response && n.response.success ? t('Success') : t('Error'),
    ]);
    doc.autoTable({
      head: [[
        t('Title'),
        t('Body'),
        t('Number of Devices'),
        t('Time'),
        t('Result'),
      ]],
      body: exportData,
      styles: { font: 'arabic', fontStyle: 'normal', halign: 'right' },
      headStyles: { fillColor: [25, 118, 210] },
      margin: { right: 10, left: 10 },
    });
    doc.save('notifications.pdf');
  };

  const columns = [
    {
      title: t('Title'),
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: t('Body'),
      dataIndex: 'body',
      key: 'body',
    },
    {
      title: t('Number of Devices'),
      dataIndex: 'tokens',
      key: 'tokens',
      render: (tokens) => Array.isArray(tokens) ? tokens.length : 1,
    },
    {
      title: t('Time'),
      dataIndex: 'sentAt',
      key: 'sentAt',
      render: (sentAt) => sentAt?.seconds ? new Date(sentAt.seconds * 1000).toLocaleString(i18n.language) : '-',
    },
    {
      title: t('Result'),
      dataIndex: 'response',
      key: 'response',
      render: (response) => response && response.success ? <Tag color="green">{t('Success')}</Tag> : <Tag color="red">{t('Error')}</Tag>,
    },
  ];

  return (
    <div style={{ direction: i18n.language === 'ar' ? 'rtl' : 'ltr', padding: 24 }}>
      <h2>{t('Notifications')}</h2>
      <Button type="primary" onClick={handleSend} style={{ marginBottom: 16 }}>
        {t('Send New Notification')}
      </Button>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <Button onClick={exportToExcel}>{t('Export to Excel')}</Button>
        <Button onClick={exportToPDF}>{t('Export to PDF')}</Button>
      </div>
      <Table
        columns={columns}
        dataSource={notifications}
        rowKey={(r) => r.id}
        loading={loading}
        pagination={{ pageSize: 10 }}
        bordered
      />
      <Modal
        title={t('Send New Notification')}
        visible={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        okText={t('Send')}
        cancelText={t('Cancel')}
      >
        <Form form={form} layout="vertical">
          <Form.Item label={t('Category')} required>
            <Select value={userType} onChange={v => { setUserType(v); setSelectedUser('all'); fetchUsers(v); }}>
              <Select.Option value="teacher">{t('Teachers')}</Select.Option>
              <Select.Option value="parent">{t('Parents')}</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label={t('Recipient')} required>
            <Select value={selectedUser} onChange={setSelectedUser} showSearch optionFilterProp="children">
              <Select.Option value="all">{t('All')} {userType === 'teacher' ? t('Teachers') : t('Parents')}</Select.Option>
              {users.map(u => (
                <Select.Option key={u.id} value={u.id}>{u.name} ({u.email})</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="title" label={t('Title')} rules={[{ required: true, message: t('Please enter the title') }]}> 
            <Input />
          </Form.Item>
          <Form.Item name="body" label={t('Body')} rules={[{ required: true, message: t('Please enter the notification body') }]}> 
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Notifications; 