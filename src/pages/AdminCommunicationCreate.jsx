import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ArrowLeft, Plus, Trash2, CheckCircle, AlertCircle, Sparkles, BookOpen, Layers } from 'lucide-react';
import { createCommunicationAssignment } from '../utils/api';
import './AdminCommunication.css';

const DEFAULT_10_WORDS = [
  { word: "Meticulous", meaning: "Very careful, precise, and showing great attention to detail.", partOfSpeech: "Adjective", exampleSentence: "She was meticulous when preparing financial reports for the board.", pronunciation: "muh-TIK-yuh-luss", difficulty: "Advanced" },
  { word: "Resilient", meaning: "Able to withstand or recover quickly from difficult conditions or setbacks.", partOfSpeech: "Adjective", exampleSentence: "The engineering team remained resilient despite the server migration outage.", pronunciation: "ruh-ZIL-yuhnt", difficulty: "Intermediate" },
  { word: "Articulate", meaning: "Having or showing the ability to speak fluently and coherently.", partOfSpeech: "Adjective", exampleSentence: "He gave an articulate presentation explaining complex data architecture.", pronunciation: "ar-TIK-yuh-lit", difficulty: "Intermediate" },
  { word: "Ambiguous", meaning: "Open to more than one interpretation; not having one obvious meaning.", partOfSpeech: "Adjective", exampleSentence: "The project specifications were too ambiguous to begin development.", pronunciation: "am-BIG-yoo-uhs", difficulty: "Advanced" },
  { word: "Innovative", meaning: "Featuring new methods; advanced and original in thinking.", partOfSpeech: "Adjective", exampleSentence: "The company launched an innovative AI-driven customer feedback module.", pronunciation: "IN-nuh-vay-tiv", difficulty: "Intermediate" },
  { word: "Persuasive", meaning: "Good at persuading someone to do or believe something through reasoning.", partOfSpeech: "Adjective", exampleSentence: "Her persuasive pitch convinced executive stakeholders to double the project budget.", pronunciation: "pur-SWAY-siv", difficulty: "Intermediate" },
  { word: "Adaptable", meaning: "Able to adjust to new conditions or environment quickly.", partOfSpeech: "Adjective", exampleSentence: "Developers must be adaptable to rapidly changing technology stacks.", pronunciation: "uh-DAP-tuh-buhl", difficulty: "Intermediate" },
  { word: "Pragmatic", meaning: "Dealing with things sensibly and realistically based on practical considerations.", partOfSpeech: "Adjective", exampleSentence: "Instead of choosing an expensive framework, the team adopted a pragmatic approach.", pronunciation: "prag-MAT-ik", difficulty: "Advanced" },
  { word: "Empathetic", meaning: "Showing an ability to understand and share the feelings of others.", partOfSpeech: "Adjective", exampleSentence: "An empathetic leader listens carefully to employee feedback.", pronunciation: "em-puh-THET-ik", difficulty: "Intermediate" },
  { word: "Tenacious", meaning: "Tending to keep a firm hold of something; persistent and determined.", partOfSpeech: "Adjective", exampleSentence: "His tenacious effort helped resolve the complex database deadlock bug.", pronunciation: "tuh-NAY-shuhs", difficulty: "Advanced" }
];

export const AdminCommunicationCreate = () => {
  const navigate = useNavigate();
  const todayStr = new Date().toISOString().split('T')[0];

  const [title, setTitle] = useState("Daily Advanced Vocabulary Challenge");
  const [description, setDescription] = useState("Learn these 10 advanced words, then craft a cohesive story incorporating them. Submit via typing or voice recording.");
  const [assignedDate, setAssignedDate] = useState(todayStr);
  const [dueDate, setDueDate] = useState(`${todayStr}T23:59`);
  const [difficulty, setDifficulty] = useState("Advanced");
  const [departmentId, setDepartmentId] = useState("");

  const [words, setWords] = useState(DEFAULT_10_WORDS);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleWordChange = (index, field, value) => {
    const updated = [...words];
    updated[index][field] = value;
    setWords(updated);
  };

  const handleAddWord = () => {
    if (words.length >= 10) return;
    setWords([...words, { word: "", meaning: "", partOfSpeech: "Adjective", exampleSentence: "", pronunciation: "", difficulty: "Intermediate" }]);
  };

  const handleRemoveWord = (index) => {
    if (words.length <= 1) return;
    setWords(words.filter((_, i) => i !== index));
  };

  const handleLoadPresets = () => {
    setWords(DEFAULT_10_WORDS);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (words.length !== 10) {
      setErrorMsg(`Assignment must contain EXACTLY 10 words. Current word count: ${words.length}/10`);
      return;
    }

    for (let i = 0; i < words.length; i++) {
      if (!words[i].word.trim() || !words[i].meaning.trim()) {
        setErrorMsg(`Word #${i + 1} is missing a word title or meaning.`);
        return;
      }
    }

    setIsLoading(true);

    try {
      await createCommunicationAssignment({
        title,
        description,
        assignedDate,
        dueDate,
        difficulty,
        departmentId: departmentId ? Number(departmentId) : null,
        status: 'PUBLISHED',
        words
      });

      setSuccessMsg("Communication Assignment created and published successfully!");
      setTimeout(() => {
        navigate('/admin/communication');
      }, 1200);
    } catch (err) {
      console.error('Failed to create assignment:', err);
      setErrorMsg(err.message || "Failed to create assignment.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-communication-create-page">
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <Link to="/admin/communication" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary-600)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Back to Communication Dashboard
          </Link>
          <h1>Create Daily Communication Assignment</h1>
          <p className="subtitle">Assign 10 advanced vocabulary words for employee story creation & AI analysis</p>
        </div>
      </div>

      {errorMsg && (
        <div style={{ padding: '12px 16px', backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#dc2626', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
          <AlertCircle size={18} /> {errorMsg}
        </div>
      )}

      {successMsg && (
        <div style={{ padding: '12px 16px', backgroundColor: 'rgba(34, 197, 94, 0.12)', color: '#15803d', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
          <CheckCircle size={18} /> {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Assignment Settings */}
        <Card style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={18} style={{ color: 'var(--color-primary-600)' }} /> Assignment Details
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <Input 
              label="Assignment Title *" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              required 
            />
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Target Department</label>
              <select 
                value={departmentId} 
                onChange={(e) => setDepartmentId(e.target.value)}
                className="ui-input"
                style={{ width: '100%', padding: '10px 12px' }}
              >
                <option value="">All Departments (Company-wide)</option>
                <option value="1">Data Engineering (DE)</option>
                <option value="2">Cognitive Technology (COGNITIVE)</option>
                <option value="3">DCG (DCG)</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Description & Instructions</label>
            <textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              className="ui-input"
              rows={2}
              style={{ width: '100%', padding: '10px 12px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            <Input 
              label="Assigned Date *" 
              type="date" 
              value={assignedDate} 
              onChange={(e) => setAssignedDate(e.target.value)} 
              required 
            />
            <Input 
              label="Due Date & Time" 
              type="datetime-local" 
              value={dueDate} 
              onChange={(e) => setDueDate(e.target.value)} 
            />
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Difficulty Level</label>
              <select 
                value={difficulty} 
                onChange={(e) => setDifficulty(e.target.value)}
                className="ui-input"
                style={{ width: '100%', padding: '10px 12px' }}
              >
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Expert">Expert</option>
              </select>
            </div>
          </div>
        </Card>

        {/* 10 Advanced Words Section */}
        <Card style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} style={{ color: '#d97706' }} /> Vocabulary Words ({words.length}/10)
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Admin must assign <strong>EXACTLY 10 advanced words</strong> for the daily challenge.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <Button type="button" variant="secondary" size="sm" onClick={handleLoadPresets}>
                <Layers size={14} style={{ marginRight: '4px' }} /> Load 10 Presets
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={handleAddWord} disabled={words.length >= 10}>
                <Plus size={14} style={{ marginRight: '4px' }} /> Add Word ({words.length}/10)
              </Button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {words.map((w, index) => (
              <div key={index} style={{ padding: '14px', border: '1px solid var(--color-border)', borderRadius: '8px', backgroundColor: 'var(--color-bg-base)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-primary-600)' }}>
                    Word #{index + 1}
                  </span>
                  {words.length > 1 && (
                    <button type="button" onClick={() => handleRemoveWord(index)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <Input 
                    label="Word *" 
                    placeholder="e.g. Meticulous" 
                    value={w.word} 
                    onChange={(e) => handleWordChange(index, 'word', e.target.value)} 
                    required 
                  />
                  <Input 
                    label="Part of Speech" 
                    placeholder="e.g. Adjective" 
                    value={w.partOfSpeech} 
                    onChange={(e) => handleWordChange(index, 'partOfSpeech', e.target.value)} 
                  />
                  <Input 
                    label="Phonetic Pronunciation" 
                    placeholder="e.g. muh-TIK-yuh-luss" 
                    value={w.pronunciation} 
                    onChange={(e) => handleWordChange(index, 'pronunciation', e.target.value)} 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <Input 
                    label="Definition / Meaning *" 
                    placeholder="e.g. Very careful and precise" 
                    value={w.meaning} 
                    onChange={(e) => handleWordChange(index, 'meaning', e.target.value)} 
                    required 
                  />
                  <Input 
                    label="Example Sentence *" 
                    placeholder="e.g. She was meticulous while preparing reports." 
                    value={w.exampleSentence} 
                    onChange={(e) => handleWordChange(index, 'exampleSentence', e.target.value)} 
                    required 
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Submit Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Button type="button" variant="secondary" onClick={() => navigate('/admin/communication')}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} disabled={words.length !== 10}>
            Publish Daily Assignment (10 Words)
          </Button>
        </div>
      </form>
    </div>
  );
};
