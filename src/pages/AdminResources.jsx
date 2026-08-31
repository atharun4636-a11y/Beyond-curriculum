import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { 
  Search, Plus, Edit, Trash2, ExternalLink, X, 
  Upload, CheckCircle, AlertCircle, RefreshCw, Layers, Zap,
  BookOpen, Sparkles, Filter, Award, Check
} from 'lucide-react';
import { getDB, setDB, defaultEmployees, defaultContentAssignments, defaultDepartments } from '../utils/db';
import { 
  getDepartments, getResources, createResource, updateResource, deleteResource,
  generateResourcesApi, getResourceStatsApi
} from '../utils/api';
import './AdminResources.css';

const DEMO_TITLES = ['React Hooks Guide', 'LeetCode 75 Study Plan', 'UI Design Patterns', 'SQL JOINS'];

export const AdminResources = () => {
  const [resources, setResources] = useState(() => {
    const cached = getDB('resources', []);
    return cached.filter(r => !DEMO_TITLES.includes(r.title));
  });

  const [departments, setDepartments] = useState(() => getDB('departments', defaultDepartments));
  const [stats, setStats] = useState(null);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingRes, setEditingRes] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  // Generate Modal State
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateMsg, setGenerateMsg] = useState(null);
  const [genFormData, setGenFormData] = useState({
    departmentId: 0,
    topic: 'Python',
    difficulty: 'Beginner',
    count: 10,
    source: 'Automatic'
  });

  // Add / Edit Resource Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    departmentId: 1,
    departmentIds: [1],
    isAllDepartments: false,
    topic: 'Python',
    skill: 'Python',
    technology: 'Python',
    difficulty: 'Beginner',
    resourceType: 'Tutorial',
    source: 'Official Documentation',
    tags: 'Python, Programming',
    status: 'ACTIVE'
  });

  const loadApiData = async () => {
    try {
      const depts = await getDepartments();
      if (Array.isArray(depts) && depts.length > 0) setDepartments(depts);
    } catch (e) {}

    try {
      const apiRes = await getResources();
      if (Array.isArray(apiRes)) {
        const clean = apiRes.filter(r => !DEMO_TITLES.includes(r.title) && r.url && !r.url.includes('example.com') && r.url !== '#');
        setResources(clean);
        setDB('resources', clean);
      }
    } catch (e) {}

    try {
      const statsData = await getResourceStatsApi();
      if (statsData) setStats(statsData);
    } catch (e) {}
  };

  useEffect(() => {
    loadApiData();
  }, []);

  // Filtering Resources
  const filteredResources = resources.filter(res => {
    const matchesSearch = (res.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (res.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (res.topic || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (res.technology || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCat = categoryFilter ? (res.category || res.topic || '').toLowerCase() === categoryFilter.toLowerCase() : true;
    const matchesDiff = difficultyFilter ? (res.difficulty || '').toLowerCase() === difficultyFilter.toLowerCase() : true;
    const matchesType = typeFilter ? (res.resourceType || '').toLowerCase().includes(typeFilter.toLowerCase()) : true;

    let matchesDept = true;
    if (deptFilter) {
      const targetDeptId = parseInt(deptFilter);
      matchesDept = res.departmentId === targetDeptId ||
                    (res.departmentIds && res.departmentIds.includes(targetDeptId)) ||
                    (res.department && res.department.toLowerCase().includes('all'));
    }

    return matchesSearch && matchesCat && matchesDiff && matchesType && matchesDept;
  });

  const totalPages = Math.ceil(filteredResources.length / itemsPerPage) || 1;
  const paginatedResources = filteredResources.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenAdd = () => {
    setEditingRes(null);
    setSaveMessage(null);
    setFormData({ 
      title: '', 
      description: '', 
      url: '', 
      departmentId: 1, 
      departmentIds: [1],
      isAllDepartments: false,
      topic: 'Python',
      skill: 'Python',
      technology: 'Python',
      difficulty: 'Beginner',
      resourceType: 'Tutorial',
      source: 'Official Documentation',
      tags: 'Python, Programming',
      status: 'ACTIVE' 
    });
    setShowModal(true);
  };

  const handleOpenEdit = (res) => {
    setEditingRes(res);
    setSaveMessage(null);
    const deptId = res.departmentId || (res.departmentIds && res.departmentIds[0]) || 1;
    const isAll = res.department === 'All Departments' || (res.departmentIds && res.departmentIds.length === 3);

    setFormData({
      ...res,
      topic: res.topic || res.category || 'Python',
      skill: res.skill || res.skills || 'Python',
      technology: res.technology || res.topic || 'Python',
      difficulty: res.difficulty || 'Beginner',
      resourceType: res.resourceType || 'Tutorial',
      source: res.source || 'Official Documentation',
      tags: res.tags || res.skills || '',
      departmentId: deptId,
      departmentIds: isAll ? [1, 2, 3] : (res.departmentIds || [deptId]),
      isAllDepartments: isAll
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);

    let deptIds = formData.isAllDepartments ? [1, 2, 3] : (formData.departmentIds || [1]);
    if (deptIds.length === 0) deptIds = [1];

    const activeDeptName = formData.isAllDepartments ? 'All Departments' : 
      deptIds.map(id => id === 1 ? 'Data Engineering' : id === 2 ? 'Cognitive Technology' : 'DCG').join(', ');

    const apiPayload = {
      title: formData.title,
      description: formData.description || '',
      url: formData.url,
      source: formData.source || 'Official Documentation',
      resourceType: formData.resourceType || 'Tutorial',
      category: formData.topic || 'General',
      skills: formData.skill || '',
      difficulty: formData.difficulty || 'Beginner',
      department: activeDeptName,
      departmentId: deptIds[0] || 1,
      departmentIds: deptIds,
      topic: formData.topic || 'Python',
      skill: formData.skill || 'Python',
      technology: formData.technology || 'Python',
      tags: formData.tags || '',
      status: 'ACTIVE',
      author: 'Admin',
      isActive: true
    };

    try {
      if (editingRes && editingRes.id) {
        await updateResource(editingRes.id, apiPayload);
      } else {
        await createResource(apiPayload);
      }
      
      await loadApiData();
      setSaveMessage('Resource saved successfully.');
      setTimeout(() => {
        setShowModal(false);
        setSaveMessage(null);
      }, 600);
    } catch (err) {
      console.error('Backend resource save error:', err);
      setSaveMessage('Failed to save resource to backend.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    try {
      await deleteResource(id);
      await loadApiData();
    } catch (err) {
      console.error('Failed to delete resource:', err);
      setResources(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleGenerateSubmit = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setGenerateMsg(null);
    try {
      const res = await generateResourcesApi(genFormData);
      setGenerateMsg(res.message || 'Resources generated successfully!');
      await loadApiData();
      setTimeout(() => {
        setShowGenerateModal(false);
        setGenerateMsg(null);
      }, 1200);
    } catch (err) {
      console.error('Generate resources failed:', err);
      setGenerateMsg('Failed to generate resources.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="admin-resources-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header Bar */}
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>Learning Resources Management</h1>
          <p className="subtitle" style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Manage, publish, and automatically generate technical learning resources and hackathon preparation feeds.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Button variant="secondary" onClick={() => setShowGenerateModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#4f46e5', borderColor: '#4f46e5' }}>
            <Zap size={16} /> Generate Resources
          </Button>
          <Button variant="primary" onClick={handleOpenAdd} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> Add New Resource
          </Button>
        </div>
      </div>

      {/* Admin Resource Stats Overview Cards */}
      {stats && (
        <div className="resource-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <Card style={{ padding: '1rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Total Resources</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, margin: '4px 0', color: 'var(--color-text-base)' }}>{stats.totalResources}</div>
            <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600 }}>{stats.activeResources} Active</span>
          </Card>

          <Card style={{ padding: '1rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Auto-Generated</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, margin: '4px 0', color: '#4f46e5' }}>{stats.automaticallyGenerated}</div>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>From trusted APIs & docs</span>
          </Card>

          <Card style={{ padding: '1rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Manually Created</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, margin: '4px 0', color: '#d97706' }}>{stats.manuallyCreated}</div>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Created by Admin</span>
          </Card>

          <Card style={{ padding: '1rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Hackathon-Related</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, margin: '4px 0', color: '#16a34a' }}>{stats.hackathonRelated}</div>
            <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600 }}>Mapped to hackathons</span>
          </Card>
        </div>
      )}

      {/* Filter and Search Toolbar */}
      <Card className="filter-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Input 
              placeholder="Search title, topic, skill..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.4rem' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          </div>

          <select 
            className="filter-select"
            value={deptFilter}
            onChange={(e) => { setDeptFilter(e.target.value); setCurrentPage(1); }}
            style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-base)' }}
          >
            <option value="">All Departments</option>
            <option value="1">Data Engineering</option>
            <option value="2">Cognitive Technology</option>
            <option value="3">DCG</option>
          </select>

          <select 
            className="filter-select"
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
            style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-base)' }}
          >
            <option value="">All Resource Types</option>
            <option value="Tutorial">Tutorial</option>
            <option value="Documentation">Documentation</option>
            <option value="Course">Course</option>
            <option value="Practice">Practice</option>
            <option value="Interview Preparation">Interview Preparation</option>
            <option value="Hackathon Preparation">Hackathon Preparation</option>
          </select>

          <select 
            className="filter-select"
            value={difficultyFilter}
            onChange={(e) => { setDifficultyFilter(e.target.value); setCurrentPage(1); }}
            style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-base)' }}
          >
            <option value="">All Difficulties</option>
            <option value="Beginner">Beginner</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
      </Card>

      {/* Resource Grid List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {paginatedResources.map((res) => {
          const deptLabel = res.department || (res.departmentId === 1 ? 'Data Engineering' : res.departmentId === 2 ? 'Cognitive Technology' : 'DCG');
          return (
            <Card key={res.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#4f46e5', backgroundColor: 'rgba(99, 102, 241, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                    {res.difficulty || 'Beginner'}
                  </span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', backgroundColor: 'var(--color-bg-base)', padding: '2px 8px', borderRadius: '4px' }}>
                    {res.source || 'Official Docs'}
                  </span>
                </div>

                <h3 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-base)' }}>
                  {res.title}
                </h3>
                <p style={{ margin: '0 0 12px 0', fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {res.description || 'No description provided.'}
                </p>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', paddingTop: '10px', marginTop: '10px' }}>
                  <span>Dept: {deptLabel}</span>
                  <a href={res.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary-600)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Visit Link <ExternalLink size={12} />
                  </a>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <Button size="sm" variant="secondary" onClick={() => handleOpenEdit(res)} style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <Edit size={14} /> Edit
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => handleDelete(res.id)} style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#dc2626' }}>
                    <Trash2 size={14} /> Delete
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
          <Button size="sm" variant="secondary" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>
            Prev
          </Button>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Page {currentPage} of {totalPages}</span>
          <Button size="sm" variant="secondary" disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>
            Next
          </Button>
        </div>
      )}

      {/* Automatic Resource Generator Modal */}
      {showGenerateModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <Card style={{ width: '100%', maxWidth: '520px', padding: '1.5rem', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap color="#4f46e5" size={20} /> Generate Learning Resources
              </h3>
              <button onClick={() => setShowGenerateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleGenerateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Department</label>
                <select
                  value={genFormData.departmentId}
                  onChange={(e) => setGenFormData({ ...genFormData, departmentId: parseInt(e.target.value) })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-base)' }}
                >
                  <option value={0}>All Departments</option>
                  <option value={1}>Data Engineering</option>
                  <option value={2}>Cognitive Technology</option>
                  <option value={3}>DCG</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Topic / Skill</label>
                <select
                  value={genFormData.topic}
                  onChange={(e) => setGenFormData({ ...genFormData, topic: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-base)' }}
                >
                  <option value="Python">Python</option>
                  <option value="SQL">SQL</option>
                  <option value="ETL">ETL & Data Warehousing</option>
                  <option value="AI">AI & Generative AI</option>
                  <option value="Machine Learning">Machine Learning</option>
                  <option value="Java">Java & Spring Boot</option>
                  <option value="React">React & Modern Frontend</option>
                  <option value="Hackathon Preparation">Hackathon Preparation</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Difficulty</label>
                  <select
                    value={genFormData.difficulty}
                    onChange={(e) => setGenFormData({ ...genFormData, difficulty: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-base)' }}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Resource Count</label>
                  <select
                    value={genFormData.count}
                    onChange={(e) => setGenFormData({ ...genFormData, count: parseInt(e.target.value) })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-base)' }}
                  >
                    <option value={5}>5 Resources</option>
                    <option value={10}>10 Resources</option>
                    <option value={20}>20 Resources</option>
                    <option value={50}>50 Resources</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Trusted Source Catalog</label>
                <select
                  value={genFormData.source}
                  onChange={(e) => setGenFormData({ ...genFormData, source: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-base)' }}
                >
                  <option value="Automatic">Automatic (Official Docs, W3Schools, GeeksforGeeks)</option>
                  <option value="Official Documentation">Official Documentation</option>
                  <option value="W3Schools">W3Schools</option>
                  <option value="GeeksforGeeks">GeeksforGeeks</option>
                  <option value="Dev.to">Dev.to & GitHub Feeds</option>
                </select>
              </div>

              {generateMsg && (
                <div style={{ padding: '8px 12px', backgroundColor: 'rgba(22, 163, 74, 0.1)', color: '#16a34a', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 600 }}>
                  {generateMsg}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <Button type="button" variant="secondary" onClick={() => setShowGenerateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={isGenerating} style={{ backgroundColor: '#4f46e5', borderColor: '#4f46e5' }}>
                  {isGenerating ? 'Generating...' : '⚡ Generate Resources'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Add / Edit Resource Modal */}
      {showModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <Card style={{ width: '100%', maxWidth: '580px', padding: '1.5rem', borderRadius: '12px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                {editingRes ? 'Edit Resource' : 'Add New Learning Resource'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Title *</label>
                <Input
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Master PySpark Data Pipelines"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief summary of the resource..."
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-base)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>URL *</label>
                <Input
                  required
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Department</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: parseInt(e.target.value) })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-base)' }}
                  >
                    <option value={1}>Data Engineering</option>
                    <option value={2}>Cognitive Technology</option>
                    <option value={3}>DCG</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Resource Type</label>
                  <select
                    value={formData.resourceType}
                    onChange={(e) => setFormData({ ...formData, resourceType: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-base)' }}
                  >
                    <option value="Tutorial">Tutorial</option>
                    <option value="Documentation">Documentation</option>
                    <option value="Course">Course</option>
                    <option value="Practice">Practice</option>
                    <option value="Interview Preparation">Interview Preparation</option>
                    <option value="Hackathon Preparation">Hackathon Preparation</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Topic / Skill</label>
                  <Input
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value, skill: e.target.value, technology: e.target.value })}
                    placeholder="e.g. SQL, Python, AI"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-base)' }}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              {saveMessage && (
                <div style={{ padding: '8px 12px', backgroundColor: 'rgba(22, 163, 74, 0.1)', color: '#16a34a', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 600 }}>
                  {saveMessage}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Resource'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

    </div>
  );
};
