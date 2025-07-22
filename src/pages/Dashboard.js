import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, Row, Col, Statistic, message, Spin } from 'antd';
import { Pie } from '@ant-design/plots';
import { useTranslation } from 'react-i18next';
import { 
  TeamOutlined, 
  UserOutlined, 
  SolutionOutlined, 
  BellOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import '../styles/dashboard.css';

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const [stats, setStats] = useState({
    children: 0,
    parents: 0,
    teachers: 0,
    billsPaid: 0,
    billsUnpaid: 0,
    messages: 0,
  });
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [childrenRes, usersRes, billsRes, notificationsRes] = await Promise.all([
        axios.get('/api/children', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/users', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/bills', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/notifications', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const children = childrenRes.data.children || [];
      const users = usersRes.data.users || [];
      const bills = billsRes.data.bills || [];
      const notifications = notificationsRes.data.notifications || [];
      setStats({
        children: children.length,
        parents: users.filter(u => u.role === 'parent').length,
        teachers: users.filter(u => u.role === 'teacher').length,
        billsPaid: bills.filter(b => b.status === 'paid').length,
        billsUnpaid: bills.filter(b => b.status === 'unpaid').length,
        messages: notifications.length,
      });
    } catch (err) {
      message.error('حدث خطأ أثناء جلب الإحصائيات');
    }
    setLoading(false);
  };

  const billsPieData = [
    { type: t('Paid'), value: stats.billsPaid },
    { type: t('Unpaid'), value: stats.billsUnpaid },
  ];

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="dashboard-container" style={{ direction: i18n.language === 'ar' ? 'rtl' : 'ltr' }}>
      <h1 className="dashboard-title">{t('Dashboard')}</h1>
      
      <Row gutter={[20, 20]} className="stats-row">
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" style={{ background: '#1a237e' }}>
            <TeamOutlined className="stat-icon" />
            <Statistic 
              title={t('Children')} 
              value={stats.children}
              valueStyle={{ color: 'white' }}
              className="statistic"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" style={{ background: '#303f9f' }}>
            <UserOutlined className="stat-icon" />
            <Statistic 
              title={t('Parents')} 
              value={stats.parents}
              valueStyle={{ color: 'white' }}
              className="statistic"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" style={{ background: '#3949ab' }}>
            <SolutionOutlined className="stat-icon" />
            <Statistic 
              title={t('Teachers')} 
              value={stats.teachers}
              valueStyle={{ color: 'white' }}
              className="statistic"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" style={{ background: '#5c6bc0' }}>
            <BellOutlined className="stat-icon" />
            <Statistic 
              title={t('Notifications')} 
              value={stats.messages}
              valueStyle={{ color: 'white' }}
              className="statistic"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[20, 20]} className="charts-row">
        <Col xs={24} lg={12}>
          <Card className="chart-card" title={
            <div className="chart-title">
              <CheckCircleOutlined style={{ color: '#4caf50', marginLeft: '8px' }} />
              <span>{t('Bills Status')}</span>
            </div>
          }>
            <div className="chart-container">
              <Pie
                data={billsPieData}
                angleField="value"
                colorField="type"
                radius={0.8}
                innerRadius={0.6}
                label={{
                  content: (data) => {
                    const total = billsPieData.reduce((sum, item) => sum + item.value, 0);
                    return total > 0 ? `${Math.round((data.value / total) * 100)}%` : '0%';
                  },
                  style: {
                    fontSize: 14,
                    fill: '#fff',
                    textAlign: 'center',
                  },
                  offset: '-30%',
                }}
                interactions={[{ type: 'element-active' }]}
                legend={{
                  position: 'bottom',
                  itemName: {
                    style: {
                      fontSize: 14,
                    },
                  },
                }}
                color={['#4caf50', '#f44336']}
                height={300}
              />
            </div>
            <div className="chart-summary">
              <div className="summary-item">
                <CheckCircleOutlined style={{ color: '#4caf50', fontSize: '18px' }} />
                <span>{t('Paid')}: {stats.billsPaid}</span>
              </div>
              <div className="summary-item">
                <CloseCircleOutlined style={{ color: '#f44336', fontSize: '18px' }} />
                <span>{t('Unpaid')}: {stats.billsUnpaid}</span>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard; 