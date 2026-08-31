export const getDB = (key, defaultData) => {
  const data = localStorage.getItem(`db_${key}`);
  if (!data) {
    localStorage.setItem(`db_${key}`, JSON.stringify(defaultData));
    return defaultData;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return defaultData;
  }
};

export const setDB = (key, data) => {
  localStorage.setItem(`db_${key}`, JSON.stringify(data));
};

export const defaultDepartments = [
  { id: 1, name: 'Engineering', code: 'ENG', description: 'Software Engineering team', status: 'Active', created_at: '2026-08-01' },
  { id: 2, name: 'Product', code: 'PROD', description: 'Product Management team', status: 'Active', created_at: '2026-08-01' },
  { id: 3, name: 'Design', code: 'DES', description: 'UI UX Design team', status: 'Active', created_at: '2026-08-01' },
  { id: 4, name: 'Marketing', code: 'MKT', description: 'Product Marketing team', status: 'Active', created_at: '2026-08-01' }
];

export const defaultEmployees = [
  { id: 'EMP001', name: 'John Doe', email: 'john.doe@company.com', phone: '+123456789', departmentId: 1, department: 'Engineering', designation: 'Senior Engineer', score: 85, dateJoined: '2023-01-15', active: true, photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60' },
  { id: 'EMP002', name: 'Jane Smith', email: 'jane.smith@company.com', phone: '+123456780', departmentId: 2, department: 'Product', designation: 'Product Manager', score: 90, dateJoined: '2022-11-10', active: true, photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60' },
  { id: 'EMP003', name: 'Robert Johnson', email: 'robert.j@company.com', phone: '+123456781', departmentId: 1, department: 'Engineering', designation: 'QA Lead', score: 60, dateJoined: '2024-03-01', active: false, photo: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&auto=format&fit=crop&q=60' }
];

export const defaultResources = [];

export const defaultCodingProblems = [];

export const defaultEvents = [
  { id: 1, name: 'AI Revolution Hackathon', statement: 'Develop an AI helper utility that automates boring day-to-day office tasks.', organizer: 'Platform Group', mode: 'Online', location: '', regLink: 'https://hackathon.com/ai-rev', lastDate: '2026-08-10', eventDate: '2026-08-15', poster: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&auto=format&fit=crop&q=60', description: 'Solve real-world company problems using LLMs.', registered: true },
  { id: 2, name: 'CodeStorm 2026', statement: 'Optimize microservices network overhead by 50% using Rust or Go.', organizer: 'Core Infra', mode: 'Offline', location: 'Seattle Office, Conf Rm 4B', regLink: 'https://hackathon.com/codestorm', lastDate: '2026-08-04', eventDate: '2026-08-06', poster: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&auto=format&fit=crop&q=60', description: 'Infrastructure optimization challenge.', registered: false }
];

export const defaultSubmissions = [
  { id: 1, title: 'Aegis Portal', developer: 'Alex Mercer', platform: 'Lovable', appLink: 'https://aegis-portal.lovable.app', description: 'Employee Learning Dashboard with AI grading mechanics.', status: 'Pending', scores: null, feedback: null, evidenceList: [], confidence: null, coverage: 0, evalMode: 'Automated', finalScore: null, adminReason: '', reviewer: '', reviewDate: '' },
  { id: 2, title: 'Pulse Health', developer: 'Sarah Connor', platform: 'Bolt.new', appLink: 'https://pulse.bolt.app', description: 'Patient records manager using local storage and quick index schemas.', status: 'Reviewed', scores: { functionality: 26, uiux: 18, innovation: 18, completeness: 14, usability: 13 }, feedback: { strengths: 'Responsive layout tested successfully on mobile. Dashboard analytics charts render without delays.', weaknesses: 'Input validations are missing on profile config setups.', suggestions: 'Validate input bounds in client forms.', recommended: 89 }, score: '89/100', evidenceList: [
    { feature: 'Landing Page', status: 'Verified', evidence: 'Landing page loads successfully within 1.1s.', url: 'https://pulse.bolt.app', testResult: 'Pass' },
    { feature: 'Dashboard analytics', status: 'Verified', evidence: 'Analytics charts detected and render.', url: 'https://pulse.bolt.app/dashboard', testResult: 'Pass' },
    { feature: 'Profile Configuration', status: 'Failed', evidence: 'Input fields do not check bounds or show error styles.', url: 'https://pulse.bolt.app/profile', testResult: 'Fail' }
  ], confidence: 'High', coverage: 90, evalMode: 'Automated', finalScore: 89, adminReason: 'Matches automated AI metrics.', reviewer: 'Administrator', reviewDate: '2026-08-09' }
];

export const defaultCerts = [
  { id: 1, title: 'React Basics (HackerRank)', url: '#', dateUploaded: '2026-07-28', status: 'Approved', employee: 'John Doe' },
  { id: 2, title: 'AWS Cloud Practitioner', url: '#', dateUploaded: '2026-08-01', status: 'Pending', employee: 'Sarah Connor' }
];

export const defaultFeedbacks = [
  { id: 1, employee: 'John Doe', type: 'Learning Resource', target: 'React Hooks Guide', rating: 5, comment: 'Great detailed explanations. Really helped with my projects!', date: '2026-08-01' },
  { id: 2, employee: 'Sarah Connor', type: 'Hackathon Event', target: 'CodeStorm 2026', rating: 4, comment: 'Well organized, but would love to have more templates available.', date: '2026-08-02' }
];

export const defaultDailyChallenges = [
  { id: 1, title: 'Explain a Project Delay', workplaceSituation: 'A client-facing sprint was delayed by 3 days due to an unexpected DB schema migration conflict. Your manager asks for an update.', instructions: 'Explain the issue technically but translate the impact into business-friendly terms. Avoid blaming anyone; outline the recovery path clearly.', category: 'Manager Communication', difficulty: 'Medium', expectedDuration: 120, activeDate: '2026-08-11', targetDept: 'Engineering' },
  { id: 2, title: 'Negotiating Scope Change', workplaceSituation: 'Your client requests a major feature modification just 4 days before the official release.', instructions: 'Explain how scope increases impact launch stability. Offer a compromise (e.g. Phase 2 delivery) while maintaining a positive relationship.', category: 'Client Communication', difficulty: 'Hard', expectedDuration: 180, activeDate: '2026-08-12', targetDept: 'Product' }
];

export const defaultPodcasts = [
  { id: 1, title: 'Navigating Technical Leadership', topic: 'How code architectures scale alongside team sizes.', category: 'Leadership', description: 'Deep dive into standard corporate hierarchy patterns and cross-functional feedback channels.', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', transcript: 'Technical leadership isn\'t just about selecting the right database or framework. It is about understanding how to communicate constraints to stakeholders, how to translate business constraints into code boundaries, and how to enable junior developers through constructive coding sheets reviews...', duration: '12 mins', difficulty: 'Medium', questions: [
    { id: 1, question: 'What is the primary core theme of technical leadership according to the podcast?', options: ['Selecting databases', 'Aligning stakeholders and developers', 'Writing fast code', 'Creating Figma wireframes'], answer: 'Aligning stakeholders and developers' },
    { id: 2, question: 'How should architects approach code communication limits?', options: ['Isolate codebases completely', 'Review sheets and constraints continuously', 'Ignore business stakeholders', 'Increase team sprint timelines'], answer: 'Review sheets and constraints continuously' }
  ], target: 'All' },
  { id: 2, title: 'AI Collaboration in Teams', topic: 'Structuring LLM workflows across agile projects.', category: 'AI', description: 'Insights on co-authoring code, writing prompts, and verifying compliance rules.', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', transcript: 'Collaborating with AI agents changes the developer lifecycle. We are shifting from pure syntax writers to architectural designers and prompt evaluators...', duration: '15 mins', difficulty: 'Easy', questions: [
    { id: 1, question: 'What role shift does the podcast highlight for developers?', options: ['System architects', 'Syntax typers', 'Manual testers', 'Figma designers'], answer: 'System architects' }
  ], target: 'Engineering' }
];

export const defaultScenarios = [
  { id: 1, category: 'Manager', title: 'Asking for Help', description: 'You are stuck on a memory leak bug for 6 hours. Speak with your team lead to request support without sounding incompetent.', difficulty: 'Easy' },
  { id: 2, category: 'Meeting', title: 'Disagreeing Professionally', description: 'Your colleague proposes a server architecture that will double Vercel costs. Oppose it constructively in the planning session.', difficulty: 'Medium' },
  { id: 3, category: 'Client', title: 'Handling Complaint', description: 'A critical client is angry that the payment gateway went down for 15 minutes. Diffuse the situation and assure them.', difficulty: 'Hard' }
];

export const defaultInterviews = [
  { id: 1, category: 'Behavioral', title: 'Conflict Resolution', questions: [
    'Tell me about a time you disagreed with a colleague. How did you resolve it?',
    'How do you handle negative feedback from clients?'
  ] },
  { id: 2, category: 'Technical', title: 'System Architecture Pitch', questions: [
    'Walk me through your recent project architecture. Why did you choose this layout?',
    'How would you scale this application if traffic grew 10x overnight?'
  ] }
];

export const defaultPresentations = [
  { id: 1, title: 'Hackathon Project Pitch', topic: 'Explain your hackathon application in 3 minutes to mock investors.', duration: 180, difficulty: 'Medium', criteria: ['Structure', 'Value Prop', 'Delivery'] }
];

export const defaultBadges = [
  { id: 1, title: 'Communication Champion', description: 'Reach a growth score of 80% across all speaking modules.', icon: '🏆' },
  { id: 2, title: '7-Day Speaking Streak', description: 'Record daily speaking challenges for 7 consecutive days.', icon: '🔥' },
  { id: 3, title: 'Podcast Explorer', description: 'Complete listening comprehension tests on 5 podcasts.', icon: '🎧' },
  { id: 4, title: 'Presentation Pro', description: 'Achieve a score of 90+ on any presentation pitch challenge.', icon: '🎤' }
];

export const defaultCommAttempts = [
  { id: 1, employee: 'Alex Mercer', activityType: 'Daily Practice', activityTitle: 'Explain a Project Delay', date: '2026-08-11', overallScore: 82, fluency: 80, grammar: 78, vocabulary: 84, clarity: 85, confidence: 80, professionalism: 85, aiFeedback: 'Excellent logical breakdown. You communicated the database issues clearly. Expand your vocabulary around risk mitigation strategies.', adminFeedback: 'Solid explanation. Recommended score matches performance.', status: 'Reviewed' }
];

export const defaultUserGrowth = {
  speaking: 78,
  listening: 84,
  grammar: 72,
  vocabulary: 76,
  confidence: 81,
  presentation: 69,
  interview: 82,
  completedCount: 8,
  pendingCount: 3,
  streak: 4,
  skillGaps: ['Vocabulary range', 'Presentation time management'],
  growthTrend: [
    { month: 'May', Score: 68 },
    { month: 'Jun', Score: 72 },
    { month: 'Jul', Score: 75 },
    { month: 'Aug', Score: 80 }
  ]
};

export const defaultContentAssignments = [
  { id: 1, employeeName: 'John Doe', contentId: 1, contentType: 'Resource', dueDate: '2026-08-20', priority: 'Medium', mandatory: true, status: 'Pending' },
  { id: 2, employeeName: 'John Doe', contentId: 1, contentType: 'Podcast', dueDate: '2026-08-22', priority: 'High', mandatory: false, status: 'Completed' }
];
