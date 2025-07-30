import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Input, 
  Select, 
  Form, 
  DatePicker, 
  message, 
  Space, 
  Modal, 
  Popconfirm, 
  Badge, 
  Spin 
} from 'antd';
import { 
  SearchOutlined, 
  FilePdfOutlined, 
  FileExcelOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined 
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/ar';
import 'moment/locale/fr';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useTranslation } from 'react-i18next';

const { Option } = Select;

function Bills() {
  const { t, i18n } = useTranslation();
  const [bills, setBills] = useState([]);
  const [children, setChildren] = useState([]);
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [form] = Form.useForm();
  const [filters, setFilters] = useState({ childId: '', parentId: '', status: '' });

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchBills();
    fetchChildren();
    fetchParents();
    // eslint-disable-next-line
  }, []);

  const fetchBills = async (params = {}) => {
    setLoading(true);
    try {
      const res = await axios.get('/api/bills', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setBills(res.data.bills || []);
    } catch (err) {
      message.error(t('Network error'));
    }
    setLoading(false);
  };

  const fetchChildren = async () => {
    try {
      const res = await axios.get('/api/children', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChildren(res.data.children || []);
    } catch (error) {
      console.error('Error fetching children:', error);
      message.error('Failed to load children data');
    }
  };

  const fetchParents = async () => {
    try {
      const res = await axios.get('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
        params: { role: 'parent' },
      });
      setParents(res.data.users || []);
    } catch (error) {
      console.error('Error fetching parents:', error);
      message.error('Failed to load parents data');
    }
  };

  const handleAdd = () => {
    setEditingBill(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (bill) => {
    setEditingBill(bill);
    form.setFieldsValue({
      ...bill,
      dueDate: bill.dueDate ? moment(bill.dueDate) : null,
      paidAt: bill.paidAt ? moment(bill.paidAt) : null,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await axios.delete(`/api/bills/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success(t('Bill deleted successfully'));
      fetchBills(filters);
    } catch (err) {
      message.error(t('Network error'));
    }
    setLoading(false);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        ...values,
        dueDate: values.dueDate ? values.dueDate.format('YYYY-MM-DD') : '',
        paidAt: values.paidAt ? values.paidAt.format('YYYY-MM-DD') : null,
      };
      setLoading(true);
      if (editingBill) {
        await axios.put(`/api/bills/${editingBill.id}`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
        message.success(t('Bill updated successfully'));
      } else {
        await axios.post('/api/bills', data, {
          headers: { Authorization: `Bearer ${token}` },
        });
        message.success(t('Bill added successfully'));
      }
      setIsModalVisible(false);
      fetchBills(filters);
    } catch (err) {
      message.error(t('Network error'));
    }
    setLoading(false);
  };

  const handleFilter = (changed) => {
    const newFilters = { ...filters, ...changed };
    setFilters(newFilters);
    fetchBills(newFilters);
  };

  // تصدير إلى Excel
  const exportToExcel = () => {
    const exportData = bills.map(bill => ({
      الطفل: children.find(c => c.id === bill.childId)?.name || '-',
      'ولي الأمر': parents.find(p => p.id === bill.parentId)?.name || '-',
      المبلغ: bill.amount,
      'تاريخ الاستحقاق': bill.dueDate,
      الحالة: bill.status === 'paid' ? 'مدفوع' : 'غير مدفوع',
      'تاريخ الدفع': bill.paidAt || '-',
      الوصف: bill.description || '-',
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'الفواتير');
    XLSX.writeFile(wb, 'bills.xlsx');
  };

  // تصدير إلى PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    const exportData = bills.map(bill => [
      children.find(c => c.id === bill.childId)?.name || '-',
      parents.find(p => p.id === bill.parentId)?.name || '-',
      bill.amount,
      bill.dueDate,
      bill.status === 'paid' ? 'مدفوع' : 'غير مدفوع',
      bill.paidAt || '-',
      bill.description || '-',
    ]);
    doc.autoTable({
      head: [[
        'الطفل',
        'ولي الأمر',
        'المبلغ',
        'تاريخ الاستحقاق',
        'الحالة',
        'تاريخ الدفع',
        'الوصف',
      ]],
      body: exportData,
      styles: { font: 'arabic', fontStyle: 'normal', halign: 'right' },
      headStyles: { fillColor: [25, 118, 210] },
      margin: { right: 10, left: 10 },
    });
    doc.save('bills.pdf');
  };

  const columns = [
    {
      title: 'الطفل',
      dataIndex: 'childId',
      key: 'childId',
      render: (id) => children.find((c) => c.id === id)?.name || '-',
    },
    {
      title: 'ولي الأمر',
      dataIndex: 'parentId',
      key: 'parentId',
      render: (id) => parents.find((p) => p.id === id)?.name || '-',
    },
    {
      title: 'المبلغ',
      dataIndex: 'amount',
      key: 'amount',
    },
    {
      title: 'تاريخ الاستحقاق',
      dataIndex: 'dueDate',
      key: 'dueDate',
    },
    {
      title: t('Status'),
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Badge color={status === 'paid' ? 'green' : 'red'} text={status === 'paid' ? t('Paid') : t('Unpaid')} />,
    },
    {
      title: 'تاريخ الدفع',
      dataIndex: 'paidAt',
      key: 'paidAt',
    },
    {
      title: 'الوصف',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'إجراءات',
      key: 'actions',
      render: (_, bill) => (
        <>
          <Button type="link" onClick={() => handleEdit(bill)}>
            {t('Edit')}
          </Button>
          <Popconfirm title="هل أنت متأكد من الحذف؟" onConfirm={() => handleDelete(bill.id)} okText="نعم" cancelText="لا">
            <Button type="link" danger>
              {t('Delete')}
            </Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <div style={{ direction: i18n.language === 'ar' ? 'rtl' : 'ltr', padding: 24 }}>
      <h2>{t('Bills')}</h2>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <Button onClick={exportToExcel}>{t('Export to Excel')}</Button>
        <Button onClick={exportToPDF}>{t('Export to PDF')}</Button>
        <Select
          placeholder={t('Select Child')}
          style={{ width: 150 }}
          allowClear
          value={filters.childId || undefined}
          onChange={(v) => handleFilter({ childId: v })}
        >
          {children.map((c) => (
            <Option key={c.id} value={c.id}>{c.name}</Option>
          ))}
        </Select>
        <Select
          placeholder={t('Select Parent')}
          style={{ width: 150 }}
          allowClear
          value={filters.parentId || undefined}
          onChange={(v) => handleFilter({ parentId: v })}
        >
          {parents.map((p) => (
            <Option key={p.id} value={p.id}>{p.name}</Option>
          ))}
        </Select>
        <Select
          placeholder={t('Status')}
          style={{ width: 120 }}
          allowClear
          value={filters.status || undefined}
          onChange={(v) => handleFilter({ status: v })}
        >
          <Option value="paid">{t('Paid')}</Option>
          <Option value="unpaid">{t('Unpaid')}</Option>
        </Select>
        <Button type="primary" onClick={handleAdd} style={{ marginRight: 'auto' }}>
          {t('Add Bill')}
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={bills}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        bordered
      />
      <Modal
        title={editingBill ? t('Edit Bill') : t('Add Bill')}
        visible={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        okText={t('Save')}
        cancelText={t('Cancel')}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="childId" label={t('Child')} rules={[{ required: true, message: t('Please select a child') }]}> 
            <Select placeholder={t('Select Child')}>
              {children.map((c) => (
                <Option key={c.id} value={c.id}>{c.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="parentId" label={t('Parent')} rules={[{ required: true, message: t('Please select a parent') }]}> 
            <Select placeholder={t('Select Parent')}>
              {parents.map((p) => (
                <Option key={p.id} value={p.id}>{p.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="amount" label={t('Amount')} rules={[{ required: true, message: t('Please enter the amount') }]}> 
            <Input type="number" min={0} />
          </Form.Item>
          <Form.Item name="dueDate" label={t('Due Date')} rules={[{ required: true, message: t('Please select a due date') }]}> 
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="status" label={t('Status')} initialValue="unpaid">
            <Select>
              <Option value="paid">{t('Paid')}</Option>
              <Option value="unpaid">{t('Unpaid')}</Option>
            </Select>
          </Form.Item>
          <Form.Item name="paidAt" label={t('Payment Date')}>
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="description" label={t('Description')}>
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Bills;