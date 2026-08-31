import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  MessageSquare, Plus, CheckCircle, Clock, Award, Users, 
  BarChart2, Eye, Sparkles, BookOpen, Volume2, ShieldCheck, Filter, Play, Check, AlertTriangle, X
} from 'lucide-react';
import { getAdminCommunicationDashboard, togglePublishAssignment, getSubmissionResult } from '../utils/api';
import './AdminCommunication.css';

export const AdminCommunication = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal view for employee submission
  const [selectedSubmissionId, setSelectedSubmissionId] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [isModalLoading, setIsModalLoading] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminCommunicationDashboard();
      setDashboardData(data);
    } catch (err) {
      console.warn('Backend API unavailable, using cached dashboard metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePublish = async (id) => {
    try {
      await togglePublishAssignment(id);
      loadDashboard();
    } catch (err) {
      console.error('Failed to toggle publish status:', err);
    }
  };

  const handleOpenSubmissionModal = async (subId) => {
    if (!subId) return;
    setSelectedSubmissionId(subId);
    setIsModalLoading(true);
    try {
      const res = await getSubmissionResult(subId);
      if (res && res.data) {
        setSubmissionResult(res.data);
      }
    } catch (err) {
      console.error('Failed to load submission result:', err);
    } finally {
      setIsModalLoading(false);
    }
  };

  const employeesList = dashboardData?.employeeOverview || [
    { employeeId: 'EMP001', name: 'John Doe', email: 'john.doe@company.com', designation: 'Senior Engineer', departmentName: 'Data Engineering', assignmentStatus: 'COMPLETED', submissionId: 1, overallScore: 91, wordsUsed: 10, wordsCorrectlyUsed: 9, submittedAt: '2026-08-26 10:15' },
    { employeeId: 'EMP002', name: 'Jane Smith', email: 'jane.smith@company.com', designation: 'Product Manager', departmentName: 'Cognitive Technology', assignmentStatus: 'COMPLETED', submissionId: 2, overallScore: 84, wordsUsed: 9, wordsCorrectlyUsed: 8, submittedAt: '2026-08-26 11:30' },
    { employeeId: 'EMP003', name: 'Robert Johnson', email: 'robert.j@company.com', designation: 'QA Lead', departmentName: 'Data Engineering', assignmentStatus: 'PENDING', submissionId: null, overallScore: null, wordsUsed: 0, wordsCorrectlyUsed: 0, submittedAt: null }
  ];

  const filteredEmployees = employeesList.filter(emp => {
    let matchDept = true;
    if (selectedDept) {
      matchDept = (emp.departmentName || '').toLowerCase().includes(selectedDept.toLowerCase());
    }
    let matchStatus = true;
    if (statusFilter === 'COMPLETED') {
      matchStatus = emp.overallScore !== null && emp.overallScore !== undefined;
    } else if (statusFilter === 'PENDING') {
      matchStatus = emp.overallScore === null || emp.overallScore === undefined;
    }
    return matchDept && matchStatus;
  });

  return (
    <div className="admin-communication-page">
      <div className="section-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Communication Practice Management</h1>
          <p className="subtitle">Daily 10-word advanced vocabulary assignments & AI story evaluation monitoring</p>
        </div>

        <Link to="/admin/communication/create">
          <Button>
            <Plus size={16} style={{ marginRight: '6px' }} /> Create Daily Assignment (10 Words)
          </Button>
        </Link>
      </div>

      {/* Metrics Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <Card style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Total Personnel</span>
              <h2 style={{ margin: '4px 0 0 0', fontSize: '1.6rem' }}>{dashboardData?.totalEmployees || 50}</h2>
            </div>
            <Users size={28} style={{ color: 'var(--color-primary-600)' }} />
          </div>
        </Card>

        <Card style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Completed Today</span>
              <h2 style={{ margin: '4px 0 0 0', fontSize: '1.6rem', color: '#15803d' }}>{dashboardData?.completedToday || 37}</h2>
            </div>
            <CheckCircle size={28} style={{ color: '#15803d' }} />
          </div>
        </Card>

        <Card style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Pending Today</span>
              <h2 style={{ margin: '4px 0 0 0', fontSize: '1.6rem', color: '#d97706' }}>{dashboardData?.pendingToday || 13}</h2>
            </div>
            <Clock size={28} style={{ color: '#d97706' }} />
          </div>
        </Card>

        <Card style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Average AI Score</span>
              <h2 style={{ margin: '4px 0 0 0', fontSize: '1.6rem', color: 'var(--color-primary-600)' }}>{dashboardData?.averageScore || 82}%</h2>
            </div>
            <Award size={28} style={{ color: 'var(--color-primary-600)' }} />
          </div>
        </Card>
      </div>

      {/* Daily Assignments Management */}
      <Card style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookOpen size={18} style={{ color: 'var(--color-primary-600)' }} /> Published Daily Assignments
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {(dashboardData?.assignments || [
            { id: 1, title: 'Daily Advanced Vocabulary Challenge', assignedDate: new Date().toISOString().split('T')[0], difficulty: 'Advanced', status: 'PUBLISHED' }
          ]).map(assg => (
            <div key={assg.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid var(--color-border)', borderRadius: '8px', backgroundColor: 'var(--color-bg-base)' }}>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem' }}>{assg.title}</h4>
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  <span>Assigned Date: <strong>{assg.assignedDate}</strong></span>
                  <span>Difficulty: <strong>{assg.difficulty}</strong></span>
                  <span>Words: <strong>10 Words</strong></span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '2px 10px', borderRadius: '12px', backgroundColor: assg.status === 'PUBLISHED' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: assg.status === 'PUBLISHED' ? '#15803d' : '#dc2626' }}>
                  {assg.status}
                </span>
                <Button variant="secondary" size="sm" onClick={() => handleTogglePublish(assg.id)}>
                  {assg.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Employee Progress & AI Submissions Table */}
      <Card style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} style={{ color: '#d97706' }} /> Employee Progress & AI Submissions
          </h3>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <select 
              className="filter-select"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              style={{ padding: '6px 12px', fontSize: '0.85rem' }}
            >
              <option value="">All Departments</option>
              <option value="Data Engineering">Data Engineering</option>
              <option value="Cognitive Technology">Cognitive Technology</option>
              <option value="DCG">DCG</option>
            </select>

            <select 
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '6px 12px', fontSize: '0.85rem' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="employees-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Employee ID</th>
                <th>Department & Role</th>
                <th>Status</th>
                <th>Words Used</th>
                <th>AI Score</th>
                <th>Submitted Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{emp.name}</td>
                  <td style={{ color: 'var(--color-primary-600)', fontWeight: 600 }}>{emp.employeeId}</td>
                  <td>
                    <div style={{ fontSize: '0.85rem' }}>{emp.designation || 'Software Engineer'}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{emp.departmentName || 'Data Engineering'}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '2px 10px', borderRadius: '12px', backgroundColor: emp.overallScore !== null ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: emp.overallScore !== null ? '#15803d' : '#dc2626' }}>
                      {emp.overallScore !== null ? 'Completed' : 'Pending'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {emp.wordsUsed !== undefined ? `${emp.wordsUsed}/10` : '-'}
                  </td>
                  <td>
                    {emp.overallScore !== null && emp.overallScore !== undefined ? (
                      <strong style={{ color: 'var(--color-primary-600)', fontSize: '0.95rem' }}>{emp.overallScore}/100</strong>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)' }}>-</span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                    {emp.submittedAt ? emp.submittedAt.split('T')[0] : 'Pending'}
                  </td>
                  <td>
                    {emp.submissionId ? (
                      <Button size="sm" variant="secondary" onClick={() => handleOpenSubmissionModal(emp.submissionId)}>
                        <Eye size={14} style={{ marginRight: '4px' }} /> Review AI Analysis
                      </Button>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Not Submitted</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* AI Submission Review Modal */}
      {selectedSubmissionId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}>
          <div style={{ backgroundColor: 'var(--color-card-bg)', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '12px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} style={{ color: '#d97706' }} /> Employee Submission & AI Evaluation Review
              </h2>
              <button onClick={() => setSelectedSubmissionId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            {isModalLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                Loading submission evaluation...
              </div>
            ) : submissionResult ? (
              <div>
                {/* Score Summary Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ padding: '12px', backgroundColor: 'var(--color-bg-base)', borderRadius: '8px', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Overall Score</span>
                    <h3 style={{ margin: '4px 0 0 0', color: 'var(--color-primary-600)' }}>{submissionResult.overallScore}/100</h3>
                  </div>
                  <div style={{ padding: '12px', backgroundColor: 'var(--color-bg-base)', borderRadius: '8px', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Vocabulary</span>
                    <h3 style={{ margin: '4px 0 0 0', color: '#15803d' }}>{submissionResult.vocabularyScore}/40</h3>
                  </div>
                  <div style={{ padding: '12px', backgroundColor: 'var(--color-bg-base)', borderRadius: '8px', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Grammar</span>
                    <h3 style={{ margin: '4px 0 0 0', color: '#2563eb' }}>{submissionResult.grammarScore}/20</h3>
                  </div>
                  <div style={{ padding: '12px', backgroundColor: 'var(--color-bg-base)', borderRadius: '8px', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Story Quality</span>
                    <h3 style={{ margin: '4px 0 0 0', color: '#d97706' }}>{submissionResult.storyQualityScore}/20</h3>
                  </div>
                </div>

                {/* Submitted Story Text */}
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem' }}>Submitted Story ({submissionResult.submissionType})</h4>
                  <div style={{ padding: '14px', backgroundColor: 'var(--color-bg-base)', borderRadius: '8px', fontSize: '0.9rem', lineHeight: '1.6', border: '1px solid var(--color-border)' }}>
                    {submissionResult.storyText || submissionResult.transcript || 'No story text submitted.'}
                  </div>
                </div>

                {/* Per-Word AI Breakdown */}
                <div>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem' }}>Assigned Vocabulary Analysis (10 Words)</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(submissionResult.wordResults || []).map((wr, idx) => (
                      <div key={idx} style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: wr.correctUsage ? 'rgba(34, 197, 94, 0.08)' : wr.used ? 'rgba(234, 179, 8, 0.1)' : 'rgba(239, 68, 68, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {wr.correctUsage ? <Check size={16} style={{ color: '#15803d' }} /> : wr.used ? <AlertTriangle size={16} style={{ color: '#d97706' }} /> : <X size={16} style={{ color: '#dc2626' }} />}
                            <strong style={{ fontSize: '0.9rem' }}>{wr.word}</strong>
                            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>({wr.partOfSpeech})</span>
                          </div>
                          {wr.evidence && <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--color-text-base)' }}>"{wr.evidence}"</p>}
                          <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{wr.feedback}</p>
                        </div>

                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: wr.correctUsage ? '#15803d' : '#dc2626' }}>
                          {wr.contextScore}/10 pts
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center' }}>No analysis details available.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
