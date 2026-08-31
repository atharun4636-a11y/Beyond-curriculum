import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { 
  Search, UserPlus, Edit, Trash2, Shield, ShieldAlert, X, Upload, Plus, Link as LinkIcon, Image as ImageIcon, CheckCircle, AlertCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { getDB, setDB, defaultEmployees, defaultDepartments } from '../utils/db';
import { getDepartments, getEmployees, createEmployee, updateEmployee, deleteEmployee } from '../utils/api';
import './AdminEmployees.css';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60';

export const AdminEmployees = () => {
  const [employees, setEmployees] = useState(() => getDB('employees', defaultEmployees));
  const [departments, setDepartments] = useState(() => getDB('departments', defaultDepartments));

  // Sync states to localStorage as backup
  useEffect(() => { setDB('employees', employees); }, [employees]);
  useEffect(() => { setDB('departments', departments); }, [departments]);

  // Load departments and employees from API on page load
  const loadApiData = async () => {
    try {
      const depts = await getDepartments();
      if (depts && depts.length > 0) {
        setDepartments(depts);
      }
    } catch (err) {
      console.warn('Backend API unavailable for departments, using cached data.');
    }

    try {
      const apiEmps = await getEmployees();
      if (apiEmps && apiEmps.length > 0) {
        const mappedEmps = apiEmps.map(emp => ({
          id: emp.employeeId || `EMP00${emp.id}`,
          backendId: emp.id,
          name: emp.name,
          email: emp.email,
          phone: emp.phone || '+123456789',
          departmentId: emp.departmentId || 1,
          department: emp.departmentName || (emp.departmentId === 2 ? 'Cognitive Technology' : emp.departmentId === 3 ? 'DCG' : 'Data Engineering'),
          designation: emp.designation || 'Engineer',
          score: emp.score || 0,
          dateJoined: emp.dateJoined || (emp.createdAt ? emp.createdAt.split('T')[0] : '2026-08-01'),
          active: emp.isActive !== undefined ? emp.isActive : true,
          photo: emp.photo || emp.profileImageUrl || DEFAULT_AVATAR
        }));

        setEmployees(prev => {
          const empMap = new Map(prev.map(e => [e.email.toLowerCase(), e]));
          mappedEmps.forEach(me => {
            const key = me.email.toLowerCase();
            const existing = empMap.get(key) || {};
            empMap.set(key, { ...existing, ...me, photo: me.photo || existing.photo || DEFAULT_AVATAR });
          });
          return Array.from(empMap.values());
        });
      }
    } catch (err) {
      console.warn('Backend API unavailable for employees, using cached data.');
    }
  };

  useEffect(() => {
    loadApiData();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);

  // Profile Image Tab State
  const [imageTab, setImageTab] = useState('upload'); // 'upload' | 'url' | 'gallery'
  const [imageError, setImageError] = useState(false);

  // Form Saving Feedback
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    id: '', 
    name: '', 
    email: '', 
    phone: '', 
    departmentId: 1, 
    department: 'Data Engineering', 
    designation: 'Engineer', 
    score: 0, 
    dateJoined: new Date().toISOString().split('T')[0], 
    active: true, 
    photo: DEFAULT_AVATAR
  });

  // Target system departments (strictly Data Engineering=1, Cognitive Technology=2, DCG=3)
  const systemDepartments = [
    { id: 1, name: 'Data Engineering', code: 'DE' },
    { id: 2, name: 'Cognitive Technology', code: 'COGNITIVE' },
    { id: 3, name: 'DCG', code: 'DCG' }
  ];

  const getDeptName = (emp) => {
    if (emp.departmentId === 1) return 'Data Engineering';
    if (emp.departmentId === 2) return 'Cognitive Technology';
    if (emp.departmentId === 3) return 'DCG';
    return emp.department || 'Data Engineering';
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = (emp.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (emp.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (emp.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (emp.score || 0).toString().includes(searchTerm);

    let matchesDept = true;
    if (deptFilter) {
      matchesDept = emp.departmentId === parseInt(deptFilter);
    }
    return matchesSearch && matchesDept;
  });

  // Extract gallery images from existing employees
  const galleryImages = Array.from(new Set(employees.map(e => e.photo).filter(p => p && p !== DEFAULT_AVATAR)));

  const handleOpenAdd = () => {
    setEditingEmp(null);
    setValidationError(null);
    setSaveSuccessMsg(null);
    setImageError(false);
    setImageTab('upload');
    
    setFormData({
      id: `EMP00${employees.length + 1}`,
      name: '',
      email: '',
      phone: '',
      departmentId: 1,
      department: 'Data Engineering',
      designation: 'Software Engineer',
      score: 0,
      dateJoined: new Date().toISOString().split('T')[0],
      active: true,
      photo: DEFAULT_AVATAR
    });
    setShowModal(true);
  };

  const handleOpenEdit = (emp) => {
    setEditingEmp(emp);
    setValidationError(null);
    setSaveSuccessMsg(null);
    setImageError(false);
    setImageTab('upload');

    const deptId = [1, 2, 3].includes(emp.departmentId) ? emp.departmentId : 1;
    const deptName = deptId === 1 ? 'Data Engineering' : deptId === 2 ? 'Cognitive Technology' : 'DCG';

    setFormData({
      ...emp,
      departmentId: deptId,
      department: deptName,
      photo: emp.photo || DEFAULT_AVATAR
    });
    setShowModal(true);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setFormData(prev => ({ ...prev, photo: evt.target.result }));
        setImageError(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    if (!formData.id.trim()) return 'Employee ID is required.';
    if (!formData.name.trim()) return 'Full Name is required.';
    if (!formData.email.trim()) return 'Email is required.';

    // Email format regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) return 'Please enter a valid email address.';

    // Check Employee ID uniqueness when adding new employee
    if (!editingEmp) {
      const exists = employees.some(e => e.id.toLowerCase() === formData.id.trim().toLowerCase());
      if (exists) return `Employee ID "${formData.id}" already exists. Please use a unique ID.`;
    }

    if (![1, 2, 3].includes(formData.departmentId)) return 'Department must be Data Engineering (1), Cognitive Technology (2), or DCG (3).';
    if (!formData.designation.trim()) return 'Designation is required.';
    if (!formData.dateJoined) return 'Date of Joining is required.';
    if (formData.score < 0) return 'Current Hackathon Score must be 0 or greater.';

    return null;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const error = validateForm();
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError(null);
    setIsSaving(true);

    const activeDeptName = formData.departmentId === 1 ? 'Data Engineering' : formData.departmentId === 2 ? 'Cognitive Technology' : 'DCG';

    const dataToSave = {
      ...formData,
      departmentId: formData.departmentId,
      department: activeDeptName
    };

    const apiPayload = {
      employeeId: formData.id,
      name: formData.name,
      email: formData.email,
      departmentId: formData.departmentId,
      role: 'employee',
      isActive: formData.active,
      phone: formData.phone,
      designation: formData.designation,
      dateJoined: formData.dateJoined,
      score: formData.score,
      photo: formData.photo,
      profileImageUrl: formData.photo
    };

    if (editingEmp) {
      if (editingEmp.backendId) {
        try {
          await updateEmployee(editingEmp.backendId, apiPayload);
        } catch (err) {
          console.warn('Backend update failed, updating local state:', err);
        }
      }
      setEmployees(prev => prev.map(emp => emp.id === editingEmp.id ? dataToSave : emp));
      setSaveSuccessMsg('Employee updated successfully.');
      setIsSaving(false);
      setTimeout(() => {
        setShowModal(false);
        setSaveSuccessMsg(null);
      }, 500);
    } else {
      try {
        const created = await createEmployee(apiPayload);
        if (created && created.id) {
          dataToSave.backendId = created.id;
        }
        setEmployees(prev => [...prev, dataToSave]);
        setSaveSuccessMsg('Employee added successfully.');
        setIsSaving(false);
        setShowModal(false);
        
        // Show Created Account Modal with Temporary Password for Admin
        setCreatedAccountNotice({
          employeeId: formData.id,
          name: formData.name,
          email: formData.email,
          tempPassword: (created && created.tempPassword) ? created.tempPassword : `${formData.id}@2026`
        });
      } catch (err) {
        console.warn('Backend create failed, saving to local state:', err);
        if (err.message.includes('already exists') || err.message.includes('Conflict')) {
          setValidationError(err.message);
          setIsSaving(false);
          return;
        }
        setEmployees(prev => [...prev, dataToSave]);
        setSaveSuccessMsg('Employee added successfully.');
        setIsSaving(false);
        setShowModal(false);
      }
    }
  };

  const [createdAccountNotice, setCreatedAccountNotice] = useState(null);

  const handleToggleStatus = async (emp) => {
    const newStatus = !emp.active;
    if (emp.backendId) {
      try {
        await toggleEmployeeStatus(emp.backendId, newStatus);
      } catch (e) {
        console.warn('Backend status toggle failed:', e);
      }
    }
    setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, active: newStatus } : e));
  };


  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      const empToDelete = employees.find(emp => emp.id === id);
      if (empToDelete && empToDelete.backendId) {
        try {
          await deleteEmployee(empToDelete.backendId);
        } catch (err) {
          console.warn('Backend delete failed, removing locally:', err);
        }
      }
      setEmployees(prev => prev.filter(emp => emp.id !== id));
    }
  };

  const toggleActive = (id) => {
    setEmployees(prev => prev.map(emp => emp.id === id ? { ...emp, active: !emp.active } : emp));
  };

  return (
    <div className="admin-employees">
      <div className="section-header">
        <div>
          <h1>Employee Directory</h1>
          <p className="subtitle">Manage corporate personnel, department assignments, and skill profiles</p>
        </div>
        <div className="action-buttons-row">
          <Button onClick={handleOpenAdd}>
            <UserPlus size={16} style={{ marginRight: '6px' }} /> Add New Employee
          </Button>
        </div>
      </div>

      <Card className="employees-controls">
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by ID, name, email, or score..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="filter-select"
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
        >
          <option value="">All Departments</option>
          {systemDepartments.map(d => (
            <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
          ))}
        </select>
      </Card>

      <Card className="table-card">
        <div className="table-wrapper">
          <table className="employees-table">
            <thead>
              <tr>
                <th>Profile</th>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Contact</th>
                <th>Role & Dept</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map(emp => (
                <tr key={emp.id} className={!emp.active ? 'inactive-row' : ''}>
                  <td>
                    <img 
                      src={emp.photo || DEFAULT_AVATAR} 
                      alt={emp.name} 
                      className="emp-table-avatar"
                      onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_AVATAR; }}
                    />
                  </td>
                  <td className="emp-id">{emp.id}</td>
                  <td>
                    <div className="emp-name-cell">
                      <span className="emp-name">{emp.name}</span>
                      <span className="emp-date">Joined {emp.dateJoined}</span>
                    </div>
                  </td>
                  <td>
                    <div className="emp-contact-cell">
                      <span>{emp.email}</span>
                      <span className="emp-subtext">{emp.phone}</span>
                    </div>
                  </td>
                  <td>
                    <div className="emp-role-cell">
                      <span className="emp-role">{emp.designation}</span>
                      <span className="emp-dept">{getDeptName(emp)}</span>
                    </div>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button className="action-btn edit" onClick={() => handleOpenEdit(emp)} title="Edit Employee">
                        <Edit size={16} />
                      </button>
                      <button className="action-btn delete" onClick={() => handleDelete(emp.id)} title="Delete Employee">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit Employee Modal */}
      {showModal && (
        <div className="modal-overlay">
          <Card className="modal-content glass modal-content-wide">
            <div className="modal-header">
              <h3>{editingEmp ? 'Edit Employee Details' : 'Add New Employee'}</h3>
              <button onClick={() => setShowModal(false)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>

            {validationError && (
              <div style={{ padding: '8px 12px', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={16} /> {validationError}
              </div>
            )}

            {saveSuccessMsg && (
              <div style={{ padding: '8px 12px', backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={16} /> {saveSuccessMsg}
              </div>
            )}

            <form onSubmit={handleSave} className="modal-form">
              <div className="modal-two-col">
                
                {/* Left Column: Employee Details */}
                <div className="form-grid-col">
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--color-text-base)' }}>
                    Employee Information
                  </h4>

                  <div className="form-row-2">
                    <Input 
                      label="Employee ID *" 
                      value={formData.id} 
                      onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                      disabled={!!editingEmp}
                      placeholder="e.g. EMP004"
                      required 
                    />
                    <Input 
                      label="Full Name *" 
                      value={formData.name} 
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Test Employee"
                      required 
                    />
                  </div>

                  <div className="form-row-2">
                    <Input 
                      label="Email *" 
                      type="email" 
                      value={formData.email} 
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. test.employee@company.com"
                      required 
                    />
                    <Input 
                      label="Phone" 
                      value={formData.phone} 
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. +123456789"
                    />
                  </div>

                  <div className="form-row-2">
                    {/* Manual Selection Department Dropdown: strictly 1, 2, or 3 */}
                    <div className="select-input-group">
                      <label className="ui-input-label">Department *</label>
                      <select 
                        value={formData.departmentId} 
                        onChange={(e) => {
                          const dId = parseInt(e.target.value);
                          const dName = dId === 1 ? 'Data Engineering' : dId === 2 ? 'Cognitive Technology' : 'DCG';
                          setFormData({ ...formData, departmentId: dId, department: dName });
                        }}
                        className="ui-input"
                        required
                      >
                        <option value={1}>Data Engineering (DE)</option>
                        <option value={2}>Cognitive Technology (COGNITIVE)</option>
                        <option value={3}>DCG (DCG)</option>
                      </select>
                    </div>

                    <Input 
                      label="Designation *" 
                      value={formData.designation} 
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      placeholder="e.g. Software Engineer"
                      required 
                    />
                  </div>

                  <div className="form-row-2">
                    <Input 
                      label="Date of Joining *" 
                      type="date" 
                      value={formData.dateJoined} 
                      onChange={(e) => setFormData({ ...formData, dateJoined: e.target.value })}
                      required 
                    />
                    <Input 
                      label="Current Hackathon Score" 
                      type="number"
                      value={formData.score} 
                      onChange={(e) => setFormData({ ...formData, score: parseInt(e.target.value) || 0 })}
                      min="0"
                    />
                  </div>
                </div>

                {/* Right Column: Profile Photo Management */}
                <div className="profile-section-card">
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: 'var(--color-text-base)' }}>
                    Profile Photo
                  </h4>

                  {/* Circular Avatar Preview */}
                  <div style={{ textAlign: 'center', position: 'relative' }}>
                    <img 
                      src={formData.photo || DEFAULT_AVATAR} 
                      alt="Profile Preview" 
                      className="profile-avatar-preview"
                      onError={() => setImageError(true)}
                      onLoad={() => setImageError(false)}
                    />
                    {imageError && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-danger)', marginTop: '4px' }}>
                        Unable to load image. Please check the URL.
                      </p>
                    )}
                  </div>

                  {/* Profile Mode Tabs */}
                  <div className="profile-mode-tabs">
                    <button 
                      type="button"
                      className={`profile-tab-btn ${imageTab === 'upload' ? 'active' : ''}`}
                      onClick={() => setImageTab('upload')}
                    >
                      <Upload size={12} style={{ display: 'inline', marginRight: 4 }} />
                      Upload
                    </button>
                    <button 
                      type="button"
                      className={`profile-tab-btn ${imageTab === 'url' ? 'active' : ''}`}
                      onClick={() => setImageTab('url')}
                    >
                      <LinkIcon size={12} style={{ display: 'inline', marginRight: 4 }} />
                      URL
                    </button>
                    <button 
                      type="button"
                      className={`profile-tab-btn ${imageTab === 'gallery' ? 'active' : ''}`}
                      onClick={() => setImageTab('gallery')}
                    >
                      <ImageIcon size={12} style={{ display: 'inline', marginRight: 4 }} />
                      Gallery
                    </button>
                  </div>

                  {/* Tab Body A: File Upload Dropzone */}
                  {imageTab === 'upload' && (
                    <label className="photo-dropzone">
                      <Upload size={20} style={{ color: 'var(--color-primary-600)' }} />
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-base)' }}>
                        {formData.photo && formData.photo !== DEFAULT_AVATAR ? 'Change Photo' : 'Choose Image'}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                        Supports JPG, JPEG, PNG, WEBP
                      </span>
                      <input 
                        type="file" 
                        accept="image/png, image/jpeg, image/jpg, image/webp" 
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                      />
                    </label>
                  )}

                  {/* Tab Body B: Image URL Input */}
                  {imageTab === 'url' && (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <Input 
                        label="Profile Image URL"
                        placeholder="https://example.com/photo.jpg"
                        value={formData.photo}
                        onChange={(e) => {
                          setFormData({ ...formData, photo: e.target.value });
                          setImageError(false);
                        }}
                      />
                    </div>
                  )}

                  {/* Tab Body C: Gallery Selector */}
                  {imageTab === 'gallery' && (
                    <div style={{ width: '100%' }}>
                      {galleryImages.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '12px', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                          No saved profile images yet.
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '8px' }}>
                            <Button size="sm" variant="secondary" onClick={() => setImageTab('upload')}>Upload Image</Button>
                            <Button size="sm" variant="secondary" onClick={() => setImageTab('url')}>Use Image URL</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="gallery-grid">
                          {galleryImages.map((imgUrl, idx) => (
                            <img 
                              key={idx}
                              src={imgUrl} 
                              alt="Gallery Avatar" 
                              className={`gallery-item ${formData.photo === imgUrl ? 'selected' : ''}`}
                              onClick={() => {
                                setFormData({ ...formData, photo: imgUrl });
                                setImageError(false);
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>

              </div>

              <div className="modal-actions">
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving employee...' : (editingEmp ? 'Save Changes' : 'Save Employee')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Account Created Success Notice Modal */}
      {createdAccountNotice && (
        <div className="modal-overlay">
          <Card className="modal-content glass" style={{ maxWidth: '480px', width: '100%', textAlign: 'center', padding: '1.75rem' }}>
            <CheckCircle size={44} style={{ color: 'var(--color-success)', marginBottom: '12px' }} />
            <h2 style={{ margin: '0 0 6px 0', fontSize: '1.25rem' }}>Employee Account Created</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', margin: '0 0 1.25rem 0' }}>
              The login credentials for <strong>{createdAccountNotice.name}</strong> have been generated successfully.
            </p>

            <div style={{ backgroundColor: 'var(--color-bg-base)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '1rem', textAlign: 'left', marginBottom: '1.25rem', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div><strong>Employee ID:</strong> <code>{createdAccountNotice.employeeId}</code></div>
              <div><strong>Email Address:</strong> <code>{createdAccountNotice.email}</code></div>
              <div><strong>Temporary Password:</strong> <code style={{ backgroundColor: 'rgba(234, 179, 8, 0.2)', padding: '2px 8px', borderRadius: '4px', color: '#b45309', fontWeight: 700 }}>{createdAccountNotice.tempPassword}</code></div>
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: '0 0 1.25rem 0' }}>
              Please provide these credentials to the employee. They can now log in at <code>/login</code>.
            </p>

            <Button onClick={() => setCreatedAccountNotice(null)} fullWidth>
              Got It, Dismiss
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
};
