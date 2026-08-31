import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Search, Calendar, MapPin, ExternalLink, Filter, Sparkles, Tag, Video, Layers, CheckCircle } from 'lucide-react';
import { getDB, defaultEmployees, defaultDepartments } from '../utils/db';
import { getOpportunitiesByDepartment, getUpcomingOpportunities, getDepartments } from '../utils/api';
import { SkeletonGrid } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import './EmployeeOpportunities.css';

export const EmployeeOpportunities = () => {
  const [currentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  const empDeptId = currentUser?.departmentId || currentUser?.department?.id || 1;

  const [selectedDeptId, setSelectedDeptId] = useState(empDeptId);
  const [departments, setDepartments] = useState(() => getDB('departments', defaultDepartments));
  const [opportunities, setOpportunities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');

  const fetchOpportunitiesData = async (deptId) => {
    setIsLoading(true);
    try {
      let data = [];
      if (deptId === 'All' || !deptId) {
        data = await getUpcomingOpportunities();
      } else {
        data = await getOpportunitiesByDepartment(deptId);
      }
      if (Array.isArray(data)) {
        setOpportunities(data);
      } else {
        setOpportunities([]);
      }
    } catch (err) {
      console.warn(`Failed to fetch opportunities for department ${deptId}:`, err);
      setOpportunities([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunitiesData(selectedDeptId);
    getDepartments().then(d => { if (d && d.length) setDepartments(d); }).catch(() => {});
  }, [selectedDeptId]);

  const filtered = opportunities.filter(opp => {
    const matchesSearch = (opp.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (opp.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (opp.skills || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'All' ? true : (opp.eventType || 'WEBINAR').toUpperCase() === typeFilter.toUpperCase();
    const matchesSource = sourceFilter === 'All' ? true : (opp.source || 'manual').toUpperCase() === sourceFilter.toUpperCase();

    return matchesSearch && matchesType && matchesSource;
  });

  const currentDept = departments.find(d => d.id === selectedDeptId) || { 
    id: selectedDeptId, 
    name: selectedDeptId === 1 ? 'Data Engineering' : selectedDeptId === 2 ? 'Cognitive Technology' : 'DCG',
    code: selectedDeptId === 1 ? 'DE' : selectedDeptId === 2 ? 'COGNITIVE' : 'DCG'
  };

  return (
    <div className="employee-opportunities">
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h1 style={{ margin: 0 }}>Professional Webinars & Opportunities</h1>
            <span className="badge-dept" style={{ 
              backgroundColor: 'rgba(99, 102, 241, 0.15)', 
              color: 'var(--color-primary-600)',
              padding: '4px 10px', 
              borderRadius: '20px', 
              fontSize: '0.8rem', 
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Sparkles size={13} /> {currentDept.name} ({currentDept.code})
            </span>
          </div>
          <p className="subtitle">Live webinars, technical workshops, masterclasses, and tech talks from trusted industry sources</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} style={{ color: 'var(--color-text-muted)' }} />
          <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>Department Filter:</label>
          <select 
            value={selectedDeptId} 
            onChange={(e) => setSelectedDeptId(e.target.value === 'All' ? 'All' : parseInt(e.target.value))}
            className="ui-input"
            style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }}
          >
            <option value={1}>Data Engineering (DE)</option>
            <option value={2}>Cognitive Technology (COGNITIVE)</option>
            <option value={3}>DCG (DCG)</option>
            <option value="All">All Departments</option>
          </select>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="events-controls" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px' }}>
            <Search size={18} style={{ color: 'var(--color-text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search webinars, topics, or skills (e.g. AI Agents, PySpark, Azure)..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.88rem', color: 'var(--color-text-base)' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)}
              className="ui-input"
              style={{ width: 'auto', padding: '4px 10px', fontSize: '0.82rem' }}
            >
              <option value="All">All Event Types</option>
              <option value="WEBINAR">Webinar</option>
              <option value="WORKSHOP">Workshop</option>
              <option value="TECH_TALK">Tech Talk</option>
              <option value="MASTERCLASS">Masterclass</option>
              <option value="MEETUP">Meetup</option>
              <option value="CONFERENCE">Conference</option>
            </select>

            <select 
              value={sourceFilter} 
              onChange={(e) => setSourceFilter(e.target.value)}
              className="ui-input"
              style={{ width: 'auto', padding: '4px 10px', fontSize: '0.82rem' }}
            >
              <option value="All">All Sources</option>
              <option value="MICROSOFT">Microsoft</option>
              <option value="AWS">AWS</option>
              <option value="GITHUB">GitHub</option>
              <option value="DEVTO">Dev.to</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Opportunities Grid */}
      {isLoading ? (
        <SkeletonGrid count={6} />
      ) : filtered.length === 0 ? (
        <EmptyState 
          icon={Video}
          title="No Upcoming Opportunities Found"
          description={`No upcoming webinars or technical events match your criteria for ${currentDept.name}.`}
        />
      ) : (
        <div className="opportunities-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {filtered.map(opp => (
            <Card key={opp.id} className="opportunity-card glass" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ position: 'relative', height: '140px', overflow: 'hidden', borderRadius: '8px 8px 0 0' }}>
                <img 
                  src={opp.imageUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&auto=format&fit=crop&q=60"} 
                  alt={opp.title} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
                <span className="badge-event-type" style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  backgroundColor: 'var(--color-primary-600)',
                  color: '#fff',
                  padding: '2px 10px',
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}>
                  {opp.eventType || 'WEBINAR'}
                </span>
                <span style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  backgroundColor: 'rgba(0, 0, 0, 0.75)',
                  color: '#fff',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                  fontWeight: 600
                }}>
                  {(opp.source || 'MICROSOFT').toUpperCase()}
                </span>
              </div>

              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0 0 8px 0', lineHeight: 1.3 }}>{opp.title}</h3>
                
                <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', flex: 1, margin: '0 0 12px 0', lineHeight: 1.4 }}>
                  {opp.description}
                </p>

                {opp.skills && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--color-primary-600)', marginBottom: '12px', flexWrap: 'wrap' }}>
                    <Tag size={12} />
                    <strong>Skills:</strong> {opp.skills}
                  </div>
                )}

                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={13} />
                    <span><strong>Date:</strong> {opp.startDate || 'Upcoming'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={13} />
                    <span><strong>Location:</strong> {opp.location || 'Online Webinar'}</span>
                  </div>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <a 
                    href={opp.registrationUrl || opp.sourceUrl || '#'} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ui-btn ui-btn-primary"
                    style={{ fontSize: '0.82rem', padding: '6px 14px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    Register Now <ExternalLink size={13} />
                  </a>

                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                    {opp.difficulty || 'Intermediate'}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
