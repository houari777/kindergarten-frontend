import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useTranslation } from 'react-i18next';

function Messages() {
  const { t, i18n } = useTranslation();
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState('parent');
  const [recipient, setRecipient] = useState('all');
  const [message, setMessage] = useState('');
  const [sendError, setSendError] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  // جلب المستخدمين حسب الدور
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/users?role=${role}`, { headers: { Authorization: 'Bearer ' + token } });
        const data = await res.json();
        setUsers(data.users || []);
      } catch (err) {
        setUsers([]);
      }
    };
    fetchUsers();
  }, [role, token]);

  // جلب سجل الرسائل
  const fetchMessages = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/messages', { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
      } else {
        setError(data.message || t('حدث خطأ'));
      }
    } catch (err) {
      setError(t('Network error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // eslint-disable-next-line
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    setSendError('');
    setSendLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({
          role,
          recipient,
          message
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(t('تم إرسال الرسالة بنجاح'));
        setMessage('');
        fetchMessages();
      } else {
        setSendError(data.message || t('فشل الإرسال'));
      }
    } catch (err) {
      setSendError(t('Network error'));
    } finally {
      setSendLoading(false);
    }
  };

  // تصدير إلى Excel
  const exportToExcel = () => {
    const exportData = messages.map(msg => ({
      التاريخ: msg.createdAt ? new Date(msg.createdAt._seconds * 1000).toLocaleString() : '-',
      إلى: msg.recipient === 'all' ? `${t('جميع')} ${msg.role === 'parent' ? t('أولياء الأمور') : t('المعلمين')}` : msg.recipientName || msg.recipient,
      النص: msg.message,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'سجل الرسائل');
    XLSX.writeFile(wb, 'messages.xlsx');
  };

  // تصدير إلى PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    const exportData = messages.map(msg => [
      msg.createdAt ? new Date(msg.createdAt._seconds * 1000).toLocaleString() : '-',
      msg.recipient === 'all' ? `${t('جميع')} ${msg.role === 'parent' ? t('أولياء الأمور') : t('المعلمين')}` : msg.recipientName || msg.recipient,
      msg.message,
    ]);
    doc.autoTable({
      head: [[
        t('التاريخ'),
        t('إلى'),
        t('النص'),
      ]],
      body: exportData,
      styles: { font: 'arabic', fontStyle: 'normal', halign: 'right' },
      headStyles: { fillColor: [25, 118, 210] },
      margin: { right: 10, left: 10 },
    });
    doc.save('messages.pdf');
  };

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: 24 }}>
      <h2>{t('Messages')}</h2>
      {successMsg && <div style={{ color: 'green', marginBottom: 12 }}>{successMsg}</div>}
      <form onSubmit={handleSend} style={{ marginBottom: 32, background: '#f5f5f5', padding: 16, borderRadius: 8 }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <label>{t('Send to')}:</label>
          <select value={role} onChange={e => { setRole(e.target.value); setRecipient('all'); }}>
            <option value="parent">{t('Parent')}</option>
            <option value="teacher">{t('Teacher')}</option>
          </select>
          <select value={recipient} onChange={e => setRecipient(e.target.value)}>
            <option value="all">{t('All')} {role === 'parent' ? t('Parents') : t('Teachers')}</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
            ))}
          </select>
        </div>
        <div>
          <textarea value={message} onChange={e => setMessage(e.target.value)} required placeholder={t('Message text...')} style={{ width: '100%', minHeight: 60 }} />
        </div>
        {sendError && <div style={{ color: 'red', margin: '8px 0' }}>{sendError}</div>}
        <button type="submit" disabled={sendLoading} style={{ marginTop: 12 }}>{t('Send')}</button>
      </form>
      <h3>{t('Message Log')}</h3>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <button onClick={exportToExcel}>{t('Export to Excel')}</button>
        <button onClick={exportToPDF}>{t('Export to PDF')}</button>
      </div>
      {loading ? <div>{t('Loading...')}</div> : error ? <div style={{ color: 'red' }}>{error}</div> : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th>{t('Date')}</th>
              <th>{t('To')}</th>
              <th>{t('Message')}</th>
            </tr>
          </thead>
          <tbody>
            {messages.map(msg => (
              <tr key={msg.id}>
                <td>{msg.createdAt ? new Date(msg.createdAt._seconds * 1000).toLocaleString() : '-'}</td>
                <td>{msg.recipient === 'all' ? `${t('All')} ${role === 'parent' ? t('Parents') : t('Teachers')}` : msg.recipientName || msg.recipient}</td>
                <td>{msg.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Messages; 