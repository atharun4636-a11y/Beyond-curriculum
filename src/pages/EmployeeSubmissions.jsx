import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { FileText, Send, Calendar, CheckCircle } from 'lucide-react';
import { getDB, setDB, defaultSubmissions } from '../utils/db';
import './EmployeeSubmissions.css';

export const EmployeeSubmissions = () => {
  const [submissions, setSubmissions] = useState(() => getDB('submissions', defaultSubmissions));

  useEffect(() => {
    setDB('submissions', submissions);
  }, [submissions]);

  const [formData, setFormData] = useState({
    title: '', platform: 'Lovable', appLink: '', description: ''
  });
  const [successMsg, setSuccessMsg] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const userString = localStorage.getItem('user');
    const loggedInUser = userString ? JSON.parse(userString) : null;
    const developerName = loggedInUser?.name || 'Alex Mercer';

    const newSubmission = {
      ...formData,
      id: Date.now(),
      developer: developerName,
      dateSubmitted: new Date().toISOString().split('T')[0],
      score: 'Pending Review',
      aiScore: null,
      status: 'Pending',
      evidenceList: [],
      confidence: null,
      coverage: 0,
      evalMode: 'Automated',
      finalScore: null,
      adminReason: '',
      reviewer: '',
      reviewDate: ''
    };

    setSubmissions([newSubmission, ...submissions]);
    setFormData({ title: '', platform: 'Lovable', appLink: '', description: '' });
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
  };

  return (
    <div className="employee-submissions">
      <div className="section-header">
        <div>
          <h1>Project Submissions</h1>
          <p className="subtitle">Submit published app links for live evaluation and scoring</p>
        </div>
      </div>

      <div className="submissions-grid">
        {/* Form to submit */}
        <Card className="submission-form-card">
          <h3>New Project Submission</h3>
          <form onSubmit={handleSubmit} className="submission-form">
            <Input 
              label="Project Title"
              placeholder="e.g. Aegis Employee Portal"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
            
            <div className="select-input-group">
              <label className="ui-input-label">Platform Used</label>
              <select 
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                className="ui-input"
              >
                <option value="Lovable">Lovable</option>
                <option value="Bolt.new">Bolt.new</option>
                <option value="Firebase Studio">Firebase Studio</option>
                <option value="Replit">Replit</option>
                <option value="Custom stack">Custom stack (Firebase/Vercel/etc.)</option>
              </select>
            </div>

            <Input 
              label="Published Application Link"
              placeholder="https://your-app.lovable.app"
              type="url"
              value={formData.appLink}
              onChange={(e) => setFormData({ ...formData, appLink: e.target.value })}
              required
            />

            <div className="select-input-group">
              <label className="ui-input-label">Short Description</label>
              <textarea 
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="ui-input"
                rows={4}
                placeholder="Explain the technologies used, challenges faced, and main features..."
                required
              />
            </div>

            <Button type="submit" className="btn-submit">
              <Send size={18} style={{ marginRight: 8 }} /> Submit Project
            </Button>

            {successMsg && (
              <div className="success-toast">
                <CheckCircle size={18} /> Submission recorded! Waiting for Admin & AI Evaluation.
              </div>
            )}
          </form>
        </Card>

        {/* History of submissions */}
        <Card className="submission-history-card">
          <h3>Submission History</h3>
          <div className="history-list">
            {submissions.map(sub => (
              <div key={sub.id} className="history-item">
                <div className="history-header">
                  <h4>{sub.title}</h4>
                  <span className={`badge-status ${sub.status.toLowerCase()}`}>{sub.status}</span>
                </div>
                <p className="history-desc">{sub.description}</p>
                <div className="history-footer">
                  <span className="history-platform">Via: <strong>{sub.platform}</strong></span>
                  <a href={sub.appLink} target="_blank" rel="noopener noreferrer" className="history-link">
                    Live Demo Link
                  </a>
                </div>
                {sub.status === 'Reviewed' && (
                  <div className="evaluation-feedback-preview">
                    <h5>Official Score: <span className="score-val">{sub.score}</span></h5>
                    <p className="emp-subtext">AI-evaluated & validated by Admin</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
