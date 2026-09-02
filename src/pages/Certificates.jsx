import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { FileCheck, FileWarning, Upload, Download, CheckCircle, XCircle } from 'lucide-react';
import { getDB, setDB, defaultCerts } from '../utils/db';
import { getCertificates, uploadCertificate, updateCertificateStatus } from '../utils/api';
import './Certificates.css';

export const Certificates = ({ role = 'employee' }) => {
  const [certs, setCerts] = useState(() => getDB('certs', defaultCerts));

  // Current Logged-in Employee Info
  const [currentUser] = useState(() => {
    try {
      const u = localStorage.getItem('user');
      if (u) return JSON.parse(u);
    } catch (e) {}
    return { name: 'John Doe', employeeId: 'EMP001' };
  });

  const [uploadTitle, setUploadTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileDataUrl, setFileDataUrl] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load live certificates from backend DB
  useEffect(() => {
    const loadLiveCerts = async () => {
      try {
        const liveCerts = await getCertificates(role === 'employee' ? currentUser.employeeId : null);
        if (liveCerts && liveCerts.length > 0) {
          const mapped = liveCerts.map(c => ({
            id: c.id,
            title: c.title,
            url: c.fileData || c.fileUrl || '#',
            dateUploaded: c.dateUploaded || (c.createdAt ? c.createdAt.split('T')[0] : '2026-08-01'),
            status: c.status || 'Pending',
            employee: c.employeeName || c.employeeId || 'Employee'
          }));
          setCerts(prev => {
            const apiIds = new Set(mapped.map(m => m.id));
            const localOnly = prev.filter(p => !apiIds.has(p.id));
            return [...mapped, ...localOnly];
          });
        }
      } catch (err) {
        console.warn('Backend API unavailable for certificates, using cached state.');
      }
    };
    loadLiveCerts();
  }, [role, currentUser]);

  useEffect(() => {
    setDB('certs', certs);
  }, [certs]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setFileDataUrl(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadTitle.trim()) return;

    setIsSubmitting(true);
    const newCertLocal = {
      id: Date.now(),
      title: uploadTitle.trim(),
      url: fileDataUrl || '#',
      dateUploaded: new Date().toISOString().split('T')[0],
      status: 'Pending',
      employee: currentUser.name || currentUser.employeeId || 'John Doe'
    };

    try {
      const res = await uploadCertificate({
        title: uploadTitle.trim(),
        employeeId: currentUser.employeeId || 'EMP001',
        employeeName: currentUser.name || 'John Doe',
        fileData: fileDataUrl,
        fileUrl: '#'
      });

      if (res && res.id) {
        newCertLocal.id = res.id;
      }
    } catch (err) {
      console.warn('Backend API upload failed, saved locally:', err);
    }

    setCerts(prev => [newCertLocal, ...prev]);
    setUploadTitle('');
    setSelectedFile(null);
    setFileDataUrl('');
    setIsSubmitting(false);
    setUploadSuccess(true);
    setTimeout(() => setUploadSuccess(false), 3000);
  };

  const handleStatus = async (id, newStatus) => {
    try {
      await updateCertificateStatus(id, newStatus);
    } catch (err) {
      console.warn(`Backend status update for cert ${id} failed:`, err);
    }
    setCerts(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
  };

  return (
    <div className="certificates-page">
      <div className="section-header">
        <div>
          <h1>Certificates & Badges</h1>
          <p className="subtitle">
            {role === 'admin' 
              ? 'Approve or Reject uploaded learning resource and coding certifications' 
              : 'Upload and track approval state of your external learning certificates'}
          </p>
        </div>
      </div>

      <div className="certificates-grid">
        {role === 'employee' && (
          <Card className="upload-cert-card">
            <h3>Upload New Certificate</h3>
            <form onSubmit={handleUpload} className="upload-form">
              <div className="select-input-group">
                <label className="ui-input-label">Certificate Title</label>
                <input 
                  type="text" 
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="ui-input"
                  placeholder="e.g. HackerRank React (Basic)"
                  required
                />
              </div>

              <div 
                className="upload-box-dashed"
                style={{ cursor: 'pointer' }}
                onClick={() => document.getElementById('cert-file-input').click()}
              >
                <input 
                  type="file" 
                  id="cert-file-input" 
                  accept="image/*,.pdf" 
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                />
                <Upload size={32} className="upload-icon" />
                <span>
                  {selectedFile ? `File Selected: ${selectedFile.name}` : 'Drag and drop PDF/Image here or Click to browse'}
                </span>
              </div>

              <Button type="submit" fullWidth disabled={isSubmitting}>
                {isSubmitting ? 'Uploading...' : 'Upload for Approval'}
              </Button>
              {uploadSuccess && (
                <div className="success-toast">
                  <CheckCircle size={18} /> Uploaded successfully! Awaiting Admin review.
                </div>
              )}
            </form>
          </Card>
        )}

        <Card className="cert-history-card">
          <h3>{role === 'admin' ? 'Review Certificates' : 'My Certificates'}</h3>
          <div className="cert-list">
            {certs.map(cert => (
              <div key={cert.id} className="cert-item">
                <div className="cert-info">
                  <h4>{cert.title}</h4>
                  <span className="cert-meta">
                    {role === 'admin' && `Uploaded by: ${cert.employee} • `} 
                    Date: {cert.dateUploaded}
                  </span>
                </div>
                <div className="cert-actions-status">
                  <span className={`badge-status ${cert.status.toLowerCase()}`}>
                    {cert.status === 'Approved' ? <FileCheck size={14} /> : <FileWarning size={14} />}
                    {cert.status}
                  </span>
                  
                  {role === 'admin' && cert.status === 'Pending' ? (
                    <div className="admin-decision-btns" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {cert.url && cert.url !== '#' && (
                        <a href={cert.url} target="_blank" rel="noopener noreferrer" className="download-btn" style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}>
                          View Document
                        </a>
                      )}
                      <Button size="sm" onClick={() => handleStatus(cert.id, 'Approved')} className="btn-approve">
                        Approve
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleStatus(cert.id, 'Rejected')} className="btn-reject">
                        Reject
                      </Button>
                    </div>
                  ) : (
                    cert.status === 'Approved' && cert.url && cert.url !== '#' && (
                      <a href={cert.url} download={`${cert.title}.png`} target="_blank" rel="noopener noreferrer" className="download-btn">
                        <Download size={16} /> Download
                      </a>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
