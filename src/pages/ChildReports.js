import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useTranslation } from 'react-i18next';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, getDoc } from 'firebase/firestore';
import { db } from 'firebase/config';
import { message } from 'antd';

// Import our Arabic PDF utility
import { loadFonts } from 'utils/arabicFonts';

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
  const [showEdit, setShowEdit] = useState(false);
  const [editReport, setEditReport] = useState(null);
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [attestation, setAttestation] = useState(null);
  const [attestationLoading, setAttestationLoading] = useState(false);
  const [attestationError, setAttestationError] = useState('');

  // Fetch reports from Firestore
  useEffect(() => {
    if (!childId) return;
    
    console.log('Setting up reports listener for child:', childId);
    setLoading(true);
    
    const reportsQuery = query(collection(db, 'reports'), where('childId', '==', childId));
    
    const unsubscribe = onSnapshot(
      reportsQuery,
      (snapshot) => {
        console.log('Reports snapshot received, docs count:', snapshot.docs.length);
        const reportsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('Reports data:', reportsData);
        setReports(reportsData);
        setLoading(false);
        setError('');
      },
      (error) => {
        console.error('Error in reports listener:', error);
        setError('Failed to load reports: ' + error.message);
        setLoading(false);
      }
    );

    return () => {
      console.log('Cleaning up reports listener');
      unsubscribe();
    };
  }, [childId]);

  // Fetch attestation from Firestore
  useEffect(() => {
    if (!childId) return;
    
    console.log('Setting up attestation listener for child:', childId);
    setAttestationLoading(true);
    
    const attestationQuery = query(collection(db, 'attestations'), where('childId', '==', childId));
    
    const unsubscribe = onSnapshot(
      attestationQuery,
      (snapshot) => {
        console.log('Attestation snapshot received, docs count:', snapshot.docs.length);
        if (!snapshot.empty) {
          const attestationData = snapshot.docs[0].data();
          console.log('Attestation data:', attestationData);
          setAttestation(attestationData);
        } else {
          setAttestation(null);
        }
        setAttestationLoading(false);
        setAttestationError('');
      },
      (error) => {
        console.error('Error in attestation listener:', error);
        setAttestationError('Failed to load attestation: ' + error.message);
        setAttestationLoading(false);
      }
    );

    return () => {
      console.log('Cleaning up attestation listener');
      unsubscribe();
    };
  }, [childId]);

  const handleAddReport = async (e) => {
    e.preventDefault();
    setAddError('');
    setAddLoading(true);
    
    try {
      console.log('Adding new report:', { ...newReport, childId });
      await addDoc(collection(db, 'reports'), {
        date: newReport.date,
        type: newReport.type,
        content: newReport.content,
        childId: childId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      message.success(t('Report added successfully'));
      setNewReport({ date: '', type: 'يومي', content: '' });
      setShowAdd(false);
    } catch (error) {
      console.error('Error adding report:', error);
      setAddError(t('Failed to add report: ') + error.message);
    } finally {
      setAddLoading(false);
    }
  };

  const handleEditReport = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditLoading(true);
    
    try {
      console.log('Updating report:', editReport);
      await updateDoc(doc(db, 'reports', editReport.id), {
        date: editReport.date,
        type: editReport.type,
        content: editReport.content,
        updatedAt: new Date()
      });
      
      message.success(t('Report updated successfully'));
      setShowEdit(false);
      setEditReport(null);
    } catch (error) {
      console.error('Error updating report:', error);
      setEditError(t('Failed to update report: ') + error.message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!reportId) {
      setDeleteId(null);
      return;
    }
    
    setDeleteLoading(true);
    
    try {
      console.log('Deleting report:', reportId);
      await deleteDoc(doc(db, 'reports', reportId));
      message.success(t('Report deleted successfully'));
      setDeleteId(null);
    } catch (error) {
      console.error('Error deleting report:', error);
      message.error(t('Failed to delete report: ') + error.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Export to Excel
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

  // PDF export with Arabic support
  const exportToPDF = async () => {
    try {
      setLoading(true);
      
      // Get the pdfmake instance
      const pdfMake = window.pdfMake;
      if (!pdfMake) {
        throw new Error('PDF library not loaded');
      }
      
      try {
        // Load Arabic fonts
        const fontsLoaded = await loadFonts();
        if (!fontsLoaded) {
          throw new Error('Failed to load Arabic fonts');
        }
      } catch (fontError) {
        console.error('Font loading error:', fontError);
        // Continue with default fonts if Arabic font loading fails
        console.warn('Falling back to default fonts');
      }
      
      // Prepare table data
      const tableBody = [
        // Table header
        [
          { text: 'التاريخ', style: 'tableHeader' },
          { text: 'نوع التقرير', style: 'tableHeader' },
          { text: 'المحتوى', style: 'tableHeader' }
        ],
        // Table rows
        ...reports.map(report => ([ 
          report.date || '-',
          report.type || '-',
          report.content || '-'
        ]))
      ];
      
      // Document definition
      const docDefinition = {
        pageOrientation: 'portrait',
        pageSize: 'A4',
        content: [
          { 
            text: 'تقرير أنشطة الطفل', 
            style: 'header',
            alignment: 'center',
            margin: [0, 0, 0, 10]
          },
          { 
            text: `تاريخ التصدير: ${new Date().toLocaleDateString('ar-EG')}`, 
            style: 'subheader',
            alignment: 'right',
            margin: [0, 0, 0, 20]
          },
          {
            table: {
              headerRows: 1,
              widths: ['auto', 'auto', '*'],
              body: tableBody
            },
            layout: {
              fillColor: (rowIndex) => rowIndex % 2 === 0 ? '#f5f5f5' : null,
              hLineWidth: () => 0.5,
              vLineWidth: () => 0.5,
              hLineColor: () => '#cccccc',
              vLineColor: () => '#cccccc',
              paddingTop: () => 5,
              paddingBottom: () => 5,
              paddingLeft: () => 10,
              paddingRight: () => 10,
            }
          }
        ],
        styles: {
          header: {
            fontSize: 18,
            bold: true
          },
          subheader: {
            fontSize: 12
          },
          tableHeader: {
            bold: true,
            fontSize: 12,
            color: 'white',
            fillColor: '#1976d2',
            alignment: 'center',
            margin: [0, 5, 0, 5]
          }
        },
        defaultStyle: {
          font: 'Amiri',
          alignment: 'right',
          rtl: true,
          fontSize: 11,
          lineHeight: 1.5
        },
        // Set default font family
        defaultFont: 'Amiri'
      };
      
      // Create and download PDF
      pdfMake.createPdf(docDefinition).download('تقرير_الطفل.pdf');
      
    } catch (error) {
      console.error('Error in ChildReports:', error);
      alert('حدث خطأ أثناء إنشاء ملف PDF. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  // PDF export for attestation
  const exportAttestationToPDF = async () => {
    try {
      setLoading(true);
      
      // Get the pdfmake instance
      const pdfMake = window.pdfMake;
      if (!pdfMake) {
        throw new Error('PDF library not loaded');
      }
      
      try {
        // Load Arabic fonts
        const fontsLoaded = await loadFonts();
        if (!fontsLoaded) {
          throw new Error('Failed to load Arabic fonts');
        }
      } catch (fontError) {
        console.error('Font loading error:', fontError);
        console.warn('Falling back to default fonts');
      }
      
      // Format date in French format (DD/MM/YYYY)
      const formatFrenchDate = (date) => {
        if (!date) return new Date().toLocaleDateString('fr-FR');
        const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
        return d.toLocaleDateString('fr-FR');
      };

      // Document definition
      const docDefinition = {
        pageOrientation: 'portrait',
        pageSize: 'A4',
        pageMargins: [40, 60, 40, 60],
        content: [
          { 
            text: 'شهادة تسجيل الطفل', 
            style: 'header',
            alignment: 'center',
            margin: [0, 0, 0, 40]
          },
          {
            text: 'تمهيدي :الصف',
            style: 'infoLine',
            alignment: 'right',
            margin: [0, 0, 0, 15]
          },
          {
            text: ':ولي الأمر',
            style: 'infoLine',
            alignment: 'right',
            margin: [0, 0, 0, 15]
          },
          {
            text: `${formatFrenchDate(attestation.inscriptionDate || new Date())} :تاريخ التسجيل`,
            style: 'infoLine',
            alignment: 'right',
            margin: [0, 0, 0, 15]
          },
          {
            text: `نشهد بأن الطفل/الطفلة ${attestation.childName || 'الطفل'} مسجل/ة في مؤسستنا التعليمية.`,
            style: 'attestationMessage',
            alignment: 'right',
            margin: [0, 40, 0, 40]
          },
          {
            text: '___________________',
            alignment: 'right',
            margin: [0, 0, 0, 10]
          },
          {
            text: 'توقيع',
            style: 'signature',
            alignment: 'right',
            margin: [0, 0, 0, 0]
          }
        ],
        styles: {
          header: {
            fontSize: 20,
            bold: true,
            color: '#2c3e50',
            font: 'Amiri'
          },
          infoLine: {
            fontSize: 14,
            lineHeight: 1.5,
            font: 'Amiri'
          },
          attestationMessage: {
            fontSize: 16,
            lineHeight: 1.8,
            bold: true,
            color: '#2c3e50',
            alignment: 'right',
            font: 'Amiri'
          },
          signature: {
            fontSize: 14,
            bold: true,
            font: 'Amiri'
          }
        },
        defaultStyle: {
          font: 'Amiri',
          fontSize: 12,
          lineHeight: 1.5
        }
      };
      
      // Create and download PDF
      pdfMake.createPdf(docDefinition).download(`شهادة_تسجيل_الطفل_${attestation.childName || 'الطفل'}.pdf`);
      
    } catch (error) {
      console.error('Error in exportAttestationToPDF:', error);
      alert('حدث خطأ أثناء إنشاء ملف PDF. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAttestation = async () => {
    setAttestationLoading(true);
    setAttestationError('');
    
    try {
      // Check if attestation already exists
      const attestationQuery = query(collection(db, 'attestations'), where('childId', '==', childId));
      const existingAttestations = await getDocs(attestationQuery);
      
      if (!existingAttestations.empty) {
        // Attestation already exists, just show it
        const attestationData = existingAttestations.docs[0].data();
        setAttestation(attestationData);
        setAttestationLoading(false);
        message.success(t('Attestation loaded successfully'));
        return;
      }
      
      // Try different collection names for children data
      let childData = null;
      let childDoc = null;
      
      // Try 'enfants' collection first
      try {
        childDoc = await getDoc(doc(db, 'enfants', childId));
        if (childDoc.exists()) {
          childData = childDoc.data();
        }
      } catch (error) {
        console.log('Child not found in enfants collection');
      }
      
      // Try 'children' collection if not found in 'enfants'
      if (!childData) {
        try {
          childDoc = await getDoc(doc(db, 'children', childId));
          if (childDoc.exists()) {
            childData = childDoc.data();
          }
        } catch (error) {
          console.log('Child not found in children collection');
        }
      }
      
      // If still not found, create a basic attestation with the childId
      if (!childData) {
        console.log('Child document not found, creating basic attestation');
        childData = {
          name: 'Child ' + childId,
          classeId: 'Unknown',
          parentId: 'Unknown'
        };
      }
      
      // Generate new attestation
      const attestationData = {
        childId: childId,
        childName: childData.name || 'Child ' + childId,
        classId: childData.classeId || childData.classId || 'Unknown',
        parentIds: childData.parentId || childData.parentIds || 'Unknown',
        inscriptionDate: new Date(),
        message: i18n.language === 'ar' 
          ? `نشهد بأن الطفل/الطفلة ${childData.name || 'Child ' + childId} مسجل/ة في مؤسستنا التعليمية.`
          : `Nous certifions que l'enfant ${childData.name || 'Child ' + childId} est inscrit(e) dans notre établissement.`,
        messageAr: `نشهد بأن الطفل/الطفلة ${childData.name || 'Child ' + childId} مسجل/ة في مؤسستنا التعليمية.`,
        messageFr: `Nous certifions que l'enfant ${childData.name || 'Child ' + childId} est inscrit(e) dans notre établissement.`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Save to Firestore
      await addDoc(collection(db, 'attestations'), attestationData);
      
      setAttestation(attestationData);
      message.success(t('Attestation generated successfully'));
    } catch (error) {
      console.error('Error generating attestation:', error);
      setAttestationError('Failed to generate attestation: ' + error.message);
    } finally {
      setAttestationLoading(false);
    }
  };

  if (loading) return <div style={{ margin: 40 }}>{t('Loading', 'جاري التحميل...')}</div>;
  if (error) return <div style={{ color: 'red', margin: 40 }}>{t(error)}</div>;
  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: 24, direction: i18n.language === 'ar' ? 'rtl' : 'ltr' }}>
      <h2>{t('Child Reports')}</h2>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <button onClick={exportToExcel}>{t('Export to Excel')}</button>
        <button onClick={exportToPDF}>{t('Export to PDF')}</button>
        <button onClick={handleGenerateAttestation}>{t('Generate Attestation')}</button>
        {attestation && <button onClick={exportAttestationToPDF}>{t('Export Attestation to PDF')}</button>}
      </div>
      {attestationLoading && <div style={{ color: '#1976d2', marginBottom: 8 }}>{t('Loading attestation...')}</div>}
      {attestationError && <div style={{ color: 'red', marginBottom: 8 }}>{attestationError}</div>}
      {attestation && (
        <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, marginBottom: 16 }}>
          <h3>{t('Attestation d&apos;inscription')}</h3>
          <div><b>{t('Nom de l&apos;enfant')} :</b> {attestation.childName}</div>
          <div><b>{t('Classe')} :</b> {attestation.classId}</div>
          <div><b>{t('Parents')} :</b> {Array.isArray(attestation.parentIds) ? attestation.parentIds.join(', ') : attestation.parentIds}</div>
          <div><b>{t('Date d&apos;inscription')} :</b> {attestation.inscriptionDate && attestation.inscriptionDate._seconds ? new Date(attestation.inscriptionDate._seconds * 1000).toLocaleDateString() : '-'}</div>
          <div style={{ marginTop: 8 }}>{attestation.message}</div>
        </div>
      )}
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