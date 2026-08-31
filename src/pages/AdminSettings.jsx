import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { 
  getDB, setDB, 
  defaultDepartments, defaultEmployees, defaultResources, defaultPodcasts 
} from '../utils/db';
import { Plus, Edit, X, Search, RefreshCw, CheckCircle, Database } from 'lucide-react';
import { syncSource } from '../utils/api';
import './AdminSettings.css';

export const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('departments');

  // DB States
  const [departments, setDepartments] = useState(() => getDB('departments', defaultDepartments));
  const [employees] = useState(() => getDB('employees', defaultEmployees));
  const [resources] = useState(() => getDB('resources', []).filter(r => !['React Hooks Guide', 'LeetCode 75 Study Plan', 'UI Design Patterns'].includes(r.title)));
  const [podcasts] = useState(() => getDB('podcasts', defaultPodcasts));

  // External Sources State
  const [sources, setSources] = useState([]);
  const [syncingId, setSyncingId] = useState(null);
  const [syncResult, setSyncResult] = useState(null);

  // Sync to localStorage
  useEffect(() => {
    setDB('departments', departments);
  }, [departments]);

  // Load external sources from API
  const loadSources = async () => {
    try {
      const resp = await fetch('http://localhost:8000/api/sources');
      if (resp.ok) {
        const data = await resp.json();
        setSources(data);
      }
    } catch (e) {
      console.warn('Failed to load sources from API:', e);
    }
  };

  useEffect(() => {
    loadSources();
  }, []);

  // Search & Modals
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', description: '', status: 'Active' });

  // Calculation helpers
  const getEmployeeCount = (dept) => {
    return employees.filter(emp => 
      emp.departmentId === dept.id || 
      (emp.department && emp.department.toLowerCase() === dept.name.toLowerCase())
    ).length;
  };

  const getUsageCount = (dept) => {
    const matchingResources = resources.filter(res => 
      res.departmentId === dept.id || 
      (res.department && res.department.toLowerCase() === dept.name.toLowerCase())
    ).length;

    const matchingPodcasts = podcasts.filter(pd => 
      pd.departmentId === dept.id || 
      (pd.department && pd.department.toLowerCase() === dept.name.toLowerCase())
    ).length;

    return matchingResources + matchingPodcasts;
  };

  const handleOpenAdd = () => {
    setEditingDept(null);
    setFormData({ name: '', code: '', description: '', status: 'Active' });
    setShowModal(true);
  };

  const handleOpenEdit = (dept) => {
    setEditingDept(dept);
    setFormData(dept);
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const normalizedNewName = formData.name.trim().toLowerCase();
    const isDuplicate = departments.some(dept => 
      dept.name.trim().toLowerCase() === normalizedNewName && 
      (!editingDept || dept.id !== editingDept.id)
    );

    if (isDuplicate) {
      alert('Department already exists. Please enter a unique department name.');
      return;
    }

    if (editingDept) {
      setDepartments(departments.map(d => d.id === editingDept.id ? { ...formData, id: editingDept.id } : d));
    } else {
      const newDept = {
        ...formData,
        id: Date.now(),
        created_at: new Date().toISOString().split('T')[0]
      };
      setDepartments([...departments, newDept]);
    }
    setShowModal(false);
  };

  const handleToggleStatus = (id) => {
    setDepartments(departments.map(d => {
      if (d.id === id) {
        const nextStatus = d.status === 'Active' ? 'Inactive' : 'Active';
        return { ...d, status: nextStatus };
      }
      return d;
    }));
  };

  const handleManualSync = async (src) => {
    setSyncingId(src.id);
    setSyncResult(null);
    try {
      const res = await syncSource(src.id);
      setSyncResult(res);
      await loadSources();
    } catch (err) {
      alert(`Sync failed for ${src.name}: ${err.message}`);
    } finally {
      setSyncingId(null);
    }
  };

  const filteredDepts = departments.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.code && d.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="admin-settings-container">
      <div className="section-header">
        <div>
          <h1>System Settings & Connectors</h1>
          <p className="subtitle">Manage dynamic departments, monitor external source integrations, and automated schedulers</p>
        </div>
      </div>

      <div className="settings-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button 
          onClick={() => setActiveTab('departments')}
          className={`settings-tab-btn ${activeTab === 'departments' ? 'active' : ''}`}
          style={{ padding: '10px 16px', fontWeight: 600, border: 'none', cursor: 'pointer' }}
        >
          Departments Management
        </button>
        <button 
          onClick={() => setActiveTab('sources')}
          className={`settings-tab-btn ${activeTab === 'sources' ? 'active' : ''}`}
          style={{ padding: '10px 16px', fontWeight: 600, border: 'none', cursor: 'pointer' }}
        >
          External Sources Monitoring
        </button>
      </div>

      {activeTab === 'departments' && (
        <Card style={{ padding: '1.5rem' }}>
          <div className="settings-controls">
            <div className="search-bar" style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, maxWidth: '400px' }}>
              <Search size={18} />
              <input 
                type="text" 
                placeholder="Search department name or code..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none' }}
              />
            </div>
            <Button onClick={handleOpenAdd}>
              <Plus size={16} style={{ marginRight: '6px' }} /> Add Department
            </Button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="bulk-manual-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Department Name</th>
                  <th>Description</th>
                  <th>Employee Count</th>
                  <th>Content Usage</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDepts.map(dept => {
                  const empCount = getEmployeeCount(dept);
                  const usageCount = getUsageCount(dept);
                  const isInactive = dept.status === 'Inactive';
                  
                  return (
                    <tr key={dept.id} className={isInactive ? 'deactivated-row' : ''}>
                      <td style={{ fontWeight: 700 }}>{dept.code || 'N/A'}</td>
                      <td style={{ fontWeight: 600 }}>{dept.name}</td>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{dept.description || 'No description provided.'}</td>
                      <td>{empCount} employees</td>
                      <td>{usageCount} assigned items</td>
                      <td>
                        <span className={`badge-status ${dept.status === 'Active' ? 'active' : 'inactive'}`}>
                          {dept.status}
                        </span>
                      </td>
                      <td>
                        <div className="dept-actions">
                          <Button size="sm" variant="secondary" onClick={() => handleOpenEdit(dept)}>
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            className={dept.status === 'Active' ? 'btn-deactivate' : ''}
                            onClick={() => handleToggleStatus(dept.id)}
                          >
                            {dept.status === 'Active' ? 'Deactivate' : 'Reactivate'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'sources' && (
        <Card style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3>Automated External Connectors & Schedulers</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
                Monitors active APIs: Unstop (Hackathons 6h), GitHub & Dev.to (Resources 12h), Codeforces (Coding 12h)
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={loadSources}>
              <RefreshCw size={14} style={{ marginRight: '6px' }} /> Refresh Status
            </Button>
          </div>

          {syncResult && (
            <div style={{ padding: '12px 16px', backgroundColor: 'rgba(34, 197, 94, 0.12)', color: '#15803d', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
              <strong>Sync Result ({syncResult.source}):</strong> {syncResult.message} | Fetched: {syncResult.totalFetched} | New: {syncResult.newAdded} | Updated: {syncResult.updated} | Mappings: {syncResult.departmentMappingsCreated}
            </div>
          )}

          <div style={{ overflowX: 'auto' }}>
            <table className="bulk-manual-table">
              <thead>
                <tr>
                  <th>Source Name</th>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Target Domain</th>
                  <th>Last Sync Timestamp</th>
                  <th>Status</th>
                  <th>Manual Sync</th>
                </tr>
              </thead>
              <tbody>
                {sources.map(src => (
                  <tr key={src.id}>
                    <td style={{ fontWeight: 700 }}>
                      <Database size={14} style={{ display: 'inline', marginRight: '6px' }} />
                      {src.name}
                    </td>
                    <td><code style={{ fontWeight: 600 }}>{src.code}</code></td>
                    <td>{src.sourceType}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{src.baseUrl || 'N/A'}</td>
                    <td style={{ fontSize: '0.8rem' }}>{src.lastSyncAt ? new Date(src.lastSyncAt).toLocaleString() : 'Pending initial sync'}</td>
                    <td>
                      <span className="badge-status active">Active</span>
                    </td>
                    <td>
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        disabled={syncingId === src.id}
                        onClick={() => handleManualSync(src)}
                      >
                        {syncingId === src.id ? 'Syncing...' : 'Sync Now'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Edit Department Modal */}
      {showModal && (
        <div className="modal-overlay">
          <Card className="modal-content glass">
            <div className="modal-header">
              <h3>{editingDept ? 'Edit Department' : 'Add Department'}</h3>
              <button onClick={() => setShowModal(false)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="modal-form">
              <Input 
                label="Department Name" 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required 
              />
              <Input 
                label="Department Code" 
                value={formData.code} 
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                required 
              />
              <div className="select-input-group">
                <label className="ui-input-label">Description</label>
                <textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="ui-input"
                  rows={3}
                />
              </div>
              <div className="modal-actions">
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit">Save Department</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
