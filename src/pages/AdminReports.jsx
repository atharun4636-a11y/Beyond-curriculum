import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { FileDown, Users, Trophy, Award, TrendingUp } from 'lucide-react';
import './AdminReports.css';

import { getDB, defaultDepartments } from '../utils/db';

export const AdminReports = () => {
  const [downloading, setDownloading] = useState(null);
  const [deptFilter, setDeptFilter] = useState('');
  const [departments] = useState(() => getDB('departments', defaultDepartments));

  const reportTypes = [
    { title: 'Employee Progress Report', desc: 'Detailed sheets of learning paths, coding solutions and scores completed by employees.', icon: Users, file: 'Employee_Progress_2026.pdf' },
    { title: 'Participation Analytics', desc: 'Aggregated hackathon and contest attendee logs, departments, and active statuses.', icon: TrendingUp, file: 'Participation_Logs_2026.xlsx' },
    { title: 'Resource Usage Metrics', desc: 'Visual distribution metrics detailing bookmarks and clicks across study sites.', icon: Award, file: 'Resource_Usage_Overview.xlsx' }
  ];

  const handleExport = (fileName) => {
    setDownloading(fileName);
    setTimeout(() => {
      setDownloading(null);
      // Trigger a mock file download in browser
      const element = document.createElement("a");
      const file = new Blob(["Mock Report Data"], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = fileName;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }, 1200);
  };

  return (
    <div className="admin-reports">
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1>Analytics Reports</h1>
          <p className="subtitle">Compile employee progress metrics and export official PDF or Excel summaries</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Filter Department:</label>
          <select 
            value={deptFilter} 
            onChange={(e) => setDownloading(null) || setDeptFilter(e.target.value)} 
            className="ui-input"
            style={{ width: '220px', padding: '6px 12px' }}
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name} {d.status === 'Inactive' ? '(Deactivated)' : ''}</option>
            ))}
          </select>
        </div>
      </div>

      {deptFilter && (
        <Card style={{ padding: '8px 16px', backgroundColor: 'var(--color-primary-50)', color: 'var(--color-primary-800)', border: '1px solid var(--color-primary-200)', marginBottom: '15px', fontSize: '0.85rem', fontWeight: 600 }}>
          ℹ Currently showing and exporting data scoped strictly to: {departments.find(d => d.id === parseInt(deptFilter))?.name} Department.
        </Card>
      )}

      <div className="reports-grid">
        {reportTypes.map((rep, i) => {
          const Icon = rep.icon;
          const isCurrent = downloading === rep.file;
          return (
            <Card key={i} className="report-card">
              <div className="rep-icon-title">
                <div className="rep-icon-wrapper">
                  <Icon size={24} />
                </div>
                <div>
                  <h3>{rep.title}</h3>
                  <p className="rep-desc">{rep.desc}</p>
                </div>
              </div>
              
              <div className="rep-actions">
                <span className="file-format-badge">
                  {rep.file.split('.').pop().toUpperCase()}
                </span>
                <Button 
                  onClick={() => handleExport(rep.file)}
                  isLoading={isCurrent}
                  variant="secondary"
                  size="sm"
                >
                  <FileDown size={14} style={{ marginRight: 6 }} /> Export
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
