import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { HelpCircle, Star, MessageSquare, CheckCircle } from 'lucide-react';
import { getDB, setDB, defaultFeedbacks } from '../utils/db';
import './Feedback.css';

export const Feedback = ({ role = 'employee' }) => {
  const [feedbacks, setFeedbacks] = useState(() => getDB('feedbacks', defaultFeedbacks));

  useEffect(() => {
    setDB('feedbacks', feedbacks);
  }, [feedbacks]);

  // Form states for Employee
  const [feedbackType, setFeedbackType] = useState('Learning Resource');
  const [targetName, setTargetName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newFeedback = {
      id: Date.now(),
      employee: 'Alex Mercer',
      type: feedbackType,
      target: targetName,
      rating,
      comment,
      date: new Date().toISOString().split('T')[0]
    };

    setFeedbacks([newFeedback, ...feedbacks]);
    setTargetName('');
    setComment('');
    setRating(5);
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
  };

  return (
    <div className="feedback-page">
      <div className="section-header">
        <div>
          <h1>{role === 'admin' ? 'Employee Feedback Reviews' : 'Submit Feedback'}</h1>
          <p className="subtitle">
            {role === 'admin' 
              ? 'View ratings and suggestions submitted by employees for resources and events' 
              : 'Submit suggestions and rate learning resources or hackathon events'}
          </p>
        </div>
      </div>

      <div className="feedback-grid">
        {role === 'employee' && (
          <Card className="submit-feedback-card">
            <h3>Share your thoughts</h3>
            <form onSubmit={handleSubmit} className="feedback-form">
              <div className="form-row-2">
                <div className="select-input-group">
                  <label className="ui-input-label">Feedback Category</label>
                  <select 
                    value={feedbackType} 
                    onChange={(e) => setFeedbackType(e.target.value)}
                    className="ui-input"
                  >
                    <option value="Learning Resource">Learning Resource</option>
                    <option value="Hackathon Event">Hackathon Event</option>
                    <option value="Portal UX">Portal UX / General Suggestions</option>
                  </select>
                </div>
                
                <div className="select-input-group">
                  <label className="ui-input-label">Item / Event Name</label>
                  <input 
                    type="text" 
                    value={targetName}
                    onChange={(e) => setTargetName(e.target.value)}
                    placeholder="e.g. React Hooks Guide"
                    className="ui-input"
                    required
                  />
                </div>
              </div>

              <div className="rating-select-section">
                <label className="ui-input-label">Rating</label>
                <div className="star-rating-row">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                      type="button" 
                      key={star} 
                      onClick={() => setRating(star)}
                      className={`star-btn ${star <= rating ? 'active' : ''}`}
                    >
                      <Star size={24} fill={star <= rating ? 'var(--color-warning)' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="select-input-group">
                <label className="ui-input-label">Comment or Suggestion</label>
                <textarea 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="ui-input"
                  rows={4}
                  placeholder="Tell us what you liked or how we can improve..."
                  required
                />
              </div>

              <Button type="submit">Submit Feedback</Button>

              {successMsg && (
                <div className="success-toast">
                  <CheckCircle size={18} /> Thank you! Your feedback has been registered.
                </div>
              )}
            </form>
          </Card>
        )}

        <Card className={`feedback-history-card ${role === 'admin' ? 'full-width-card' : ''}`}>
          <h3>{role === 'admin' ? 'Latest Submissions' : 'Recent Reviews'}</h3>
          <div className="feedback-list">
            {feedbacks.map(fb => (
              <div key={fb.id} className="feedback-item-row">
                <div className="fb-header-row">
                  <div>
                    <span className="fb-employee-name">{fb.employee}</span>
                    <span className="fb-date">{fb.date}</span>
                  </div>
                  <span className="fb-type-badge">{fb.type}</span>
                </div>
                <div className="fb-target-ratings">
                  <strong>{fb.target}</strong>
                  <div className="stars-display">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star 
                        key={s} 
                        size={14} 
                        fill={s <= fb.rating ? 'var(--color-warning)' : 'none'} 
                        color="var(--color-warning)" 
                      />
                    ))}
                  </div>
                </div>
                <p className="fb-comment">{fb.comment}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
