import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Search, Plus, Edit, Trash2, Calendar, MapPin, ExternalLink, X, Clock, CheckCircle, AlertOctagon, HelpCircle } from 'lucide-react';
import { getDB, setDB, defaultEvents } from '../utils/db';
import { getHackathons, createHackathon, updateHackathon, deleteHackathon } from '../utils/api';
import './AdminEvents.css';

export const AdminEvents = () => {
  const [events, setEvents] = useState(() => getDB('events', defaultEvents));
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [eligibilityFilter, setEligibilityFilter] = useState('All'); // 'All' | 'eligible' | 'not_eligible' | 'uncertain'

  // Sync to localStorage as fallback / backup
  useEffect(() => {
    setDB('events', events);
  }, [events]);

  // Fetch hackathons from FastAPI backend on load
  const loadHackathons = async () => {
    setLoading(true);
    try {
      const data = await getHackathons();
      setEvents(data);
      setApiError(null);
    } catch (err) {
      console.error('FastAPI fetch error, falling back to local database:', err);
      setApiError('Unable to connect to backend API. Displaying cached records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHackathons();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const [formData, setFormData] = useState({
    name: '', statement: '', organizer: '', mode: 'Online', location: '', regLink: '', lastDate: '', eventDate: '', poster: '', description: '', eligibility: 'Working Professionals'
  });

  const filteredEvents = events.filter(event => {
    const matchesSearch = (event.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (event.organizer || '').toLowerCase().includes(searchTerm.toLowerCase());

    const status = event.eligibilityStatus || 'eligible';
    const matchesElig = eligibilityFilter === 'All' ? true : status === eligibilityFilter;

    return matchesSearch && matchesElig;
  });

  const handleOpenAdd = () => {
    setEditingEvent(null);
    setFormData({ name: '', statement: '', organizer: '', mode: 'Online', location: '', regLink: '', lastDate: '', eventDate: '', poster: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&auto=format&fit=crop&q=60', description: '', eligibility: 'Working Professionals' });
    setShowModal(true);
  };

  const handleOpenEdit = (evt) => {
    setEditingEvent(evt);
    setFormData(evt);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const payload = {
      name: formData.name,
      statement: formData.statement || "",
      organizer: formData.organizer || "",
      mode: formData.mode || "Online",
      location: formData.location || "",
      regLink: formData.regLink || "",
      lastDate: formData.lastDate || "",
      eventDate: formData.eventDate || "",
      poster: formData.poster || "",
      description: formData.description || "",
      source: "manual",
      category: "",
      skills: "",
      eligibility: formData.eligibility || "Working Professionals",
      teamSize: "",
      isActive: true
    };

    if (editingEvent) {
      try {
        await updateHackathon(editingEvent.id, payload);
        await loadHackathons();
        setShowModal(false);
      } catch (err) {
        alert('Failed to update hackathon on backend.');
      }
    } else {
      try {
        await createHackathon(payload);
        await loadHackathons();
        setShowModal(false);
      } catch (err) {
        alert('Failed to create hackathon on backend.');
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this event?')) {
      try {
        await deleteHackathon(id);
        await loadHackathons();
      } catch (err) {
        alert('Failed to delete hackathon on backend.');
      }
    }
  };

  return (
    <div className="admin-events">
      <div className="section-header">
        <div>
          <h1>Hackathons & Events Directory</h1>
          <p className="subtitle">Launch company hackathons & monitor automatic external employee-eligible syncs</p>
        </div>
        <Button onClick={handleOpenAdd}>
          <Plus size={18} /> Create Event
        </Button>
      </div>

      <Card className="events-controls" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="search-bar" style={{ flex: 1, minWidth: '240px' }}>
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search event name or organizer..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Eligibility Filter:</span>
            <select 
              value={eligibilityFilter} 
              onChange={(e) => setEligibilityFilter(e.target.value)}
              className="ui-input"
              style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }}
            >
              <option value="All">All Opportunities ({events.length})</option>
              <option value="eligible">✓ Employees Eligible</option>
              <option value="not_eligible">✕ Student Only</option>
              <option value="uncertain">? Uncertain</option>
            </select>
          </div>
        </div>
      </Card>

      <div className="events-grid">
        {filteredEvents.map(evt => {
          const status = evt.eligibilityStatus || 'eligible';
          const isEligible = status === 'eligible';
          const isNotEligible = status === 'not_eligible';

          return (
            <Card key={evt.id} className="event-card">
              <img src={evt.poster} alt={evt.name} className="event-poster" />
              <div className="event-details">
                <div className="event-badges" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className={`badge-mode ${evt.mode.toLowerCase()}`}>{evt.mode}</span>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: isEligible ? 'rgba(34, 197, 94, 0.15)' : isNotEligible ? 'rgba(239, 68, 68, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                    color: isEligible ? '#15803d' : isNotEligible ? '#dc2626' : '#b45309',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {isEligible ? <CheckCircle size={12} /> : isNotEligible ? <AlertOctagon size={12} /> : <HelpCircle size={12} />}
                    {isEligible ? 'Employees Eligible' : isNotEligible ? 'Student-Only' : 'Uncertain'}
                  </span>
                </div>

                <h3 className="event-name" style={{ marginTop: '8px' }}>{evt.name}</h3>
                <p className="event-desc">{evt.description || evt.statement}</p>

                {evt.eligibility && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                    <strong>Criteria:</strong> {evt.eligibility}
                  </div>
                )}

                <div className="event-dates">
                  <div>
                    <Calendar size={14} /> <strong>Event:</strong> {evt.eventDate}
                  </div>
                  <div>
                    <Clock size={14} /> <strong>Reg Closes:</strong> {evt.lastDate}
                  </div>
                  {evt.location && (
                    <div>
                      <MapPin size={14} /> <strong>Loc:</strong> {evt.location}
                    </div>
                  )}
                </div>

                <div className="event-actions" style={{ flexWrap: 'wrap', gap: '8px' }}>
                  <a href={evt.regLink} target="_blank" rel="noopener noreferrer" className="reg-link">
                    Reg Page <ExternalLink size={14} />
                  </a>
                  <div className="actions-buttons">
                    <Button size="sm" variant="secondary" onClick={() => handleOpenEdit(evt)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" className="text-danger" onClick={() => handleDelete(evt.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <Card className="modal-content glass">
            <div className="modal-header">
              <h3>{editingEvent ? 'Edit Hackathon Event' : 'Create Hackathon Event'}</h3>
              <button onClick={() => setShowModal(false)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="modal-form">
              <div className="form-row-2">
                <Input 
                  label="Event Name" 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required 
                />
                <Input 
                  label="Organizer Department / Entity" 
                  value={formData.organizer} 
                  onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                  required 
                />
              </div>

              <div className="form-row-2">
                <Input 
                  label="Registration Link" 
                  value={formData.regLink} 
                  onChange={(e) => setFormData({ ...formData, regLink: e.target.value })}
                  required 
                />
                <Input 
                  label="Poster Image URL" 
                  value={formData.poster} 
                  onChange={(e) => setFormData({ ...formData, poster: e.target.value })}
                />
              </div>

              <div className="form-row-2">
                <Input 
                  label="Event Date" 
                  type="date"
                  value={formData.eventDate} 
                  onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                />
                <Input 
                  label="Last Registration Date" 
                  type="date"
                  value={formData.lastDate} 
                  onChange={(e) => setFormData({ ...formData, lastDate: e.target.value })}
                />
              </div>

              <Input 
                label="Eligibility Criteria" 
                value={formData.eligibility} 
                onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
                placeholder="e.g. Working Professionals & Employees"
              />

              <div className="select-input-group">
                <label className="ui-input-label">Problem Statement / Description</label>
                <textarea 
                  value={formData.statement} 
                  onChange={(e) => setFormData({ ...formData, statement: e.target.value })}
                  className="ui-input"
                  rows={3}
                />
              </div>

              <div className="modal-actions">
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingEvent ? 'Save Changes' : 'Create Event'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
