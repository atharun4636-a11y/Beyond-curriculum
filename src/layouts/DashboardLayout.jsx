import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, X, Sun, Moon, Bell, LogOut, User, Sparkles,
  LayoutDashboard, Users, BookOpen, Code, Trophy, 
  Award, FileText, Settings, HelpCircle, MessageSquare, ChevronRight, Activity, ShieldAlert, Video
} from 'lucide-react';
import { getBackendHealth, getCurrentUser, logoutUser } from '../utils/api';
import './DashboardLayout.css';

export const DashboardLayout = ({ role = 'employee', children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute('data-theme') || 'light');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');
  
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  const navigate = useNavigate();
  const location = useLocation();

  // Load authenticated user profile from backend API on mount
  useEffect(() => {
    let isMounted = true;
    getCurrentUser()
      .then(user => {
        if (isMounted && user) {
          setUserProfile(user);
          localStorage.setItem('user', JSON.stringify(user));
        }
      })
      .catch(err => {
        console.warn('Could not fetch user from backend:', err);
      });

    getBackendHealth()
      .then(() => {
        if (isMounted) setBackendStatus('connected');
      })
      .catch(() => {
        if (isMounted) setBackendStatus('disconnected');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Route Protection Check
  const effectiveRole = userProfile?.role || role;
  const isAccessingAdmin = location.pathname.startsWith('/admin');

  useEffect(() => {
    if (isAccessingAdmin && effectiveRole !== 'admin') {
      console.warn('Unauthorized access attempt to Admin section by non-admin user.');
    }
  }, [isAccessingAdmin, effectiveRole]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleLogout = async () => {
    await logoutUser();
    navigate('/login');
  };

  const currentDept = userProfile?.department || {
    name: userProfile?.departmentId === 1 ? 'Data Engineering' : userProfile?.departmentId === 2 ? 'Cognitive Technology' : 'DCG',
    code: userProfile?.departmentId === 1 ? 'DE' : userProfile?.departmentId === 2 ? 'COGNITIVE' : 'DCG'
  };

  const userName = userProfile?.fullName || userProfile?.name || (role === 'admin' ? 'System Administrator' : 'Employee');
  const userPhoto = userProfile?.photo || '';

  const adminMenuGroups = [
    {
      group: 'MAIN',
      items: [
        { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
        { name: 'Hackathons & Events', path: '/admin/events', icon: Trophy },
        { name: 'Webinars & Opportunities', path: '/admin/opportunities', icon: Video },
        { name: 'Learning Resources', path: '/admin/resources', icon: BookOpen },
        { name: 'Coding Practice', path: '/admin/coding', icon: Code },
      ]
    },
    {
      group: 'PEOPLE & CONTENT',
      items: [
        { name: 'Employee Directory', path: '/admin/employees', icon: Users },
        { name: 'Evaluations', path: '/admin/evaluations', icon: FileText },
        { name: 'Certificates & Approvals', path: '/admin/certificates', icon: Award },
        { name: 'Communication', path: '/admin/communication', icon: MessageSquare },
        { name: 'Reports & Analytics', path: '/admin/reports', icon: FileText },
        { name: 'Feedback Reviews', path: '/admin/feedback', icon: HelpCircle },
      ]
    },
    {
      group: 'SYSTEM & AUTOMATION',
      items: [
        { name: 'Sources & System Settings', path: '/admin/settings', icon: Settings },
      ]
    }
  ];

  const employeeMenuGroups = [
    {
      group: 'MAIN',
      items: [
        { name: 'Dashboard', path: '/employee', icon: LayoutDashboard },
        { name: 'Hackathons', path: '/employee/events', icon: Trophy },
        { name: 'Webinars & Events', path: '/employee/opportunities', icon: Video },
        { name: 'Learning Resources', path: '/employee/resources', icon: BookOpen },
        { name: 'Coding Practice', path: '/employee/coding', icon: Code },
      ]
    },
    {
      group: 'CAREER & GROWTH',
      items: [
        { name: 'Project Submissions', path: '/employee/submissions', icon: FileText },
        { name: 'Communication', path: '/employee/communication', icon: MessageSquare },
        { name: 'Certificates', path: '/employee/certificates', icon: Award },
        { name: 'My Progress', path: '/employee/progress', icon: Activity },
        { name: 'Feedback', path: '/employee/feedback', icon: HelpCircle },
      ]
    }
  ];

  const menuGroups = role === 'admin' ? adminMenuGroups : employeeMenuGroups;

  // Block employee trying to access admin pages
  if (isAccessingAdmin && effectiveRole !== 'admin') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem', textAlign: 'center', background: 'var(--color-bg-base)' }}>
        <ShieldAlert size={48} style={{ color: '#dc2626', marginBottom: '1rem' }} />
        <h2 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0' }}>403 Access Forbidden</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
          Employees are not authorized to view the Admin Portal.
        </p>
        <button onClick={() => navigate('/employee')} className="ui-btn ui-btn-primary">
          Return to Employee Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="layout-root">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="sidebar-header">
          <div className="brand-wrapper">
            <div className="brand-icon-box">
              <Sparkles size={20} className="brand-sparkle" />
            </div>
            <div className="brand-titles">
              <span className="logo-text">Aegis Learn</span>
              <span className="logo-subtext">Enterprise Platform</span>
            </div>
          </div>
          <button className="sidebar-toggle-btn mobile-only" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuGroups.map((group) => (
            <div key={group.group} className="nav-group">
              <span className="nav-group-title">{group.group}</span>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link 
                    key={item.name} 
                    to={item.path} 
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    title={item.name}
                  >
                    <Icon size={18} className="nav-icon" />
                    <span className="nav-text">{item.name}</span>
                    {isActive && <ChevronRight size={14} className="active-indicator" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile-summary">
            {userPhoto ? (
              <img src={userPhoto} alt={userName} className="avatar-img" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div className="avatar-box">
                <User size={16} />
              </div>
            )}
            <div className="user-info-text">
              <span className="user-name">{userName}</span>
              <span className="user-dept">{currentDept.name}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn-full" title="Logout">
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="main-wrapper">
        {/* Topbar */}
        <header className="topbar glass">
          <div className="topbar-left">
            <button className="sidebar-toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu size={18} />
            </button>
            
            <div className="header-greeting">
              <span className="greeting-text">
                Good day, <strong>{userName}</strong> 👋
              </span>
              <span className="dept-badge">
                <Sparkles size={12} /> {currentDept.name} ({currentDept.code})
              </span>
            </div>

            <div className={`backend-status-badge ${backendStatus}`}>
              <span className="status-dot" />
              <span>
                Backend API: {backendStatus === 'connected' ? 'Connected' : backendStatus === 'disconnected' ? 'Offline' : 'Checking...'}
              </span>
            </div>
          </div>

          <div className="topbar-right">
            <button className="icon-action-btn" onClick={toggleTheme} title="Toggle theme">
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            <div className="dropdown-container">
              <button className="icon-action-btn" onClick={() => setNotificationsOpen(!notificationsOpen)} title="Notifications">
                <Bell size={18} />
                <span className="badge" />
              </button>
              {notificationsOpen && (
                <div className="dropdown-menu notifications-menu glass">
                  <div className="dropdown-header">System Notifications</div>
                  <div className="dropdown-item">
                    <span className="item-title">Weekend Coding Challenge</span>
                    <span className="item-sub">10 new Python & SQL problems assigned</span>
                  </div>
                  <div className="dropdown-item">
                    <span className="item-title">Learning Resources Sync</span>
                    <span className="item-sub">Curated resources aligned with {currentDept.code}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="dropdown-container">
              <button className="profile-trigger" onClick={() => setProfileOpen(!profileOpen)}>
                {userPhoto ? (
                  <img src={userPhoto} alt={userName} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div className="avatar-placeholder">
                    <User size={18} />
                  </div>
                )}
              </button>
              {profileOpen && (
                <div className="dropdown-menu profile-menu glass">
                  <div className="profile-header-info">
                    <strong>{userName}</strong>
                    <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: '2px 0 0 0' }}>{userProfile?.email || ''}</p>
                  </div>
                  <div className="dropdown-divider" />
                  <div className="dropdown-item" onClick={() => navigate(`/${role}/profile`)}>
                    Profile Settings
                  </div>
                  <div className="dropdown-item text-danger" onClick={handleLogout}>
                    Sign Out
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Page Router Content */}
        <main className="content-container">
          {children}
        </main>
      </div>
    </div>
  );
};
