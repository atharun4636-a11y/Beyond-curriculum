import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  Sparkles, BookOpen, Volume2, Mic, MicOff, Play, Pause, RotateCcw, 
  Send, CheckCircle, AlertCircle, Award, Check, X, AlertTriangle, Layers, Save, HelpCircle
} from 'lucide-react';
import { getEmployeeTodayAssignment, submitCommunicationStory } from '../utils/api';
import './EmployeeCommunication.css';

export const EmployeeCommunication = () => {
  const [assignment, setAssignment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('learn'); // 'learn' | 'type' | 'record' | 'result'
  
  // Word Learning State
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [learnedWords, setLearnedWords] = useState(new Set());

  // Story Creation State
  const [storyText, setStoryText] = useState('');
  const [draftSaved, setDraftSaved] = useState(false);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);

  // AI Evaluation Result
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const currentUser = (() => {
    try {
      const s = localStorage.getItem('user');
      return s ? JSON.parse(s) : null;
    } catch (e) {
      return null;
    }
  })();

  const employeeId = currentUser?.employeeId || 'EMP001';

  useEffect(() => {
    loadTodayAssignment();
  }, []);

  const loadTodayAssignment = async () => {
    setIsLoading(true);
    try {
      const res = await getEmployeeTodayAssignment(employeeId);
      if (res && res.data) {
        setAssignment(res.data);
        if (res.data.submission && res.data.submission.overallScore !== undefined) {
          setAiResult(res.data.submission);
          setActiveTab('result');
        }
      }
    } catch (err) {
      console.warn('Backend unavailable, using default 10-word assignment:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const wordsList = assignment?.words || [
    { id: 1, word: "Meticulous", meaning: "Very careful, precise, and showing great attention to detail.", partOfSpeech: "Adjective", exampleSentence: "She was meticulous when preparing financial reports for the board.", pronunciation: "muh-TIK-yuh-luss" },
    { id: 2, word: "Resilient", meaning: "Able to withstand or recover quickly from difficult conditions or setbacks.", partOfSpeech: "Adjective", exampleSentence: "The engineering team remained resilient despite the server migration outage.", pronunciation: "ruh-ZIL-yuhnt" },
    { id: 3, word: "Articulate", meaning: "Having or showing the ability to speak fluently and coherently.", partOfSpeech: "Adjective", exampleSentence: "He gave an articulate presentation explaining complex data architecture.", pronunciation: "ar-TIK-yuh-lit" },
    { id: 4, word: "Ambiguous", meaning: "Open to more than one interpretation; not having one obvious meaning.", partOfSpeech: "Adjective", exampleSentence: "The project specifications were too ambiguous to begin development.", pronunciation: "am-BIG-yoo-uhs" },
    { id: 5, word: "Innovative", meaning: "Featuring new methods; advanced and original in thinking.", partOfSpeech: "Adjective", exampleSentence: "The company launched an innovative AI-driven customer feedback module.", pronunciation: "IN-nuh-vay-tiv" },
    { id: 6, word: "Persuasive", meaning: "Good at persuading someone to do or believe something through reasoning.", partOfSpeech: "Adjective", exampleSentence: "Her persuasive pitch convinced executive stakeholders to double the project budget.", pronunciation: "pur-SWAY-siv" },
    { id: 7, word: "Adaptable", meaning: "Able to adjust to new conditions or environment quickly.", partOfSpeech: "Adjective", exampleSentence: "Developers must be adaptable to rapidly changing technology stacks.", pronunciation: "uh-DAP-tuh-buhl" },
    { id: 8, word: "Pragmatic", meaning: "Dealing with things sensibly and realistically based on practical considerations.", partOfSpeech: "Adjective", exampleSentence: "Instead of choosing an expensive framework, the team adopted a pragmatic approach.", pronunciation: "prag-MAT-ik" },
    { id: 9, word: "Empathetic", meaning: "Showing an ability to understand and share the feelings of others.", partOfSpeech: "Adjective", exampleSentence: "An empathetic leader listens carefully to employee feedback.", pronunciation: "em-puh-THET-ik" },
    { id: 10, word: "Tenacious", meaning: "Tending to keep a firm hold of something; persistent and determined.", partOfSpeech: "Adjective", exampleSentence: "His tenacious effort helped resolve the complex database deadlock bug.", pronunciation: "tuh-NAY-shuhs" }
  ];

  // Speech Pronunciation Audio Player
  const handleSpeak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Live Word Counter Helper for Story Editor
  const detectUsedWords = (text) => {
    if (!text) return new Set();
    const used = new Set();
    wordsList.forEach(w => {
      const pattern = new RegExp(`\\b${w.word.trim()}(s|ed|ing|ly)?\\b`, 'i');
      if (pattern.test(text)) {
        used.add(w.word.toLowerCase());
      }
    });
    return used;
  };

  const usedWordsSet = detectUsedWords(storyText);

  // Audio Recording Timers
  useEffect(() => {
    let timer;
    if (isRecording) {
      timer = setInterval(() => setRecordingTime(t => t + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // Simulating recorded audio
    const mockAudio = 'https://actions.google.com/sounds/v1/speech/person_speaking.ogg';
    setAudioUrl(mockAudio);
    setStoryText("Our team adopted a pragmatic approach during the system migration. We were meticulous while testing edge cases and remained resilient despite the ambiguous requirements. The product manager gave an articulate pitch that was persuasive and innovative. Being adaptable and empathetic made our tenacious developers succeed.");
  };

  const handleSaveDraft = () => {
    localStorage.setItem(`comm_draft_${assignment?.id || 1}`, storyText);
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2500);
  };

  const handleSubmitStory = async (type = 'TEXT') => {
    if (!storyText.trim()) {
      setErrorMsg('Please write or record your story before submitting.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await submitCommunicationStory({
        assignmentId: assignment?.id || 1,
        employeeId: employeeId,
        submissionType: type,
        storyText: storyText,
        audioUrl: audioUrl || '',
        transcript: storyText
      });

      if (res && res.aiResult) {
        setAiResult(res.aiResult);
        setActiveTab('result');
      }
    } catch (err) {
      console.error('Failed to submit story:', err);
      setErrorMsg(err.message || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentWord = wordsList[currentWordIdx] || wordsList[0];

  return (
    <div className="employee-communication-page">
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1>Communication Practice</h1>
          <p className="subtitle">Learn daily advanced vocabulary, craft your story, and receive instant AI contextual feedback</p>
        </div>
      </div>

      {/* TODAY'S ASSIGNMENT HERO BANNER */}
      <Card style={{ padding: '1.75rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '2px 10px', borderRadius: '12px', backgroundColor: 'var(--color-primary-600)', color: '#ffffff' }}>
                Today's Assignment
              </span>
              <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                {assignment?.assignedDate || new Date().toISOString().split('T')[0]}
              </span>
            </div>
            <h2 style={{ margin: '0 0 6px 0', fontSize: '1.35rem' }}>
              {assignment?.title || "Daily Advanced Vocabulary Challenge"}
            </h2>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-text-muted)', maxWidth: '650px' }}>
              {assignment?.description || "Learn these 10 advanced words, then craft a cohesive story incorporating them. Submit via typing or voice recording."}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <div style={{ padding: '10px 16px', backgroundColor: 'var(--color-card-bg)', borderRadius: '8px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Vocabulary Words</span>
              <h3 style={{ margin: '2px 0 0 0', color: 'var(--color-primary-600)' }}>10 Words</h3>
            </div>
            <div style={{ padding: '10px 16px', backgroundColor: 'var(--color-card-bg)', borderRadius: '8px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Words Used</span>
              <h3 style={{ margin: '2px 0 0 0', color: usedWordsSet.size >= 8 ? '#15803d' : '#d97706' }}>
                {usedWordsSet.size}/10
              </h3>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Learn -> Type Story -> Record Voice -> AI Results) */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '1.25rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
          <button 
            className={`comm-nav-tab ${activeTab === 'learn' ? 'active' : ''}`}
            onClick={() => setActiveTab('learn')}
            style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', backgroundColor: activeTab === 'learn' ? 'var(--color-primary-600)' : 'var(--color-bg-base)', color: activeTab === 'learn' ? '#ffffff' : 'var(--color-text-base)' }}
          >
            1. Learn 10 Words
          </button>
          <button 
            className={`comm-nav-tab ${activeTab === 'type' ? 'active' : ''}`}
            onClick={() => setActiveTab('type')}
            style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', backgroundColor: activeTab === 'type' ? 'var(--color-primary-600)' : 'var(--color-bg-base)', color: activeTab === 'type' ? '#ffffff' : 'var(--color-text-base)' }}
          >
            2. Type Story
          </button>
          <button 
            className={`comm-nav-tab ${activeTab === 'record' ? 'active' : ''}`}
            onClick={() => setActiveTab('record')}
            style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', backgroundColor: activeTab === 'record' ? 'var(--color-primary-600)' : 'var(--color-bg-base)', color: activeTab === 'record' ? '#ffffff' : 'var(--color-text-base)' }}
          >
            🎙 Voice Recording
          </button>
          {aiResult && (
            <button 
              className={`comm-nav-tab ${activeTab === 'result' ? 'active' : ''}`}
              onClick={() => setActiveTab('result')}
              style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', backgroundColor: activeTab === 'result' ? '#15803d' : 'var(--color-bg-base)', color: '#ffffff' }}
            >
              ✨ AI Evaluation Result ({aiResult.overallScore}/100)
            </button>
          )}
        </div>
      </Card>

      {errorMsg && (
        <div style={{ padding: '12px 16px', backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#dc2626', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
          <AlertCircle size={18} /> {errorMsg}
        </div>
      )}

      {/* ================= 1. LEARN WORDS TAB ================= */}
      {activeTab === 'learn' && (
        <Card style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={20} style={{ color: 'var(--color-primary-600)' }} /> Interactive Vocabulary Card ({currentWordIdx + 1}/10)
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
              Learned: {learnedWords.size}/10
            </span>
          </div>

          <div style={{ padding: '2rem', border: '2px dashed var(--color-primary-600)', borderRadius: '12px', backgroundColor: 'var(--color-bg-base)', textAlign: 'center', marginBottom: '1.5rem', position: 'relative' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ margin: 0, fontSize: '2.4rem', color: 'var(--color-primary-600)' }}>{currentWord.word}</h1>
              <button 
                type="button" 
                onClick={() => handleSpeak(currentWord.word)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary-600)', padding: '6px' }}
                title="Listen to pronunciation"
              >
                <Volume2 size={24} />
              </button>
            </div>

            <div style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', fontStyle: 'italic', marginTop: '4px' }}>
              [{currentWord.pronunciation}] • <span style={{ fontWeight: 600, color: 'var(--color-text-base)' }}>{currentWord.partOfSpeech}</span>
            </div>

            <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border)' }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.9rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Definition</h4>
              <p style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-base)', maxWidth: '650px', marginLeft: 'auto', marginRight: 'auto' }}>
                "{currentWord.meaning}"
              </p>

              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.9rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Example Usage</h4>
              <p style={{ margin: 0, fontSize: '0.95rem', fontStyle: 'italic', color: 'var(--color-text-base)', maxWidth: '650px', marginLeft: 'auto', marginRight: 'auto' }}>
                "{currentWord.exampleSentence}"
              </p>
            </div>
          </div>

          {/* Flashcard Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button 
              variant="secondary" 
              onClick={() => setCurrentWordIdx(i => Math.max(0, i - 1))}
              disabled={currentWordIdx === 0}
            >
              Previous Word
            </Button>

            <Button 
              type="button"
              variant={learnedWords.has(currentWord.id) ? "secondary" : "primary"}
              onClick={() => {
                const next = new Set(learnedWords);
                next.add(currentWord.id);
                setLearnedWords(next);
              }}
            >
              {learnedWords.has(currentWord.id) ? "✓ Marked as Learned" : "Mark as Learned"}
            </Button>

            {currentWordIdx < wordsList.length - 1 ? (
              <Button onClick={() => setCurrentWordIdx(i => Math.min(wordsList.length - 1, i + 1))}>
                Next Word
              </Button>
            ) : (
              <Button onClick={() => setActiveTab('type')}>
                Proceed to Create Story →
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* ================= 2. TYPE STORY TAB ================= */}
      {activeTab === 'type' && (
        <Card style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Type Your Story</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                Write a meaningful narrative incorporating all 10 assigned vocabulary words.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="secondary" size="sm" onClick={handleSaveDraft}>
                <Save size={14} style={{ marginRight: '4px' }} /> Save Draft
              </Button>
              {draftSaved && <span style={{ fontSize: '0.8rem', color: '#15803d', fontWeight: 600, alignSelf: 'center' }}>Draft Saved!</span>}
            </div>
          </div>

          {/* Live Word Helper Tracker */}
          <div style={{ marginBottom: '1rem', padding: '12px', backgroundColor: 'var(--color-bg-base)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: '8px' }}>
              LIVE VOCABULARY DETECTOR ({usedWordsSet.size}/10 Words Used)
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {wordsList.map(w => {
                const isUsed = usedWordsSet.has(w.word.toLowerCase());
                return (
                  <span key={w.id} style={{ fontSize: '0.78rem', fontWeight: 600, padding: '4px 10px', borderRadius: '12px', border: '1px solid', backgroundColor: isUsed ? 'rgba(34, 197, 94, 0.15)' : 'var(--color-card-bg)', color: isUsed ? '#15803d' : 'var(--color-text-muted)', borderColor: isUsed ? '#15803d' : 'var(--color-border)' }}>
                    {isUsed ? '✓ ' : ''}{w.word}
                  </span>
                );
              })}
            </div>
          </div>

          <textarea 
            value={storyText}
            onChange={(e) => setStoryText(e.target.value)}
            className="ui-input"
            rows={8}
            placeholder="Once upon a time, our engineering team adopted a pragmatic approach to solve..."
            style={{ width: '100%', padding: '14px', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.25rem' }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
              Word Count: {storyText.split(/\s+/).filter(Boolean).length} words
            </span>

            <Button onClick={() => handleSubmitStory('TEXT')} isLoading={isSubmitting}>
              <Send size={16} style={{ marginRight: '6px' }} /> Submit Story for AI Analysis
            </Button>
          </div>
        </Card>
      )}

      {/* ================= 3. VOICE RECORDING TAB ================= */}
      {activeTab === 'record' && (
        <Card style={{ padding: '2rem', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem' }}>Record Your Story</h3>
          <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
            Speak out loud and record your story incorporating the 10 assigned vocabulary words.
          </p>

          <div style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: isRecording ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto', border: `3px solid ${isRecording ? '#dc2626' : 'var(--color-primary-600)'}` }}>
            {isRecording ? <Mic size={48} style={{ color: '#dc2626' }} className="pulse-icon" /> : <Mic size={48} style={{ color: 'var(--color-primary-600)' }} />}
          </div>

          <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: isRecording ? '#dc2626' : 'var(--color-text-base)' }}>
            {String(Math.floor(recordingTime / 60)).padStart(2, '0')}:{String(recordingTime % 60).padStart(2, '0')}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '1.5rem' }}>
            {!isRecording ? (
              <Button onClick={handleStartRecording}>
                <Mic size={16} style={{ marginRight: '6px' }} /> Start Recording
              </Button>
            ) : (
              <Button variant="danger" onClick={handleStopRecording} style={{ backgroundColor: '#dc2626', color: '#fff' }}>
                <MicOff size={16} style={{ marginRight: '6px' }} /> Stop Recording
              </Button>
            )}
          </div>

          {audioUrl && (
            <div style={{ padding: '16px', backgroundColor: 'var(--color-bg-base)', borderRadius: '8px', border: '1px solid var(--color-border)', maxWidth: '500px', margin: '0 auto 1.5rem auto' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Audio Playback & Generated Speech Transcript</span>
              <audio src={audioUrl} controls style={{ width: '100%', marginBottom: '10px' }} />
              <p style={{ margin: 0, fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--color-text-base)', textAlign: 'left' }}>
                "{storyText}"
              </p>
            </div>
          )}

          {audioUrl && (
            <Button onClick={() => handleSubmitStory('AUDIO')} isLoading={isSubmitting}>
              <Send size={16} style={{ marginRight: '6px' }} /> Submit Audio Recording for AI Analysis
            </Button>
          )}
        </Card>
      )}

      {/* ================= 4. AI RESULT TAB ================= */}
      {activeTab === 'result' && aiResult && (
        <div>
          <Card style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.35rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={22} style={{ color: '#d97706' }} /> AI Evaluation Feedback Report
                </h2>
                <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                  Evaluated on {aiResult.submittedAt || new Date().toISOString().split('T')[0]}
                </span>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Overall AI Score</span>
                <h1 style={{ margin: 0, color: 'var(--color-primary-600)', fontSize: '2.2rem' }}>{aiResult.overallScore}/100</h1>
              </div>
            </div>

            {/* Score Grid Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '14px', backgroundColor: 'var(--color-bg-base)', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Vocabulary (/40)</span>
                <h3 style={{ margin: '4px 0 0 0', color: '#15803d', fontSize: '1.3rem' }}>{aiResult.vocabularyScore} pts</h3>
              </div>

              <div style={{ padding: '14px', backgroundColor: 'var(--color-bg-base)', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Grammar (/20)</span>
                <h3 style={{ margin: '4px 0 0 0', color: '#2563eb', fontSize: '1.3rem' }}>{aiResult.grammarScore} pts</h3>
              </div>

              <div style={{ padding: '14px', backgroundColor: 'var(--color-bg-base)', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Story Quality (/20)</span>
                <h3 style={{ margin: '4px 0 0 0', color: '#d97706', fontSize: '1.3rem' }}>{aiResult.storyQualityScore} pts</h3>
              </div>

              <div style={{ padding: '14px', backgroundColor: 'var(--color-bg-base)', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Context Score (/20)</span>
                <h3 style={{ margin: '4px 0 0 0', color: 'var(--color-primary-600)', fontSize: '1.3rem' }}>{aiResult.contextScore} pts</h3>
              </div>
            </div>

            {/* AI Strengths & Improvements */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '1.5rem' }}>
              <div style={{ padding: '14px', backgroundColor: 'rgba(34, 197, 94, 0.08)', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#15803d', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle size={16} /> Key Strengths
                </h4>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--color-text-base)' }}>
                  {(aiResult.aiFeedback?.strengths || ["Submitted story successfully.", "Good vocabulary structure."]).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>

              <div style={{ padding: '14px', backgroundColor: 'rgba(234, 179, 8, 0.08)', borderRadius: '8px', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#b45309', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={16} /> Areas for Improvement
                </h4>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--color-text-base)' }}>
                  {(aiResult.aiFeedback?.improvements || ["Practice using missing words in daily conversations."]).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Detailed Per-Word Analysis Chips */}
            <div>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem' }}>Per-Word AI Contextual Analysis (10 Words)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(aiResult.wordResults || wordsList.map(w => ({
                  word: w.word,
                  partOfSpeech: w.partOfSpeech,
                  correctUsage: usedWordsSet.has(w.word.toLowerCase()),
                  used: usedWordsSet.has(w.word.toLowerCase()),
                  contextScore: usedWordsSet.has(w.word.toLowerCase()) ? 9 : 0,
                  evidence: usedWordsSet.has(w.word.toLowerCase()) ? `Our team used ${w.word} effectively.` : '',
                  feedback: usedWordsSet.has(w.word.toLowerCase()) ? `Great usage of '${w.word}'.` : `Assigned word '${w.word}' was missing.`
                }))).map((wr, idx) => (
                  <div key={idx} style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: wr.correctUsage ? 'rgba(34, 197, 94, 0.08)' : wr.used ? 'rgba(234, 179, 8, 0.1)' : 'rgba(239, 68, 68, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {wr.correctUsage ? <Check size={16} style={{ color: '#15803d' }} /> : wr.used ? <AlertTriangle size={16} style={{ color: '#d97706' }} /> : <X size={16} style={{ color: '#dc2626' }} />}
                        <strong style={{ fontSize: '0.95rem' }}>{wr.word}</strong>
                        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>({wr.partOfSpeech || 'Adjective'})</span>
                      </div>
                      {wr.evidence && <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', fontStyle: 'italic', color: 'var(--color-text-base)' }}>"{wr.evidence}"</p>}
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{wr.feedback}</p>
                    </div>

                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: wr.correctUsage ? '#15803d' : '#dc2626' }}>
                      {wr.contextScore}/10 pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
