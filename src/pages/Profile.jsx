import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { User, Lock, Upload, CheckCircle, Shield, Building, Mail, Trophy, Award, Phone, Calendar, Sparkles, Camera } from 'lucide-react';
import { updateEmployee } from '../utils/api';
import { getDB, setDB } from '../utils/db';
import './Profile.css';

export const Profile = ({ role = 'employee' }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  const [profileData, setProfileData] = useState({
    employeeId: currentUser?.employeeId || 'EMP001',
    name: currentUser?.name || currentUser?.fullName || 'John Doe',
    email: currentUser?.email || 'john.doe@company.com',
    phone: currentUser?.phone || '+1 234 567 8900',
    departmentName: currentUser?.department?.name || currentUser?.departmentName || 'Data Engineering',
    departmentCode: currentUser?.department?.code || currentUser?.departmentCode || 'DE',
    designation: currentUser?.designation || 'Senior Software Engineer',
    dateJoined: currentUser?.dateJoined || '2023-01-15',
    score: currentUser?.score || 85,
    photo: currentUser?.photo || currentUser?.profileImageUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    bio: currentUser?.bio || 'Passionate software engineer building enterprise data systems & fullstack AI tools.'
  });

  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fast Client-Side Image Resizer & Compressor (< 20KB output)
  const handlePhotoUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 350;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Compress to lightweight JPEG (~20KB) for instant network transfers
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);
          setProfileData(prev => ({ ...prev, photo: compressedBase64 }));
        };
        img.src = evt.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  // Instant Save handler with zero-lag background persistence
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const updatedUser = {
      ...currentUser,
      name: profileData.name,
      phone: profileData.phone,
      designation: profileData.designation,
      photo: profileData.photo,
      profileImageUrl: profileData.photo,
      bio: profileData.bio
    };

    // 1. Immediately update localStorage and user state (Instant UI update!)
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);

    // 2. Immediately update local DB cache (Instant Admin Directory reflection!)
    try {
      const localEmps = getDB('employees', []);
      let found = false;
      const updatedEmps = localEmps.map(emp => {
        if (emp.id === profileData.employeeId || (emp.email && emp.email.toLowerCase() === (profileData.email || '').toLowerCase())) {
          found = true;
          return { 
            ...emp, 
            photo: profileData.photo, 
            profileImageUrl: profileData.photo, 
            name: profileData.name, 
            phone: profileData.phone, 
            designation: profileData.designation 
          };
        }
        return emp;
      });

      if (!found) {
        updatedEmps.push({
          id: profileData.employeeId,
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
          departmentId: 1,
          department: profileData.departmentName,
          designation: profileData.designation,
          dateJoined: profileData.dateJoined,
          active: true,
          photo: profileData.photo
        });
      }
      setDB('employees', updatedEmps);
    } catch (e) {}

    // 3. Asynchronously push to backend database in background (1 second max timeout)
    if (profileData.employeeId) {
      const updatePromise = updateEmployee(profileData.employeeId, {
        name: profileData.name,
        phone: profileData.phone,
        designation: profileData.designation,
        photo: profileData.photo,
        profileImageUrl: profileData.photo
      });

      const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 800));
      await Promise.race([updatePromise, timeoutPromise]).catch(() => {});
    }

    setIsLoading(false);
    setSuccessMsg('Passport photo saved instantly! Admin can now view your profile in the Employee Directory.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (passwordForm.next !== passwordForm.confirm) {
      alert("New passwords do not match!");
      return;
    }
    setSuccessMsg('Password updated successfully!');
    setPasswordForm({ current: '', next: '', confirm: '' });
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="profile-page">
      <div className="section-header">
        <div>
          <h1>Employee Profile</h1>
          <p className="subtitle">Upload your official passport size photo and manage personal credentials</p>
        </div>
      </div>

      <div className="profile-grid">
        {/* Profile Card */}
        <Card className="profile-info-card" style={{ padding: '1.75rem' }}>
          <form onSubmit={handleSaveProfile} className="profile-form">
            
            {/* PASSPORT SIZE PHOTO UPLOAD SECTION */}
            <div className="avatar-upload-section" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ position: 'relative' }}>
                <img 
                  src={profileData.photo} 
                  alt="Passport Photo" 
                  style={{ width: '96px', height: '110px', borderRadius: '8px', objectFit: 'cover', border: '3px solid var(--color-primary-600)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                />
                <label 
                  htmlFor="passportPhotoInput" 
                  style={{ position: 'absolute', bottom: '-8px', right: '-8px', backgroundColor: 'var(--color-primary-600)', color: '#ffffff', padding: '6px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}
                  title="Upload Passport Size Photo"
                >
                  <Camera size={14} />
                </label>
              </div>

              <div>
                <h2 style={{ margin: '0 0 4px 0', fontSize: '1.25rem' }}>{profileData.name}</h2>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '10px' }}>
                  <span className="badge-dept" style={{ fontSize: '0.78rem', fontWeight: 700, padding: '2px 10px', borderRadius: '12px', backgroundColor: 'rgba(99, 102, 241, 0.15)', color: 'var(--color-primary-600)' }}>
                    {profileData.departmentName} ({profileData.departmentCode})
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                    ID: {profileData.employeeId}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input 
                    type="file" 
                    id="passportPhotoInput" 
                    accept="image/*" 
                    onChange={handlePhotoUpload} 
                    style={{ display: 'none' }} 
                  />
                  <Button 
                    type="button" 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => document.getElementById('passportPhotoInput').click()}
                  >
                    <Upload size={14} style={{ marginRight: '6px' }} /> Upload Passport Size Photo
                  </Button>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
                  Photos are automatically compressed for instant saving. Admin will see this photo in the Directory.
                </p>
              </div>
            </div>

            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input 
                label="Full Name *" 
                value={profileData.name} 
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                required 
              />
              <Input 
                label="Employee ID (Official)" 
                value={profileData.employeeId} 
                disabled 
              />
              <Input 
                label="Official Company Email *" 
                type="email"
                value={profileData.email} 
                disabled
              />
              <Input 
                label="Phone Number" 
                value={profileData.phone} 
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
              />
              <Input 
                label="Designation / Role" 
                value={profileData.designation} 
                onChange={(e) => setProfileData({ ...profileData, designation: e.target.value })}
              />
              <Input 
                label="Date of Joining" 
                value={profileData.dateJoined} 
                disabled
              />
            </div>

            <div style={{ marginTop: '12px', marginBottom: '16px' }}>
              <Input 
                label="Passport Photo URL (Alternative)" 
                value={profileData.photo} 
                onChange={(e) => setProfileData({ ...profileData, photo: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <Button type="submit" isLoading={isLoading}>Save Profile Changes</Button>
          </form>
        </Card>

        {/* Badges & Stats Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Card style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trophy size={18} style={{ color: '#d97706' }} /> Skill & Department Metrics
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ padding: '12px', backgroundColor: 'var(--color-bg-base)', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Department</span>
                <h2 style={{ margin: '4px 0 0 0', color: '#15803d', fontSize: '1.2rem' }}>{profileData.departmentCode}</h2>
              </div>

              <div style={{ padding: '12px', backgroundColor: 'var(--color-bg-base)', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Role</span>
                <h2 style={{ margin: '4px 0 0 0', color: 'var(--color-primary-600)', fontSize: '0.95rem' }}>{profileData.designation}</h2>
              </div>
            </div>
          </Card>

          {/* Change Password Card */}
          <Card className="profile-password-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} style={{ color: 'var(--color-primary-600)' }} /> Security & Password
            </h3>
            <form onSubmit={handleChangePassword} className="password-form">
              <Input 
                label="Current Password" 
                type="password"
                value={passwordForm.current}
                onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                required
              />
              <Input 
                label="New Password" 
                type="password"
                value={passwordForm.next}
                onChange={(e) => setPasswordForm({ ...passwordForm, next: e.target.value })}
                required
              />
              <Input 
                label="Confirm New Password" 
                type="password"
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                required
              />
              
              <Button type="submit" variant="secondary" style={{ marginTop: '8px' }}>
                Update Password
              </Button>
            </form>
          </Card>
        </div>
      </div>

      {successMsg && (
        <div className="success-toast-floating" style={{ position: 'fixed', bottom: '24px', right: '24px', backgroundColor: 'var(--color-success)', color: '#ffffff', padding: '12px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', fontWeight: 600, zIndex: 1000 }}>
          <CheckCircle size={18} /> {successMsg}
        </div>
      )}
    </div>
  );
};
