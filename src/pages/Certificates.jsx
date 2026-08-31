import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { FileCheck, FileWarning, Upload, Download, CheckCircle, XCircle } from 'lucide-react';
import { getDB, setDB, defaultCerts } from '../utils/db';
import './Certificates.css';

export const Certificates = ({ role = 'employee' }) => {
  const [certs, setCerts] = useState(() => getDB('certs', defaultCerts));

  useEffect(() => {
    setDB('certs', certs);
  }, [certs]);

  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleUpload = (e) => {
    e.preventDefault();
    const newCert = {
      id: Date.now(),
      title: uploadTitle,
      url: '#',
      dateUploaded: new Date().toISOString().split('T')[0],
      status: 'Pending',
      employee: 'Alex Mercer'
    };
    setCerts([newCert, ...certs]);
    setUploadTitle('');
    setUploadSuccess(true);
    setTimeout(() => setUploadSuccess(false), 3000);
  };

  const handleStatus = (id, newStatus) => {
    setCerts(certs.map(c => c.id === id ? { ...c, status: newStatus } : c));
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
              <div className="upload-box-dashed">
                <Upload size={32} className="upload-icon" />
                <span>Drag and drop PDF/Image here or Click to browse</span>
              </div>
              <Button type="submit" fullWidth>
                Upload for Approval
              </Button>
              {uploadSuccess && (
                <div className="success-toast">
                  <CheckCircle size={18} /> Uploaded successfully! Awaiting review.
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
                    <div className="admin-decision-btns">
                      <Button size="sm" onClick={() => handleStatus(cert.id, 'Approved')} className="btn-approve">
                        Approve
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleStatus(cert.id, 'Rejected')} className="btn-reject">
                        Reject
                      </Button>
                    </div>
                  ) : (
                    cert.status === 'Approved' && (
                      <a href={cert.url} className="download-btn">
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
