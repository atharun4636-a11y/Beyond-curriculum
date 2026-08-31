import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { EmployeeDashboard } from './pages/EmployeeDashboard';
import { AdminEmployees } from './pages/AdminEmployees';
import { AdminResources } from './pages/AdminResources';
import { EmployeeResources } from './pages/EmployeeResources';
import { AdminCoding } from './pages/AdminCoding';
import { EmployeeCoding } from './pages/EmployeeCoding';
import { AdminEvents } from './pages/AdminEvents';
import { EmployeeEvents } from './pages/EmployeeEvents';
import { AdminOpportunities } from './pages/AdminOpportunities';
import { EmployeeOpportunities } from './pages/EmployeeOpportunities';
import { EmployeeSubmissions } from './pages/EmployeeSubmissions';
import { AdminEvaluations } from './pages/AdminEvaluations';
import { Leaderboard } from './pages/Leaderboard';
import { Certificates } from './pages/Certificates';
import { AdminReports } from './pages/AdminReports';
import { Profile } from './pages/Profile';
import { Feedback } from './pages/Feedback';
import { EmployeeProgress } from './pages/EmployeeProgress';
import { DashboardLayout } from './layouts/DashboardLayout';
import { AdminCommunication } from './pages/AdminCommunication';
import { AdminCommunicationCreate } from './pages/AdminCommunicationCreate';
import { EmployeeCommunication } from './pages/EmployeeCommunication';
import { EmployeeCommunicationProgress } from './pages/EmployeeCommunicationProgress';
import { AdminSettings } from './pages/AdminSettings';

const ProtectedRoute = ({ role, children }) => {
  const userString = localStorage.getItem('user');
  if (!userString) {
    return <Navigate to="/login" replace />;
  }
  try {
    const user = JSON.parse(userString);
    if (role && user.role !== role) {
      return <Navigate to={`/${user.role}`} replace />;
    }
    return children;
  } catch (e) {
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }
};

function App() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute role="admin">
              <DashboardLayout role="admin">
                <AdminDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/employees" element={
            <ProtectedRoute role="admin">
              <DashboardLayout role="admin">
                <AdminEmployees />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/resources" element={
            <ProtectedRoute role="admin">
              <DashboardLayout role="admin">
                <AdminResources />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/coding" element={
            <ProtectedRoute role="admin">
              <DashboardLayout role="admin">
                <AdminCoding />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/events" element={
            <ProtectedRoute role="admin">
              <DashboardLayout role="admin">
                <AdminEvents />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/opportunities" element={
            <ProtectedRoute role="admin">
              <DashboardLayout role="admin">
                <AdminOpportunities />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/evaluations" element={
            <ProtectedRoute role="admin">
              <DashboardLayout role="admin">
                <AdminEvaluations />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/communication" element={
            <ProtectedRoute role="admin">
              <DashboardLayout role="admin">
                <AdminCommunication />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/communication/create" element={
            <ProtectedRoute role="admin">
              <DashboardLayout role="admin">
                <AdminCommunicationCreate />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedRoute role="admin">
              <DashboardLayout role="admin">
                <AdminSettings />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/leaderboard" element={
            <ProtectedRoute role="admin">
              <DashboardLayout role="admin">
                <Leaderboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/certificates" element={
            <ProtectedRoute role="admin">
              <DashboardLayout role="admin">
                <Certificates role="admin" />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/reports" element={
            <ProtectedRoute role="admin">
              <DashboardLayout role="admin">
                <AdminReports />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/feedback" element={
            <ProtectedRoute role="admin">
              <DashboardLayout role="admin">
                <Feedback role="admin" />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/profile" element={
            <ProtectedRoute role="admin">
              <DashboardLayout role="admin">
                <Profile role="admin" />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          {/* Employee Routes */}
          <Route path="/employee" element={
            <ProtectedRoute role="employee">
              <DashboardLayout role="employee">
                <EmployeeDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/employee/resources" element={
            <ProtectedRoute role="employee">
              <DashboardLayout role="employee">
                <EmployeeResources />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/employee/coding" element={
            <ProtectedRoute role="employee">
              <DashboardLayout role="employee">
                <EmployeeCoding />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/employee/events" element={
            <ProtectedRoute role="employee">
              <DashboardLayout role="employee">
                <EmployeeEvents />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/employee/opportunities" element={
            <ProtectedRoute role="employee">
              <DashboardLayout role="employee">
                <EmployeeOpportunities />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/employee/submissions" element={
            <ProtectedRoute role="employee">
              <DashboardLayout role="employee">
                <EmployeeSubmissions />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/employee/communication" element={
            <ProtectedRoute role="employee">
              <DashboardLayout role="employee">
                <EmployeeCommunication />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/employee/communication/progress" element={
            <ProtectedRoute role="employee">
              <DashboardLayout role="employee">
                <EmployeeCommunicationProgress />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/employee/progress" element={
            <ProtectedRoute role="employee">
              <DashboardLayout role="employee">
                <EmployeeProgress />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/employee/leaderboard" element={
            <ProtectedRoute role="employee">
              <DashboardLayout role="employee">
                <Leaderboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/employee/certificates" element={
            <ProtectedRoute role="employee">
              <DashboardLayout role="employee">
                <Certificates role="employee" />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/employee/feedback" element={
            <ProtectedRoute role="employee">
              <DashboardLayout role="employee">
                <Feedback role="employee" />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/employee/profile" element={
            <ProtectedRoute role="employee">
              <DashboardLayout role="employee">
                <Profile role="employee" />
              </DashboardLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
