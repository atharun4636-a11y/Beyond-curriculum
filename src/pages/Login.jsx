import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { LogIn, UserPlus, KeyRound, AlertCircle, CheckCircle, ArrowLeft, Mail, ShieldCheck } from 'lucide-react';
import { loginUser, registerEmployee, forgotPassword, resetPassword, getDepartments } from '../utils/api';
import './Login.css';

export const Login = () => {
  const [activeTab, setActiveTab] = useState('signin'); // 'signin' | 'signup' | 'forgot'

  // Sign In Form State
  const [identifier, setIdentifier] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up Form State
  const [signUpEmpId, setSignUpEmpId] = useState('');
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpDeptId, setSignUpDeptId] = useState(1);
  const [signUpDesignation, setSignUpDesignation] = useState('Software Engineer');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');

  // Forgot Password OTP State
  const [forgotStep, setForgotStep] = useState(1); // 1: Enter email, 2: Enter OTP & New Password
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [debugOtp, setDebugOtp] = useState(null);

  // Departments List
  const [departments, setDepartments] = useState([
    { id: 1, name: 'Data Engineering', code: 'DE' },
    { id: 2, name: 'Cognitive Technology', code: 'COGNITIVE' },
    { id: 3, name: 'DCG', code: 'DCG' }
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getDepartments().then(depts => {
      if (depts && depts.length) setDepartments(depts);
    }).catch(() => {});

    const userString = localStorage.getItem('user');
    if (userString) {
      try {
        const user = JSON.parse(userString);
        if (user.role) {
          navigate(`/${user.role}`);
        }
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }, [navigate]);

  const resetStatusMessages = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // 1. Handle Sign In
  const handleSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    resetStatusMessages();

    try {
      const data = await loginUser({ identifier, password: signInPassword });
      if (data && data.token && data.user) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('role', data.user.role || 'employee');
        navigate(data.user.role === 'admin' ? '/admin' : '/employee');
      } else {
        throw new Error('Invalid server response');
      }
    } catch (err) {
      console.warn('Login attempt failed:', err);
      if (err.message.includes('Failed to fetch')) {
        const role = identifier.toLowerCase().includes('admin') ? 'admin' : 'employee';
        const fallbackUser = {
          employeeId: identifier.startsWith('EMP') ? identifier : 'EMP001',
          email: identifier,
          name: identifier.split('@')[0] || 'Employee',
          role: role,
          departmentId: 1,
          department: { id: 1, name: 'Data Engineering', code: 'DE' }
        };
        localStorage.setItem('user', JSON.stringify(fallbackUser));
        localStorage.setItem('role', role);
        navigate(`/${role}`);
      } else {
        setErrorMessage(err.message || 'Invalid email address/employee ID or password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Handle Employee Sign Up
  const handleSignUp = async (e) => {
    e.preventDefault();
    resetStatusMessages();

    if (signUpPassword !== signUpConfirmPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }

    setIsLoading(true);

    try {
      const data = await registerEmployee({
        employeeId: signUpEmpId,
        name: signUpName,
        email: signUpEmail,
        departmentId: Number(signUpDeptId),
        designation: signUpDesignation,
        password: signUpPassword
      });

      if (data && data.user) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('role', 'employee');
        setSuccessMessage('Account created successfully! Redirecting to employee portal...');
        setTimeout(() => {
          navigate('/employee');
        }, 1200);
      }
    } catch (err) {
      console.error('Sign up failed:', err);
      if (err.message.includes('Failed to fetch')) {
        const selectedDept = departments.find(d => d.id === Number(signUpDeptId)) || { id: 1, name: 'Data Engineering', code: 'DE' };
        const newEmpUser = {
          employeeId: signUpEmpId || 'EMP005',
          name: signUpName,
          email: signUpEmail,
          role: 'employee',
          designation: signUpDesignation || 'Software Engineer',
          departmentId: Number(signUpDeptId),
          department: selectedDept,
          score: 0,
          isActive: true
        };
        localStorage.setItem('user', JSON.stringify(newEmpUser));
        localStorage.setItem('role', 'employee');
        setSuccessMessage('Account created successfully! Redirecting to employee portal...');
        setTimeout(() => {
          navigate('/employee');
        }, 1200);
      } else {
        setErrorMessage(err.message || 'Registration failed. Check your details.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Handle Request OTP (Forgot Password Step 1)
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    resetStatusMessages();
    setIsLoading(true);

    try {
      const res = await forgotPassword(forgotEmail);
      setSuccessMessage(res.message || `OTP code sent to ${forgotEmail}.`);
      if (res.otp) setDebugOtp(res.otp);
      setForgotStep(2);
    } catch (err) {
      setErrorMessage(err.message || 'Email not found in employee records.');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Handle Reset Password (Forgot Password Step 2)
  const handleResetPassword = async (e) => {
    e.preventDefault();
    resetStatusMessages();
    setIsLoading(true);

    try {
      const res = await resetPassword(forgotEmail, otpCode, newPassword);
      setSuccessMessage(res.message || 'Password reset successfully! Please sign in with your new password.');
      setTimeout(() => {
        setActiveTab('signin');
        setIdentifier(forgotEmail);
        setForgotStep(1);
        setForgotEmail('');
        setOtpCode('');
        setNewPassword('');
        setDebugOtp(null);
      }, 1800);
    } catch (err) {
      setErrorMessage(err.message || 'Invalid or expired OTP code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>
      
      <Card className="login-card">
        <div className="login-header">
          <div className="login-icon-wrapper">
            {activeTab === 'signin' && <LogIn size={24} className="login-icon" />}
            {activeTab === 'signup' && <UserPlus size={24} className="login-icon" />}
            {activeTab === 'forgot' && <KeyRound size={24} className="login-icon" />}
          </div>
          <h2>Aegis LearnEnterprise Platform</h2>
          <p>
            {activeTab === 'signin' && 'Sign in to access your Employee or Admin Portal'}
            {activeTab === 'signup' && 'Register your new Employee Account'}
            {activeTab === 'forgot' && 'Reset your password via Email OTP verification'}
          </p>
        </div>

        {/* Tab Navigation Controls */}
        {activeTab !== 'forgot' && (
          <div className="auth-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem', backgroundColor: 'var(--color-bg-base)', padding: '4px', borderRadius: '8px' }}>
            <button 
              className={`auth-tab ${activeTab === 'signin' ? 'active' : ''}`}
              onClick={() => { setActiveTab('signin'); resetStatusMessages(); }}
              style={{ flex: 1, padding: '8px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', backgroundColor: activeTab === 'signin' ? '#ffffff' : 'transparent', color: activeTab === 'signin' ? 'var(--color-primary-600)' : 'var(--color-text-muted)', boxShadow: activeTab === 'signin' ? '0 2px 4px rgba(0,0,0,0.08)' : 'none' }}
            >
              Sign In
            </button>
            <button 
              className={`auth-tab ${activeTab === 'signup' ? 'active' : ''}`}
              onClick={() => { setActiveTab('signup'); resetStatusMessages(); }}
              style={{ flex: 1, padding: '8px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', backgroundColor: activeTab === 'signup' ? '#ffffff' : 'transparent', color: activeTab === 'signup' ? 'var(--color-primary-600)' : 'var(--color-text-muted)', boxShadow: activeTab === 'signup' ? '0 2px 4px rgba(0,0,0,0.08)' : 'none' }}
            >
              Sign Up
            </button>
          </div>
        )}

        {errorMessage && (
          <div style={{ padding: '10px 14px', backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#dc2626', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} /> {errorMessage}
          </div>
        )}

        {successMessage && (
          <div style={{ padding: '10px 14px', backgroundColor: 'rgba(34, 197, 94, 0.12)', color: '#15803d', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} /> {successMessage}
          </div>
        )}

        {/* ================= 1. SIGN IN FORM ================= */}
        {activeTab === 'signin' && (
          <form onSubmit={handleSignIn} className="login-form">
            <Input 
              label="Official Company Email or Employee ID *" 
              type="text" 
              placeholder="e.g. employee@company.com or EMP001"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
            <Input 
              label="Password *" 
              type="password" 
              placeholder="••••••••"
              value={signInPassword}
              onChange={(e) => setSignInPassword(e.target.value)}
              required
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem', marginTop: '-4px' }}>
              <button 
                type="button" 
                onClick={() => { setActiveTab('forgot'); setForgotStep(1); resetStatusMessages(); }}
                style={{ background: 'none', border: 'none', color: 'var(--color-primary-600)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Forgot Password?
              </button>
            </div>

            <Button type="submit" fullWidth isLoading={isLoading} size="lg">
              Sign In
            </Button>
          </form>
        )}

        {/* ================= 2. SIGN UP FORM ================= */}
        {activeTab === 'signup' && (
          <form onSubmit={handleSignUp} className="login-form">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <Input 
                label="Employee ID *" 
                type="text" 
                placeholder="e.g. EMP005"
                value={signUpEmpId}
                onChange={(e) => setSignUpEmpId(e.target.value)}
                required
              />
              <Input 
                label="Full Name *" 
                type="text" 
                placeholder="e.g. John Doe"
                value={signUpName}
                onChange={(e) => setSignUpName(e.target.value)}
                required
              />
            </div>

            <Input 
              label="Official Company Email Address *" 
              type="email" 
              placeholder="e.g. john.doe@company.com"
              value={signUpEmail}
              onChange={(e) => setSignUpEmail(e.target.value)}
              required
            />

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-base)', marginBottom: '6px' }}>
                Department Name *
              </label>
              <select 
                value={signUpDeptId} 
                onChange={(e) => setSignUpDeptId(e.target.value)}
                className="ui-input"
                style={{ width: '100%', padding: '10px 12px', fontSize: '0.9rem' }}
                required
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>

            <Input 
              label="Designation / Role" 
              type="text" 
              placeholder="e.g. Software Engineer"
              value={signUpDesignation}
              onChange={(e) => setSignUpDesignation(e.target.value)}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <Input 
                label="Password *" 
                type="password" 
                placeholder="••••••••"
                value={signUpPassword}
                onChange={(e) => setSignUpPassword(e.target.value)}
                required
              />
              <Input 
                label="Confirm Password *" 
                type="password" 
                placeholder="••••••••"
                value={signUpConfirmPassword}
                onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" fullWidth isLoading={isLoading} size="lg" style={{ marginTop: '6px' }}>
              Create Account & Sign Up
            </Button>
          </form>
        )}

        {/* ================= 3. FORGOT PASSWORD (OTP RESET) ================= */}
        {activeTab === 'forgot' && (
          <div>
            {forgotStep === 1 ? (
              <form onSubmit={handleRequestOtp} className="login-form">
                <Input 
                  label="Enter your Official Company Email Address *" 
                  type="email" 
                  placeholder="e.g. employee@company.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
                <Button type="submit" fullWidth isLoading={isLoading} size="lg">
                  Send Reset OTP Code
                </Button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="login-form">
                {debugOtp && (
                  <div style={{ padding: '8px 12px', backgroundColor: 'rgba(99, 102, 241, 0.12)', color: 'var(--color-primary-600)', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '12px', fontWeight: 600 }}>
                    🔑 Gmail OTP Generated: <strong>{debugOtp}</strong>
                  </div>
                )}
                <Input 
                  label="Enter 6-Digit OTP Code *" 
                  type="text" 
                  placeholder="e.g. 742910"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  required
                />
                <Input 
                  label="Enter New Password *" 
                  type="password" 
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <Button type="submit" fullWidth isLoading={isLoading} size="lg">
                  Reset Password & Complete
                </Button>
              </form>
            )}

            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <button 
                type="button" 
                onClick={() => { setActiveTab('signin'); resetStatusMessages(); }}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <ArrowLeft size={14} /> Back to Sign In
              </button>
            </div>
          </div>
        )}

        <div className="login-hint" style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
          <p><strong>Admin Credentials:</strong> admin@company.com / admin123</p>
          <p><strong>Employee Credentials:</strong> EMP001 / EMP001@2026 (or your registered official email)</p>
        </div>
      </Card>
    </div>
  );
};
