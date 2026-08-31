import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { 
  Users, Trophy, Calendar, BookOpen, Code, FileText, Award, Bell, Activity, RefreshCw, CheckCircle, Database,
  Eye, Check, X, ShieldAlert, ExternalLink, MessageSquare, Clock, Filter, Sparkles
} from 'lucide-react';
import { 
  syncSource, getAdminHackathonRegistrations, verifyHackathonRegistration, 
  rejectHackathonRegistration, getAdminDashboardMetrics 
} from '../utils/api';
import './AdminDashboard.css';

export const AdminDashboard = () => {
  const [sources, setSources] = useState([]);
  const [syncingId, setSyncingId] = useState(null);
  
  // Monitoring Metrics & Registrations
  const [metrics, setMetrics] = useState(null);
  const [hackathonRegs, setHackathonRegs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Proof Modal State
  const [selectedProof, setSelectedProof] = useState(null);
  const [rejectComment, setRejectComment] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);

  // Filters State
  const [regFilterStatus, setRegFilterStatus] = useState('ALL'); // 'ALL' | 'PROOF_SUBMITTED' | 'VERIFIED' | 'REJECTED'

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sourcesResp, metricsResp, regsResp] = await Promise.all([
        fetch('http://localhost:8000/api/sources').then(r => r.ok ? r.json() : []).catch(() => []),
        getAdminDashboardMetrics(),
        getAdminHackathonRegistrations()
      ]);

      if (sourcesResp) setSources(sourcesResp);
      if (metricsResp) setMetrics(metricsResp);
      if (Array.isArray(regsResp)) setHackathonRegs(regsResp);
    } catch (e) {
      console.warn('Dashboard API error, using fallback:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleManualSync = async (sourceId) => {
    setSyncingId(sourceId);
    try {
      await syncSource(sourceId);
      await loadData();
    } catch (e) {
      alert(`Sync failed: ${e.message}`);
    } finally {
      setSyncingId(null);
    }
  };

  const handleVerifyRegistration = async (regId) => {
    setIsActionLoading(true);
    setActionMsg(null);
    try {
      await verifyHackathonRegistration(regId);
      setActionMsg('Registration verified successfully!');
      setTimeout(() => {
        setActionMsg(null);
        setSelectedProof(null);
        loadData();
      }, 1500);
    } catch (err) {
      console.error('Failed to verify registration:', err);
      setActionMsg('Failed to verify registration.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRejectRegistration = async (regId) => {
    setIsActionLoading(true);
    setActionMsg(null);
    try {
      await rejectHackathonRegistration(regId, rejectComment);
      setActionMsg('Registration rejected.');
      setTimeout(() => {
        setActionMsg(null);
        setSelectedProof(null);
        loadData();
      }, 1500);
    } catch (err) {
      console.error('Failed to reject registration:', err);
      setActionMsg('Failed to reject registration.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const filteredRegs = hackathonRegs.filter(r => {
    if (regFilterStatus === 'ALL') return true;
    return r.registrationStatus === regFilterStatus;
  });

  const stats = [
    { 
      label: 'Hackathon Registrations', 
      value: metrics ? metrics.hackathons.totalRegistrations.toString() : '0', 
      icon: Trophy, 
      change: `${metrics ? metrics.hackathons.pendingProofs : 0} Pending Proof Verification`, 
      color: '#4f46e5' 
    },
    { 
      label: 'Verified Registrations', 
      value: metrics ? metrics.hackathons.verifiedRegistrations.toString() : '0', 
      icon: CheckCircle, 
      change: 'Admin Verified Badges', 
      color: '#16a34a' 
    },
    { 
      label: 'Coding Problem Solutions', 
      value: metrics ? metrics.coding.verifiedSolutions.toString() : '0', 
      icon: Code, 
      change: `${metrics ? metrics.coding.pendingReviews : 0} Pending Code Review`, 
      color: '#0284c7' 
    },
    { 
      label: 'AI Communication Stories', 
      value: metrics ? metrics.communication.storiesPracticed.toString() : '0', 
      icon: MessageSquare, 
      change: `Avg Score ${metrics ? metrics.communication.avgScore : 82.5}/100`, 
      color: '#d97706' 
    },
  ];

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>Executive Admin Portal</h1>
          <p className="subtitle">Real-time Employee Activity Monitoring, Hackathon Registration Proof Verification, and Connector Health</p>
        </div>
        <Link to="/admin/settings">
          <Button variant="secondary" size="sm">
            <Database size={14} style={{ marginRight: 6 }} /> Manage Connectors
          </Button>
        </Link>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="stat-card" style={{ padding: '1.25rem' }}>
              <div className="stat-card-left">
                <span className="stat-label" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>{stat.label}</span>
                <span className="stat-value" style={{ fontSize: '1.75rem', fontWeight: 700, margin: '4px 0', color: 'var(--color-text-base)' }}>{stat.value}</span>
                <span className="stat-change" style={{ fontSize: '0.75rem', fontWeight: 600, color: stat.color }}>
                  {stat.change}
                </span>
              </div>
              <div className="stat-icon-wrapper" style={{ backgroundColor: `${stat.color}15` }}>
                <Icon size={24} color={stat.color} />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Section 1: Live Employee Hackathon Registration & Proof Verification Monitor */}
      <Card style={{ padding: '20px', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trophy size={20} color="#4f46e5" /> Employee Hackathon Registration & Proof Monitor
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Inspect employee registration screenshots, confirm participation, and verify registration proofs
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button 
              size="sm" 
              variant={regFilterStatus === 'ALL' ? 'primary' : 'secondary'} 
              onClick={() => setRegFilterStatus('ALL')}
            >
              All Registrations ({hackathonRegs.length})
            </Button>
            <Button 
              size="sm" 
              variant={regFilterStatus === 'PROOF_SUBMITTED' ? 'primary' : 'secondary'} 
              onClick={() => setRegFilterStatus('PROOF_SUBMITTED')}
            >
              Pending Verification ({hackathonRegs.filter(r => r.registrationStatus === 'PROOF_SUBMITTED').length})
            </Button>
            <Button 
              size="sm" 
              variant={regFilterStatus === 'VERIFIED' ? 'primary' : 'secondary'} 
              onClick={() => setRegFilterStatus('VERIFIED')}
            >
              Verified ({hackathonRegs.filter(r => r.registrationStatus === 'VERIFIED').length})
            </Button>
          </div>
        </div>

        {filteredRegs.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            No employee hackathon registrations matching the selected filter status.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-bg-base)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 14px' }}>Employee</th>
                  <th style={{ padding: '12px 14px' }}>Hackathon & Organizer</th>
                  <th style={{ padding: '12px 14px' }}>Registration Proof</th>
                  <th style={{ padding: '12px 14px' }}>Proof Status</th>
                  <th style={{ padding: '12px 14px' }}>Registered At</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegs.map(reg => (
                  <tr key={reg.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <strong style={{ display: 'block', color: 'var(--color-text-base)' }}>{reg.employeeName}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{reg.departmentName} ({reg.employeeId})</span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <strong style={{ display: 'block', color: 'var(--color-text-base)' }}>{reg.hackathonName}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{reg.organizer} • {reg.mode}</span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {reg.proofScreenshot ? (
                        <button 
                          onClick={() => setSelectedProof(reg)}
                          style={{ border: '1px solid var(--color-border)', borderRadius: '6px', padding: '4px 8px', backgroundColor: 'var(--color-bg-base)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-primary-600)' }}
                        >
                          <Eye size={14} /> View Screenshot Proof
                        </button>
                      ) : reg.proofUrl ? (
                        <a 
                          href={reg.proofUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{ fontSize: '0.78rem', color: 'var(--color-primary-600)', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'underline' }}
                        >
                          <ExternalLink size={12} /> Registration Link
                        </a>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>No proof attached</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: reg.registrationStatus === 'VERIFIED' ? 'rgba(34, 197, 94, 0.12)' : reg.registrationStatus === 'REJECTED' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(234, 179, 8, 0.12)', color: reg.registrationStatus === 'VERIFIED' ? '#15803d' : reg.registrationStatus === 'REJECTED' ? '#b91c1c' : '#a16207', border: '1px solid currentColor' }}>
                        {reg.registrationStatus === 'VERIFIED' ? '✓ VERIFIED' : reg.registrationStatus === 'REJECTED' ? '✗ REJECTED' : 'PROOF SUBMITTED'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>
                      {reg.registeredAt ? reg.registeredAt.split('T')[0] : 'N/A'}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          onClick={() => setSelectedProof(reg)}
                          title="Inspect Details"
                        >
                          <Eye size={14} /> Inspect
                        </Button>

                        {reg.registrationStatus !== 'VERIFIED' && (
                          <Button 
                            size="sm" 
                            variant="primary" 
                            onClick={() => handleVerifyRegistration(reg.id)}
                            style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}
                          >
                            <Check size={14} style={{ marginRight: 4 }} /> Verify
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Section 2: Live Activity Stream */}
      {metrics && metrics.activityStream && metrics.activityStream.length > 0 && (
        <Card style={{ padding: '20px', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', margin: '0 0 14px 0', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={20} color="#0284c7" /> Live Employee Activity Stream
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {metrics.activityStream.map((act, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--color-bg-base)', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: act.type === 'HACKATHON_REGISTRATION' ? '#4f46e515' : '#0284c715', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {act.type === 'HACKATHON_REGISTRATION' ? <Trophy size={14} color="#4f46e5" /> : <Code size={14} color="#0284c7" />}
                  </div>
                  <div>
                    <strong style={{ color: 'var(--color-text-base)', display: 'block' }}>{act.employee}</strong>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>{act.title}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: act.status === 'VERIFIED' ? '#15803d' : '#a16207' }}>{act.status}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{act.timestamp ? act.timestamp.split('T')[0] : ''}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Section 3: Connector Health & Sync Schedulers */}
      <Card style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RefreshCw size={18} color="#16a34a" /> Automated Synchronization Connectors
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
              Background schedulers run periodic syncs: Unstop (6h), GitHub/Dev.to (12h), Codeforces (12h)
            </span>
          </div>
          <Button variant="secondary" size="sm" onClick={loadData}>
            Refresh Status
          </Button>
        </div>

        <div className="sources-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          {sources.map(src => (
            <Card key={src.id} style={{ padding: '12px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-base)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <strong style={{ fontSize: '0.9rem', color: 'var(--color-text-base)' }}>{src.name}</strong>
                <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700 }}>• Healthy</span>
              </div>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Type: {src.type} • Code: {src.code}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                  Last Sync: {src.lastSyncAt ? src.lastSyncAt.split('T')[1]?.substring(0, 5) : 'Recent'}
                </span>
                <Button 
                  size="sm" 
                  variant="secondary" 
                  isLoading={syncingId === src.code} 
                  onClick={() => handleManualSync(src.code)}
                  style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                >
                  Sync Now
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Proof Inspection Overlay Modal */}
      {selectedProof && (
        <div className="submission-modal-overlay flex-center">
          <div className="submission-modal-card" style={{ maxWidth: '680px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            
            {/* Modal Header */}
            <div className="submission-modal-header">
              <div>
                <h2>Hackathon Registration Proof Review</h2>
                <p>{selectedProof.employeeName} • {selectedProof.hackathonName}</p>
              </div>
              <button 
                onClick={() => setSelectedProof(null)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px', display: 'flex', alignItems: 'center' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Modal Body */}
            <div className="submission-modal-body" style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              {actionMsg ? (
                <div style={{ padding: '20px', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#15803d', borderRadius: '10px', border: '1px solid rgba(34, 197, 94, 0.3)', textAlign: 'center', fontWeight: 600 }}>
                  {actionMsg}
                </div>
              ) : (
                <>
                  {/* Screenshot Image Preview */}
                  {selectedProof.proofScreenshot ? (
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--color-text-base)' }}>
                        Uploaded Registration Screenshot Proof:
                      </label>
                      <div style={{ padding: '12px', backgroundColor: '#0f172a', borderRadius: '10px', border: '1px solid #334155', textAlign: 'center' }}>
                        <img 
                          src={selectedProof.proofScreenshot} 
                          alt="Registration Proof Evidence" 
                          style={{ maxWidth: '100%', maxHeight: '280px', borderRadius: '8px', objectFit: 'contain' }} 
                        />
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'var(--color-bg-base)', borderRadius: '8px', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                      No screenshot image uploaded for this registration.
                    </div>
                  )}

                  {selectedProof.proofUrl && (
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>
                        External Registration Link / ID:
                      </label>
                      <a 
                        href={selectedProof.proofUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ fontSize: '0.85rem', color: 'var(--color-primary-600)', textDecoration: 'underline', wordBreak: 'break-all', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        {selectedProof.proofUrl} <ExternalLink size={12} />
                      </a>
                    </div>
                  )}

                  {selectedProof.notes && (
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>
                        Employee Notes / Team Information:
                      </label>
                      <p style={{ margin: 0, padding: '10px', backgroundColor: 'var(--color-bg-base)', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.85rem' }}>
                        {selectedProof.notes}
                      </p>
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                      Rejection Feedback (Optional if rejecting):
                    </label>
                    <input 
                      type="text" 
                      value={rejectComment} 
                      onChange={e => setRejectComment(e.target.value)} 
                      placeholder="State reason for rejection (e.g. Screenshot unreadable, link broken)..." 
                      className="ui-input" 
                      style={{ width: '100%', padding: '10px 12px', fontSize: '0.85rem' }} 
                    />
                  </div>
                </>
              )}
            </div>

            {/* Pinned Modal Footer */}
            {!actionMsg && (
              <div className="submission-modal-footer">
                <Button 
                  variant="secondary" 
                  onClick={() => handleRejectRegistration(selectedProof.id)}
                  isLoading={isActionLoading}
                  style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#b91c1c', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                >
                  Reject Registration
                </Button>
                <Button 
                  variant="primary" 
                  onClick={() => handleVerifyRegistration(selectedProof.id)}
                  isLoading={isActionLoading}
                  style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}
                >
                  <Check size={16} style={{ marginRight: 4 }} /> Verify Registration
                </Button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};
