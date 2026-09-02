import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Search, Plus, Edit, Trash2, Calendar, RefreshCw, ExternalLink, X, Video, CheckCircle, Sparkles, Layers } from 'lucide-react';
import { getDB, setDB, defaultDepartments } from '../utils/db';
import { getOpportunities, createOpportunity, updateOpportunity, deleteOpportunity, syncOpportunities, getDepartments } from '../utils/api';
import './AdminOpportunities.css';

export const AdminOpportunities = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [departments, setDepartments] = useState(() => getDB('departments', defaultDepartments));
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const depts = await getDepartments();
      if (Array.isArray(depts) && depts.length > 0) setDepartments(depts);
    } catch (e) {}

    try {
      const data = await getOpportunities();
      setOpportunities(data);
    } catch (err) {
      console.warn('Backend API unavailable for opportunities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSyncAll = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await syncOpportunities('ALL');
      setSyncMessage(res.message || `Successfully synchronized ${res.totalFetched} professional opportunities.`);
      await loadData();
    } catch (err) {
      console.error('Failed to sync opportunity sources:', err);
      alert('Failed to sync opportunity sources.');
    } finally {
      setIsSyncing(false);
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [formData, setFormData] = useState({
    title: '', description: '', source: 'manual', sourceUrl: '', registrationUrl: '',
    eventType: 'WEBINAR', topic: '', skills: '', startDate: '', endDate: '',
    timezone: 'UTC', isOnline: true, location: 'Online', imageUrl: '', difficulty: 'Intermediate'
  });

  const todayStr = new Date().toISOString().split('T')[0];

  const filtered = opportunities.filter(item => {
    // Automatically hide completed/past webinars unless online
    if (item.endDate && item.endDate < todayStr && !item.isOnline) {
      return false;
    }
    return (item.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
           (item.source || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
           (item.skills || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      title: '', description: '', source: 'manual', sourceUrl: '', registrationUrl: '',
      eventType: 'WEBINAR', topic: '', skills: '', startDate: '', endDate: '',
      timezone: 'UTC', isOnline: true, location: 'Online', imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&auto=format&fit=crop&q=60', difficulty: 'Intermediate'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData(item);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateOpportunity(editingItem.id, formData);
      } else {
        await createOpportunity(formData);
      }
      await loadData();
      setShowModal(false);
    } catch (err) {
      alert('Failed to save opportunity.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this opportunity?')) {
      try {
        await deleteOpportunity(id);
        await loadData();
      } catch (err) {
        alert('Failed to delete opportunity.');
      }
    }
  };

  return (
    <div className="admin-opportunities">
      <div className="section-header">
        <div>
          <h1>Professional Opportunities & Webinars</h1>
          <p className="subtitle">Automatic discovery of Microsoft, AWS, Dev.to & GitHub technical events & webinars</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button onClick={handleSyncAll} disabled={isSyncing} variant="secondary">
            <RefreshCw size={16} className={isSyncing ? 'spin' : ''} style={{ marginRight: '6px' }} />
            {isSyncing ? 'Syncing...' : 'Sync All Opportunity Sources'}
          </Button>
          <Button onClick={handleOpenAdd}>
            <Plus size={18} /> Add Manual Event
          </Button>
        </div>
      </div>

      {syncMessage && (
        <div style={{ marginBottom: '1.25rem', padding: '10px 14px', backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)', borderRadius: '8px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={16} /> {syncMessage}
        </div>
      )}

      <div className="section-header" style={{ marginBottom: '1rem' }}>
        <h3 style={{ margin: 0 }}>Synced Webinars & Tech Events ({opportunities.length})</h3>
        <div className="search-bar" style={{ maxWidth: '300px' }}>
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search opportunities..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <Video size={40} style={{ color: 'var(--color-text-muted)', marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem' }}>No Opportunities Found</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', margin: 0 }}>
            Click "Sync All Opportunity Sources" to fetch live webinars from Microsoft, AWS, Dev.to, and GitHub.
          </p>
        </Card>
      ) : (
        <Card className="table-card">
          <div className="table-wrapper">
            <table className="opportunities-table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Title & Description</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Location</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id}>
                    <td>
                      <span className="source-badge" style={{ fontWeight: 700, padding: '3px 8px', borderRadius: '12px', backgroundColor: 'rgba(99, 102, 241, 0.12)', color: 'var(--color-primary-600)', fontSize: '0.78rem' }}>
                        {(item.source || 'MICROSOFT').toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className="title-cell">
                        <span className="item-title" style={{ fontWeight: 600, display: 'block' }}>{item.title}</span>
                        {item.skills && <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Skills: {item.skills}</span>}
                      </div>
                    </td>
                    <td>
                      <span className="event-type-badge" style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: '12px', backgroundColor: 'rgba(34, 197, 94, 0.12)', color: '#15803d' }}>
                        {item.eventType || 'WEBINAR'}
                      </span>
                    </td>
                    <td>{item.startDate || 'Upcoming'}</td>
                    <td>{item.location || 'Online'}</td>
                    <td>
                      <div className="actions-cell" style={{ display: 'flex', gap: '6px' }}>
                        {item.registrationUrl && (
                          <a href={item.registrationUrl} target="_blank" rel="noopener noreferrer" className="action-btn edit" title="Open Link">
                            <ExternalLink size={16} />
                          </a>
                        )}
                        <button className="action-btn edit" onClick={() => handleOpenEdit(item)} title="Edit">
                          <Edit size={16} />
                        </button>
                        <button className="action-btn delete" onClick={() => handleDelete(item.id)} title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <Card className="modal-content glass" style={{ maxWidth: '540px', width: '100%' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>{editingItem ? 'Edit Opportunity' : 'Add Opportunity'}</h3>
              <button onClick={() => setShowModal(false)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="modal-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Input 
                label="Opportunity Title *" 
                value={formData.title} 
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required 
              />

              <div className="form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="select-input-group">
                  <label className="ui-input-label">Event Type</label>
                  <select 
                    value={formData.eventType} 
                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                    className="ui-input"
                  >
                    <option value="WEBINAR">Webinar</option>
                    <option value="WORKSHOP">Workshop</option>
                    <option value="TECH_TALK">Tech Talk</option>
                    <option value="MASTERCLASS">Masterclass</option>
                    <option value="MEETUP">Meetup</option>
                    <option value="CONFERENCE">Conference</option>
                  </select>
                </div>

                <Input 
                  label="Start Date" 
                  type="date"
                  value={formData.startDate} 
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>

              <Input 
                label="Registration / Event URL *" 
                value={formData.registrationUrl} 
                onChange={(e) => setFormData({ ...formData, registrationUrl: e.target.value, sourceUrl: e.target.value })}
                required 
              />

              <Input 
                label="Skills (comma separated)" 
                value={formData.skills} 
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                placeholder="e.g. AI Agents, Azure, Python"
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

              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit">Save Opportunity</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
