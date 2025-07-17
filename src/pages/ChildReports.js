import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useTranslation } from 'react-i18next';

function ChildReports() {
  const { t, i18n } = useTranslation();
  const { childId } = useParams();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newReport, setNewReport] = useState({ date: '', type: 'يومي', content: '' });
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const [editReport, setEditReport] = useState(null);
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const token = localStorage.getItem('token');

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`http://localhost:5000/api/reports?childId=${childId}`, { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      if (data.success) {
        setReports(data.reports);
      } else {
        setError(data.message || t('Error occurred'));
      }
    } catch (err) {
      setError(t('Network error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line
  }, [childId]);

  const handleAddReport = async (e) => {
    e.preventDefault();
    setAddError('');
    setAddLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ ...newReport, childId })
      });
      const data = await res.json();
      if (data.success) {
        setShowAdd(false);
        setNewReport({ date: '', type: 'يومي', content: '' });
        setSuccessMsg(t('Report added successfully'));
        fetchReports();
      } else {
        setAddError(data.message || t('Addition failed'));
      }
    } catch (err) {
      setAddError(t('Network error'));
    } finally {
      setAddLoading(false);
    }
  };

  const handleEditReport = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/reports/${editReport.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ date: editReport.date, type: editReport.type, content: editReport.content })
      });
      const data = await res.json();
      if (data.success) {
        setShowEdit(false);
        setEditReport(null);
        setSuccessMsg(t('Report updated successfully'));
        fetchReports();
      } else {
        setEditError(data.message || t('Edit failed'));
      }
    } catch (err) {
      setEditError(t('Network error'));
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteReport = async (id) => {
    setDeleteLoading(true);
    setSuccessMsg('');
    try {
      const res = await fetch(`http://localhost:5000/api/reports/${id}`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + token }
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(t('Report deleted successfully'));
        fetchReports();
      }
    } catch (err) {}
    setDeleteId(null);
    setDeleteLoading(false);
  };

  // تصدير إلى Excel
  const exportToExcel = () => {
    const exportData = reports.map(rep => ({
      التاريخ: rep.date,
      النوع: rep.type,
      المحتوى: rep.content,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'تقارير الطفل');
    XLSX.writeFile(wb, 'child_reports.xlsx');
  };

  // تصدير إلى PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    const exportData = reports.map(rep => [
      rep.date,
      rep.type,
      rep.content,
    ]);
    doc.autoTable({
      head: [[
        t('Date'),
        t('Type'),
        t('Content'),
      ]],
      body: exportData,
      styles: { font: 'arabic', fontStyle: 'normal', halign: 'right' },
      headStyles: { fillColor: [25, 118, 210] },
      margin: { right: 10, left: 10 },
    });
    doc.save('child_reports.pdf');
  };

  if (loading) return <div style={{ margin: 40 }}>{t('Loading', 'جاري التحميل...')}</div>;
  if (error) return <div style={{ color: 'red', margin: 40 }}>{t(error)}</div>;
  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: 24, direction: i18n.language === 'ar' ? 'rtl' : 'ltr' }}>
      <h2>{t('Child Reports')}</h2>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <button onClick={exportToExcel}>{t('Export to Excel')}</button>
        <button onClick={exportToPDF}>{t('Export to PDF')}</button>
      </div>
      {successMsg && <div style={{ color: 'green', marginBottom: 12 }}>{successMsg}</div>}
      <button style={{ marginBottom: 16 }} onClick={() => setShowAdd(true)}>{t('Add Report')}</button>
      {showAdd && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 8, minWidth: 350, position: 'relative' }}>
            <button onClick={() => setShowAdd(false)} style={{ position: 'absolute', top: 8, right: 8 }}>{t('Close')}</button>
            <h3>{t('Add New Report')}</h3>
            <form onSubmit={handleAddReport}>
              <div>
                <label>{t('Date')}:</label>
                <input type="date" value={newReport.date} onChange={e => setNewReport({ ...newReport, date: e.target.value })} required style={{ width: '100%' }} />
              </div>
              <div>
                <label>{t('Report Type')}:</label>
                <select value={newReport.type} onChange={e => setNewReport({ ...newReport, type: e.target.value })} style={{ width: '100%' }}>
                  <option value="يومي">{t('Daily')}</option>
                  <option value="أسبوعي">{t('Weekly')}</option>
                </select>
              </div>
              <div>
                <label>{t('Content')}:</label>
                <textarea value={newReport.content} onChange={e => setNewReport({ ...newReport, content: e.target.value })} required style={{ width: '100%' }} />
              </div>
              {addError && <div style={{ color: 'red', margin: '8px 0' }}>{addError}</div>}
              <button type="submit" disabled={addLoading} style={{ width: '100%', marginTop: 12 }}>{t('Add')}</button>
            </form>
          </div>
        </div>
      )}
      {showEdit && editReport && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 8, minWidth: 350, position: 'relative' }}>
            <button onClick={() => setShowEdit(false)} style={{ position: 'absolute', top: 8, right: 8 }}>{t('Close')}</button>
            <h3>{t('Edit Report')}</h3>
            <form onSubmit={handleEditReport}>
              <div>
                <label>{t('Date')}:</label>
                <input type="date" value={editReport.date} onChange={e => setEditReport({ ...editReport, date: e.target.value })} required style={{ width: '100%' }} />
              </div>
              <div>
                <label>{t('Report Type')}:</label>
                <select value={editReport.type} onChange={e => setEditReport({ ...editReport, type: e.target.value })} style={{ width: '100%' }}>
                  <option value="يومي">{t('Daily')}</option>
                  <option value="أسبوعي">{t('Weekly')}</option>
                </select>
              </div>
              <div>
                <label>{t('Content')}:</label>
                <textarea value={editReport.content} onChange={e => setEditReport({ ...editReport, content: e.target.value })} required style={{ width: '100%' }} />
              </div>
              {editError && <div style={{ color: 'red', margin: '8px 0' }}>{editError}</div>}
              <button type="submit" disabled={editLoading} style={{ width: '100%', marginTop: 12 }}>{t('Save Changes')}</button>
            </form>
          </div>
        </div>
      )}
      {deleteId && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 8, minWidth: 350, position: 'relative' }}>
            <h3>{t('Confirm Delete')}</h3>
            <p>{t('Are you sure you want to delete this report?')}</p>
            <button onClick={() => handleDeleteReport(deleteId)} disabled={deleteLoading} style={{ color: 'red', marginRight: 8 }}>{t('Confirm Delete')}</button>
            <button onClick={() => setDeleteId(null)} disabled={deleteLoading}>{t('Cancel')}</button>
          </div>
        </div>
      )}
      {loading ? <div>{t('Loading', 'جاري التحميل...')}</div> : error ? <div style={{ color: 'red' }}>{t(error)}</div> : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th>{t('Date')}</th>
              <th>{t('Type')}</th>
              <th>{t('Content')}</th>
              <th>{t('Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {reports.map(rep => (
              <tr key={rep.id}>
                <td>{rep.date}</td>
                <td>{rep.type}</td>
                <td>{rep.content}</td>
                <td>
                  <button onClick={() => { setEditReport({ ...rep }); setShowEdit(true); }}>{t('Edit')}</button>
                  <button style={{ color: 'red', marginRight: 8 }} onClick={() => setDeleteId(rep.id)}>{t('Delete')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ChildReports; 