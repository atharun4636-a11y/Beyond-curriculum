import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { 
  BookOpen, Code, Trophy, Award, Sparkles, 
  ExternalLink, CheckCircle, Clock, Calendar, ArrowRight, TrendingUp, MessageSquare,
  Activity, ShieldAlert, FileText, Check, Star
} from 'lucide-react';
import { 
  getHackathonsByDepartment, getResourcesByDepartment, getCodingProblemsByDepartment,
  getEmployeePerformanceProgress, getEmployeeHackathonRegistrations, getCurrentEmployeeId
} from '../utils/api';
import { getDB, defaultEvents, defaultResources, defaultCodingProblems, defaultEmployees, defaultDepartments } from '../utils/db';
import './EmployeeDashboard.css';

export const EmployeeDashboard = () => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const userString = localStorage.getItem('user');
      return userString ? JSON.parse(userString) : null;
    } catch (e) {
      return null;
    }
  });

  const empDeptId = currentUser?.departmentId || 1;

  const [departments] = useState(() => getDB('departments', defaultDepartments));
  const currentDept = departments.find(d => d.id === empDeptId) || { name: 'Data Engineering', code: 'DE' };

  const [hackathons, setHackathons] = useState([]);
  const [resources, setResources] = useState([]);
  const [problems, setProblems] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const empId = getCurrentEmployeeId();
    setIsLoading(true);

    Promise.all([
      getHackathonsByDepartment(empDeptId).catch(() => []),
      getResourcesByDepartment(empDeptId).catch(() => []),
      getCodingProblemsByDepartment(empDeptId).catch(() => []),
      getEmployeePerformanceProgress(empId).catch(() => null),
      getEmployeeHackathonRegistrations(empId).catch(() => [])
    ]).then(([hackData, resData, probData, perfData, regData]) => {
      if (Array.isArray(hackData)) setHackathons(hackData);
      if (Array.isArray(resData)) setResources(resData.filter(r => !['React Hooks Guide', 'LeetCode 75 Study Plan', 'UI Design Patterns'].includes(r.title)));
      if (Array.isArray(probData)) setProblems(probData);
      if (perfData) setPerformance(perfData);
      if (Array.isArray(regData)) setRegistrations(regData);
    }).finally(() => {
      setIsLoading(false);
    });
  }, [empDeptId]);

  const userName = currentUser?.name || currentUser?.fullName || "MittapalliBhanu Vardhanreddy";

  return (
    <div className="employee-dashboard">
      {/* Header Banner */}
      <div className="dashboard-header-section" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-base)' }}>
              Welcome back, {userName} 👋
            </h1>
            <span style={{ 
              backgroundColor: 'rgba(99, 102, 241, 0.12)', 
              color: 'var(--color-primary-600)',
              padding: '4px 12px', 
              borderRadius: '20px', 
              fontSize: '0.8rem', 
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Sparkles size={14} /> {currentDept.name} ({currentDept.code})
            </span>
          </div>
          <p className="subtitle" style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Track your weekly coding practice, AI communication scores, department hackathons, and certifications.
          </p>
        </div>

        <Link to="/employee/progress">
          <Button variant="primary" size="sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={14} /> View My Progress Dashboard
          </Button>
        </Link>
      </div>

      {/* Module Overview KPI Stats Grid */}
      <div className="employee-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        
        {/* Module 1: Weekly Coding Practice KPI */}
        <Card className="emp-stat-card" style={{ padding: '1.25rem' }}>
          <div className="stat-content">
            <span className="stat-label" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Weekly Coding Practice</span>
            <span className="stat-val" style={{ fontSize: '1.5rem', fontWeight: 700, margin: '4px 0', color: 'var(--color-text-base)' }}>
              {performance?.coding?.verified ?? 0} / {performance?.coding?.totalAssigned ?? 0} Solved
            </span>
            <div className="progress-bar-container" style={{ height: '6px', backgroundColor: 'var(--color-bg-base)', borderRadius: '3px', overflow: 'hidden', margin: '4px 0' }}>
              <div className="progress-bar-fill" style={{ height: '100%', backgroundColor: '#4f46e5', width: `${performance?.coding?.completionPercentage ?? 0}%`, borderRadius: '3px' }}></div>
            </div>
            <span className="stat-subtext" style={{ fontSize: '0.75rem', color: '#4f46e5', fontWeight: 600 }}>
              {performance?.coding?.completionPercentage ?? 0}% Verified Accuracy
            </span>
          </div>
          <div className="emp-stat-icon p-coding" style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#4f46e515', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Code size={20} color="#4f46e5" />
          </div>
        </Card>

        {/* Module 2: AI Communication Practice KPI */}
        <Card className="emp-stat-card" style={{ padding: '1.25rem' }}>
          <div className="stat-content">
            <span className="stat-label" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>AI Communication Practice</span>
            <span className="stat-val" style={{ fontSize: '1.5rem', fontWeight: 700, margin: '4px 0', color: 'var(--color-text-base)' }}>
              {performance?.communication?.submissionsCount ?? 0} Stories
            </span>
            <span className="stat-subtext" style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 600 }}>
              {performance?.communication?.avgOverallScore > 0 ? `★ Avg Rating ${performance.communication.avgOverallScore}/100` : 'No Submissions Yet'}
            </span>
          </div>
          <div className="emp-stat-icon p-comm" style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#d9770615', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageSquare size={20} color="#d97706" />
          </div>
        </Card>

        {/* Module 3: Department Hackathons KPI */}
        <Card className="emp-stat-card" style={{ padding: '1.25rem' }}>
          <div className="stat-content">
            <span className="stat-label" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Department Hackathons</span>
            <span className="stat-val" style={{ fontSize: '1.5rem', fontWeight: 700, margin: '4px 0', color: 'var(--color-text-base)' }}>
              {hackathons.length} Available
            </span>
            <span className="stat-subtext" style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
              <CheckCircle size={12} style={{ display: 'inline', marginRight: 4 }} />
              {registrations.filter(r => r.registrationStatus === 'VERIFIED' || r.status === 'VERIFIED').length} Verified Registrations
            </span>
          </div>
          <div className="emp-stat-icon p-hackathon" style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#16a34a15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trophy size={20} color="#16a34a" />
          </div>
        </Card>

        {/* Module 4: Overall Performance KPI */}
        <Card className="emp-stat-card" style={{ padding: '1.25rem' }}>
          <div className="stat-content">
            <span className="stat-label" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Overall Performance</span>
            <span className="stat-val" style={{ fontSize: '1.5rem', fontWeight: 700, margin: '4px 0', color: 'var(--color-text-base)' }}>
              {performance?.overallIndex ?? 0}% Index
            </span>
            <span className="stat-subtext" style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600 }}>
              {(performance?.overallIndex || 0) > 75 ? 'Advanced Practitioner' : (performance?.overallIndex || 0) > 40 ? 'Intermediate Level' : 'Beginner / Getting Started'}
            </span>
          </div>
          <div className="emp-stat-icon p-rank" style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#0284c715', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Star size={20} color="#0284c7" />
          </div>
        </Card>


      </div>

      {/* Main Grid: Modules & Core Features */}
      <div className="emp-dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        
        {/* Weekly Coding Practice Showcase */}
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Code size={18} color="#4f46e5" /> Weekly Coding Practice
            </h3>
            <Link to="/employee/coding" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-primary-600)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Open Sheet <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {problems.slice(0, 3).map((prob) => (
              <div key={prob.id} style={{ padding: '12px 14px', backgroundColor: 'var(--color-bg-base)', borderRadius: '10px', border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '0.88rem', color: 'var(--color-text-base)', display: 'block', marginBottom: '2px' }}>
                    {prob.title}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Category: {prob.category || 'Data Engineering'} • {prob.language || 'Python'}
                  </span>
                </div>
                <Link to="/employee/coding">
                  <Button size="sm" variant="secondary" style={{ fontSize: '0.78rem', padding: '4px 10px' }}>
                    Solve
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </Card>

        {/* AI Communication Practice Showcase */}
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={18} color="#d97706" /> AI Communication Practice
            </h3>
            <Link to="/employee/communication" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#d97706', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Start Challenge <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ padding: '14px', backgroundColor: 'rgba(217, 119, 6, 0.08)', borderRadius: '10px', border: '1px solid rgba(217, 119, 6, 0.2)', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <strong style={{ fontSize: '0.9rem', color: '#92400e' }}>Daily Advanced Vocabulary Challenge</strong>
              <span style={{ fontSize: '0.72rem', backgroundColor: '#d97706', color: '#fff', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>10 Words</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
              Learn 10 industry vocabulary words (e.g. <em>Elucidate, Pragmatic, Tenacious</em>), craft a cohesive story, and get instant AI grammar & pronunciation feedback!
            </p>
          </div>

          <Link to="/employee/communication">
            <Button variant="primary" style={{ width: '100%', backgroundColor: '#d97706', borderColor: '#d97706' }}>
              <MessageSquare size={16} style={{ marginRight: 6 }} /> Practice Today's Vocabulary Story
            </Button>
          </Link>
        </Card>

        {/* Recommended Department Hackathons */}
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trophy size={18} color="#16a34a" /> Recommended Hackathons
            </h3>
            <Link to="/employee/events" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}>
              All Hackathons <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {hackathons.slice(0, 3).map((hack) => (
              <div key={hack.id} style={{ padding: '12px 14px', backgroundColor: 'var(--color-bg-base)', borderRadius: '10px', border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '0.88rem', color: 'var(--color-text-base)', display: 'block', marginBottom: '2px' }}>
                    {hack.name}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    {hack.organizer} • {hack.mode || 'Online'}
                  </span>
                </div>
                <Link to="/employee/events">
                  <Button size="sm" variant="primary" style={{ fontSize: '0.78rem', padding: '4px 10px', backgroundColor: '#16a34a', borderColor: '#16a34a' }}>
                    Register & Proof
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </Card>

        {/* Curated Learning Resources */}
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={18} color="#0284c7" /> Curated Learning Resources
            </h3>
            <Link to="/employee/resources" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Explore Hub <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {resources.slice(0, 3).map((res) => (
              <div key={res.id} style={{ padding: '12px 14px', backgroundColor: 'var(--color-bg-base)', borderRadius: '10px', border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '0.88rem', color: 'var(--color-text-base)', display: 'block', marginBottom: '2px' }}>
                    {res.title}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    {res.source || 'GitHub'} • {res.difficulty || 'Beginner'}
                  </span>
                </div>
                <a href={res.url} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="secondary" style={{ fontSize: '0.78rem', padding: '4px 10px' }}>
                    Open <ExternalLink size={12} />
                  </Button>
                </a>
              </div>
            ))}
          </div>
        </Card>

      </div>
    </div>
  );
};
