import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  Search, ExternalLink, Bookmark, BookmarkCheck, Sparkles, Filter, BookOpen,
  Zap, Trophy, CheckCircle, Clock, ArrowRight, Star, Layers, Code, MessageSquare
} from 'lucide-react';
import { getDB, setDB, defaultEmployees, defaultDepartments } from '../utils/db';
import { 
  getRecommendedResources, getHackathonResources, getCurrentEmployeeId,
  trackResourceProgressApi, getHackathonsByDepartment
} from '../utils/api';
import { SkeletonGrid } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import '../pages/AdminResources.css';
import './EmployeeResources.css';

const DEMO_TITLES = ['React Hooks Guide', 'LeetCode 75 Study Plan', 'UI Design Patterns', 'SQL JOINS'];

export const EmployeeResources = () => {
  const [currentUser] = useState(() => {
    try {
      const uStr = localStorage.getItem('user');
      return uStr ? JSON.parse(uStr) : null;
    } catch (e) {
      return null;
    }
  });

  const empDeptId = currentUser?.departmentId || 1;
  const empId = getCurrentEmployeeId();

  const [departments] = useState(() => getDB('departments', defaultDepartments));
  const currentDept = departments.find(d => d.id === empDeptId) || { name: 'Data Engineering', code: 'DE' };

  const [recommendedResources, setRecommendedResources] = useState([]);
  const [hackathonResources, setHackathonResources] = useState([]);
  const [bookmarks, setBookmarks] = useState(() => getDB('bookmarks', []));
  const [isLoading, setIsLoading] = useState(true);

  // Active Category Tab: 'Recommended', 'Hackathons', 'Dept', 'Programming', 'DataAI', 'Frameworks', 'Career'
  const [activeTab, setActiveTab] = useState('Recommended');
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');

  useEffect(() => {
    setDB('bookmarks', bookmarks);
  }, [bookmarks]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [recs, hacks] = await Promise.all([
        getRecommendedResources(empId),
        getHackathonsByDepartment(empDeptId)
      ]);

      if (Array.isArray(recs)) {
        const clean = recs.filter(r => !DEMO_TITLES.includes(r.title) && r.url && !r.url.includes('example.com') && r.url !== '#');
        setRecommendedResources(clean);
      }

      if (Array.isArray(hacks) && hacks.length > 0) {
        const primaryHack = hacks[0];
        const hResources = await getHackathonResources(primaryHack.id);
        if (Array.isArray(hResources)) {
          const cleanHacks = hResources.filter(r => r.url && !r.url.includes('example.com') && r.url !== '#');
          setHackathonResources(cleanHacks);
        }
      }
    } catch (err) {
      console.warn('Failed to load personalized employee resources:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [empDeptId]);

  const toggleBookmark = (id) => {
    setBookmarks(prev => prev.includes(id) ? prev.filter(bId => bId !== id) : [...prev, id]);
  };

  const handleOpenResource = (res) => {
    trackResourceProgressApi({ resourceId: res.id, status: 'OPENED' });
    window.open(res.url, '_blank', 'noopener,noreferrer');
  };

  // Filter logic based on active tab and filters
  const getFilteredResources = () => {
    let list = recommendedResources;

    if (activeTab === 'Hackathons') {
      list = hackathonResources.length > 0 ? hackathonResources : recommendedResources.filter(r => 
        (r.resourceType || r.category || r.topic || '').toLowerCase().includes('hackathon') ||
        (r.tags || '').toLowerCase().includes('hackathon')
      );
    } else if (activeTab === 'Dept') {
      list = recommendedResources.filter(r => 
        r.departmentId === empDeptId || 
        (r.department && r.department.toLowerCase().includes(currentDept.name.toLowerCase()))
      );
    } else if (activeTab === 'Programming') {
      list = recommendedResources.filter(r => {
        const text = (r.topic + " " + r.skill + " " + r.title + " " + r.skills).toLowerCase();
        return ["python", "sql", "java", "c++", "javascript", "oop", "algorithms", "data structures"].some(k => text.includes(k));
      });
    } else if (activeTab === 'DataAI') {
      list = recommendedResources.filter(r => {
        const text = (r.topic + " " + r.skill + " " + r.title + " " + r.skills).toLowerCase();
        return ["etl", "pyspark", "spark", "ai", "ml", "learning", "llm", "genai", "prompt", "warehouse", "database"].some(k => text.includes(k));
      });
    } else if (activeTab === 'Frameworks') {
      list = recommendedResources.filter(r => {
        const text = (r.topic + " " + r.skill + " " + r.title + " " + r.skills).toLowerCase();
        return ["react", "node", "fastapi", "spring", "django", "flask", "devops", "cloud"].some(k => text.includes(k));
      });
    } else if (activeTab === 'Career') {
      list = recommendedResources.filter(r => {
        const text = (r.topic + " " + r.skill + " " + r.title + " " + r.skills + " " + r.resourceType).toLowerCase();
        return ["interview", "system design", "resume", "career", "git", "communication"].some(k => text.includes(k));
      });
    }

    return list.filter(res => {
      const matchesSearch = (res.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (res.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (res.topic || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDiff = difficultyFilter === 'All' ? true : (res.difficulty || '').toLowerCase() === difficultyFilter.toLowerCase();
      return matchesSearch && matchesDiff;
    });
  };

  const displayedResources = getFilteredResources();

  return (
    <div className="employee-resources-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header Banner */}
      <div className="dashboard-header-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>Personalized Learning Hub</h1>
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
              <Sparkles size={14} /> {currentDept.name}
            </span>
          </div>
          <p className="subtitle" style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Smart AI-recommended documentation, hackathon preparation guides, and skill tutorials tailored for your role.
          </p>
        </div>
      </div>

      {/* Taxonomical Category Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', borderBottom: '1px solid var(--color-border)' }}>
        {[
          { key: 'Recommended', label: '🔥 Recommended For You', icon: Zap },
          { key: 'Hackathons', label: '🏆 Hackathon Preparation', icon: Trophy },
          { key: 'Dept', label: `📁 ${currentDept.code} Resources`, icon: BookOpen },
          { key: 'Programming', label: '💻 Languages & Concepts', icon: Code },
          { key: 'DataAI', label: '🤖 Data & AI', icon: Sparkles },
          { key: 'Frameworks', label: '🛠️ Frameworks & Tools', icon: Layers },
          { key: 'Career', label: '🎯 Career & Interviews', icon: Star }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              backgroundColor: activeTab === tab.key ? '#4f46e5' : 'var(--color-bg-base)',
              color: activeTab === tab.key ? '#ffffff' : 'var(--color-text-muted)',
              transition: 'all 0.2s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search and Filters Bar */}
      <Card style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <input
              type="text"
              placeholder="Search by topic, technology, or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem 0.5rem 2.4rem',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-base)',
                color: 'var(--color-text-base)'
              }}
            />
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          </div>

          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-base)' }}
          >
            <option value="All">All Difficulties</option>
            <option value="Beginner">Beginner</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
      </Card>

      {/* Resource Cards Grid */}
      {isLoading ? (
        <SkeletonGrid count={6} />
      ) : displayedResources.length === 0 ? (
        <EmptyState title="No learning resources found" description="Try selecting another category tab or clearing your search filter." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {displayedResources.map((res) => {
            const isBookmarked = bookmarks.includes(res.id);
            const deptLabel = res.department || (res.departmentId === 1 ? 'Data Engineering' : res.departmentId === 2 ? 'Cognitive Technology' : 'DCG');
            const score = res.relevanceScore || 85;

            return (
              <Card key={res.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.25rem', border: res.isHighPriority ? '1.5px solid rgba(79, 70, 229, 0.4)' : '1px solid var(--color-border)' }}>
                <div>
                  {/* Top Badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '4px' }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#4f46e5', backgroundColor: 'rgba(99, 102, 241, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                        {res.difficulty || 'Beginner'}
                      </span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#16a34a', backgroundColor: 'rgba(22, 163, 74, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                        {res.resourceType || res.category || 'Tutorial'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {res.isHighPriority && (
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#d97706', backgroundColor: 'rgba(217, 119, 6, 0.12)', padding: '2px 8px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          🔥 Priority {score} pts
                        </span>
                      )}
                      <button onClick={() => toggleBookmark(res.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isBookmarked ? '#4f46e5' : 'var(--color-text-muted)' }}>
                        {isBookmarked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-base)', lineHeight: '1.3' }}>
                    {res.title}
                  </h3>
                  <p style={{ margin: '0 0 12px 0', fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {res.description || 'Curated technical reference guide covering key industry concepts.'}
                  </p>
                </div>

                <div>
                  {/* Meta Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', paddingTop: '10px', marginTop: '10px' }}>
                    <span>Dept: {deptLabel}</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-base)' }}>{res.source || 'Official Docs'}</span>
                  </div>

                  <Button 
                    variant="primary" 
                    onClick={() => handleOpenResource(res)} 
                    style={{ width: '100%', marginTop: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    Open Resource <ExternalLink size={14} />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

    </div>
  );
};
