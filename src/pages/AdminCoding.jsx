import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  Code, RefreshCw, Users, CheckCircle, Clock, AlertTriangle, Eye, Check, X, Send, Sparkles, Filter, BookOpen, Layers
} from 'lucide-react';
import { 
  getWeeklyCodingChallenge, generateWeeklyCodingChallenge, assignWeeklyCodingChallenge,
  getAdminCodingProgress, getAdminEmployeeCodingDetails, getCodingSubmissionDetails,
  verifyCodingSubmission, rejectCodingSubmission
} from '../utils/api';
import './AdminCoding.css';

export const AdminCoding = () => {
  const [weeklyData, setWeeklyData] = useState(null);
  const [adminProgress, setAdminProgress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Assignment Target State
  const [targetType, setTargetType] = useState('ALL'); // 'ALL' | 'DEPARTMENT' | 'EMPLOYEE'
  const [targetId, setTargetId] = useState('');
  const [assignMsg, setAssignMsg] = useState(null);
  const [isAssigning, setIsAssigning] = useState(false);

  // Employee Detail Modal
  const [selectedEmpId, setSelectedEmpId] = useState(null);
  const [empDetails, setEmpDetails] = useState(null);
  const [isEmpLoading, setIsEmpLoading] = useState(false);

  // Solution Review Modal
  const [reviewSubmission, setReviewSubmission] = useState(null);
  const [rejectComment, setRejectComment] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewMsg, setReviewMsg] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [challengeRes, progressRes] = await Promise.all([
        getWeeklyCodingChallenge(),
        getAdminCodingProgress()
      ]);
      setWeeklyData(challengeRes);
      setAdminProgress(progressRes);
    } catch (err) {
      console.warn('Backend unavailable, using default admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async (force = false) => {
    setIsLoading(true);
    try {
      await generateWeeklyCodingChallenge(force);
      await loadData();
    } catch (err) {
      console.error('Failed to generate challenge:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssign = async () => {
    setIsAssigning(true);
    setAssignMsg(null);
    try {
      const res = await assignWeeklyCodingChallenge(weeklyData?.challenge?.id, targetType, targetId);
      setAssignMsg(res.message || 'Challenge assigned successfully!');
      setTimeout(() => setAssignMsg(null), 3000);
      loadData();
    } catch (err) {
      console.error('Failed to assign challenge:', err);
      setAssignMsg('Failed to assign challenge.');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleViewEmployee = async (empId) => {
    setSelectedEmpId(empId);
    setIsEmpLoading(true);
    try {
      const res = await getAdminEmployeeCodingDetails(empId);
      setEmpDetails(res);
    } catch (err) {
      console.error('Failed to load employee details:', err);
    } finally {
      setIsEmpLoading(false);
    }
  };

  const handleOpenReview = async (submission) => {
    setReviewSubmission(submission);
    setRejectComment('');
    setReviewMsg(null);
    if (submission && submission.id) {
      try {
        const fullSub = await getCodingSubmissionDetails(submission.id);
        if (fullSub) {
          setReviewSubmission(fullSub);
        }
      } catch (err) {
        console.warn('Using cached submission:', err);
      }
    }
  };

  const handleVerifySolution = async () => {
    if (!reviewSubmission) return;
    setIsReviewing(true);
    try {
      await verifyCodingSubmission(reviewSubmission.id);
      setReviewMsg('Solution verified successfully! Employee progress updated.');
      setTimeout(() => {
        setReviewSubmission(null);
        if (selectedEmpId) handleViewEmployee(selectedEmpId);
        loadData();
      }, 1200);
    } catch (err) {
      console.error('Failed to verify:', err);
    } finally {
      setIsReviewing(false);
    }
  };

  const handleRejectSolution = async () => {
    if (!reviewSubmission) return;
    setIsReviewing(true);
    try {
      await rejectCodingSubmission(reviewSubmission.id, rejectComment);
      setReviewMsg('Solution rejected. Employee can now re-submit.');
      setTimeout(() => {
        setReviewSubmission(null);
        if (selectedEmpId) handleViewEmployee(selectedEmpId);
        loadData();
      }, 1200);
    } catch (err) {
      console.error('Failed to reject:', err);
    } finally {
      setIsReviewing(false);
    }
  };

  const summary = adminProgress?.summary || {
    totalEmployees: 50,
    completed: 32,
    inProgress: 12,
    notStarted: 4,
    overdue: 2,
    completionRate: 64
  };

  const employeeRows = adminProgress?.employees || [
    { employeeId: 'EMP001', name: 'John Doe', departmentName: 'Data Engineering', pythonProgress: '5/5', sqlProgress: '3/5', totalProgress: '8/10', progressPercentage: 80, status: 'IN_PROGRESS' },
    { employeeId: 'EMP002', name: 'Jane Smith', departmentName: 'Cognitive Technology', pythonProgress: '5/5', sqlProgress: '5/5', totalProgress: '10/10', progressPercentage: 100, status: 'COMPLETED' },
    { employeeId: 'EMP003', name: 'Robert Johnson', departmentName: 'DCG', pythonProgress: '2/5', sqlProgress: '1/5', totalProgress: '3/10', progressPercentage: 30, status: 'AT_RISK' }
  ];

  const challengeInfo = weeklyData?.challenge || { title: 'Week: Aug 23 – Aug 29, 2026', weekStart: '2026-08-23', weekEnd: '2026-08-29', pythonCount: 5, sqlCount: 5, easyCount: 4, mediumCount: 4, hardCount: 2 };

  return (
    <div className="admin-coding-page">
      <div className="section-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Weekly Coding Challenge Management</h1>
          <p className="subtitle">Curate 10 weekly problems (5 Python, 5 SQL), assign to teams, and review employee submissions</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" onClick={() => handleGenerate(true)}>
            <RefreshCw size={16} style={{ marginRight: '6px' }} /> Regenerate 10 Problems
          </Button>
          <Button onClick={() => handleGenerate(false)}>
            <Sparkles size={16} style={{ marginRight: '6px' }} /> Generate This Week's Challenge
          </Button>
        </div>
      </div>

      {/* SECTION A — WEEKLY ASSIGNMENT MANAGEMENT */}
      <Card style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '2px 10px', borderRadius: '12px', backgroundColor: 'var(--color-primary-600)', color: '#ffffff' }}>
              Active Weekly Challenge
            </span>
            <h2 style={{ margin: '6px 0 4px 0', fontSize: '1.35rem' }}>{challengeInfo.title}</h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Due Date: <strong>{challengeInfo.weekEnd} 23:59:59</strong>
            </p>
          </div>

          {/* Problem Difficulty & Language Breakdown Chips */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ padding: '8px 14px', backgroundColor: 'var(--color-bg-base)', borderRadius: '8px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Python Problems</span>
              <h4 style={{ margin: '2px 0 0 0', color: '#2563eb' }}>{challengeInfo.pythonCount || 5} Problems</h4>
            </div>
            <div style={{ padding: '8px 14px', backgroundColor: 'var(--color-bg-base)', borderRadius: '8px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>SQL Problems</span>
              <h4 style={{ margin: '2px 0 0 0', color: '#9333ea' }}>{challengeInfo.sqlCount || 5} Problems</h4>
            </div>
            <div style={{ padding: '8px 14px', backgroundColor: 'var(--color-bg-base)', borderRadius: '8px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Difficulty Mix</span>
              <h4 style={{ margin: '2px 0 0 0', color: '#15803d' }}>
                {challengeInfo.easyCount || 4} Easy • {challengeInfo.mediumCount || 4} Med • {challengeInfo.hardCount || 2} Hard
              </h4>
            </div>
          </div>
        </div>

        {/* Target Assignment Controls */}
        <div style={{ padding: '14px', backgroundColor: 'var(--color-bg-base)', borderRadius: '8px', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Assign Target:</span>
            
            <select 
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
              className="ui-input"
              style={{ padding: '6px 12px', fontSize: '0.85rem' }}
            >
              <option value="ALL">All Employees (Company-wide)</option>
              <option value="DEPARTMENT">Specific Department</option>
              <option value="EMPLOYEE">Individual Employee</option>
            </select>

            {targetType === 'DEPARTMENT' && (
              <select 
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="ui-input"
                style={{ padding: '6px 12px', fontSize: '0.85rem' }}
              >
                <option value="">Select Department...</option>
                <option value="1">Data Engineering (DE)</option>
                <option value="2">Cognitive Technology (COGNITIVE)</option>
                <option value="3">DCG (DCG)</option>
              </select>
            )}

            {targetType === 'EMPLOYEE' && (
              <input 
                type="text"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                placeholder="Enter Employee ID (e.g. EMP001)"
                className="ui-input"
                style={{ padding: '6px 12px', fontSize: '0.85rem', width: '220px' }}
              />
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {assignMsg && <span style={{ fontSize: '0.82rem', color: '#15803d', fontWeight: 600 }}>{assignMsg}</span>}
            <Button onClick={handleAssign} isLoading={isAssigning}>
              <Send size={14} style={{ marginRight: '6px' }} /> Assign to Selected Target
            </Button>
          </div>
        </div>
      </Card>

      {/* WEEKLY CODING REPORT OVERVIEW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <Card style={{ padding: '1.25rem', textAlign: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Total Personnel</span>
          <h2 style={{ margin: '4px 0 0 0', color: 'var(--color-primary-600)' }}>{summary.totalEmployees}</h2>
        </Card>
        <Card style={{ padding: '1.25rem', textAlign: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>100% Completed</span>
          <h2 style={{ margin: '4px 0 0 0', color: '#15803d' }}>{summary.completed}</h2>
        </Card>
        <Card style={{ padding: '1.25rem', textAlign: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>In Progress</span>
          <h2 style={{ margin: '4px 0 0 0', color: '#2563eb' }}>{summary.inProgress}</h2>
        </Card>
        <Card style={{ padding: '1.25rem', textAlign: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Not Started / Overdue</span>
          <h2 style={{ margin: '4px 0 0 0', color: '#dc2626' }}>{summary.notStarted + summary.overdue}</h2>
        </Card>
        <Card style={{ padding: '1.25rem', textAlign: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Overall Completion</span>
          <h2 style={{ margin: '4px 0 0 0', color: 'var(--color-primary-600)' }}>{summary.completionRate}%</h2>
        </Card>
      </div>

      {/* SECTION B — EMPLOYEE PROGRESS MONITORING TABLE */}
      <Card style={{ padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={18} style={{ color: 'var(--color-primary-600)' }} /> Employee Weekly Progress Monitoring
        </h3>

        <div className="table-wrapper">
          <table className="employees-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Department</th>
                <th>Python (5)</th>
                <th>SQL (5)</th>
                <th>Total (10)</th>
                <th>Progress %</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {employeeRows.map((emp, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>
                    <div>{emp.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-primary-600)' }}>{emp.employeeId}</div>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{emp.departmentName}</td>
                  <td>
                    <span style={{ fontWeight: 600, color: '#2563eb' }}>{emp.pythonProgress}</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: '#9333ea' }}>{emp.sqlProgress}</span>
                  </td>
                  <td>
                    <strong style={{ fontSize: '0.95rem' }}>{emp.totalProgress}</strong>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, height: '6px', backgroundColor: 'var(--color-bg-base)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${emp.progressPercentage}%`, height: '100%', backgroundColor: emp.progressPercentage === 100 ? '#15803d' : 'var(--color-primary-600)' }} />
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{emp.progressPercentage}%</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', backgroundColor: emp.status === 'COMPLETED' ? 'rgba(34, 197, 94, 0.15)' : emp.status === 'IN_PROGRESS' ? 'rgba(37, 99, 235, 0.15)' : emp.status === 'AT_RISK' || emp.status === 'OVERDUE' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(100, 116, 139, 0.15)', color: emp.status === 'COMPLETED' ? '#15803d' : emp.status === 'IN_PROGRESS' ? '#2563eb' : emp.status === 'AT_RISK' || emp.status === 'OVERDUE' ? '#dc2626' : '#64748b' }}>
                      {emp.status}
                    </span>
                  </td>
                  <td>
                    <Button size="sm" variant="secondary" onClick={() => handleViewEmployee(emp.employeeId)}>
                      <Eye size={14} style={{ marginRight: '4px' }} /> View Breakdown
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* EMPLOYEE DETAIL BREAKDOWN MODAL */}
      {selectedEmpId && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card">
            <div className="admin-modal-header">
              <div>
                <h2>{empDetails?.employee?.name || 'Employee'} — Weekly Problem Breakdown</h2>
                <p>
                  ID: <strong>{empDetails?.employee?.employeeId || selectedEmpId}</strong> • Department: <strong>{empDetails?.employee?.departmentName || 'Data Engineering'}</strong>
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedEmpId(null)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="admin-modal-body">
              {isEmpLoading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading employee progress...</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(empDetails?.problems || []).map((prob, idx) => {
                    const st = (prob.status || 'NOT_STARTED').toUpperCase();
                    const isVer = (st === 'VERIFIED');
                    const isSub = (st === 'SUBMITTED');

                    return (
                      <div 
                        key={idx} 
                        className={`admin-problem-row ${isVer ? 'verified' : isSub ? 'submitted' : 'pending'}`}
                      >
                        <div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary-600)' }}>#{idx + 1}</span>
                            <strong style={{ fontSize: '0.95rem' }}>{prob.title}</strong>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: '8px', backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}>{prob.language}</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: '8px', backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}>{prob.difficulty}</span>
                          </div>
                          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'block', marginTop: '4px' }}>
                            Platform: {prob.source} • URL: <a href={prob.url} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary-600)', textDecoration: 'underline' }}>{prob.url}</a>
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '3px 10px', borderRadius: '12px', backgroundColor: isVer ? 'rgba(34, 197, 94, 0.18)' : isSub ? 'rgba(234, 179, 8, 0.18)' : 'rgba(100, 116, 139, 0.15)', color: isVer ? '#15803d' : isSub ? '#b45309' : '#64748b' }}>
                            {st === 'NOT_STARTED' ? 'PENDING' : st}
                          </span>

                          {prob.submission && (
                            <Button size="sm" variant="secondary" onClick={() => handleOpenReview(prob.submission)}>
                              Review Submission
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SOLUTION REVIEW MODAL */}
      {reviewSubmission && (
        <div className="admin-modal-overlay" style={{ zIndex: 10000 }}>
          <div className="admin-modal-card" style={{ maxWidth: '720px' }}>
            <div className="admin-modal-header">
              <div>
                <h2>Review Employee Solution Code</h2>
                <p>Problem: <strong>{reviewSubmission.problemTitle || 'Coding Problem'}</strong> • Language: <strong>{reviewSubmission.language}</strong></p>
              </div>
              <button 
                type="button" 
                onClick={() => setReviewSubmission(null)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="admin-modal-body">
              {reviewMsg && (
                <div style={{ padding: '10px 14px', backgroundColor: 'rgba(34, 197, 94, 0.12)', color: '#15803d', borderRadius: '8px', marginBottom: '14px', fontWeight: 600, fontSize: '0.88rem' }}>
                  {reviewMsg}
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--color-text-base)' }}>
                  Submitted Solution Code ({reviewSubmission.language}):
                </label>
                <pre style={{ backgroundColor: '#0f172a', color: '#38bdf8', padding: '16px', borderRadius: '10px', fontSize: '0.88rem', fontFamily: "'Fira Code', 'Consolas', monospace", overflowX: 'auto', border: '1px solid #334155', margin: 0, lineHeight: 1.5 }}>
                  {reviewSubmission.solutionCode || 'No code submitted.'}
                </pre>
              </div>

              {reviewSubmission.externalSubmissionUrl && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--color-text-base)' }}>
                    External Submission Link:
                  </label>
                  <a 
                    href={reviewSubmission.externalSubmissionUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', fontWeight: 600, fontSize: '0.85rem', border: '1px solid rgba(37, 99, 235, 0.2)', textDecoration: 'none' }}
                  >
                    <ExternalLink size={14} /> Open Employee Submission ({reviewSubmission.platform || 'LeetCode/HackerRank'})
                  </a>
                </div>
              )}

              {reviewSubmission.screenshotUrl && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--color-text-base)' }}>
                    Uploaded Execution Output Screenshot:
                  </label>
                  <div style={{ padding: '12px', backgroundColor: 'var(--color-bg-base)', borderRadius: '10px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                    <img 
                      src={reviewSubmission.screenshotUrl} 
                      alt="Output Screenshot" 
                      style={{ maxWidth: '100%', maxHeight: '350px', borderRadius: '8px', border: '1px solid var(--color-border)', objectFit: 'contain' }} 
                    />
                  </div>
                </div>
              )}

              {reviewSubmission.explanation && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--color-text-base)' }}>
                    Algorithm Explanation:
                  </label>
                  <div style={{ padding: '12px 14px', backgroundColor: 'var(--color-bg-base)', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.88rem', fontStyle: 'italic' }}>
                    "{reviewSubmission.explanation}"
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--color-text-base)' }}>
                  Rejection Feedback Comment (Required if rejecting)
                </label>
                <input 
                  type="text"
                  value={rejectComment}
                  onChange={(e) => setRejectComment(e.target.value)}
                  placeholder="e.g. Incorrect time complexity / failed edge cases..."
                  className="ui-input"
                  style={{ width: '100%', padding: '10px 14px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
                <Button type="button" variant="danger" style={{ backgroundColor: '#dc2626', color: '#fff' }} onClick={handleRejectSolution} isLoading={isReviewing}>
                  Reject Solution
                </Button>
                <Button type="button" onClick={handleVerifySolution} isLoading={isReviewing}>
                  Verify Solution (Mark Solved)
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
