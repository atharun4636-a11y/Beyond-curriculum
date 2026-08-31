import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Search, Calendar, MapPin, Clock, ExternalLink, Filter, Sparkles, Tag, Users, ShieldAlert, CheckCircle, Upload, FileText, X } from 'lucide-react';
import { getDB, defaultEmployees, defaultDepartments } from '../utils/db';
import { getHackathonsByDepartment, registerHackathonWithProof, getEmployeeHackathonRegistrations } from '../utils/api';
import { SkeletonGrid } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import '../pages/AdminEvents.css';
import './EmployeeEvents.css';

export const EmployeeEvents = () => {
  const [employeeDeptId, setEmployeeDeptId] = useState(() => {
    try {
      const userString = localStorage.getItem('user');
      if (userString) {
        const user = JSON.parse(userString);
        if (user.departmentId) return user.departmentId;

        const employeesList = getDB('employees', defaultEmployees);
        const matchedEmp = employeesList.find(e => e.email && user.email && e.email.toLowerCase() === user.email.toLowerCase());
        if (matchedEmp && matchedEmp.departmentId) {
          return matchedEmp.departmentId;
        }

        const emailLower = (user.email || '').toLowerCase();
        if (emailLower.includes('cognitive')) return 2;
        if (emailLower.includes('dcg')) return 3;
      }
    } catch (e) {}
    return 1; // Default to Data Engineering
  });

  const [departments] = useState(() => getDB('departments', defaultDepartments));
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [modeFilter, setModeFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');

  // Proof Modal State
  const [activeRegEvent, setActiveRegEvent] = useState(null);
  const [proofScreenshot, setProofScreenshot] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  const [proofSuccessMsg, setProofSuccessMsg] = useState(null);

  const normalizeBackendEvent = (item, regMap) => {
    const regRecord = regMap[item.id];
    return {
      id: item.id,
      name: item.name || 'Untitled Hackathon',
      statement: item.statement || item.description || 'No statement provided.',
      organizer: item.organizer || 'Unstop Partner',
      mode: item.mode || 'Online',
      location: item.location || '',
      regLink: item.regLink || item.sourceUrl || '#',
      lastDate: item.lastDate || 'N/A',
      eventDate: item.eventDate || 'N/A',
      poster: item.poster || 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&auto=format&fit=crop&q=60',
      description: item.description || item.statement || '',
      category: item.category || 'Hackathon',
      skills: item.skills || '',
      eligibility: item.eligibility || 'Working Professionals & Employees',
      eligibilityStatus: item.eligibilityStatus || 'eligible',
      teamSize: item.teamSize || '1-4',
      source: item.source || 'manual',
      registrationStatus: regRecord ? regRecord.registrationStatus : null,
      proofRecord: regRecord || null
    };
  };

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [hackathonData, regData] = await Promise.all([
        getHackathonsByDepartment(employeeDeptId),
        getEmployeeHackathonRegistrations()
      ]);

      const regMap = {};
      if (Array.isArray(regData)) {
        setRegistrations(regData);
        regData.forEach(r => { regMap[r.hackathonId] = r; });
      }

      if (Array.isArray(hackathonData)) {
        const normalized = hackathonData.map(item => normalizeBackendEvent(item, regMap));
        setEvents(normalized);
      }
    } catch (err) {
      console.warn(`Backend API unavailable, using cached records:`, err);
      const cached = getDB('events', []);
      setEvents(cached.map(item => normalizeBackendEvent(item, {})));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [employeeDeptId]);

  const handleOpenRegisterModal = (event) => {
    setActiveRegEvent(event);
    setProofScreenshot('');
    setProofUrl(event.regLink !== '#' ? event.regLink : '');
    setNotes('');
    setProofSuccessMsg(null);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1000;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Fast JPEG compression (0.7 quality ~50KB)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setProofScreenshot(compressedDataUrl);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitRegistrationProof = async (e) => {
    e.preventDefault();
    if (!activeRegEvent) return;

    setIsSubmittingProof(true);
    try {
      await registerHackathonWithProof(activeRegEvent.id, {
        proofScreenshot,
        proofUrl,
        notes
      });
      setProofSuccessMsg('Registration proof submitted successfully! Awaiting Admin verification.');
      setTimeout(() => {
        setActiveRegEvent(null);
        loadData();
      }, 1500);
    } catch (err) {
      console.error('Failed to submit registration proof:', err);
      alert('Failed to submit registration proof.');
    } finally {
      setIsSubmittingProof(false);
    }
  };

  const currentDept = departments.find(d => d.id === employeeDeptId) || { name: 'Data Engineering' };

  const filteredEvents = events.filter(evt => {
    if (evt.eligibilityStatus && evt.eligibilityStatus !== 'eligible') return false;
    const eligLower = (evt.eligibility || '').toLowerCase();
    if (eligLower.includes('school student') || eligLower.includes('college student') || eligLower.includes('class 8-12') || eligLower.includes('students only')) {
      return false;
    }

    const matchesSearch = (evt.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (evt.statement || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (evt.skills || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMode = modeFilter === 'All' ? true : evt.mode.toLowerCase() === modeFilter.toLowerCase();
    const matchesSource = sourceFilter === 'All' ? true : evt.source.toLowerCase() === sourceFilter.toLowerCase();

    return matchesSearch && matchesMode && matchesSource;
  });

  return (
    <div className="employee-events-page">
      <div className="events-header">
        <div>
          <h1>Department Hackathons & Competitions</h1>
          <p className="subtitle">
            Curated employee-eligible hackathons for <strong>{currentDept.name}</strong>. Register and submit your registration proof for Admin verification.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="filter-card glass">
        <div className="filter-grid">
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search hackathons, problem statements, or tech stacks..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="ui-input search-input"
            />
          </div>

          <div className="select-filters-row">
            <select 
              value={modeFilter} 
              onChange={e => setModeFilter(e.target.value)}
              className="ui-select"
            >
              <option value="All">All Modes</option>
              <option value="Online">Online</option>
              <option value="Offline">Offline / On-site</option>
              <option value="Hybrid">Hybrid</option>
            </select>

            <select 
              value={sourceFilter} 
              onChange={e => setSourceFilter(e.target.value)}
              className="ui-select"
            >
              <option value="All">All Sources</option>
              <option value="unstop">Unstop</option>
              <option value="devpost">Devpost</option>
              <option value="hackerearth">HackerEarth</option>
              <option value="manual">Manual</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Events Grid */}
      {isLoading ? (
        <SkeletonGrid count={6} />
      ) : filteredEvents.length === 0 ? (
        <EmptyState 
          icon={ShieldAlert}
          title="No Employee-Eligible Hackathons Found"
          description={`No active employee-eligible hackathons match your search criteria for ${currentDept.name}.`}
        />
      ) : (
        <div className="events-grid">
          {filteredEvents.map(event => (
            <Card key={event.id} className="event-card glass">
              <div className="card-banner-wrapper">
                <img src={event.poster} alt={event.name} className="event-poster-img" />
                <span className={`badge-mode ${event.mode.toLowerCase()}`}>
                  {event.mode}
                </span>
                <span className="badge-source" style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: 'rgba(0, 0, 0, 0.65)', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 600 }}>
                  {event.source.toUpperCase()}
                </span>
              </div>

              <div className="event-card-body">
                <div className="organizer-tag">{event.organizer}</div>
                <h3 className="event-title">{event.name}</h3>
                
                <p className="problem-statement-preview">
                  <strong>Statement:</strong> {event.statement}
                </p>

                {event.skills && (
                  <div className="skills-tags-row">
                    <Tag size={12} className="tag-icon" />
                    <span>{event.skills}</span>
                  </div>
                )}

                <div className="event-meta-info" style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={13} />
                    <span><strong>Event Date:</strong> {event.eventDate}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={13} />
                    <span><strong>Last Reg Date:</strong> {event.lastDate}</span>
                  </div>
                </div>

                {/* Registration Proof Status Badge */}
                {event.registrationStatus && (
                  <div style={{ marginTop: '10px', padding: '8px 12px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: event.registrationStatus === 'VERIFIED' ? 'rgba(34, 197, 94, 0.1)' : event.registrationStatus === 'REJECTED' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(234, 179, 8, 0.1)', color: event.registrationStatus === 'VERIFIED' ? '#15803d' : event.registrationStatus === 'REJECTED' ? '#b91c1c' : '#a16207', border: '1px solid currentColor' }}>
                    <CheckCircle size={14} />
                    <span>
                      {event.registrationStatus === 'VERIFIED' ? '✓ Registration Verified by Admin' : event.registrationStatus === 'REJECTED' ? '✗ Registration Proof Rejected' : '✓ Proof Submitted (Pending Admin Review)'}
                    </span>
                  </div>
                )}

                <div className="event-card-footer" style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Button 
                    variant={event.registrationStatus === 'VERIFIED' ? "secondary" : "primary"}
                    size="sm"
                    onClick={() => handleOpenRegisterModal(event)}
                  >
                    {event.registrationStatus === 'VERIFIED' ? 'Registration Verified' : event.registrationStatus ? 'Update Registration Proof' : 'Register & Submit Proof'}
                  </Button>
                  
                  {event.regLink && event.regLink !== '#' && (
                    <a 
                      href={event.regLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="external-link-btn"
                      title="View on platform"
                      style={{ fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary-600)' }}
                    >
                      Platform Link <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Registration Proof Upload Modal */}
      {activeRegEvent && (
        <div className="submission-modal-overlay flex-center">
          <div className="submission-modal-card" style={{ maxWidth: '580px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            
            {/* Modal Header */}
            <div className="submission-modal-header">
              <div>
                <h2>Submit Registration Proof</h2>
                <p>{activeRegEvent.name}</p>
              </div>
              <button 
                onClick={() => setActiveRegEvent(null)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px', display: 'flex', alignItems: 'center' }}
              >
                <X size={20} />
              </button>
            </div>

            {proofSuccessMsg ? (
              <div className="submission-modal-body" style={{ padding: '24px' }}>
                <div style={{ padding: '20px', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#15803d', borderRadius: '10px', border: '1px solid rgba(34, 197, 94, 0.3)', textAlign: 'center', fontWeight: 600 }}>
                  {proofSuccessMsg}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitRegistrationProof} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                {/* Scrollable Modal Body */}
                <div className="submission-modal-body" style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px' }}>
                      1. Upload Registration Screenshot / Confirmation Proof *
                    </label>
                    <div style={{ padding: '14px', borderRadius: '8px', border: '1px dashed var(--color-border)', backgroundColor: 'var(--color-bg-base)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileUpload} 
                        style={{ fontSize: '0.85rem' }} 
                      />
                      {proofScreenshot && (
                        <div style={{ marginTop: '8px' }}>
                          <span style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                            ✓ Screenshot Attached:
                          </span>
                          <img 
                            src={proofScreenshot} 
                            alt="Registration Proof Preview" 
                            style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', border: '1px solid var(--color-border)', objectFit: 'contain', backgroundColor: '#0f172a' }} 
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px' }}>
                      2. External Registration URL / ID (Optional)
                    </label>
                    <input 
                      type="url" 
                      value={proofUrl} 
                      onChange={e => setProofUrl(e.target.value)} 
                      placeholder="https://unstop.com/registrations/123456" 
                      className="ui-input" 
                      style={{ width: '100%', padding: '10px 12px' }} 
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px' }}>
                      3. Notes / Team Info (Optional)
                    </label>
                    <textarea 
                      value={notes} 
                      onChange={e => setNotes(e.target.value)} 
                      rows={2} 
                      placeholder="Team name, member emails, or registration details..." 
                      className="ui-input" 
                      style={{ width: '100%', padding: '10px 12px', fontSize: '0.85rem' }} 
                    />
                  </div>
                </div>

                {/* Pinned Modal Footer */}
                <div className="submission-modal-footer">
                  <Button type="button" variant="secondary" onClick={() => setActiveRegEvent(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" isLoading={isSubmittingProof}>
                    Submit Registration Proof
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
