import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  Code, CheckCircle, Clock, ExternalLink, Send, AlertCircle, Sparkles, Filter, X
} from 'lucide-react';
import { getWeeklyCodingChallenge, startCodingProblem, submitCodingSolution } from '../utils/api';
import './EmployeeCoding.css';

export const EmployeeCoding = () => {
  const [weeklyData, setWeeklyData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLang, setSelectedLang] = useState('ALL');
  const [selectedDiff, setSelectedDiff] = useState('ALL');

  // Submission Modal state
  const [activeProblem, setActiveProblem] = useState(null);
  const [solutionType, setSolutionType] = useState('CODE'); // 'CODE' | 'URL'
  const [solutionCode, setSolutionCode] = useState('');
  const [outputResult, setOutputResult] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [explanation, setExplanation] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const currentUser = (() => {
    try {
      const s = localStorage.getItem('user');
      return s ? JSON.parse(s) : null;
    } catch (e) {
      return null;
    }
  })();

  const employeeId = currentUser?.employeeId || 'EMP001';

  useEffect(() => {
    loadChallenge();
  }, []);

  const loadChallenge = async () => {
    setIsLoading(true);
    try {
      const res = await getWeeklyCodingChallenge(employeeId);
      if (res) {
        setWeeklyData(res);
      }
    } catch (err) {
      console.warn('Backend unavailable, using default challenge data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenProblem = async (problem) => {
    // Open external problem URL in new tab
    if (problem.url) {
      window.open(problem.url, '_blank', 'noopener,noreferrer');
    }

    // Update status to IN_PROGRESS in backend
    try {
      await startCodingProblem(problem.id, employeeId, weeklyData?.challenge?.id);
      loadChallenge();
    } catch (err) {
      console.error('Failed to update start status:', err);
    }
  };

  const handleOpenSubmitModal = (problem) => {
    setActiveProblem(problem);
    setSolutionCode('');
    setOutputResult('');
    setScreenshotUrl('');
    setExplanation('');
    setExternalUrl(problem.url || '');
    setErrorMsg(null);
    setSuccessMsg(null);
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
          setScreenshotUrl(compressedDataUrl);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitSolution = async (e) => {
    e.preventDefault();
    if (!activeProblem) return;

    if (solutionType === 'CODE' && !solutionCode.trim()) {
      setErrorMsg('Please enter your solution code before submitting.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await submitCodingSolution(activeProblem.id, {
        employeeId: employeeId,
        challengeId: weeklyData?.challenge?.id,
        language: activeProblem.language || 'Python',
        solutionCode: solutionCode,
        outputResult: outputResult,
        screenshotUrl: screenshotUrl,
        explanation: explanation,
        externalSubmissionUrl: externalUrl
      });

      setSuccessMsg('Solution, submission link & screenshot submitted successfully! Awaiting Admin verification.');
      setTimeout(() => {
        setActiveProblem(null);
        loadChallenge();
      }, 1500);
    } catch (err) {
      console.error('Submission failed:', err);
      setErrorMsg(err.message || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const problemsList = weeklyData?.problems || [
    { id: 1, position: 1, title: 'Two Sum', source: 'LEETCODE', language: 'Python', difficulty: 'Easy', category: 'Data Structures', url: 'https://leetcode.com/problems/two-sum/', status: 'NOT_STARTED' },
    { id: 2, position: 2, title: 'Valid Parentheses', source: 'LEETCODE', language: 'Python', difficulty: 'Easy', category: 'Algorithms', url: 'https://leetcode.com/problems/valid-parentheses/', status: 'NOT_STARTED' },
    { id: 3, position: 3, title: 'Group Anagrams', source: 'LEETCODE', language: 'Python', difficulty: 'Medium', category: 'Data Structures', url: 'https://leetcode.com/problems/group-anagrams/', status: 'NOT_STARTED' },
    { id: 4, position: 4, title: 'Longest Substring Without Repeating Characters', source: 'LEETCODE', language: 'Python', difficulty: 'Medium', category: 'Algorithms', url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', status: 'NOT_STARTED' },
    { id: 5, position: 5, title: 'Merge k Sorted Lists', source: 'LEETCODE', language: 'Python', difficulty: 'Hard', category: 'Data Structures', url: 'https://leetcode.com/problems/merge-k-sorted-lists/', status: 'NOT_STARTED' },
    { id: 6, position: 6, title: 'Select All', source: 'HACKERRANK', language: 'SQL', difficulty: 'Easy', category: 'Database Queries', url: 'https://www.hackerrank.com/challenges/select-all-sql/problem', status: 'NOT_STARTED' },
    { id: 7, position: 7, title: 'Revising the Select Query I', source: 'HACKERRANK', language: 'SQL', difficulty: 'Easy', category: 'Database Queries', url: 'https://www.hackerrank.com/challenges/revising-the-select-query/problem', status: 'NOT_STARTED' },
    { id: 8, position: 8, title: 'Weather Observation Station 5', source: 'HACKERRANK', language: 'SQL', difficulty: 'Medium', category: 'Database Queries', url: 'https://www.hackerrank.com/challenges/weather-observation-station-5/problem', status: 'NOT_STARTED' },
    { id: 9, position: 9, title: 'Occupations Pivot', source: 'HACKERRANK', language: 'SQL', difficulty: 'Medium', category: 'Database Queries', url: 'https://www.hackerrank.com/challenges/occupations/problem', status: 'NOT_STARTED' },
    { id: 10, position: 10, title: '15 Days of Learning SQL', source: 'HACKERRANK', language: 'SQL', difficulty: 'Hard', category: 'Database Queries', url: 'https://www.hackerrank.com/challenges/15-days-of-learning-sql/problem', status: 'NOT_STARTED' }
  ];

  const filteredProblems = problemsList.filter(p => {
    let matchLang = true;
    if (selectedLang !== 'ALL') {
      matchLang = (p.language || 'Python').toUpperCase() === selectedLang.toUpperCase();
    }
    let matchDiff = true;
    if (selectedDiff !== 'ALL') {
      matchDiff = (p.difficulty || 'Easy').toUpperCase() === selectedDiff.toUpperCase();
    }
    return matchLang && matchDiff;
  });

  const progress = weeklyData?.progress || { solved: 0, total: 10, percentage: 0 };
  const challengeInfo = weeklyData?.challenge || { title: 'Week: Aug 23 – Aug 29, 2026', weekStart: '2026-08-23', weekEnd: '2026-08-29' };

  return (
    <div className="employee-coding-page">
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1>Weekly Coding Challenge</h1>
          <p className="subtitle">Master 10 curated Python & SQL problems weekly from LeetCode & HackerRank</p>
        </div>
      </div>

      {/* WEEKLY HERO PROGRESS BANNER */}
      <Card style={{ padding: '1.75rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '2px 10px', borderRadius: '12px', backgroundColor: 'var(--color-primary-600)', color: '#ffffff' }}>
                Weekly Challenge
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                {challengeInfo.title || 'Week: Aug 23 – Aug 29, 2026'}
              </span>
            </div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '1.4rem' }}>10 Assigned Problems (5 Python, 5 SQL)</h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Due Date: <strong>{challengeInfo.weekEnd || 'Aug 29, 2026'} 23:59:59</strong>
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Verified Completion</span>
            <h1 style={{ margin: '2px 0 0 0', color: progress.percentage === 100 ? '#15803d' : 'var(--color-primary-600)', fontSize: '2.2rem' }}>
              {progress.solved} / {progress.total} Solved ({progress.percentage}%)
            </h1>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ width: '100%', height: '10px', backgroundColor: 'var(--color-bg-base)', borderRadius: '5px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
          <div style={{ width: `${progress.percentage}%`, height: '100%', backgroundColor: progress.percentage === 100 ? '#15803d' : 'var(--color-primary-600)', transition: 'width 0.4s ease' }} />
        </div>
      </Card>

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Code size={18} style={{ color: 'var(--color-primary-600)' }} /> Problem List ({filteredProblems.length}/10)
        </h3>

        <div style={{ display: 'flex', gap: '10px' }}>
          <select 
            className="filter-select"
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            style={{ padding: '6px 12px', fontSize: '0.85rem' }}
          >
            <option value="ALL">All Languages (Python & SQL)</option>
            <option value="PYTHON">Python (5)</option>
            <option value="SQL">SQL (5)</option>
          </select>

          <select 
            className="filter-select"
            value={selectedDiff}
            onChange={(e) => setSelectedDiff(e.target.value)}
            style={{ padding: '6px 12px', fontSize: '0.85rem' }}
          >
            <option value="ALL">All Difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>
      </div>

      {/* PROBLEM CARDS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
        {filteredProblems.map((prob, idx) => {
          const statusUpper = (prob.status || 'NOT_STARTED').toUpperCase();

          let statusBg = 'rgba(100, 116, 139, 0.15)';
          let statusColor = '#64748b';

          if (statusUpper === 'VERIFIED') {
            statusBg = 'rgba(34, 197, 94, 0.15)';
            statusColor = '#15803d';
          } else if (statusUpper === 'SUBMITTED') {
            statusBg = 'rgba(234, 179, 8, 0.15)';
            statusColor = '#b45309';
          } else if (statusUpper === 'IN_PROGRESS') {
            statusBg = 'rgba(37, 99, 235, 0.15)';
            statusColor = '#2563eb';
          } else if (statusUpper === 'REJECTED') {
            statusBg = 'rgba(239, 68, 68, 0.15)';
            statusColor = '#dc2626';
          } else if (statusUpper === 'OVERDUE') {
            statusBg = 'rgba(239, 68, 68, 0.2)';
            statusColor = '#dc2626';
          }

          return (
            <Card key={prob.id || idx} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary-600)' }}>
                    #{prob.position || idx + 1}
                  </span>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', backgroundColor: 'var(--color-bg-base)', border: '1px solid var(--color-border)' }}>
                      {prob.source || 'LEETCODE'}
                    </span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', backgroundColor: (prob.language || 'Python').toUpperCase() === 'PYTHON' ? 'rgba(37, 99, 235, 0.15)' : 'rgba(168, 85, 247, 0.15)', color: (prob.language || 'Python').toUpperCase() === 'PYTHON' ? '#2563eb' : '#9333ea' }}>
                      {prob.language || 'Python'}
                    </span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', backgroundColor: (prob.difficulty || 'Easy').toUpperCase() === 'EASY' ? 'rgba(34, 197, 94, 0.15)' : (prob.difficulty || 'Easy').toUpperCase() === 'MEDIUM' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: (prob.difficulty || 'Easy').toUpperCase() === 'EASY' ? '#15803d' : (prob.difficulty || 'Easy').toUpperCase() === 'MEDIUM' ? '#b45309' : '#dc2626' }}>
                      {prob.difficulty || 'Easy'}
                    </span>
                  </div>
                </div>

                <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem' }}>{prob.title}</h3>
                <p style={{ margin: '0 0 12px 0', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                  Category: {prob.category || 'Algorithms'}
                </p>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingTop: '10px', borderTop: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Status</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '2px 10px', borderRadius: '12px', backgroundColor: statusBg, color: statusColor }}>
                    {statusUpper === 'NOT_STARTED' ? 'Not Started' : statusUpper === 'IN_PROGRESS' ? 'In Progress' : statusUpper === 'SUBMITTED' ? 'Submitted (Awaiting Admin)' : statusUpper === 'VERIFIED' ? '✓ Verified' : statusUpper === 'REJECTED' ? 'Rejected (Retry)' : 'Overdue'}
                  </span>
                </div>

                {/* STRICT BUTTONS: Open Problem & Submit Solution (NO Mark as Completed) */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    size="sm" 
                    style={{ flex: 1 }}
                    onClick={() => handleOpenProblem(prob)}
                  >
                    <ExternalLink size={14} style={{ marginRight: '4px' }} /> Open Problem
                  </Button>

                  <Button 
                    type="button" 
                    size="sm" 
                    style={{ flex: 1 }}
                    disabled={statusUpper === 'VERIFIED'}
                    onClick={() => handleOpenSubmitModal(prob)}
                  >
                    <Send size={14} style={{ marginRight: '4px' }} /> {statusUpper === 'SUBMITTED' ? 'Resubmit' : 'Submit Solution'}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* HIGH-QUALITY SUBMISSION MODAL */}
      {activeProblem && (
        <div className="submission-modal-overlay">
          <div className="submission-modal-card">
            <div className="submission-modal-header">
              <div>
                <h2>Submit Solution: {activeProblem.title}</h2>
                <p>
                  Platform: <strong>{activeProblem.source}</strong> • Language: <strong>{activeProblem.language}</strong> • Difficulty: <strong>{activeProblem.difficulty}</strong>
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setActiveProblem(null)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitSolution} className="submission-modal-body">
              {errorMsg && (
                <div style={{ padding: '10px 14px', backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#dc2626', borderRadius: '8px', marginBottom: '16px', fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} /> {errorMsg}
                </div>
              )}

              {successMsg && (
                <div style={{ padding: '10px 14px', backgroundColor: 'rgba(34, 197, 94, 0.12)', color: '#15803d', borderRadius: '8px', marginBottom: '16px', fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={16} /> {successMsg}
                </div>
              )}

              <div className="submission-tab-group">
                <button 
                  type="button"
                  onClick={() => setSolutionType('CODE')}
                  className={`submission-tab-btn ${solutionType === 'CODE' ? 'active' : ''}`}
                >
                  Code Submission
                </button>
                <button 
                  type="button"
                  onClick={() => setSolutionType('URL')}
                  className={`submission-tab-btn ${solutionType === 'URL' ? 'active' : ''}`}
                >
                  External Submission Link
                </button>
              </div>

              {solutionType === 'CODE' ? (
                <>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--color-text-base)' }}>
                      1. Paste Your Solution Code ({activeProblem.language}) *
                    </label>
                    <textarea 
                      value={solutionCode}
                      onChange={(e) => setSolutionCode(e.target.value)}
                      className="code-editor-textarea"
                      rows={6}
                      placeholder={activeProblem.language === 'SQL' ? "SELECT name, salary FROM employees WHERE salary > 50000;" : "def twoSum(nums, target):\n    # Write your solution code here..."}
                      required
                    />
                  </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--color-text-base)' }}>
                      2. Upload Screenshot of Code Output / Execution Result
                    </label>
                    
                    <div style={{ padding: '14px', borderRadius: '8px', border: '1px dashed var(--color-border)', backgroundColor: 'var(--color-bg-base)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <input 
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        style={{ fontSize: '0.85rem' }}
                      />

                      {screenshotUrl && (
                        <div style={{ marginTop: '8px', position: 'relative' }}>
                          <span style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                            ✓ Screenshot Attached:
                          </span>
                          <img 
                            src={screenshotUrl} 
                            alt="Output Screenshot Preview" 
                            style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', border: '1px solid var(--color-border)', objectFit: 'contain', backgroundColor: '#0f172a' }} 
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--color-text-base)' }}>
                    External Solution URL *
                  </label>
                  <input 
                    type="url"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    className="ui-input"
                    placeholder="https://leetcode.com/submissions/detail/123456789/"
                    style={{ width: '100%', padding: '12px' }}
                    required
                  />
                </div>
              )}

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--color-text-base)' }}>
                  Algorithm Approach & Complexity Explanation (Optional)
                </label>
                <textarea 
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  className="ui-input"
                  rows={3}
                  placeholder="Briefly explain your time complexity and algorithm approach (e.g. O(n) hashmap lookup)..."
                  style={{ width: '100%', fontSize: '0.88rem', padding: '12px' }}
                />
              </div>

              <div className="submission-modal-footer" style={{ padding: 0, background: 'none', border: 'none' }}>
                <Button type="button" variant="secondary" onClick={() => setActiveProblem(null)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                  <Send size={14} style={{ marginRight: '6px' }} /> Submit Solution
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
