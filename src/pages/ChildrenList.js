import React, { useState, useEffect, useCallback } from 'react';
import { 
  Button, 
  Input, 
  Table, 
  Space, 
  Card, 
  Modal, 
  message
} from 'antd';
import { 
  MessageOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { 
  collection, 
  query, 
  getDocs,
  doc,
  deleteDoc,
  getDoc
} from 'firebase/firestore';
import {db} from "../firebase/config";

const ChildrenList = () => {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const navigate = useNavigate();
  const { t } = useTranslation();

  const fetchChildren = useCallback(async () => {
    setLoading(true);
    try {
      const childrenQuery = query(collection(db, 'enfants'));
      const querySnapshot = await getDocs(childrenQuery);
      const childrenData = [];
      
      for (const doc of querySnapshot.docs) {
        const childData = { id: doc.id, ...doc.data() };
        
        // Fetch class name if classId exists
        if (childData.classeId) {
          const classDoc = await getDoc(doc(db, 'classes', childData.classeId));
          if (classDoc.exists()) {
            childData.className = classDoc.data().nom;
          }
        }
        
        childrenData.push(childData);
      }
      
      setChildren(childrenData);
    } catch (error) {
      console.error('Error fetching children:', error);
      message.error(t('error.fetchingChildren'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const handleDelete = async () => {
    if (!deleteId) return;
    
    setDeleteLoading(true);
    try {
      await deleteDoc(doc(db, 'enfants', deleteId));
      message.success(t('child.deletedSuccessfully'));
      fetchChildren();
    } catch (error) {
      console.error('Error deleting child:', error);
      message.error(t('error.deletingChild'));
    } finally {
      setDeleteId(null);
      setDeleteLoading(false);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  const filteredChildren = children.filter(child => {
    const matchesSearch = child.nom?.toLowerCase().includes(searchText.toLowerCase()) ||
                        child.prenom?.toLowerCase().includes(searchText.toLowerCase());
    return matchesSearch;
  });

  const columns = [
    {
      title: t('common.name'),
      dataIndex: 'nom',
      key: 'name',
      render: (_, record) => `${record.prenom} ${record.nom}`
    },
    {
      title: t('common.class'),
      dataIndex: 'className',
      key: 'class',
      render: (className) => className || t('common.notAssigned')
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="primary" 
            icon={<MessageOutlined />} 
            onClick={() => navigate(`/child/${record.id}/reports`)}
          >
            {t('common.reports')}
          </Button>
          <Button 
            danger
            onClick={() => setDeleteId(record.id)}
            loading={deleteLoading && deleteId === record.id}
          >
            {t('common.delete')}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card 
      title={t('children.title')}
      extra={
        <Input
          placeholder={t('common.search')}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 200 }}
        />
      }
    >
      <Table
        columns={columns}
        dataSource={filteredChildren}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
      
      <Modal
        title={t('common.confirmDelete')}
        open={!!deleteId}
        onOk={handleDelete}
        onCancel={() => setDeleteId(null)}
        confirmLoading={deleteLoading}
      >
        <p>{t('child.confirmDelete')}</p>
      </Modal>
    </Card>
  );
};

export default ChildrenList;