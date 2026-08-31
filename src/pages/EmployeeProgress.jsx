import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  Code, MessageSquare, Award, CheckCircle2, Clock, AlertCircle, Sparkles, TrendingUp, BookOpen, Layers
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { getEmployeePerformanceProgress } from '../utils/api';
import './EmployeeProgress.css';

export const EmployeeProgress = () => {
  const [progressData, setProgressData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    setIsLoading(true);
    try {
      const data = await getEmployeePerformanceProgress();
      setProgressData(data);
    } catch (err) {
      console.warn('Failed to fetch employee progress from API, using fallback data:', err);
      // Clean fallback data
      setProgressData({
        coding: {
          verified: 1,
          submitted: 2,
          inProgress: 3,
          totalAssigned: 10,
          completionPercentage: 10.0,
          pythonVerified: 1,
          sqlVerified: 0,
          easyVerified: 1,
          medVerified: 0,
          hardVerified: 0
        },
        communication: {
          submissionsCount: 4,
          avgOverallScore: 82.5,
          avgGrammar: 84.0,
          avgVocabulary: 81.5,
          avgPronunciation: 82.0,
          wordsLearned: 40
        },
        hackathons: {
          participated: 2,
          projectsSubmitted: 1,
          certificatesEarned: 4
        },
        skillRadar: [
          { subject: 'Python Coding', A: 75, fullMark: 100 },
          { subject: 'SQL Databases', A: 65, fullMark: 100 },
          { subject: 'English Fluency', A: 83, fullMark: 100 },
          { subject: 'Problem Solving', A: 70, fullMark: 100 },
          { subject: 'Architecture & Deploy', A: 85, fullMark: 100 }
        ],
        monthlyTrend: [
          { month: 'May', coding: 2, communication: 1 },
          { month: 'Jun', coding: 4, communication: 3 },
          { month: 'Jul', coding: 6, communication: 5 },
          { month: 'Aug', coding: 10, communication: 8 }
        ]
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="employee-progress-page flex-center" style={{ minHeight: '400px' }}>
        <p style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>Loading performance metrics across all modules...</p>
      </div>
    );
  }

  const { coding, communication, hackathons, skillRadar, monthlyTrend } = progressData;

  const summary = [
    { label: 'Weekly Coding Solved', val: `${coding.verified} / ${coding.totalAssigned}`, sub: `${coding.completionPercentage}% Verified`, icon: Code, color: '#3b82f6' },
    { label: 'AI Communication Rating', val: `${communication.avgOverallScore} / 100`, sub: `${communication.submissionsCount} Stories Submitted`, icon: MessageSquare, color: '#8b5cf6' },
    { label: 'Advanced Words Learnt', val: `${communication.wordsLearned} Words`, sub: 'Daily Vocab Mastery', icon: BookOpen, color: '#10b981' },
    { label: 'Hackathons Participated', val: `${hackathons.participated}`, sub: 'Active Events', icon: Award, color: '#f59e0b' },
    { label: 'Projects Submitted', val: `${hackathons.projectsSubmitted}`, sub: 'Verified Portfolios', icon: Layers, color: '#ec4899' },
    { label: 'Skill Certificates', val: `${hackathons.certificatesEarned}`, sub: 'Earned Badges', icon: Sparkles, color: '#06b6d4' }
  ];

  return (
    <div className="employee-progress-page">
      <div className="section-header">
        <div>
          <h1>My Performance Progress</h1>
          <p className="subtitle">Real-time performance metrics across Weekly Coding Practice, AI Communication, Hackathons, and Certifications</p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="progress-summary-grid">
        {summary.map((sum, i) => {
          const IconComp = sum.icon;
          return (
            <Card key={i} className="progress-sum-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="sum-label">{sum.label}</span>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: `${sum.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconComp size={18} color={sum.color} />
                </div>
              </div>
              <span className="sum-value" style={{ fontSize: '1.4rem', fontWeight: 800 }}>{sum.val}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{sum.sub}</span>
            </Card>
          );
        })}
      </div>

      {/* Detailed Module Breakdown Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        
        {/* Module 1: Weekly Coding Practice Breakdown */}
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#3b82f615', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Code size={20} color="#3b82f6" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Weekly Coding Practice</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>10 Weekly Assigned Problems (5 Python • 5 SQL)</span>
              </div>
            </div>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#2563eb' }}>{coding.completionPercentage}%</span>
          </div>

          {/* Progress Bar */}
          <div style={{ width: '100%', height: '10px', backgroundColor: 'var(--color-bg-base)', borderRadius: '6px', overflow: 'hidden', marginBottom: '16px', border: '1px solid var(--color-border)' }}>
            <div style={{ width: `${coding.completionPercentage}%`, height: '100%', backgroundColor: '#2563eb', borderRadius: '6px', transition: 'width 0.4s ease' }} />
          </div>

          {/* Status Badges */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
            <div style={{ padding: '10px', backgroundColor: 'rgba(34, 197, 94, 0.08)', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.2)', textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#15803d', fontWeight: 700 }}>VERIFIED</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#15803d' }}>{coding.verified}</span>
            </div>
            <div style={{ padding: '10px', backgroundColor: 'rgba(234, 179, 8, 0.08)', borderRadius: '8px', border: '1px solid rgba(234, 179, 8, 0.2)', textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#a16207', fontWeight: 700 }}>PENDING REVIEW</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#a16207' }}>{coding.submitted}</span>
            </div>
            <div style={{ padding: '10px', backgroundColor: 'rgba(59, 130, 246, 0.08)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)', textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#1d4ed8', fontWeight: 700 }}>IN PROGRESS</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1d4ed8' }}>{coding.inProgress}</span>
            </div>
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--color-border)', paddingTop: '12px' }}>
            <span><strong>Python Verified:</strong> {coding.pythonVerified}</span>
            <span><strong>SQL Verified:</strong> {coding.sqlVerified}</span>
            <span><strong>Easy/Med/Hard:</strong> {coding.easyVerified}/{coding.medVerified}/{coding.hardVerified}</span>
          </div>
        </Card>

        {/* Module 2: AI Communication Practice Breakdown */}
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#8b5cf615', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageSquare size={20} color="#8b5cf6" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>AI Communication Practice</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Daily 10 Advanced Words Story Submissions</span>
              </div>
            </div>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#7c3aed' }}>{communication.avgOverallScore}/100</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                <span>Grammar & Structure</span>
                <span>{communication.avgGrammar}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--color-bg-base)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${communication.avgGrammar}%`, height: '100%', backgroundColor: '#10b981', borderRadius: '4px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                <span>Vocabulary & Word Usage</span>
                <span>{communication.avgVocabulary}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--color-bg-base)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${communication.avgVocabulary}%`, height: '100%', backgroundColor: '#8b5cf6', borderRadius: '4px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                <span>Pronunciation & Fluency</span>
                <span>{communication.avgPronunciation}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--color-bg-base)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${communication.avgPronunciation}%`, height: '100%', backgroundColor: '#3b82f6', borderRadius: '4px' }} />
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--color-border)', paddingTop: '12px' }}>
            <span><strong>Stories Submitted:</strong> {communication.submissionsCount}</span>
            <span><strong>Words Practiced:</strong> {communication.wordsLearned} Advanced Words</span>
          </div>
        </Card>

      </div>

      {/* Skill Growth Radar & Monthly Submissions Trend */}
      <div className="progress-charts-grid">
        <Card className="chart-card">
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: 700 }}>Comprehensive Skill Growth Radar</h3>
          <div className="chart-wrapper flex-center">
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={skillRadar}>
                <PolarGrid stroke="var(--color-border)" />
                <PolarAngleAxis dataKey="subject" stroke="var(--color-text-muted)" fontSize={12} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="var(--color-text-muted)" fontSize={10} />
                <Radar name="Employee Skills" dataKey="A" stroke="var(--color-primary-600)" fill="var(--color-primary-500)" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="chart-card">
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: 700 }}>Monthly Submissions & Activity Trend</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyTrend}>
                <XAxis dataKey="month" stroke="var(--color-text-muted)" fontSize={12} />
                <YAxis stroke="var(--color-text-muted)" fontSize={12} />
                <Tooltip />
                <Bar dataKey="coding" name="Coding Problems" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="communication" name="Communication Stories" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};
