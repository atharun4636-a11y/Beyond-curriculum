import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { 
  getDB, setDB, 
  defaultSubmissions, defaultEmployees 
} from '../utils/db';
import { 
  FileText, Cpu, ExternalLink, CheckCircle, Award, 
  AlertTriangle, AlertCircle, ChevronDown, ChevronUp, Check, X, ShieldAlert
} from 'lucide-react';
import './AdminEvaluations.css';

export const AdminEvaluations = () => {
  const [submissions, setSubmissions] = useState(() => getDB('submissions', defaultSubmissions));

  // Sync with localStorage
  useEffect(() => {
    setDB('submissions', submissions);
  }, [submissions]);

  const [selectedId, setSelectedId] = useState(1);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [publishedMsg, setPublishedMsg] = useState(false);

  // Selected Submission
  const selectedSub = submissions.find(sub => sub.id === selectedId);

  // Evaluation States
  const [evalMode, setEvalMode] = useState('Automated'); // 'Automated' | 'Manual' | 'Hybrid'
  const [evalStatus, setEvalStatus] = useState('Pending'); // 'Pending', 'Evaluating', 'Completed', 'Partially Verified', 'Failed', 'Needs Manual Review'
  const [evidenceList, setEvidenceList] = useState([]);
  const [confidence, setConfidence] = useState('Low');
  const [coverage, setCoverage] = useState(0);

  // Category scores bound strictly to Point limits
  const [scores, setScores] = useState({ functionality: 0, uiux: 0, innovation: 0, completeness: 0, usability: 0 });
  const [feedback, setFeedback] = useState({ strengths: '', weaknesses: '', suggestions: '', recommended: 0 });
  const [finalScore, setFinalScore] = useState(0);
  const [adminReason, setAdminReason] = useState('');

  // Accordion toggle states
  const [expandedSection, setExpandedSection] = useState(null); // 'functionality' | 'uiux' | 'innovation' | 'completeness' | 'usability'

  // Manual Checklists fallback mode variables
  const [manualChecklist, setManualChecklist] = useState({
    landingPage: false,
    navigation: false,
    authFlow: false,
    dataForms: false,
    mobileResponsiveness: false
  });

  // Sync evaluations dashboard when changing selected submission
  useEffect(() => {
    if (selectedSub) {
      setEvalStatus(selectedSub.status);
      setEvalMode(selectedSub.evalMode || 'Automated');
      setEvidenceList(selectedSub.evidenceList || []);
      setConfidence(selectedSub.confidence || 'Low');
      setCoverage(selectedSub.coverage || 0);
      setAdminReason(selectedSub.adminReason || '');

      if (selectedSub.scores) {
        setScores(selectedSub.scores);
        setFeedback(selectedSub.feedback);
        setFinalScore(selectedSub.finalScore || selectedSub.feedback.recommended);
      } else {
        setScores({ functionality: 0, uiux: 0, innovation: 0, completeness: 0, usability: 0 });
        setFeedback({ strengths: '', weaknesses: '', suggestions: '', recommended: 0 });
        setFinalScore(0);
      }
      setExpandedSection(null);
    }
  }, [selectedId, submissions]);

  // Recalculate scores in Manual checklist fallback mode
  useEffect(() => {
    if (evalMode === 'Manual' && selectedSub && selectedSub.status !== 'Reviewed') {
      let functionalityPoints = 0;
      let uiuxPoints = 0;
      let completenessPoints = 0;
      let usabilityPoints = 0;

      if (manualChecklist.landingPage) {
        functionalityPoints += 10;
        uiuxPoints += 5;
        completenessPoints += 3;
        usabilityPoints += 3;
      }
      if (manualChecklist.navigation) {
        functionalityPoints += 8;
        uiuxPoints += 5;
        completenessPoints += 3;
        usabilityPoints += 4;
      }
      if (manualChecklist.authFlow) {
        functionalityPoints += 6;
        uiuxPoints += 4;
        completenessPoints += 4;
        usabilityPoints += 3;
      }
      if (manualChecklist.dataForms) {
        functionalityPoints += 6;
        uiuxPoints += 3;
        completenessPoints += 3;
        usabilityPoints += 3;
      }
      if (manualChecklist.mobileResponsiveness) {
        uiuxPoints += 3;
        usabilityPoints += 2;
      }

      const calculatedScores = {
        functionality: functionalityPoints,
        uiux: uiuxPoints,
        innovation: 12, // Standard baseline
        completeness: completenessPoints,
        usability: usabilityPoints
      };

      const recommendedScore = calculatedScores.functionality + calculatedScores.uiux + calculatedScores.innovation + calculatedScores.completeness + calculatedScores.usability;

      setScores(calculatedScores);
      setFinalScore(recommendedScore);
      setFeedback(prev => ({
        ...prev,
        recommended: recommendedScore,
        strengths: 'Manual inspection completed. Basic structural components verify correctly.',
        weaknesses: 'Requires final checks on backend data integrity.',
        suggestions: 'Run stress testing checks on APIs.'
      }));
    }
  }, [manualChecklist, evalMode]);

  // Validate URL link structure
  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch (_) {
      return false;
    }
  };

  // Run AI Evidence-Based Project Evaluation
  const triggerAiEvaluation = () => {
    if (!selectedSub) return;

    if (!isValidUrl(selectedSub.appLink)) {
      setEvalStatus('Failed');
      alert(`Automated URL Inspection Failed: The published application link "${selectedSub.appLink}" is invalid or unreachable. Evaluation status marked as failed / needs manual review.`);
      return;
    }

    setIsAiLoading(true);
    setEvalStatus('Evaluating');

    setTimeout(() => {
      setIsAiLoading(false);
      setEvalStatus('Completed');

      // EVIDENCE-BASED MOCK GRADINGS
      const collectedEvidence = [
        { feature: 'Landing page loading', status: 'Verified', evidence: 'Landing page loaded successfully within 1.25s.', url: selectedSub.appLink, testResult: 'Pass' },
        { feature: 'Profile dashboard navigation', status: 'Verified', evidence: 'Sidebar navigation items redirect cleanly.', url: `${selectedSub.appLink}/dashboard`, testResult: 'Pass' },
        { feature: 'User authentication gate', status: 'Not Verified', evidence: 'Authentication gate detected, bypass prevented without active credentials.', url: `${selectedSub.appLink}/login`, testResult: 'Pass' },
        { feature: 'Data forms validation', status: 'Failed', evidence: 'Forms submit null values without raising native inline errors.', url: `${selectedSub.appLink}/forms`, testResult: 'Fail' },
        { feature: 'Mobile layout breakpoints', status: 'Verified', evidence: 'Renders correctly under 320px viewport metrics.', url: selectedSub.appLink, testResult: 'Pass' }
      ];

      setEvidenceList(collectedEvidence);
      setConfidence('High');
      setCoverage(80);

      // Scoring bound strictly to points limits (max 30 / 20 / 20 / 15 / 15)
      const rubricScores = {
        functionality: 22, // Max 30
        uiux: 15,          // Max 20
        innovation: 16,    // Max 20
        completeness: 11,  // Max 15
        usability: 11      // Max 15
      };

      const recommendedScore = rubricScores.functionality + rubricScores.uiux + rubricScores.innovation + rubricScores.completeness + rubricScores.usability;

      setScores(rubricScores);
      setFinalScore(recommendedScore);
      setFeedback({
        strengths: 'Responsive mobile breakpoints verify cleanly. Active page transition latency is extremely low.',
        weaknesses: 'Form actions fail to report user validations. Auth routes restrict testing without credentials.',
        suggestions: 'Implement regex validations inside form scripts. Set up sandbox credentials for reviewer testing.',
        recommended: recommendedScore
      });
    }, 2000);
  };

  // Publish final evaluation
  const publishEvaluation = () => {
    // Override safeguards validation
    const recommended = feedback.recommended;
    if (finalScore !== recommended && !adminReason.trim()) {
      alert('Security Warning: If you override the AI Recommended Score, you MUST provide an "Admin Adjustment Reason" explaining the manual validation updates.');
      return;
    }

    setSubmissions(submissions.map(sub => 
      sub.id === selectedId 
        ? { 
            ...sub, 
            status: 'Reviewed', 
            scores, 
            feedback, 
            finalScore,
            adminReason,
            evalMode,
            reviewer: 'Administrator',
            reviewDate: new Date().toISOString().split('T')[0],
            score: `${finalScore}/100`,
            evidenceList,
            confidence,
            coverage
          } 
        : sub
    ));

    // Sync score back to targeted employee growth index
    if (selectedSub && selectedSub.developer) {
      const emps = getDB('employees', defaultEmployees);
      const updatedEmps = emps.map(emp => 
        emp.name && emp.name.toLowerCase() === selectedSub.developer.toLowerCase()
          ? { ...emp, score: finalScore }
          : emp
      );
      setDB('employees', updatedEmps);
    }

    setPublishedMsg(true);
    setTimeout(() => setPublishedMsg(false), 3000);
  };

  // Explanation Data Provider for Rubric categories
  const getExplanationData = (category) => {
    switch (category) {
      case 'functionality':
        return {
          pos: ['Landing page loaded successfully.', 'Menu links redirect cleanly.'],
          neg: ['Form inputs do not trigger validation rules.', 'Database persistence fails on page refresh.'],
          reason: 'Stable baseline mechanics but missing robust error-boundary handling.'
        };
      case 'uiux':
        return {
          pos: ['Glassmorphic styling applied consistently.', 'Responsive breakpoints match 320px-1024px.'],
          neg: ['Active button states lack subtle animations.', 'Alert notifications overflow the top header.'],
          reason: 'Fluid navigation layouts and consistent color palette templates.'
        };
      case 'innovation':
        return {
          pos: ['Creative implementation of speech indicators.'],
          neg: ['Integrates standard API endpoints without novel customizations.'],
          reason: 'Applies functional models but sticks strictly to existing blueprints.'
        };
      case 'completeness':
        return {
          pos: ['Login UI and Dashboard panels exist.'],
          neg: ['Password recovery links are not implemented.'],
          reason: 'Core deliverables are available, but peripheral metrics are missing.'
        };
      case 'usability':
        return {
          pos: ['High legibility typography scales.', 'Form buttons are easy to locate.'],
          neg: ['Micro-animations are absent during loading state durations.'],
          reason: 'Excellent learnability metrics but lacks high-end usability transitions.'
        };
      default:
        return { pos: [], neg: [], reason: '' };
    }
  };

  return (
    <div className="admin-evaluations">
      <div className="section-header">
        <div>
          <h1>Project Evaluation</h1>
          <p className="subtitle">Audit hackathon submissions, inspect live urls, collect verified evidence, and score according to point-rubric rules</p>
        </div>
      </div>

      <div className="evaluations-grid">
        {/* Left Side: Submissions list */}
        <div className="submissions-sidebar">
          <h3>Submissions</h3>
          <div className="sub-scroll-list">
            {submissions.map(sub => (
              <div 
                key={sub.id} 
                className={`sub-card-item ${sub.id === selectedId ? 'selected' : ''}`}
                onClick={() => setSelectedId(sub.id)}
              >
                <div className="sub-header-line">
                  <h4>{sub.title}</h4>
                  <span className={`badge-status ${sub.status.toLowerCase()}`}>{sub.status}</span>
                </div>
                <div className="sub-meta-line">
                  <span>By: {sub.developer}</span>
                  <span>Platform: {sub.platform}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Selected Submission Details + AI Evaluation Board */}
        <div className="evaluation-board">
          {selectedSub ? (
            <div className="eval-board-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <Card className="project-details-card">
                <div className="proj-header">
                  <h2>{selectedSub.title}</h2>
                  <a href={selectedSub.appLink} target="_blank" rel="noopener noreferrer" className="live-link-btn">
                    Visit Published Link <ExternalLink size={16} />
                  </a>
                </div>
                <p className="proj-description">{selectedSub.description}</p>
                <div className="proj-meta-info">
                  <span>Developer: <strong>{selectedSub.developer}</strong></span>
                  <span>Development Platform: <strong>{selectedSub.platform}</strong></span>
                </div>
              </Card>

              {/* Evaluation Engine Control Card */}
              <Card className="scoring-card">
                <div className="scoring-header-section">
                  <h3>Evidence-Based Grading Control</h3>
                  
                  {/* Evaluation Mode Toggle */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Evaluation Mode:</label>
                    <select 
                      value={evalMode} 
                      onChange={(e) => setEvalMode(e.target.value)}
                      disabled={selectedSub.status === 'Reviewed'}
                      style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-base)' }}
                    >
                      <option value="Automated">Automated</option>
                      <option value="Manual">Manual Evidence</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>

                  {selectedSub.status !== 'Reviewed' && evalMode !== 'Manual' && (
                    <Button onClick={triggerAiEvaluation} isLoading={isAiLoading} className="ai-btn">
                      <Cpu size={16} /> Run AI Evaluation
                    </Button>
                  )}
                </div>

                {/* Fallback Mode Trigger alerts */}
                {evalStatus === 'Failed' && (
                  <div className="fallback-warning">
                    <AlertCircle size={16} />
                    <span>Automated inspection unavailable. Connection timed out or link is invalid. Switch to manual checklist evaluation below.</span>
                  </div>
                )}

                {/* Manual checklists checklist widgets */}
                {evalMode === 'Manual' && selectedSub.status !== 'Reviewed' && (
                  <div style={{ marginTop: '1rem' }}>
                    <h4>Verification Checklist</h4>
                    <div className="manual-checklist-grid">
                      {[
                        { key: 'landingPage', label: 'Landing Page loads' },
                        { key: 'navigation', label: 'Navigation links work' },
                        { key: 'authFlow', label: 'Auth Gate verified' },
                        { key: 'dataForms', label: 'Interactive Forms verify' },
                        { key: 'mobileResponsiveness', label: 'Mobile layout scales' }
                      ].map(item => (
                        <div 
                          key={item.key} 
                          onClick={() => setManualChecklist({ ...manualChecklist, [item.key]: !manualChecklist[item.key] })}
                          className={`checklist-card-item ${manualChecklist[item.key] ? 'selected' : ''}`}
                          style={{ cursor: 'pointer', border: manualChecklist[item.key] ? '1px solid var(--color-primary-600)' : '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', borderRadius: '6px' }}
                        >
                          <input type="checkbox" checked={manualChecklist[item.key]} readOnly />
                          <span>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Evidence Metrics Summary */}
                {evidenceList.length > 0 && (
                  <div className="eval-meta-summary">
                    <div className="eval-meta-card">
                      <label>Confidence Rating</label>
                      <span>{confidence}</span>
                    </div>
                    <div className="eval-meta-card">
                      <label>Evidence Coverage</label>
                      <span>{coverage}%</span>
                    </div>
                    <div className="eval-meta-card">
                      <label>Evaluation Status</label>
                      <span>{evalStatus}</span>
                    </div>
                  </div>
                )}

                {/* Low coverage warnings */}
                {evidenceList.length > 0 && coverage < 50 && (
                  <div className="coverage-warning">
                    <AlertTriangle size={16} />
                    <span>Warning: Low evidence coverage. Verify remaining components manually before publishing results.</span>
                  </div>
                )}

                {/* Verified Evidence list Table */}
                {evidenceList.length > 0 && (
                  <div className="evidence-table-card">
                    <h4>Collected Verification Evidence</h4>
                    <div style={{ overflowX: 'auto', marginTop: '0.5rem' }}>
                      <table className="evidence-table">
                        <thead>
                          <tr>
                            <th>Feature</th>
                            <th>Status</th>
                            <th>Evidence Details</th>
                            <th>URL Tested</th>
                            <th>Result</th>
                          </tr>
                        </thead>
                        <tbody>
                          {evidenceList.map((ev, idx) => (
                            <tr key={idx}>
                              <td style={{ fontWeight: 600 }}>{ev.feature}</td>
                              <td>
                                <span className={`badge-status ${ev.status === 'Verified' ? 'approved' : ev.status === 'Failed' ? 'rejected' : 'pending'}`}>
                                  {ev.status}
                                </span>
                              </td>
                              <td style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{ev.evidence}</td>
                              <td><a href={ev.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: 'var(--color-primary-600)' }}>Tested Link</a></td>
                              <td>
                                <span style={{ fontWeight: 700, color: ev.testResult === 'Pass' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                  {ev.testResult}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Sliders bound strictly to scoring rules */}
                <h4 style={{ marginTop: '1rem' }}>Adjust Scoring Rubric (Fixed Point Weights)</h4>
                <div className="score-sliders">
                  {[
                    { label: 'Functionality (Working behavior)', key: 'functionality', max: 30, desc: 'Pages, links, and forms operational' },
                    { label: 'UI / UX Design (Visual hierarchy)', key: 'uiux', max: 20, desc: 'Consistent typography, layout balance' },
                    { label: 'Innovation (Creative tech usage)', key: 'innovation', max: 20, desc: 'Relevance, design customizations' },
                    { label: 'Feature Completeness', key: 'completeness', max: 15, desc: 'Ratio of declared specifications' },
                    { label: 'Usability (Overall UX flow)', key: 'usability', max: 15, desc: 'Ease of control, learnability' }
                  ].map(param => (
                    <div key={param.key} className="slider-row">
                      <div className="slider-label">
                        <div>
                          <strong>{param.label}</strong>
                          <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{param.desc}</p>
                        </div>
                        <span style={{ fontSize: '1rem', fontWeight: 700 }}>
                          {scores[param.key]} / {param.max}
                        </span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max={param.max} 
                        value={scores[param.key]} 
                        onChange={(e) => setScores({ ...scores, [param.key]: parseInt(e.target.value) })}
                        disabled={selectedSub.status === 'Reviewed'}
                        className="score-range-slider"
                      />
                    </div>
                  ))}
                </div>

                {/* Explainable Category Details (Why this score?) Accordions */}
                <div className="rubric-accordion-list">
                  <h4>Why this score? (Explainable Rubrics)</h4>
                  {[
                    { label: 'Functionality Explanation', key: 'functionality' },
                    { label: 'UI/UX Details', key: 'uiux' },
                    { label: 'Innovation Context', key: 'innovation' },
                    { label: 'Feature Completeness calculations', key: 'completeness' },
                    { label: 'Usability metrics analysis', key: 'usability' }
                  ].map(sec => {
                    const isExpanded = expandedSection === sec.key;
                    const expData = getExplanationData(sec.key);
                    return (
                      <div key={sec.key} className="rubric-accordion-item">
                        <div 
                          className="rubric-accordion-header" 
                          onClick={() => setExpandedSection(isExpanded ? null : sec.key)}
                        >
                          <span>{sec.label}</span>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                        {isExpanded && (
                          <div className="rubric-accordion-content">
                            <div className="evidence-list-split">
                              <div className="evidence-sub-box positive">
                                <h5>Positive Evidence Verified</h5>
                                <ul>
                                  {expData.pos.map((p, i) => <li key={i}>{p}</li>)}
                                </ul>
                              </div>
                              <div className="evidence-sub-box negative">
                                <h5>Negative Evidence / Areas to Improve</h5>
                                <ul>
                                  {expData.neg.map((n, i) => <li key={i}>{n}</li>)}
                                </ul>
                              </div>
                            </div>
                            <div className="reasoning-box">
                              <strong>Scoring Reasoning:</strong> {expData.reason}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* AI feedback text logs */}
                {feedback.recommended > 0 && (
                  <div className="feedback-textareas" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
                    <div className="feedback-box">
                      <strong>AI Strengths</strong>
                      <textarea 
                        value={feedback.strengths} 
                        onChange={(e) => setFeedback({ ...feedback, strengths: e.target.value })}
                        disabled={selectedSub.status === 'Reviewed'}
                        rows={3} 
                      />
                    </div>
                    <div className="feedback-box">
                      <strong>AI Weaknesses</strong>
                      <textarea 
                        value={feedback.weaknesses} 
                        onChange={(e) => setFeedback({ ...feedback, weaknesses: e.target.value })}
                        disabled={selectedSub.status === 'Reviewed'}
                        rows={3} 
                      />
                    </div>
                    <div className="feedback-box">
                      <strong>AI Recommendations</strong>
                      <textarea 
                        value={feedback.suggestions} 
                        onChange={(e) => setFeedback({ ...feedback, suggestions: e.target.value })}
                        disabled={selectedSub.status === 'Reviewed'}
                        rows={3} 
                      />
                    </div>
                  </div>
                )}

                {/* Admin review overrides validations */}
                <div className="eval-publish-section">
                  <div className="recommended-score-box">
                    <span>AI Recommended Score: <strong>{feedback.recommended}/100</strong></span>
                  </div>
                  <div className="final-score-input">
                    <label>Admin Final Score</label>
                    <input 
                      type="number" 
                      min="0" 
                      max="100" 
                      value={finalScore} 
                      onChange={(e) => setFinalScore(parseInt(e.target.value))}
                      disabled={selectedSub.status === 'Reviewed'}
                    />
                  </div>
                  
                  {/* Adjustment override reason input box */}
                  <div className="wizard-field" style={{ flex: '1 1 100%' }}>
                    <label className="ui-input-label">
                      Admin Adjustment Reason (Mandatory if Final Score overrides Recommended Score)
                    </label>
                    <input 
                      type="text" 
                      className="ui-input" 
                      value={adminReason} 
                      onChange={(e) => setAdminReason(e.target.value)}
                      disabled={selectedSub.status === 'Reviewed'}
                      placeholder="e.g. Verified additional mobile workflow manually."
                    />
                  </div>

                  {selectedSub.status !== 'Reviewed' ? (
                    <Button onClick={publishEvaluation} className="btn-publish">
                      <Award size={16} /> Publish Score
                    </Button>
                  ) : (
                    <div className="graded-badge">
                      <CheckCircle size={18} /> Grading Published
                    </div>
                  )}
                </div>

                {publishedMsg && (
                  <div className="success-toast">
                    <CheckCircle size={18} /> Evaluation score successfully logged to Hackathon Leaderboard!
                  </div>
                )}
              </Card>
            </div>
          ) : (
            <div className="empty-state">
              <FileText size={48} />
              <p>Select a submission to start evaluating.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
