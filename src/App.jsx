import { NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';

const selectOptions = ['Not started', 'Pending', 'Done'];

// ── Class 12 CBSE Syllabus ──────────────────────────────────────────────────
const CBSE_SUBJECTS_CONFIG = [
  {
    name: 'Physics',
    color: '#60a5fa',
    focus: 'Class 12 CBSE',
    chapters: [
      'Electric Charges and Fields',
      'Electrostatic Potential and Capacitance',
      'Current Electricity',
      'Moving Charges and Magnetism',
      'Magnetism and Matter',
      'Electromagnetic Induction',
      'Alternating Current',
      'Electromagnetic Waves',
      'Ray Optics and Optical Instruments',
      'Wave Optics',
      'Dual Nature of Radiation and Matter',
      'Atoms',
      'Nuclei',
      'Semiconductor Electronics'
    ]
  },
  {
    name: 'Chemistry',
    color: '#34d399',
    focus: 'Class 12 CBSE',
    chapters: [
      'Solutions',
      'Electrochemistry',
      'Chemical Kinetics',
      'd- and f-Block Elements',
      'Coordination Compounds',
      'Haloalkanes and Haloarenes',
      'Alcohols, Phenols and Ethers',
      'Aldehydes, Ketones and Carboxylic Acids',
      'Amines',
      'Biomolecules'
    ]
  },
  {
    name: 'Mathematics',
    color: '#fbbf24',
    focus: 'Class 12 CBSE',
    chapters: [
      'Relations and Functions',
      'Inverse Trigonometric Functions',
      'Matrices',
      'Determinants',
      'Continuity and Differentiability',
      'Applications of Derivatives',
      'Integrals',
      'Applications of Integrals',
      'Differential Equations',
      'Vector Algebra',
      'Three Dimensional Geometry',
      'Linear Programming',
      'Probability'
    ]
  },
  {
    name: 'Computer Science',
    color: '#a78bfa',
    focus: 'Class 12 CBSE',
    chapters: [
      'Python Revision',
      'Functions',
      'File Handling',
      'Exception Handling',
      'MySQL',
      'SQL Queries',
      'Computer Networks'
    ]
  },
  {
    name: 'English',
    color: '#f472b6',
    focus: 'Class 12 CBSE',
    chapters: [
      'Reading Skills',
      'Writing Skills',
      'Flamingo',
      'Vistas'
    ]
  }
];

// Topic → chapter hint mapping for voice parser improvement
const CBSE_TOPIC_HINTS = [
  // Physics
  { keywords: ['kirchhoff', 'ohm', 'resistivity', 'conductivity', 'drift velocity'], subject: 'physics', chapter: 'Current Electricity' },
  { keywords: ['lenz', 'faraday', 'mutual inductance', 'self inductance', 'eddy'], subject: 'physics', chapter: 'Electromagnetic Induction' },
  { keywords: ['gauss', 'coulomb', 'dipole', 'electric field', 'flux'], subject: 'physics', chapter: 'Electric Charges and Fields' },
  { keywords: ['capacitance', 'capacitor', 'dielectric'], subject: 'physics', chapter: 'Electrostatic Potential and Capacitance' },
  { keywords: ['biot-savart', 'ampere', 'cyclotron', 'magnetic force', 'lorentz'], subject: 'physics', chapter: 'Moving Charges and Magnetism' },
  { keywords: ['hysteresis', 'magnetic moment', 'magnetisation'], subject: 'physics', chapter: 'Magnetism and Matter' },
  { keywords: ['transformer', 'ac', 'impedance', 'resonance', 'rms'], subject: 'physics', chapter: 'Alternating Current' },
  { keywords: ['displacement current', 'em wave', 'electromagnetic wave'], subject: 'physics', chapter: 'Electromagnetic Waves' },
  { keywords: ['lens', 'mirror', 'refraction', 'microscope', 'telescope', 'snell', 'prism'], subject: 'physics', chapter: 'Ray Optics and Optical Instruments' },
  { keywords: ['interference', 'diffraction', 'polarisation', 'huygens', 'young'], subject: 'physics', chapter: 'Wave Optics' },
  { keywords: ['photoelectric', 'einstein', 'planck', 'de broglie'], subject: 'physics', chapter: 'Dual Nature of Radiation and Matter' },
  { keywords: ['rutherford', 'bohr', 'hydrogen spectrum', 'atomic'], subject: 'physics', chapter: 'Atoms' },
  { keywords: ['radioactive', 'half life', 'binding energy', 'fission', 'fusion', 'nuclear'], subject: 'physics', chapter: 'Nuclei' },
  { keywords: ['pn junction', 'diode', 'transistor', 'logic gate', 'zener'], subject: 'physics', chapter: 'Semiconductor Electronics' },
  // Chemistry
  { keywords: ['raoult', 'henry', 'colligative', 'osmotic', 'vapour pressure'], subject: 'chemistry', chapter: 'Solutions' },
  { keywords: ['galvanic', 'electrolytic', 'nernst', 'conductance', 'cell potential'], subject: 'chemistry', chapter: 'Electrochemistry' },
  { keywords: ['rate constant', 'activation energy', 'order of reaction', 'arrhenius'], subject: 'chemistry', chapter: 'Chemical Kinetics' },
  { keywords: ['lanthanoid', 'actinoid', 'transition element'], subject: 'chemistry', chapter: 'd- and f-Block Elements' },
  { keywords: ['ligand', 'crystal field', 'chelate', 'coordination sphere'], subject: 'chemistry', chapter: 'Coordination Compounds' },
  { keywords: ['haloalkane', 'haloarene', 'sn1', 'sn2', 'wurtz', 'grignard'], subject: 'chemistry', chapter: 'Haloalkanes and Haloarenes' },
  { keywords: ['alcohol', 'phenol', 'ether'], subject: 'chemistry', chapter: 'Alcohols, Phenols and Ethers' },
  { keywords: ['aldehyde', 'ketone', 'carboxylic acid', 'cannizzaro', 'aldol'], subject: 'chemistry', chapter: 'Aldehydes, Ketones and Carboxylic Acids' },
  { keywords: ['amine', 'diazonium', 'amide'], subject: 'chemistry', chapter: 'Amines' },
  { keywords: ['carbohydrate', 'protein', 'vitamin', 'enzyme', 'dna', 'rna', 'biomolecule'], subject: 'chemistry', chapter: 'Biomolecules' },
  // Mathematics
  { keywords: ['relation', 'equivalence', 'function type', 'one-one', 'onto'], subject: 'mathematics', chapter: 'Relations and Functions' },
  { keywords: ['inverse', 'arcsin', 'arccos', 'arctan', 'principal value'], subject: 'mathematics', chapter: 'Inverse Trigonometric Functions' },
  { keywords: ['matrix', 'determinant', 'inverse of matrix', 'cramer'], subject: 'mathematics', chapter: 'Matrices' },
  { keywords: ['exercise 7', 'integration', 'integral', 'definite integral', 'indefinite'], subject: 'mathematics', chapter: 'Integrals' },
  { keywords: ['exercise 6', 'derivative', 'tangent', 'normal', 'maxima', 'minima'], subject: 'mathematics', chapter: 'Applications of Derivatives' },
  { keywords: ['differential equation', 'homogeneous', 'integrating factor'], subject: 'mathematics', chapter: 'Differential Equations' },
  { keywords: ['vector', 'dot product', 'cross product', 'scalar triple'], subject: 'mathematics', chapter: 'Vector Algebra' },
  { keywords: ['line', 'plane', 'distance', 'angle between'], subject: 'mathematics', chapter: 'Three Dimensional Geometry' },
  { keywords: ['probability', 'bayes', 'random variable', 'binomial', 'bernoulli'], subject: 'mathematics', chapter: 'Probability' },
  // Computer Science
  { keywords: ['python', 'list', 'tuple', 'dictionary', 'string slicing'], subject: 'computer science', chapter: 'Python Revision' },
  { keywords: ['function def', 'lambda', 'recursion', 'argument'], subject: 'computer science', chapter: 'Functions' },
  { keywords: ['file', 'open', 'read', 'write', 'append', 'csv'], subject: 'computer science', chapter: 'File Handling' },
  { keywords: ['exception', 'try', 'except', 'finally', 'raise'], subject: 'computer science', chapter: 'Exception Handling' },
  { keywords: ['mysql', 'database', 'table', 'create', 'insert', 'select'], subject: 'computer science', chapter: 'MySQL' },
  { keywords: ['sql', 'query', 'join', 'group by', 'order by', 'where'], subject: 'computer science', chapter: 'SQL Queries' },
  { keywords: ['network', 'tcp', 'ip', 'protocol', 'topology', 'lan', 'wan'], subject: 'computer science', chapter: 'Computer Networks' },
  // English
  { keywords: ['comprehension', 'unseen', 'reading passage'], subject: 'english', chapter: 'Reading Skills' },
  { keywords: ['notice', 'article', 'speech', 'debate', 'letter writing', 'report'], subject: 'english', chapter: 'Writing Skills' },
  { keywords: ['flamingo', 'poem', 'prose'], subject: 'english', chapter: 'Flamingo' },
  { keywords: ['vistas', 'supplementary', 'reader'], subject: 'english', chapter: 'Vistas' }
];

// ── User correction memory ──────────────────────────────────────────────────
// Learns from user edits to the extracted voice data
const CORRECTIONS_KEY = 'study-companion-voice-corrections';

function loadUserCorrections() {
  try {
    const stored = localStorage.getItem(CORRECTIONS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveUserCorrection(speechText, correctedField, correctedValue) {
  const all = loadUserCorrections();
  const key = speechText.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
  if (!key || !correctedValue) return;
  if (!all[key]) all[key] = {};
  all[key][correctedField] = correctedValue;
  try {
    localStorage.setItem(CORRECTIONS_KEY, JSON.stringify(all));
  } catch { /* ignore storage limits */ }
}

function getCorrectedText(speechText) {
  const all = loadUserCorrections();
  const key = speechText.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
  return all[key] || null;
}

// ── Syntax helpers ──────────────────────────────────────────────────────────
function splitTranscriptBySubject(text) {
  // Split on sentence boundaries that likely introduce a new subject
  const segments = [];
  const sentences = text.split(/[.;]\s*/).filter(Boolean);
  
  const subjectPatterns = [
    { regex: /\b(physics|phy)\b/i, name: 'Physics' },
    { regex: /\b(chemistry|chem)\b/i, name: 'Chemistry' },
    { regex: /\b(maths|mathematics|math)\b/i, name: 'Mathematics' },
    { regex: /\b(computer science|cs|computer)\b/i, name: 'Computer Science' },
    { regex: /\b(english|eng)\b/i, name: 'English' }
  ];

  let currentSubject = '';
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;
    
    // Check if this sentence introduces a new subject
    let detectedSubject = '';
    for (const sp of subjectPatterns) {
      if (sp.regex.test(trimmed)) {
        detectedSubject = sp.name;
        break;
      }
    }
    
    if (detectedSubject) {
      currentSubject = detectedSubject;
    }
    
    segments.push({ text: trimmed, subjectHint: currentSubject });
  }
  
  // Merge consecutive segments with same subject hint
  const merged = [];
  for (const seg of segments) {
    const last = merged[merged.length - 1];
    if (last && last.subjectHint === seg.subjectHint) {
      last.text += '. ' + seg.text;
    } else {
      merged.push({ ...seg });
    }
  }
  
  return merged;
}

// ── Syllabus helpers ─────────────────────────────────────────────────────────
function createCbseSubject(config) {
  const subjectId = `subject-${Date.now()}`;
  let lastChapterId = '';
  let lastTopicId = '';

  const chapters = config.chapters.map((chName, i) => {
    const chId = `chapter-${Date.now()}-${i}`;
    const topicId = `topic-${Date.now()}-${i}`;
    if (i === 0) {
      lastChapterId = chId;
      lastTopicId = topicId;
    }
    return {
      id: chId,
      name: chName,
      topics: [
        {
          id: topicId,
          name: 'General',
          schoolNotes: 'Not started',
          homework: 'Not started',
          revision: 'Not started',
          mcq: 'Not started',
          tuitionNotes: 'Not started',
          jee: 'Not started',
          pyqs: 'Not started',
          practiceQuestions: 'Not started'
        }
      ]
    };
  });

  return {
    id: subjectId,
    name: config.name,
    color: config.color,
    focus: config.focus,
    lastChapterId,
    lastTopicId,
    homework: 'Not started',
    backlog: 'Not started',
    revision: 'Not started',
    chapters
  };
}

function seedCbseSyllabus(existingSubjects) {
  const existingNames = new Set(existingSubjects.map((s) => s.name.toLowerCase().trim()));
  const added = [];

  CBSE_SUBJECTS_CONFIG.forEach((config) => {
    if (existingNames.has(config.name.toLowerCase().trim())) return; // already exists
    const newSubject = createCbseSubject(config);
    existingSubjects.push(newSubject);
    added.push(config.name);
  });

  return added;
}

function createDefaultSubjects() {
  return [];
}

function createDefaultBagItems() {
  return [];
}

function createEmptySubject(name, focus) {
  const chapterId = `chapter-${Date.now()}`;
  const topicId = `topic-${Date.now() + 1}`;
  return {
    id: `subject-${Date.now()}`,
    name,
    color: '#60a5fa',
    focus: focus || 'Custom subject',
    lastChapterId: chapterId,
    lastTopicId: topicId,
    homework: 'Not started',
    backlog: 'Not started',
    revision: 'Not started',
    chapters: [
      {
        id: chapterId,
        name: 'Chapter 1',
        topics: [
          {
            id: topicId,
            name: 'Topic 1',
            schoolNotes: 'Not started',
            homework: 'Not started',
            revision: 'Not started'
          }
        ]
      }
    ]
  };
}

const defaultState = {
  tasks: [],
  subjects: createDefaultSubjects(),
  revisionNotes: [],
  examDate: '',
  timerMinutes: 25,
  todayNote: 'Start with one small step.',
  bagItems: createDefaultBagItems(),
  weeklyReview: { text: '', updatedAt: null },
  monthlyReflection: { text: '', updatedAt: null },
  notificationsEnabled: false,
  darkMode: true,
  plannerProfile: {
    schoolProgress: '',
    homework: '',
    backlog: '',
    revisionDue: '',
    upcomingExams: '',
    availableStudyTime: 60,
    energyLevel: 'normal'
  },
  generatedPlan: { generatedAt: null, summary: '', tasks: [], methodology: 'balanced' },
  plannerMethodology: 'balanced',
  lastQuickSubjectId: '',
  lastQuickType: ''
};

function isLegacySeededState(parsed) {
  const seededTaskTitles = ['Math revision', 'Biology flashcards', 'Essay draft'];
  const seededSubjectIds = ['physics', 'chemistry', 'mathematics', 'computer-science', 'english'];
  const seededBagTitles = ['Textbooks', 'Water bottle', 'Charged laptop'];

  const hasLegacyTasks = Array.isArray(parsed?.tasks) && parsed.tasks.some((task) => seededTaskTitles.includes(task.title));
  const hasLegacySubjects = Array.isArray(parsed?.subjects) && parsed.subjects.some((subject) => seededSubjectIds.includes(subject.id) || seededSubjectIds.includes(subject.name?.toLowerCase().replace(/\s+/g, '-')));
  const hasLegacyBagItems = Array.isArray(parsed?.bagItems) && parsed.bagItems.some((item) => seededBagTitles.includes(item.title));

  return hasLegacyTasks || hasLegacySubjects || hasLegacyBagItems;
}

function readState() {
  try {
    const stored = localStorage.getItem('study-companion-state');
    const parsed = stored ? JSON.parse(stored) : null;
    
    // If no saved state or legacy state, seed CBSE syllabus into a fresh default
    if (!parsed || isLegacySeededState(parsed)) {
      const freshSubjects = createDefaultSubjects();
      seedCbseSyllabus(freshSubjects);
      // Build a fresh state and persist it so CBSE subjects survive reload
      const freshState = { ...defaultState, subjects: freshSubjects, __cbseSeeded: true };
      localStorage.setItem('study-companion-state', JSON.stringify(freshState));
      return freshState;
    }
    
    // Ensure subjects array exists
    const subjects = Array.isArray(parsed.subjects) ? parsed.subjects : createDefaultSubjects();
    
    // Seed CBSE syllabus once (only adds missing subjects, never duplicates)
    if (!parsed.__cbseSeeded) {
      const added = seedCbseSyllabus(subjects);
      if (added.length > 0) {
        // Persist the seeded subjects immediately so they survive page reload
        parsed.__cbseSeeded = true;
        parsed.subjects = subjects;
        localStorage.setItem('study-companion-state', JSON.stringify(parsed));
      }
    }
    
    return {
      ...defaultState,
      ...parsed,
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : defaultState.tasks,
      subjects,
      bagItems: Array.isArray(parsed.bagItems) ? parsed.bagItems : createDefaultBagItems(),
      weeklyReview: { text: parsed.weeklyReview?.text || '', updatedAt: parsed.weeklyReview?.updatedAt || null },
      monthlyReflection: { text: parsed.monthlyReflection?.text || '', updatedAt: parsed.monthlyReflection?.updatedAt || null },
      plannerProfile: { ...defaultState.plannerProfile, ...(parsed.plannerProfile || {}) },
      generatedPlan: parsed.generatedPlan || { generatedAt: null, summary: '', tasks: [] },
      notificationsEnabled: Boolean(parsed.notificationsEnabled),
      darkMode: parsed.darkMode ?? true
    };
  } catch {
    return defaultState;
  }
}

function writeState(state) {
  localStorage.setItem('study-companion-state', JSON.stringify(state));
}

function updateStateAndPersist(currentState, patch, setState) {
  const nextState = { ...currentState, ...patch };
  setState(nextState);
  writeState(nextState);
  return nextState;
}

function formatTimerDisplay(totalSeconds) {
  const mins = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const secs = String(totalSeconds % 60).padStart(2, '0');
  return `${mins}:${secs}`;
}

// ── Timer persistence (survives page refreshes) ─────────────────────────────
const TIMER_STORAGE_KEY = 'study-companion-timer-state';

function saveTimerState(fs) {
  try {
    const now = Date.now();
    const payload = {
      mode: fs.mode,
      studySeconds: fs.studySeconds,
      breakSeconds: fs.breakSeconds,
      isRunning: fs.isRunning,
      savedAt: now,
      // If running, store endTimestamp so we can compute elapsed time on reload
      ...(fs.isRunning ? { endTimestamp: now + fs.remainingSeconds * 1000 } : {}),
      // If paused / idle, store the remaining directly
      ...(!fs.isRunning ? { pausedRemaining: fs.remainingSeconds } : {})
    };
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(payload));
  } catch { /* ignore quota errors */ }
}

function loadSavedTimerState() {
  try {
    const raw = localStorage.getItem(TIMER_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    const now = Date.now();

    if (data.isRunning && data.endTimestamp) {
      // How much time is left based on the saved end timestamp?
      const remaining = Math.max(0, Math.floor((data.endTimestamp - now) / 1000));
      return {
        mode: data.mode || 'study',
        remainingSeconds: remaining,
        isRunning: remaining > 0,         // only keep running if time hasn't fully elapsed
        studySeconds: data.studySeconds || 25 * 60,
        breakSeconds: data.breakSeconds || 5 * 60,
        expired: remaining <= 0,          // flag so we can notify the user
        focusIndex: data.focusIndex || 0
      };
    }

    // Paused or idle timer → restore remaining as-is, stay paused
    return {
      mode: data.mode || 'study',
      remainingSeconds: data.pausedRemaining || data.remainingSeconds || 25 * 60,
      isRunning: false,
      studySeconds: data.studySeconds || 25 * 60,
      breakSeconds: data.breakSeconds || 5 * 60,
      expired: false,
      focusIndex: data.focusIndex || 0
    };
  } catch {
    return null;
  }
}

function clearTimerState() {
  try { localStorage.removeItem(TIMER_STORAGE_KEY); } catch { /* ignore */ }
}

function getStudyWindowMinutes(now) {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const eveningFinish = 22 * 60;
  return Math.max(60, eveningFinish - currentMinutes);
}

function formatMinutes(minutes) {
  const safeMinutes = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${String(mins).padStart(2, '0')} ${suffix}`;
}

function collectSubjectPlannerItems(subjects) {
  const homeworkItems = [];
  const backlogItems = [];
  const revisionItems = [];

  subjects.forEach((subject) => {
    if (subject.homework === 'Pending') {
      homeworkItems.push({ title: `${subject.name} homework`, kind: 'homework', subject: subject.name });
    }
    if (subject.backlog === 'Pending') {
      backlogItems.push({ title: `${subject.name} backlog`, kind: 'backlog', subject: subject.name });
    }
    if (subject.revision === 'Pending') {
      revisionItems.push({ title: `${subject.name} revision`, kind: 'revision', subject: subject.name });
    }

    subject.chapters.forEach((chapter) => {
      chapter.topics.forEach((topic) => {
        if (topic.homework === 'Pending') {
          homeworkItems.push({ title: `${subject.name} · ${chapter.name} · ${topic.name}`, kind: 'homework', subject: subject.name });
        }
        if (topic.revision === 'Pending') {
          revisionItems.push({ title: `${subject.name} · ${chapter.name} · ${topic.name}`, kind: 'revision', subject: subject.name });
        }
      });
    });
  });

  return { homeworkItems, backlogItems, revisionItems };
}

// Simple fuzzy match: returns items sorted by similarity score (higher = better)
function fuzzyFind(query, items, getName) {
  if (!query || !items.length) return [];
  const q = query.toLowerCase().trim();
  const scored = items.map((item) => {
    const name = getName(item).toLowerCase().trim();
    if (name === q) return { item, score: 100 };
    if (name.includes(q)) return { item, score: 80 };
    if (q.includes(name)) return { item, score: 70 };
    const queryWords = q.split(/\s+/).filter(Boolean);
    const nameWords = name.split(/\s+/).filter(Boolean);
    let wordMatches = 0;
    for (const qw of queryWords) {
      for (const nw of nameWords) {
        if (nw.includes(qw) || qw.includes(nw)) {
          wordMatches++;
          break;
        }
      }
    }
    const wordScore = nameWords.length > 0 ? (wordMatches / Math.max(nameWords.length, queryWords.length)) * 60 : 0;
    let charOverlap = 0;
    for (const ch of q) {
      if (name.includes(ch)) charOverlap++;
    }
    const charScore = q.length > 0 ? (charOverlap / q.length) * 40 : 0;
    return {
      item,
      score: Math.max(wordScore, charScore)
    };
  });
  return scored.sort((a, b) => b.score - a.score).filter((s) => s.score >= 25);
}

function bestFuzzyMatch(query, items, getName) {
  const results = fuzzyFind(query, items, getName);
  if (results.length > 0) return results[0];
  return null;
}

// ── Levenshtein distance for spelling-tolerant matching ─────────────────────
function levenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }
  return matrix[b.length][a.length];
}

function normalizedLevenshteinSimilarity(a, b) {
  if (!a || !b) return 0;
  const distance = levenshteinDistance(a.toLowerCase().trim(), b.toLowerCase().trim());
  const maxLen = Math.max(a.length, b.length);
  return maxLen > 0 ? 1 - distance / maxLen : 0;
}

// Strip punctuation and common filler words for comparison
function normalizeForMatch(text) {
  return text
    .toLowerCase()
    .replace(/[,.\-';:!?()]/g, ' ')
    .replace(/\b(and|the|a|an|in|of|for|to|on|at|by|with|from|till|until|up|down)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Action detection ────────────────────────────────────────────────────────
function detectAction(normalized) {
  if (/\b(completed|finished|did|done|covered|studied|went through|did exercise)\b/i.test(normalized)) return 'completed';
  if (/\b(revised|revision|reviewed|review|revise)\b/i.test(normalized)) return 'revised';
  if (/\b(homework|assignment|worksheet|practice|exercise due|homework due)\b/i.test(normalized)) return 'homework';
  if (/\b(pending|backlog|not done|left|remaining)\b/i.test(normalized)) return 'pending';
  return null;
}

function detectType(normalized) {
  if (/\btuition\b/i.test(normalized)) return 'Tuition';
  if (/\bschool\b/i.test(normalized)) return 'School';
  return 'School'; // default
}

// ── Subject detection with aliases + fuzzy ──────────────────────────────────
const SUBJECT_ALIASES = {
  mathematics: ['math', 'maths', 'mathematics', 'mathmatics', 'mathamatics'],
  physics: ['physics', 'phy', 'phys'],
  chemistry: ['chemistry', 'chem', 'chm', 'chemitry'],
  english: ['english', 'eng'],
  'computer science': ['computer science', 'computer', 'cs', 'computers']
};

function detectSubject(normalized, subjects) {
  // 1. Direct name match in transcript
  for (const subject of subjects) {
    const subLower = subject.name.toLowerCase();
    if (normalized.includes(subLower)) {
      return { subject, confidence: 100, method: 'direct' };
    }
  }

  // 2. Alias match
  for (const subject of subjects) {
    const subLower = subject.name.toLowerCase();
    for (const [key, aliases] of Object.entries(SUBJECT_ALIASES)) {
      if (subLower.includes(key) || key.includes(subLower)) {
        for (const alias of aliases) {
          if (normalized.includes(alias)) {
            return { subject, confidence: 90, method: 'alias' };
          }
        }
      }
    }
  }

  // 3. Fuzzy match fallback
  const best = bestFuzzyMatch(normalized, subjects, s => s.name);
  if (best && best.score >= 40) {
    return { subject: best.item, confidence: best.score, method: 'fuzzy' };
  }

  return { subject: null, confidence: 0, method: 'none' };
}

// ── Chapter detection with fuzzy + hints + punctuation-stripped matching ────
function detectChapter(normalized, subject, topicKeywordsFound) {
  if (!subject || !subject.chapters.length) {
    return { chapter: null, confidence: 0 };
  }

  const chapters = subject.chapters;

  // 1. Check CBSE_TOPIC_HINTS first for keyword-based matches
  const subjectKey = subject.name.toLowerCase();
  for (const hint of CBSE_TOPIC_HINTS) {
    if (hint.subject !== subjectKey) continue;
    for (const kw of hint.keywords) {
      if (normalized.includes(kw)) {
        const match = chapters.find(ch => ch.name === hint.chapter);
        if (match) {
          // Mark keywords found for topic detection
          hint.keywords.forEach(k => { if (normalized.includes(k)) topicKeywordsFound.add(k); });
          return { chapter: match, confidence: 85, method: 'hint' };
        }
      }
    }
  }

  // 2. Normalized (punctuation-stripped) exact match
  const normClean = normalizeForMatch(normalized);
  for (const ch of chapters) {
    const chClean = normalizeForMatch(ch.name);
    if (normClean.includes(chClean)) {
      return { chapter: ch, confidence: 95, method: 'exact' };
    }
  }

  // 3. Word-overlap fuzzy match
  const fuzzyResult = bestFuzzyMatch(normalized, chapters, ch => ch.name);
  if (fuzzyResult && fuzzyResult.score >= 35) {
    return { chapter: fuzzyResult.item, confidence: fuzzyResult.score, method: 'fuzzy' };
  }

  // 4. Levenshtein similarity fallback (handles spelling mistakes)
  let bestLev = { chapter: null, confidence: 0 };
  for (const ch of chapters) {
    const sim = normalizedLevenshteinSimilarity(normalized, ch.name);
    if (sim > bestLev.confidence && sim > 0.5) {
      bestLev = { chapter: ch, confidence: Math.round(sim * 100), method: 'levenshtein' };
    }
    // Also check chapter name words individually
    const chWords = ch.name.toLowerCase().split(/\s+/);
    for (const word of chWords) {
      if (word.length > 3 && normalized.includes(word)) {
        bestLev = { chapter: ch, confidence: Math.max(bestLev.confidence, 70), method: 'wordMatch' };
        break;
      }
    }
  }

  if (bestLev.chapter) return bestLev;

  return { chapter: null, confidence: 0 };
}

// ── Topic detection ─────────────────────────────────────────────────────────
function detectTopic(normalized, chapter) {
  if (!chapter || !chapter.topics.length) {
    return { topic: null, confidence: 0 };
  }

  // Check user-added topics
  for (const topic of chapter.topics) {
    const tClean = normalizeForMatch(topic.name);
    const nClean = normalizeForMatch(normalized);
    if (nClean.includes(tClean)) {
      return { topic, confidence: 85 };
    }
    // Fuzzy match topic name
    const fuzzyResult = bestFuzzyMatch(normalized, chapter.topics, t => t.name);
    if (fuzzyResult && fuzzyResult.score >= 40) {
      return { topic: fuzzyResult.item, confidence: fuzzyResult.score };
    }
  }

  return { topic: null, confidence: 0 };
}

// ── Confidence scoring ──────────────────────────────────────────────────────
function computeOverallConfidence(subjectConf, chapterConf, hasText) {
  if (!hasText) return 0;
  if (!subjectConf && !chapterConf) return 0;
  // Weighted: subject matters more (50%), chapter (40%), text length (10%)
  const weights = { subject: 0.5, chapter: 0.4, text: 0.1 };
  const textScore = hasText ? 100 : 0;
  return Math.round(
    (subjectConf * weights.subject) +
    (chapterConf * weights.chapter) +
    (textScore * weights.text)
  );
}

// Topic name hints: keyword → { subject, chapter, topic }
const CBSE_TOPIC_NAME_HINTS = [
  { keywords: ['capacitor', 'capacitors', 'capacitance'], subject: 'physics', chapter: 'Electrostatic Potential and Capacitance', topic: 'Capacitors' },
  { keywords: ['potential', 'equipotential'], subject: 'physics', chapter: 'Electrostatic Potential and Capacitance', topic: 'Electrostatic Potential' },
  { keywords: ['kirchhoff', 'ohm', 'resistivity', 'conductivity', 'drift velocity'], subject: 'physics', chapter: 'Current Electricity', topic: "Ohm's Law" },
  { keywords: ['biot-savart', 'ampere circuital', 'cyclotron'], subject: 'physics', chapter: 'Moving Charges and Magnetism', topic: 'Biot-Savart Law' },
  { keywords: ['faraday', 'lenz', 'mutual inductance', 'self inductance', 'eddy'], subject: 'physics', chapter: 'Electromagnetic Induction', topic: "Faraday's Law" },
  { keywords: ['lens', 'mirror', 'refraction', 'snell', 'prism', 'telescope', 'microscope'], subject: 'physics', chapter: 'Ray Optics and Optical Instruments', topic: 'Ray Optics' },
  { keywords: ['interference', 'diffraction', 'polarisation', 'huygens', 'young'], subject: 'physics', chapter: 'Wave Optics', topic: 'Interference' },
  { keywords: ['pn junction', 'diode', 'transistor', 'logic gate', 'zener'], subject: 'physics', chapter: 'Semiconductor Electronics', topic: 'Semiconductor Devices' },
  { keywords: ['raoult', 'henry', 'colligative', 'osmotic', 'vapour pressure'], subject: 'chemistry', chapter: 'Solutions', topic: 'Colligative Properties' },
  { keywords: ['galvanic', 'electrolytic', 'nernst', 'conductance', 'cell potential'], subject: 'chemistry', chapter: 'Electrochemistry', topic: 'Electrochemical Cells' },
  { keywords: ['rate constant', 'activation energy', 'order of reaction', 'arrhenius'], subject: 'chemistry', chapter: 'Chemical Kinetics', topic: 'Rate of Reaction' },
  { keywords: ['lanthanoid', 'actinoid', 'transition element'], subject: 'chemistry', chapter: 'd- and f-Block Elements', topic: 'Transition Elements' },
  { keywords: ['ligand', 'crystal field', 'chelate', 'coordination sphere'], subject: 'chemistry', chapter: 'Coordination Compounds', topic: 'Coordination Compounds' },
  { keywords: ['aldehyde', 'ketone', 'carboxylic acid', 'cannizzaro', 'aldol'], subject: 'chemistry', chapter: 'Aldehydes, Ketones and Carboxylic Acids', topic: 'Aldehydes and Ketones' },
  { keywords: ['amine', 'diazonium', 'amide'], subject: 'chemistry', chapter: 'Amines', topic: 'Amines' },
  { keywords: ['carbohydrate', 'protein', 'vitamin', 'enzyme', 'dna', 'rna'], subject: 'chemistry', chapter: 'Biomolecules', topic: 'Biomolecules' },
  { keywords: ['maxima', 'minima', 'tangent', 'normal', 'increasing', 'decreasing'], subject: 'mathematics', chapter: 'Applications of Derivatives', topic: 'Maxima and Minima' },
  { keywords: ['integration', 'integral', 'definite integral', 'indefinite'], subject: 'mathematics', chapter: 'Integrals', topic: 'Integration' },
  { keywords: ['differential equation', 'homogeneous', 'integrating factor'], subject: 'mathematics', chapter: 'Differential Equations', topic: 'Differential Equations' },
  { keywords: ['vector', 'dot product', 'cross product', 'scalar triple'], subject: 'mathematics', chapter: 'Vector Algebra', topic: 'Vector Algebra' },
  { keywords: ['line', 'plane', 'distance', 'angle between'], subject: 'mathematics', chapter: 'Three Dimensional Geometry', topic: '3D Geometry' },
  { keywords: ['probability', 'bayes', 'random variable', 'binomial', 'bernoulli'], subject: 'mathematics', chapter: 'Probability', topic: 'Probability' },
  { keywords: ['python', 'list', 'tuple', 'dictionary', 'string'], subject: 'computer science', chapter: 'Python Revision', topic: 'Python' },
  { keywords: ['function', 'lambda', 'recursion', 'argument'], subject: 'computer science', chapter: 'Functions', topic: 'Functions' },
  { keywords: ['file', 'open', 'read', 'write', 'append', 'csv'], subject: 'computer science', chapter: 'File Handling', topic: 'File Handling' },
  { keywords: ['exception', 'try', 'except', 'finally', 'raise'], subject: 'computer science', chapter: 'Exception Handling', topic: 'Exception Handling' },
  { keywords: ['mysql', 'database', 'table', 'create', 'insert', 'select'], subject: 'computer science', chapter: 'MySQL', topic: 'MySQL' },
  { keywords: ['network', 'tcp', 'ip', 'protocol', 'topology', 'lan', 'wan'], subject: 'computer science', chapter: 'Computer Networks', topic: 'Computer Networks' },
  { keywords: ['comprehension', 'unseen', 'reading passage'], subject: 'english', chapter: 'Reading Skills', topic: 'Reading Comprehension' },
  { keywords: ['notice', 'article', 'speech', 'debate', 'letter', 'report'], subject: 'english', chapter: 'Writing Skills', topic: 'Writing' },
];

/**
 * Parse a voice transcript and extract subject, chapter, topic, type, action.
 * Homework is only extracted when explicitly mentioned.
 */
function parseVoiceUpdate(transcript, subjects) {
  const normalized = transcript.toLowerCase().trim();
  const hasText = normalized.length > 0;

  const result = {
    subjectId: null,
    subjectName: "",
    chapterId: null,
    chapterName: "",
    topicId: null,
    topicName: "",
    homework: "",
    type: "School",
    action: null,
    actionConfidence: 0,
    subjectConfidence: 0,
    chapterConfidence: 0,
    topicConfidence: 0,
    confidence: 0,
    needsConfirmation: false,
    method: 'none',
    subjectsFound: [],
    chaptersFound: [],
    topicsFound: [],
    actionsFound: [],
    decisions: {}
  };

  if (!hasText) return result;

  // 1. ACTION DETECTION
  const detectedAction = detectAction(normalized);
  result.action = detectedAction;
  result.actionConfidence = detectedAction ? 90 : 0;
  if (detectedAction) result.actionsFound.push(detectedAction);

  // 2. TYPE DETECTION
  result.type = detectType(normalized);

  // 3. SUBJECT DETECTION – find ALL candidate subjects
  const allSubjects = new Map();
  for (const subject of subjects) {
    const subLower = subject.name.toLowerCase();
    if (normalized.includes(subLower)) {
      allSubjects.set(subject.id, { subject, confidence: 100, method: 'direct' });
      continue;
    }
    for (const [, aliases] of Object.entries(SUBJECT_ALIASES)) {
      for (const alias of aliases) {
        if (normalized.includes(alias)) {
          allSubjects.set(subject.id, { subject, confidence: 90, method: 'alias' });
          break;
        }
      }
      if (allSubjects.has(subject.id)) break;
    }
    if (!allSubjects.has(subject.id)) {
      const fuzzy = bestFuzzyMatch(normalized, [subject], s => s.name);
      if (fuzzy && fuzzy.score >= 40) {
        allSubjects.set(subject.id, { subject, confidence: fuzzy.score, method: 'fuzzy' });
      }
    }
  }
  // Also check CBSE_TOPIC_HINTS for subject hints
  for (const hint of CBSE_TOPIC_HINTS) {
    for (const kw of hint.keywords) {
      if (normalized.includes(kw)) {
        const matchSubject = subjects.find(s => s.name.toLowerCase() === hint.subject);
        if (matchSubject && !allSubjects.has(matchSubject.id)) {
          allSubjects.set(matchSubject.id, { subject: matchSubject, confidence: 80, method: 'hint-keyword' });
        }
        break;
      }
    }
  }
  const allSorted = Array.from(allSubjects.values()).sort((a, b) => b.confidence - a.confidence);
  result.subjectsFound = allSorted.map(e => ({ name: e.subject.name, confidence: e.confidence, method: e.method }));
  const bestSubjectEntry = allSorted.length > 0 ? allSorted[0] : null;
  const needsMultiSubjectConfirm = allSorted.length > 1 && allSorted[0].confidence - (allSorted[1]?.confidence || 0) < 20;
  if (bestSubjectEntry) {
    result.subjectId = bestSubjectEntry.subject.id;
    result.subjectName = bestSubjectEntry.subject.name;
    result.subjectConfidence = bestSubjectEntry.confidence;
    result.method = bestSubjectEntry.method;
  }

  // 4. CHAPTER + TOPIC DETECTION
  let bestChapter = null;
  let bestChapterConf = 0;
  let bestTopicName = '';
  let bestTopicConf = 0;

  // Step A: Scan CBSE_TOPIC_NAME_HINTS for topic-level matches
  const subjectKey = result.subjectName?.toLowerCase() || '';
  for (const hint of CBSE_TOPIC_NAME_HINTS) {
    if (subjectKey && hint.subject !== subjectKey) continue;
    const matchedKeywords = hint.keywords.filter(kw => normalized.includes(kw));
    if (matchedKeywords.length > 0) {
      const hintSubject = subjects.find(s => s.name.toLowerCase() === hint.subject);
      if (!hintSubject) continue;
      const chapter = hintSubject.chapters.find(ch => ch.name === hint.chapter);
      if (!chapter) continue;
      const matchRatio = matchedKeywords.length / hint.keywords.length;
      const confidence = Math.min(95, 60 + Math.round(matchRatio * 35));
      result.chaptersFound.push({ chapter: chapter.name, subject: hintSubject.name, confidence, keywords: matchedKeywords });
      if (confidence > bestChapterConf) {
        bestChapter = chapter;
        bestChapterConf = confidence;
        bestTopicName = hint.topic;
        bestTopicConf = confidence - 5;
      }
    }
  }

  // Step B: Fall back to fuzzy chapter/topic detection
  if (!bestChapter && result.subjectId) {
    const targetSubject = subjects.find(s => s.id === result.subjectId);
    if (targetSubject) {
      const topicKeywordsFound = new Set();
      const { chapter, confidence: chConf } = detectChapter(normalized, targetSubject, topicKeywordsFound);
      if (chapter && chConf > bestChapterConf) {
        bestChapter = chapter;
        bestChapterConf = chConf;
      }
      if (chapter) {
        const { topic, confidence: tConf } = detectTopic(normalized, chapter);
        if (topic && tConf > bestTopicConf) {
          bestTopicName = topic.name;
          bestTopicConf = tConf;
        }
      }
    }
  }

  // Step C: Extract topic from remaining text
  if (!bestTopicName && bestChapter) {
    let remaining = normalized;
    if (result.subjectName) remaining = remaining.replace(new RegExp(normalizeForMatch(result.subjectName).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '');
    if (bestChapter.name) remaining = remaining.replace(new RegExp(normalizeForMatch(bestChapter.name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '');
    remaining = remaining.replace(/\b(completed|finished|did|done|revised|revision|homework|tuition|school|chapter|topic|exercise|studied|covered|in|of|the|and|for|today|yesterday|now|then|just|i|we|they|he|she|has|have|had|was|were|been|being|am|is|are|be|will|would|can|could|shall|should|may|might|must|do|does|did|doing|done|gets|got|get|getting|a|an|the|this|that|these|those|at|by|to|from|on|off|with|without|after|before|during|until|till|since|about|around|between|among)\b/g, ' ').replace(/\s+/g, ' ').trim();
    for (const hint of CBSE_TOPIC_NAME_HINTS) {
      if (hint.subject !== subjectKey) continue;
      if (hint.chapter !== bestChapter.name) continue;
      const wordsPresent = hint.keywords.filter(kw => remaining.includes(kw));
      if (wordsPresent.length > 0) {
        bestTopicName = hint.topic;
        bestTopicConf = 50 + wordsPresent.length * 5;
        break;
      }
    }
    if (!bestTopicName && remaining.length > 2) {
      const words = remaining.split(/\s+/).filter(w => w.length > 2);
      if (words.length > 0) {
        bestTopicName = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        bestTopicConf = 35;
      }
    }
  }

  if (bestChapter) {
    result.chapterId = bestChapter.id;
    result.chapterName = bestChapter.name;
    result.chapterConfidence = bestChapterConf;
    if (bestTopicName) {
      result.topicName = bestTopicName;
      result.topicConfidence = bestTopicConf;
      result.topicsFound.push({ name: bestTopicName, confidence: bestTopicConf });
    }
  }

  // 5. HOMEWORK EXTRACTION - ONLY when explicitly mentioned
  const hwExplicitPattern = /(?:homework|assignment|worksheet)\s*(?:is|:)?\s*(.+?)(?:\.|;|$)/i;
  const hwMatch = transcript.match(hwExplicitPattern);
  if (hwMatch) {
    const hw = hwMatch[1]?.trim() || hwMatch[0]?.trim() || '';
    if (hw.length > 0 && hw.length <= 60) {
      result.homework = hw.charAt(0).toUpperCase() + hw.slice(1);
    }
  }

  // 6. OVERALL CONFIDENCE
  result.confidence = computeOverallConfidence(result.subjectConfidence, result.chapterConfidence, hasText);
  result.needsConfirmation = result.confidence < 50 || (!result.subjectId && hasText) || needsMultiSubjectConfirm;
  result.decisions = {
    bestSubject: result.subjectName || '(none)',
    bestChapter: result.chapterName || '(none)',
    bestTopic: result.topicName || '(none)',
    action: result.action || '(none)',
    confidence: result.confidence,
    needsConfirmation: result.needsConfirmation,
    subjectsConsidered: result.subjectsFound,
    chaptersConsidered: result.chaptersFound,
    topicsConsidered: result.topicsFound
  };
  console.log("=== Parser Debug ===");
  console.log("Transcript:", transcript);
  console.log("Result:", result);
  return result;
}

function createGeneratedPlan(state, now, methodology) {
  const profile = state.plannerProfile || defaultState.plannerProfile;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // ── Profile inputs ──────────────────────────────────────────────────────
  const energyLevel = profile.energyLevel || 'normal';
  const availableStudyTime = profile.availableStudyTime || 60;

  const isTired = energyLevel === 'tired';
  const isHighlyMotivated = energyLevel === 'highly_motivated';
  const isNormal = energyLevel === 'normal';

  // ── Determine study parameters from energy level + methodology ──────────
  let baseBlock, breakLength, maxStudyTasks;
  const method = methodology || 'balanced';

  // Base params from energy level
  if (isTired) {
    baseBlock = 15;        // shorter focus
    breakLength = 5;       // short breaks
    maxStudyTasks = 2;     // fewer tasks
  } else if (isHighlyMotivated) {
    baseBlock = 35;        // deep focus
    breakLength = 10;      // earned longer break
    maxStudyTasks = 4;     // more tasks
  } else {
    baseBlock = 25;        // normal pomodoro
    breakLength = 8;       // standard break
    maxStudyTasks = 3;     // standard tasks
  }

  // Apply methodology modifiers
  if (method === 'quick_wins') {
    baseBlock = Math.min(baseBlock, 20);  // shorter blocks
    breakLength = Math.max(breakLength, 5);
    maxStudyTasks = Math.min(maxStudyTasks + 1, 5); // more tasks, smaller
  } else if (method === 'deep_focus') {
    baseBlock = Math.max(baseBlock, 35);  // longer blocks
    breakLength = Math.max(breakLength, 10);
    maxStudyTasks = Math.max(maxStudyTasks - 1, 1); // fewer tasks, deeper
  } else if (method === 'cram_mode') {
    baseBlock = 45;                        // max focus
    breakLength = 3;                       // minimal breaks
    maxStudyTasks = Math.min(maxStudyTasks + 2, 6);
  }
  // balanced: no changes

  // Cap available minutes to user's declared available study time
  const availableMinutes = Math.min(availableStudyTime, getStudyWindowMinutes(now));

  const { homeworkItems, backlogItems, revisionItems } = collectSubjectPlannerItems(state.subjects || []);

  // ── Candidate tasks ─────────────────────────────────────────────────────
  const candidates = [];
  const addCandidate = (task, priority) => {
    if (!task.title?.trim()) return;
    const normalizedTitle = task.title.trim().toLowerCase();
    if (!candidates.some((item) => item.title.trim().toLowerCase() === normalizedTitle)) {
      candidates.push({ ...task, priority });
    }
  };

  // 1) School progress review — high priority
  if (profile.schoolProgress?.trim()) {
    addCandidate({
      kind: 'school',
      title: `Review: ${profile.schoolProgress.trim()}`,
      label: 'School notes',
      duration: isTired ? 15 : baseBlock
    }, 9);
  }

  // 2) Homework from planner profile — highest priority
  if (profile.homework?.trim()) {
    addCandidate({
      kind: 'planner-homework',
      title: profile.homework.trim(),
      label: 'Homework',
      duration: isTired ? 15 : baseBlock
    }, 10);
  }

  // 3) Homework items from subject tracker
  homeworkItems.forEach((task, i) => {
    addCandidate({
      kind: 'homework',
      title: task.title,
      label: 'Homework',
      duration: baseBlock
    }, 8 - i);
  });

  // 4) Revision due
  if (profile.revisionDue?.trim()) {
    addCandidate({
      kind: 'planner-revision',
      title: profile.revisionDue.trim(),
      label: 'Revision',
      duration: isTired ? 15 : baseBlock
    }, 7);
  }
  revisionItems.slice(0, 1).forEach((task, i) => {
    addCandidate({
      kind: 'revision',
      title: task.title,
      label: 'Revision due',
      duration: isTired ? 15 : baseBlock
    }, 6 - i);
  });

  // 5) JEE practice (if motivated / normal energy)
  if (!isTired) {
    const jeeSubjects = ['physics', 'chemistry', 'mathematics', 'maths'];
    state.subjects.forEach((subject) => {
      const subjectLower = subject.name.toLowerCase();
      if (jeeSubjects.some((js) => subjectLower.includes(js))) {
        subject.chapters.forEach((chapter) => {
          chapter.topics.forEach((topic) => {
            if (topic.jee === 'Not started' || topic.jee === 'Pending') {
              addCandidate({
                kind: 'jee',
                title: `${subject.name} JEE - ${topic.name}`,
                label: 'JEE practice',
                duration: baseBlock
              }, 5);
            }
          });
        });
      }
    });
    const hasJeeTask = candidates.some((c) => c.kind === 'jee');
    if (!hasJeeTask) {
      addCandidate({
        kind: 'jee',
        title: 'JEE practice (PYQs)',
        label: 'JEE practice',
        duration: baseBlock
      }, 4);
    }
  }

  // 6) Backlog (only if not tired)
  if (!isTired) {
    if (profile.backlog?.trim()) {
      addCandidate({
        kind: 'planner-backlog',
        title: profile.backlog.trim(),
        label: 'Backlog',
        duration: baseBlock
      }, 3);
    }
    if (backlogItems[0]) {
      addCandidate({
        kind: 'backlog',
        title: backlogItems[0].title,
        label: 'Backlog',
        duration: baseBlock
      }, 2);
    }
  }

  // 7) Upcoming exams prep
  if (profile.upcomingExams?.trim()) {
    addCandidate({
      kind: 'exam',
      title: profile.upcomingExams.trim(),
      label: 'Exam prep',
      duration: isTired ? 15 : baseBlock
    }, 1);
  }

  // ── Prioritise and pick top tasks ───────────────────────────────────────
  candidates.sort((a, b) => b.priority - a.priority);
  const studyTasks = candidates.slice(0, maxStudyTasks);

  // ── Build timeline ──────────────────────────────────────────────────────
  const planItems = [];
  let startMinutes = currentMinutes;
  let remainingMinutes = availableMinutes;

  studyTasks.forEach((task, index) => {
    const taskDuration = Math.min(
      task.duration,
      Math.max(10, Math.floor(remainingMinutes / Math.max(1, studyTasks.length - index)))
    );
    planItems.push({
      id: `${task.kind}-${Date.now()}-${index}`,
      title: task.title,
      type: task.label,
      duration: taskDuration,
      time: formatMinutes(startMinutes),
      kind: task.kind
    });
    startMinutes += taskDuration;
    remainingMinutes -= taskDuration;

    // Insert break between tasks
    if (index < studyTasks.length - 1) {
      const actualBreak = Math.min(
        breakLength,
        Math.max(3, Math.floor(remainingMinutes / (studyTasks.length - index - 1) * 0.2))
      );
      const breakTitle = isTired
        ? `Gentle break · ${actualBreak} min`
        : `Break · ${actualBreak} min`;
      planItems.push({
        id: `break-${Date.now()}-${index}`,
        title: breakTitle,
        type: 'Break',
        duration: actualBreak,
        time: formatMinutes(startMinutes),
        kind: 'break'
      });
      startMinutes += actualBreak;
      remainingMinutes -= actualBreak;
    }
  });

  // ── Summary ─────────────────────────────────────────────────────────────
  const summaryParts = [];
  const nowLabel = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  summaryParts.push(`Now ${nowLabel}`);
  summaryParts.push(`${Math.max(1, Math.ceil((startMinutes - currentMinutes) / 60))}h plan`);
  if (isTired) summaryParts.push('Tired • Light session');
  if (isHighlyMotivated) summaryParts.push('Highly motivated • Deep focus');

  return {
    generatedAt: now.toISOString(),
    summary: summaryParts.join(' • '),
    tasks: planItems
  };
}

function getRevisionItems(subjects) {
  const today = new Date();
  const todayKey = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  return subjects.flatMap((subject) =>
    subject.chapters.flatMap((chapter) =>
      chapter.topics.map((topic) => {
        const nextReviewAt = topic.nextReviewAt ? new Date(topic.nextReviewAt).getTime() : null;
        const isDue = !nextReviewAt || nextReviewAt <= todayKey;
        const isWeak = Boolean(topic.weak || topic.forgotCount >= 2);
        return {
          subjectId: subject.id,
          subjectName: subject.name,
          chapterId: chapter.id,
          chapterName: chapter.name,
          topicId: topic.id,
          topicName: topic.name,
          nextReviewAt,
          isDue,
          isWeak,
          forgotCount: topic.forgotCount || 0,
          reviewCount: topic.reviewCount || 0
        };
      })
    )
  ).filter((item) => item.isDue || item.isWeak);
}

function QuickUpdateCard({ state, setState }) {
  // Initialize with last remembered selections
  const recognitionRef = useRef(null);
  const [draft, setDraft] = useState({
    transcript: '',
    subjectId: state.lastQuickSubjectId || '',
    chapterId: '',
    topicId: '',
    homework: '',
    type: state.lastQuickType || '',
    note: '',
    isListening: false,
    mode: 'manual',
    showConfirmation: false,
    extractedData: null
  });
  const retryCountRef = useRef(0);
  const silenceTimerRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const interimRef = useRef('');
  const userStoppedRef = useRef(false);
  const isListeningRef = useRef(false);

  const selectedSubject = state.subjects.find((subject) => subject.id === draft.subjectId) || null;
  const selectedChapter = selectedSubject?.chapters.find((chapter) => chapter.id === draft.chapterId) || selectedSubject?.chapters[0] || null;
  const selectedTopic = selectedChapter?.topics.find((topic) => topic.id === draft.topicId) || selectedChapter?.topics[0] || null;

  // Check if SpeechRecognition is available
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const isSpeechAvailable = Boolean(SpeechRecognition);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  const updateDraft = (patch) => setDraft((prev) => ({ ...prev, ...patch }));

  const processTranscript = () => {
    const transcript = (finalTranscriptRef.current || '').trim();
    if (!transcript) {
      updateDraft({
        isListening: false,
        mode: 'manual',
        note: 'No speech detected. Please try again or use manual entry.'
      });
      return;
    }

    // Extract data from transcript
    const extracted = parseVoiceUpdate(transcript, state.subjects);
    const confidenceCheck = transcript.toLowerCase();

    // Infer missing fields
    if (!extracted.subjectId) {
      const subjectMatch = state.subjects.find((s) =>
        confidenceCheck.includes(s.name.toLowerCase()) ||
        confidenceCheck.includes(s.name.toLowerCase().replace(/[^a-z]/g, ''))
      );
      if (subjectMatch) extracted.subjectId = subjectMatch.id;
    }

    if (!extracted.type) {
      extracted.type = confidenceCheck.includes('tuition') ? 'Tuition' : 'School';
    }

    if (!extracted.homework) {
      const hwKeywords = ['worksheet', 'practice', 'revision', 'assignment', 'homework', 'read'];
      const found = hwKeywords.find((kw) => confidenceCheck.includes(kw));
      if (found) {
        extracted.homework = found.charAt(0).toUpperCase() + found.slice(1);
      }
    }

    // If subject found, try to auto-fill chapter/topic
    if (extracted.subjectId && !extracted.chapterId) {
      const subject = state.subjects.find((s) => s.id === extracted.subjectId);
      if (subject?.chapters.length) {
        const chapterMatch = subject.chapters.find((ch) =>
          confidenceCheck.includes(ch.name.toLowerCase())
        );
        extracted.chapterId = chapterMatch?.id || subject.lastChapterId || subject.chapters[0].id;

        const targetChapter = subject.chapters.find((ch) => ch.id === extracted.chapterId);
        if (targetChapter) {
          const topicMatch = targetChapter.topics.find((t) =>
            confidenceCheck.includes(t.name.toLowerCase())
          );
          extracted.topicId = topicMatch?.id || targetChapter.topics[0].id;
        }
      }
    }

    // Check if the extracted topic already exists in the subject's chapter
    let topicExistsInSubjects = true;
    if (extracted.subjectId && extracted.chapterId && extracted.topicName) {
      const subj = state.subjects.find(s => s.id === extracted.subjectId);
      const chap = subj?.chapters.find(c => c.id === extracted.chapterId);
      topicExistsInSubjects = chap?.topics.some(t =>
        t.name.toLowerCase() === extracted.topicName.toLowerCase()
      ) ?? false;
    }

    updateDraft({
      isListening: false,
      mode: 'voice',
      showConfirmation: true,
      extractedData: extracted,
      subjectId: extracted.subjectId || draft.subjectId,
      chapterId: extracted.chapterId || draft.chapterId,
      topicId: extracted.topicId || draft.topicId,
      homework: extracted.homework || draft.homework,
      type: extracted.type || draft.type,
      topicExistsInSubjects,
      note: extracted.subjectId
        ? topicExistsInSubjects
          ? 'Review the extracted info below.'
          : `Topic "${extracted.topicName}" is new. You can add it to the chapter.`
        : 'Could not identify the subject. Please edit below.'
    });
  };

  // Voice capture using Web Speech API — stays alive with silence detection
  const startVoiceCapture = () => {
    if (!isSpeechAvailable) {
      updateDraft({
        mode: 'manual',
        isListening: false,
        note: 'Speech recognition is not available in this browser. Using manual entry instead.'
      });
      return;
    }

    // Clean up any previous instance
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ok */ }
      recognitionRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let lastResultTime = Date.now();
    finalTranscriptRef.current = '';

    recognition.onstart = () => {
      userStoppedRef.current = false;
      isListeningRef.current = true;
      lastResultTime = Date.now();
      updateDraft({
        isListening: true,
        mode: 'voice',
        note: '',
        transcript: '',
        showConfirmation: false,
        extractedData: null
      });
    };

    recognition.onresult = (event) => {
      lastResultTime = Date.now();
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscriptRef.current += result[0].transcript + ' ';
        } else {
          interimTranscript += result[0].transcript;
        }
      }
      interimRef.current = interimTranscript;
      updateDraft({ transcript: finalTranscriptRef.current, note: '' });
    };

    recognition.onspeechstart = () => {
      // Speech detected — user is speaking now
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        isListeningRef.current = false;
        if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
        updateDraft({
          isListening: false,
          mode: 'manual',
          note: 'Microphone access denied. Please allow microphone access or use manual entry.'
        });
      } else if (event.error === 'no-speech') {
        if (userStoppedRef.current || !isListeningRef.current) return;
        // Retry once on no-speech
        if (!window.__speechRetryCount) window.__speechRetryCount = 0;
        if (window.__speechRetryCount < 1) {
          window.__speechRetryCount += 1;
          try {
            recognition.start();
          } catch { /* ok */ }
        } else {
          window.__speechRetryCount = 0;
          isListeningRef.current = false;
          if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
          updateDraft({
            isListening: false,
            mode: 'manual',
            note: 'No speech detected after 10 seconds. Please try again or use manual entry.'
          });
        }
      } else {
        isListeningRef.current = false;
        if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
        updateDraft({
          isListening: false,
          mode: 'manual',
          note: `Voice error: ${event.error}. Switching to manual entry.`
        });
      }
    };

    recognition.onend = () => {
      if (userStoppedRef.current) {
        // User intentionally stopped — process transcript
        isListeningRef.current = false;
        userStoppedRef.current = false;
        if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
        processTranscript();
        return;
      }

      // Not user-stopped: check if silence timeout has elapsed
      if (isListeningRef.current) {
        const silenceElapsed = Date.now() - lastResultTime;
        if (silenceElapsed >= 10000) {
          // Silence > 10s — auto-stop and process
          isListeningRef.current = false;
          if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
          processTranscript();
        } else {
          // Create a fresh recognition instance to avoid restart-loop issues
          const newRecognition = new SpeechRecognition();
          newRecognition.continuous = true;
          newRecognition.interimResults = true;
          newRecognition.lang = 'en-US';
          // Copy event handlers
          newRecognition.onstart = recognition.onstart;
          newRecognition.onspeechstart = recognition.onspeechstart;
          newRecognition.onresult = recognition.onresult;
          newRecognition.onerror = recognition.onerror;
          newRecognition.onend = recognition.onend;
          recognitionRef.current = newRecognition;
          try {
            newRecognition.start();
          } catch {
            isListeningRef.current = false;
            if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
          }
        }
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      updateDraft({
        isListening: false,
        mode: 'manual',
        note: 'Could not start speech recognition. Using manual entry.'
      });
    }
  };

  // Stop listening and extract data from transcript
  const stopVoiceCapture = () => {
    userStoppedRef.current = true;
    isListeningRef.current = false;
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
    recognitionRef.current?.stop();
  };

  // When subject changes, auto-select first chapter and topic
  const handleSubjectChange = (subjectId) => {
    const subject = state.subjects.find((s) => s.id === subjectId);
    const firstChapter = subject?.chapters[0];
    const firstTopic = firstChapter?.topics[0];
    updateDraft({
      subjectId,
      chapterId: firstChapter?.id || '',
      topicId: firstTopic?.id || ''
    });
  };

  const saveQuickUpdate = () => {
    if (!draft.subjectId || !draft.chapterId || !draft.topicId || !draft.homework.trim() || !draft.type) {
      updateDraft({ note: 'Choose the subject, chapter, topic, homework, and type before saving.' });
      return;
    }

    const nextSubjects = state.subjects.map((subject) => {
      if (subject.id !== draft.subjectId) return subject;

      const updatedChapters = subject.chapters.map((chapter) => {
        if (chapter.id !== draft.chapterId) return chapter;
        return {
          ...chapter,
          topics: chapter.topics.map((topic) => {
            if (topic.id !== draft.topicId) return topic;
            return {
              ...topic,
              schoolNotes: draft.type === 'School' ? 'Done' : topic.schoolNotes,
              tuitionNotes: draft.type === 'Tuition' ? 'Done' : topic.tuitionNotes,
              mcq: topic.mcq,
              jee: topic.jee,
              pyqs: topic.pyqs,
              practiceQuestions: topic.practiceQuestions
            };
          })
        };
      });

      return {
        ...subject,
        schoolProgress: draft.type === 'School' ? 'Done' : subject.schoolProgress,
        homework: 'Pending',
        revision: 'Pending',
        tuitionProgress: draft.type === 'Tuition' && (subject.id === 'physics' || subject.id === 'mathematics') ? 'Done' : subject.tuitionProgress,
        lastChapterId: draft.chapterId,
        lastTopicId: draft.topicId,
        chapters: updatedChapters
      };
    });

    // Auto-fill planner profile with homework and school progress
    const plannerProfile = {
      ...state.plannerProfile,
      schoolProgress: draft.type === 'School'
        ? `${selectedSubject?.name || ''} - ${selectedTopic?.name || ''}`
        : state.plannerProfile.schoolProgress,
      homework: draft.homework.trim(),
      revisionDue: draft.homework.trim()
    };

    // Remember last selections for next time
    const nextState = {
      ...state,
      subjects: nextSubjects,
      plannerProfile,
      lastQuickSubjectId: draft.subjectId,
      lastQuickType: draft.type,
      generatedPlan: createGeneratedPlan({ ...state, subjects: nextSubjects, plannerProfile }, new Date())
    };
    setState(nextState);
    writeState(nextState);

    // Reset form but keep last subject/type remembered for speed
    updateDraft({
      transcript: '',
      subjectId: draft.subjectId,
      chapterId: '',
      topicId: '',
      homework: '',
      type: draft.type,
      note: 'Saved! Homework is now in your plan.',
      isListening: false,
      mode: 'manual',
      showConfirmation: false,
      extractedData: null
    });
  };

  return (
    <section className="card quick-update-card">
      <div className="card-top">
        <div>
          <h3>Quick Update</h3>
          <p className="muted compact-copy">Speak naturally or use the manual form below.</p>
        </div>
      </div>

      {/* Voice recording UI */}
      <div className="inline-actions compact-actions" style={{ marginBottom: 12 }}>
        <button
          className={`primary-btn ${draft.isListening ? 'listening' : ''}`}
          onClick={draft.isListening ? stopVoiceCapture : startVoiceCapture}
          style={draft.isListening ? { background: 'linear-gradient(135deg, #ef4444, #dc2626)' } : {}}
        >
          {draft.isListening ? '■ Stop Listening' : '🎤 Start Voice'}
        </button>
        <button className="ghost-btn" onClick={() => updateDraft({ mode: 'manual', showConfirmation: false, extractedData: null })}>
          Manual Entry
        </button>
      </div>

      {/* Voice mode */}
      {draft.mode === 'voice' && (
        <div className="stack">
          {draft.isListening ? (
            <div className="voice-active">
              <p className="muted" style={{ marginBottom: 8 }}>
                <span className="chip" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5' }}>● Listening</span>
Speak naturally. It will auto-stop after 10 seconds of silence, or tap <strong>"■ Stop Listening"</strong>.
              </p>
              <p className="muted" style={{ fontSize: '0.85rem' }}>
                Example: "Physics completed Current Electricity till Kirchhoff's Law. Maths tuition completed Maxima and Minima."
              </p>
              {draft.transcript ? (
                <div className="voice-transcript">
                  <p style={{ background: 'rgba(59, 130, 246, 0.1)', padding: 10, borderRadius: 10, marginTop: 8 }}>
                    {draft.transcript}
                    {interimRef.current ? <span style={{ opacity: 0.5 }}> {interimRef.current}</span> : null}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Confirmation screen */}
          {draft.showConfirmation && draft.extractedData ? (
            <div className="voice-confirmation stack">
              <h4 style={{ margin: '8px 0' }}>Confirm extracted information</h4>
              <p className="muted">Transcript: "{draft.transcript}"</p>

              <div className="input-row">
                <label className="inline-stack compact">
                  <span>Subject</span>
                  <select value={draft.subjectId} onChange={(e) => {
                    const subjectId = e.target.value;
                    const subject = state.subjects.find((s) => s.id === subjectId);
                    updateDraft({
                      subjectId,
                      chapterId: subject?.chapters[0]?.id || '',
                      topicId: subject?.chapters[0]?.topics[0]?.id || ''
                    });
                  }}>
                    <option value="">Select subject</option>
                    {state.subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>{subject.name}</option>
                    ))}
                  </select>
                </label>
                <label className="inline-stack compact">
                  <span>Type</span>
                  <select value={draft.type} onChange={(e) => updateDraft({ type: e.target.value })}>
                    <option value="">Type</option>
                    <option value="School">School</option>
                    <option value="Tuition">Tuition</option>
                  </select>
                </label>
              </div>

              {selectedSubject && (
                <div className="input-row">
                  <label className="inline-stack compact">
                    <span>Chapter</span>
                    <select value={draft.chapterId} onChange={(e) => updateDraft({ chapterId: e.target.value, topicId: '' })}>
                      <option value="">Chapter</option>
                      {selectedSubject.chapters.map((chapter) => (
                        <option key={chapter.id} value={chapter.id}>{chapter.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="inline-stack compact">
                    <span>Topic</span>
                    <select value={draft.topicId} onChange={(e) => updateDraft({ topicId: e.target.value })} disabled={!selectedChapter}>
                      <option value="">Topic</option>
                      {selectedChapter?.topics.map((topic) => (
                        <option key={topic.id} value={topic.id}>{topic.name}</option>
                      ))}
                    </select>
                  </label>
                </div>
              )}

              <div className="input-row">
                <label className="inline-stack compact">
                  <span>Homework</span>
                  <select value={draft.homework} onChange={(e) => updateDraft({ homework: e.target.value })}>
                    <option value="">Homework</option>
                    <option value="Worksheet">Worksheet</option>
                    <option value="Practice set">Practice set</option>
                    <option value="Revision">Revision</option>
                    <option value="Assignment">Assignment</option>
                    <option value="Read chapter">Read chapter</option>
                  </select>
                </label>
              </div>

              {/* Show add-topic button if the spoken topic is not in the subject's chapter */}
              {!draft.topicExistsInSubjects && draft.extractedData?.topicName && (
                <div className="inline-actions compact-actions" style={{ marginTop: 4 }}>
                  <button className="primary-btn" onClick={() => {
                    // Add the new topic to the selected chapter
                    const topicName = draft.extractedData.topicName;
                    const subj = state.subjects.find(s => s.id === draft.subjectId);
                    const chap = subj?.chapters.find(c => c.id === draft.chapterId);
                    if (subj && chap) {
                      const newTopicId = `topic-${Date.now() + 100}`;
                      const newTopic = {
                        id: newTopicId,
                        name: topicName,
                        schoolNotes: 'Not started',
                        homework: 'Not started',
                        revision: 'Not started',
                        mcq: 'Not started',
                        tuitionNotes: 'Not started',
                        jee: 'Not started',
                        pyqs: 'Not started',
                        practiceQuestions: 'Not started'
                      };
                      const nextSubjects = state.subjects.map(s => {
                        if (s.id !== subj.id) return s;
                        return {
                          ...s,
                          chapters: s.chapters.map(c => {
                            if (c.id !== chap.id) return c;
                            return { ...c, topics: [...c.topics, newTopic] };
                          })
                        };
                      });
                      updateStateAndPersist(state, { subjects: nextSubjects }, setState);
                      // Update draft topicId to the new one
                      updateDraft({
                        topicId: newTopicId,
                        topicExistsInSubjects: true,
                        note: `Topic "${topicName}" added! Now you can save.`
                      });
                    }
                  }} style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
                    + Add "{draft.extractedData.topicName}" topic
                  </button>
                </div>
              )}

              <div className="inline-actions compact-actions">
                <button className="primary-btn" onClick={saveQuickUpdate}>Confirm & Save</button>
                <button className="ghost-btn" onClick={() => updateDraft({
                  mode: 'voice',
                  showConfirmation: false,
                  extractedData: null,
                  transcript: '',
                  isListening: false
                })}>Cancel</button>
              </div>
            </div>
          ) : null}

          {!draft.isListening && !draft.showConfirmation && draft.mode === 'voice' ? (
            <p className="muted">Tap <strong>"🎤 Start Voice"</strong> and speak naturally. The app will extract subject, chapter, topic, homework, and type for confirmation.</p>
          ) : null}
        </div>
      )}

      {/* Manual mode */}
      {(draft.mode === 'manual' || (!draft.isListening && !draft.showConfirmation && draft.mode !== 'voice')) && (
        <div className="stack">
          <div className="input-row">
            <label className="inline-stack compact">
              <span>Subject</span>
              <select value={draft.subjectId} onChange={(e) => handleSubjectChange(e.target.value)}>
                <option value="">Subject</option>
                {state.subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
            </label>
            <label className="inline-stack compact">
              <span>Type</span>
              <select value={draft.type} onChange={(e) => updateDraft({ type: e.target.value })}>
                <option value="">Type</option>
                <option value="School">School</option>
                <option value="Tuition">Tuition</option>
              </select>
            </label>
          </div>

          {selectedSubject && (
            <div className="input-row">
              <label className="inline-stack compact">
                <span>Chapter</span>
                <select value={draft.chapterId} onChange={(e) => updateDraft({ chapterId: e.target.value, topicId: '' })}>
                  <option value="">Latest</option>
                  {selectedSubject.chapters.map((chapter) => (
                    <option key={chapter.id} value={chapter.id}>{chapter.name}</option>
                  ))}
                </select>
              </label>
              <label className="inline-stack compact">
                <span>Topic</span>
                <select value={draft.topicId} onChange={(e) => updateDraft({ topicId: e.target.value })} disabled={!selectedChapter}>
                  <option value="">Latest</option>
                  {selectedChapter?.topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>{topic.name}</option>
                  ))}
                </select>
              </label>
            </div>
          )}

          <div className="input-row">
            <label className="inline-stack compact">
              <span>Homework</span>
              <select value={draft.homework} onChange={(e) => updateDraft({ homework: e.target.value })}>
                <option value="">Homework</option>
                <option value="Worksheet">Worksheet</option>
                <option value="Practice set">Practice set</option>
                <option value="Revision">Revision</option>
                <option value="Assignment">Assignment</option>
                <option value="Read chapter">Read chapter</option>
              </select>
            </label>
          </div>

          <div className="inline-actions compact-actions">
            <button className="primary-btn" onClick={saveQuickUpdate}>Save update</button>
            <button className="ghost-btn" onClick={() => updateDraft({
              subjectId: state.lastQuickSubjectId || '',
              chapterId: '',
              topicId: '',
              homework: '',
              type: state.lastQuickType || '',
              note: '',
              showConfirmation: false,
              extractedData: null
            })}>Clear</button>
          </div>
        </div>
      )}

      {draft.note ? <p className="muted">{draft.note}</p> : null}
    </section>
  );
}

function HomePage({ state, setState, focusProps, handleStartEvening }) {
  const navigate = useNavigate();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const todayTasks = useMemo(() => state.tasks.filter((task) => !task.complete).slice(0, 3), [state.tasks]);
  const remaining = useMemo(() => state.tasks.filter((task) => !task.complete).length, [state.tasks]);
  const examDate = state.examDate ? new Date(state.examDate) : null;
  const countdown = examDate && !Number.isNaN(examDate.getTime()) ? Math.ceil((examDate - new Date()) / (1000 * 60 * 60 * 24)) : null;

  const addTask = () => {
    const trimmed = newTaskTitle.trim();
    if (!trimmed) return;
    const nextTasks = [...state.tasks, { id: Date.now(), title: trimmed, subject: 'Custom', complete: false }];
    updateStateAndPersist(state, { tasks: nextTasks }, setState);
    setNewTaskTitle('');
  };

  const removeTask = (taskId) => {
    const nextTasks = state.tasks.filter((task) => task.id !== taskId);
    updateStateAndPersist(state, { tasks: nextTasks }, setState);
  };

  return (
    <div className="page-stack">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Study Companion 2.0</p>
          <h1>Start studying in under 30 seconds</h1>
          <p className="muted">A calm, personal study companion that helps you begin quickly and stay focused.</p>
        </div>
        <button className="primary-btn" onClick={() => handleStartEvening()}>
          Start My Evening
        </button>
      </section>

      <QuickUpdateCard state={state} setState={setState} />

        <section className="card-grid">
        <div className="card">
          <div className="card-top">
            <h3>Open Tasks</h3>
            <span className="chip">{remaining} left</span>
          </div>
          <p className="muted">Finish your remaining tasks from the study plan.</p>
          <button className="secondary-btn" onClick={() => navigate('/planner')}>
            Open planner
          </button>
        </div>

        <div className="card">
          <div className="card-top">
            <h3>Today's Tasks</h3>
            <span className="chip">Quick add</span>
          </div>
          <div className="stack">
            <div className="inline-actions">
              <input value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="Add a task" />
              <button className="primary-btn" onClick={addTask}>Add task</button>
            </div>
            {todayTasks.length ? (
              <ul className="list">
                {todayTasks.map((task) => (
                  <li key={task.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={task.complete}
                        onChange={() => {
                          const updated = state.tasks.map((item) => (item.id === task.id ? { ...item, complete: !item.complete } : item));
                          updateStateAndPersist(state, { tasks: updated }, setState);
                        }}
                      />
                      <span>{task.title}</span>
                    </label>
                    <button className="ghost-btn" onClick={() => removeTask(task.id)}>Remove</button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">No tasks yet. Add your first one above.</p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-top">
            <h3>Focus Timer</h3>
            <span className="chip">{focusProps.focusState.isRunning ? 'Running' : focusProps.focusState.mode === 'break' ? 'Break' : 'Ready'}</span>
          </div>
          <div className="timer-display">{formatTimerDisplay(focusProps.focusState.remainingSeconds)}</div>
          {focusProps.currentTask ? (
            <p className="muted" style={{ fontSize: '0.85rem' }}>Current: {focusProps.currentTask.title}</p>
          ) : null}
          <div className="inline-actions">
            {!focusProps.focusState.isRunning ? (
              <button className="primary-btn" onClick={() => focusProps.startFocus()}>Start</button>
            ) : (
              <button className="secondary-btn" onClick={() => focusProps.pauseFocus()}>Pause</button>
            )}
            {focusProps.focusState.mode === 'break' ? (
              <button className="ghost-btn" onClick={() => focusProps.skipBreak()}>Skip Break</button>
            ) : null}
            {focusProps.focusIndex < focusProps.planTasks.length - 1 ? (
              <button className="ghost-btn" onClick={() => focusProps.nextTask()}>Next Task</button>
            ) : null}
          </div>
        </div>

        <div className="card">
          <div className="card-top">
            <h3>Next Exam Countdown</h3>
            <span className="chip">{countdown >= 0 ? `${countdown} days` : 'Now'}</span>
          </div>
          <p className="muted">{countdown !== null ? `Your next exam is in ${countdown} days.` : 'Set an exam date in settings to start tracking it.'}</p>
          <button className="secondary-btn" onClick={() => navigate('/settings')}>Adjust date</button>
        </div>
      </section>
    </div>
  );
}

function PlannerPage({ state, setState }) {
  const navigate = useNavigate();
  const plannerProfile = state.plannerProfile || defaultState.plannerProfile;
  const [methodology, setMethodology] = useState(state.plannerMethodology || 'balanced');
  const updateProfile = (patch) => {
    updateStateAndPersist(state, {
      plannerProfile: { ...plannerProfile, ...patch }
    }, setState);
  };

  const generatePlan = (method) => {
    const activeMethod = method || methodology;
    const nextPlan = createGeneratedPlan({ ...state, plannerProfile }, new Date(), activeMethod);
    updateStateAndPersist(state, {
      generatedPlan: nextPlan,
      plannerMethodology: activeMethod
    }, setState);
  };

  const methodologyOptions = [
    { value: 'balanced', label: 'Balanced', desc: 'Standard study blocks with regular breaks' },
    { value: 'quick_wins', label: 'Quick wins', desc: 'Short blocks, many small tasks' },
    { value: 'deep_focus', label: 'Deep focus', desc: 'Longer blocks, fewer tasks, longer breaks' },
    { value: 'cram_mode', label: 'Cram mode', desc: 'Max focus, minimal breaks' }
  ];

  const currentMethodMeta = methodologyOptions.find(m => m.value === methodology) || methodologyOptions[0];

  return (
    <div className="page-stack">
      <section className="card">
        <div className="card-top">
          <h3>Evening setup</h3>
          <span className="chip">Profile</span>
        </div>
        <div className="stack">
          <label className="inline-stack">
            <span>What happened today?</span>
            <textarea value={plannerProfile.schoolProgress} onChange={(e) => updateProfile({ schoolProgress: e.target.value })} placeholder="Physics completed Current Electricity. Maths tuition completed Maxima and Minima." />
          </label>
          <label className="inline-stack">
            <span>Homework due</span>
            <textarea value={plannerProfile.homework} onChange={(e) => updateProfile({ homework: e.target.value })} placeholder="Maths worksheet, Physics assignment..." />
          </label>
          <label className="inline-stack">
            <span>Backlog / pending work</span>
            <textarea value={plannerProfile.backlog} onChange={(e) => updateProfile({ backlog: e.target.value })} placeholder="Old homework, incomplete notes..." />
          </label>
          <label className="inline-stack">
            <span>Revision due</span>
            <textarea value={plannerProfile.revisionDue} onChange={(e) => updateProfile({ revisionDue: e.target.value })} placeholder="Topics to review from last week..." />
          </label>
          <div className="input-row">
            <label className="inline-stack compact" style={{ flex: 1 }}>
              <span>Available study time</span>
              <select value={plannerProfile.availableStudyTime} onChange={(e) => updateProfile({ availableStudyTime: Number(e.target.value) })}>
                <option value={30}>30 min</option>
                <option value={60}>1 hour</option>
                <option value={120}>2 hours</option>
                <option value={180}>3+ hours</option>
              </select>
            </label>
            <label className="inline-stack compact" style={{ flex: 1 }}>
              <span>Energy level</span>
              <select value={plannerProfile.energyLevel} onChange={(e) => updateProfile({ energyLevel: e.target.value })}>
                <option value="tired">Tired</option>
                <option value="normal">Normal</option>
                <option value="highly_motivated">Highly Motivated</option>
              </select>
            </label>
          </div>
          <div className="input-row">
            <label className="inline-stack compact" style={{ flex: 1 }}>
              <span>Study methodology</span>
              <select value={methodology} onChange={(e) => setMethodology(e.target.value)}>
                {methodologyOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </label>
            <div className="inline-stack compact" style={{ flex: 1, justifyContent: 'center' }}>
              <span className="muted" style={{ fontSize: '0.8rem' }}>{currentMethodMeta.desc}</span>
            </div>
          </div>
          <div className="inline-actions">
            <button className="primary-btn" onClick={() => generatePlan()}>Generate plan</button>
            <button className="secondary-btn" onClick={() => {
              updateProfile({ schoolProgress: '', homework: '', backlog: '', revisionDue: '', upcomingExams: '', availableStudyTime: 60, energyLevel: 'normal' });
              setMethodology('balanced');
            }}>Reset</button>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-top">
          <h3>Generated plan</h3>
          {state.generatedPlan?.summary ? <span className="chip">{state.generatedPlan.summary}</span> : null}
        </div>
        {state.generatedPlan?.tasks?.length ? (
          <>
            <p className="muted">Your plan is ready. Start the focus timer when you are set.</p>
            <div className="inline-actions compact-actions">
              <button className="primary-btn" onClick={() => navigate('/revision')}>Start focus</button>
              <button className="secondary-btn" onClick={() => generatePlan(methodology)}>
                ↻ Regenerate with {currentMethodMeta.label}
              </button>
              {methodologyOptions.filter(m => m.value !== methodology).map((opt) => (
                <button
                  key={opt.value}
                  className="ghost-btn"
                  onClick={() => {
                    setMethodology(opt.value);
                    generatePlan(opt.value);
                  }}
                  title={opt.desc}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        ) : null}
        {state.generatedPlan?.tasks?.length ? (
          <ul className="plan-list">
            {state.generatedPlan.tasks.map((task) => (
              <li key={task.id}>
                <div>
                  <strong>{task.title}</strong>
                  <p>{task.type}</p>
                </div>
                <span>{task.time}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">Start with a quick update, then generate your plan.</p>
        )}
      </section>
    </div>
  );
}

function SubjectsPage({ state, setState }) {
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectFocus, setNewSubjectFocus] = useState('');
  const [newChapterName, setNewChapterName] = useState('');
  const [newTopicName, setNewTopicName] = useState('');

  const updateSubject = (subjectId, patch) => {
    const nextSubjects = state.subjects.map((subject) => (subject.id === subjectId ? { ...subject, ...patch } : subject));
    updateStateAndPersist(state, { subjects: nextSubjects }, setState);
  };

  const updateTopicStatus = (subjectId, chapterId, topicId, field, value) => {
    const nextSubjects = state.subjects.map((subject) => {
      if (subject.id !== subjectId) return subject;
      return {
        ...subject,
        chapters: subject.chapters.map((chapter) => {
          if (chapter.id !== chapterId) return chapter;
          return {
            ...chapter,
            topics: chapter.topics.map((topic) => (topic.id === topicId ? { ...topic, [field]: value } : topic))
          };
        })
      };
    });
    updateStateAndPersist(state, { subjects: nextSubjects }, setState);
  };

  const handleChapterChange = (subject, chapterId) => {
    const chapter = subject.chapters.find((item) => item.id === chapterId) || subject.chapters[0];
    updateSubject(subject.id, { lastChapterId: chapter.id, lastTopicId: chapter.topics[0].id });
  };

  const handleTopicChange = (subject, topicId) => {
    updateSubject(subject.id, { lastTopicId: topicId });
  };

  const addSubject = () => {
    const trimmedName = newSubjectName.trim();
    if (!trimmedName) return;
    const nextSubject = createEmptySubject(trimmedName, newSubjectFocus.trim());
    updateStateAndPersist(state, { subjects: [...state.subjects, nextSubject] }, setState);
    setNewSubjectName('');
    setNewSubjectFocus('');
  };

  const removeSubject = (subjectId) => {
    const nextSubjects = state.subjects.filter((subject) => subject.id !== subjectId);
    updateStateAndPersist(state, { subjects: nextSubjects }, setState);
  };

  const addChapter = (subjectId) => {
    const trimmed = newChapterName.trim();
    if (!trimmed) return;
    const nextSubjects = state.subjects.map((subject) => {
      if (subject.id !== subjectId) return subject;
      const chapterId = `chapter-${Date.now()}`;
      const topicId = `topic-${Date.now() + 1}`;
      return {
        ...subject,
        lastChapterId: chapterId,
        lastTopicId: topicId,
        chapters: [
          ...subject.chapters,
          {
            id: chapterId,
            name: trimmed,
            topics: [{ id: topicId, name: 'Topic 1', schoolNotes: 'Not started', mcq: 'Not started', tuitionNotes: 'Not started', jee: 'Not started', pyqs: 'Not started', practiceQuestions: 'Not started' }]
          }
        ]
      };
    });
    updateStateAndPersist(state, { subjects: nextSubjects }, setState);
    setNewChapterName('');
  };

  const removeChapter = (subjectId, chapterId) => {
    const nextSubjects = state.subjects.map((subject) => {
      if (subject.id !== subjectId) return subject;
      const nextChapters = subject.chapters.filter((chapter) => chapter.id !== chapterId);
      if (!nextChapters.length) return subject;
      const nextLastChapter = nextChapters[0].id;
      const nextLastTopic = nextChapters[0].topics[0]?.id || subject.lastTopicId;
      return {
        ...subject,
        chapters: nextChapters,
        lastChapterId: subject.lastChapterId === chapterId ? nextLastChapter : subject.lastChapterId,
        lastTopicId: subject.lastChapterId === chapterId ? nextLastTopic : subject.lastTopicId
      };
    });
    updateStateAndPersist(state, { subjects: nextSubjects }, setState);
  };

  const addTopic = (subjectId, chapterId) => {
    const trimmed = newTopicName.trim();
    if (!trimmed) return;
    const nextSubjects = state.subjects.map((subject) => {
      if (subject.id !== subjectId) return subject;
      return {
        ...subject,
        chapters: subject.chapters.map((chapter) => {
          if (chapter.id !== chapterId) return chapter;
          const topicId = `topic-${Date.now() + 2}`;
          return {
            ...chapter,
            topics: [
              ...chapter.topics,
              { id: topicId, name: trimmed, schoolNotes: 'Not started', mcq: 'Not started', tuitionNotes: 'Not started', jee: 'Not started', pyqs: 'Not started', practiceQuestions: 'Not started' }
            ]
          };
        })
      };
    });
    updateStateAndPersist(state, { subjects: nextSubjects }, setState);
    setNewTopicName('');
  };

  const removeTopic = (subjectId, chapterId, topicId) => {
    const nextSubjects = state.subjects.map((subject) => {
      if (subject.id !== subjectId) return subject;
      return {
        ...subject,
        chapters: subject.chapters.map((chapter) => {
          if (chapter.id !== chapterId) return chapter;
          const nextTopics = chapter.topics.filter((topic) => topic.id !== topicId);
          return { ...chapter, topics: nextTopics };
        })
      };
    });
    updateStateAndPersist(state, { subjects: nextSubjects }, setState);
  };

  return (
    <div className="page-stack">
      <section className="card">
        <h3>Subject tracker</h3>
        <p className="muted">Create subjects as you go and remove any that are no longer needed.</p>
        <div className="stack">
          <div className="inline-actions">
            <input value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} placeholder="Subject name" />
            <input value={newSubjectFocus} onChange={(e) => setNewSubjectFocus(e.target.value)} placeholder="Focus or goal" />
            <button className="primary-btn" onClick={addSubject}>Add subject</button>
          </div>
          {state.subjects.length ? null : <p className="muted">No subjects yet. Add your first one above.</p>}
        </div>
      </section>

      <section className="card-grid">
        {state.subjects.map((subject) => {
          const chapter = subject.chapters.find((item) => item.id === subject.lastChapterId) || subject.chapters[0];
          const topic = chapter.topics.find((item) => item.id === subject.lastTopicId) || chapter.topics[0];

          return (
            <article className="subject-card" key={subject.id}>
              <div className="subject-color" style={{ background: subject.color }} />
              <div className="card-top">
                <h4>{subject.name}</h4>
                <button className="ghost-btn" onClick={() => removeSubject(subject.id)}>Remove</button>
              </div>
              <p className="muted">{subject.focus}</p>

              <div className="stack subject-stack">
                <div className="inline-actions compact-actions">
                  <label className="inline-stack compact" style={{ flex: 1 }}>
                    <span>Chapter</span>
                    <select value={chapter.id} onChange={(e) => handleChapterChange(subject, e.target.value)}>
                      {subject.chapters.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button className="ghost-btn" onClick={() => removeChapter(subject.id, chapter.id)}>Remove chapter</button>
                </div>
                <div className="inline-actions compact-actions">
                  <input value={newChapterName} onChange={(e) => setNewChapterName(e.target.value)} placeholder="New chapter" />
                  <button className="primary-btn" onClick={() => addChapter(subject.id)}>Add chapter</button>
                </div>
                <div className="inline-actions compact-actions">
                  <label className="inline-stack compact" style={{ flex: 1 }}>
                    <span>Topic</span>
                    <select value={topic.id} onChange={(e) => handleTopicChange(subject, e.target.value)}>
                      {chapter.topics.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button className="ghost-btn" onClick={() => removeTopic(subject.id, chapter.id, topic.id)}>Remove topic</button>
                </div>
                <div className="inline-actions compact-actions">
                  <input value={newTopicName} onChange={(e) => setNewTopicName(e.target.value)} placeholder="New topic" />
                  <button className="primary-btn" onClick={() => addTopic(subject.id, chapter.id)}>Add topic</button>
                </div>

                <div className="mini-grid">
                  <label className="inline-stack compact">
                    <span>School Notes</span>
                    <select value={topic.schoolNotes || 'Not started'} onChange={(e) => updateTopicStatus(subject.id, chapter.id, topic.id, 'schoolNotes', e.target.value)}>
                      {selectOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="inline-stack compact">
                    <span>MCQ</span>
                    <select value={topic.mcq || 'Not started'} onChange={(e) => updateTopicStatus(subject.id, chapter.id, topic.id, 'mcq', e.target.value)}>
                      {selectOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="inline-stack compact">
                    <span>Tuition Notes</span>
                    <select value={topic.tuitionNotes || 'Not started'} onChange={(e) => updateTopicStatus(subject.id, chapter.id, topic.id, 'tuitionNotes', e.target.value)}>
                      {selectOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="inline-stack compact">
                    <span>JEE</span>
                    <select value={topic.jee || 'Not started'} onChange={(e) => updateTopicStatus(subject.id, chapter.id, topic.id, 'jee', e.target.value)}>
                      {selectOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="inline-stack compact">
                    <span>PYQs</span>
                    <select value={topic.pyqs || 'Not started'} onChange={(e) => updateTopicStatus(subject.id, chapter.id, topic.id, 'pyqs', e.target.value)}>
                      {selectOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="inline-stack compact">
                    <span>Practice Questions</span>
                    <select value={topic.practiceQuestions || 'Not started'} onChange={(e) => updateTopicStatus(subject.id, chapter.id, topic.id, 'practiceQuestions', e.target.value)}>
                      {selectOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}

function RevisionPage({ state, setState, focusProps }) {
  const revisionItems = useMemo(() => getRevisionItems(state.subjects || []), [state.subjects]);
  const dueItems = useMemo(() => revisionItems.filter((item) => item.isDue && !item.isWeak), [revisionItems]);
  const weakItems = useMemo(() => revisionItems.filter((item) => item.isWeak), [revisionItems]);

  const handleConfidence = (subjectId, chapterId, topicId, confidence) => {
    const nextSubjects = state.subjects.map((subject) => {
      if (subject.id !== subjectId) return subject;
      return {
        ...subject,
        chapters: subject.chapters.map((chapter) => {
          if (chapter.id !== chapterId) return chapter;
          return {
            ...chapter,
            topics: chapter.topics.map((topic) => {
              if (topic.id !== topicId) return topic;
              const today = new Date();
              const nextReviewDate = new Date(today);
              const nextDays = confidence === 'Easy' ? 3 : confidence === 'Okay' ? 1 : 1;
              nextReviewDate.setDate(today.getDate() + nextDays);
              const forgotCount = confidence === 'Forgot' ? (topic.forgotCount || 0) + 1 : 0;
              const weak = confidence === 'Forgot' ? forgotCount >= 2 : false;

              return {
                ...topic,
                revision: 'Done',
                nextReviewAt: nextReviewDate.toISOString(),
                reviewCount: (topic.reviewCount || 0) + 1,
                forgotCount,
                weak
              };
            })
          };
        })
      };
    });

    updateStateAndPersist(state, {
      subjects: nextSubjects,
      generatedPlan: createGeneratedPlan({ ...state, subjects: nextSubjects }, new Date())
    }, setState);
  };

  return (
    <div className="page-stack">
      <section className="card">
        <div className="card-top">
          <h3>Revision</h3>
          <span className="chip">Spaced repetition</span>
        </div>
        <p className="muted">Review due topics, mark your confidence, and let the app schedule the next revision automatically.</p>
      </section>

      <section className="card">
        <div className="card-top">
          <h3>Focus Mode</h3>
          <span className="chip">{focusProps.currentTask ? focusProps.currentTask.title : 'No plan yet'}</span>
        </div>
        <div className="focus-box">
          <div className="focus-timer">{formatTimerDisplay(focusProps.focusState.remainingSeconds)}</div>
          <p className="muted">{focusProps.focusState.mode === 'study' ? 'Study block' : 'Break block'}</p>
          <div className="inline-actions">
            {!focusProps.focusState.isRunning ? (
              <button className="primary-btn" onClick={() => focusProps.startFocus()}>Start</button>
            ) : (
              <button className="secondary-btn" onClick={() => focusProps.pauseFocus()}>Pause</button>
            )}
            {focusProps.focusState.mode === 'break' ? (
              <button className="ghost-btn" onClick={() => focusProps.skipBreak()}>Skip Break</button>
            ) : null}
            {focusProps.focusIndex < focusProps.planTasks.length - 1 ? (
              <button className="ghost-btn" onClick={() => focusProps.nextTask()}>Next Task</button>
            ) : null}
            {focusProps.focusState.isRunning ? null : (
              <button className="ghost-btn" onClick={() => focusProps.restartFocus()}>Restart</button>
            )}
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-top">
          <h3>Weak topics</h3>
          <span className="chip">{weakItems.length} needs attention</span>
        </div>
        {weakItems.length ? (
          <div className="revision-list">
            {weakItems.map((item) => (
              <article className="revision-card" key={`weak-${item.subjectId}-${item.chapterId}-${item.topicId}`}>
                <div>
                  <strong>{item.topicName}</strong>
                  <p>{item.subjectName} · {item.chapterName}</p>
                </div>
                <div className="inline-actions compact-actions">
                  <button className="secondary-btn" onClick={() => handleConfidence(item.subjectId, item.chapterId, item.topicId, 'Easy')}>Easy</button>
                  <button className="secondary-btn" onClick={() => handleConfidence(item.subjectId, item.chapterId, item.topicId, 'Okay')}>Okay</button>
                  <button className="ghost-btn" onClick={() => handleConfidence(item.subjectId, item.chapterId, item.topicId, 'Forgot')}>Forgot</button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted">No weak topics right now.</p>
        )}
      </section>
    </div>
  );
}

function Toast({ message, icon }) {
  if (!message) return null;
  return (
    <div className="toast">
      <span className="toast-icon">{icon || '✔'}</span>
      <span>{message}</span>
    </div>
  );
}

function SettingsPage({ state, setState }) {
  const [examDate, setExamDate] = useState(state.examDate);
  const [timerMinutes, setTimerMinutes] = useState(state.timerMinutes);
  const [todayNote, setTodayNote] = useState(state.todayNote);
  const [bagItemInput, setBagItemInput] = useState('');
  const [weeklyReviewText, setWeeklyReviewText] = useState(state.weeklyReview?.text || '');
  const [monthlyReflectionText, setMonthlyReflectionText] = useState(state.monthlyReflection?.text || '');
  const [notice, setNotice] = useState('');
  const fileInputRef = useRef(null);

  // Sync dark mode to CSS
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.darkMode ? 'dark' : 'light');
  }, [state.darkMode]);

  const saveSettings = () => {
    updateStateAndPersist(state, { examDate, timerMinutes: Number(timerMinutes) || 25, todayNote }, setState);
    setNotice('Core settings saved.');
  };

  const addBagItem = () => {
    const trimmed = bagItemInput.trim();
    if (!trimmed) return;
    updateStateAndPersist(state, {
      bagItems: [...(state.bagItems || []), { id: Date.now(), title: trimmed, packed: false }]
    }, setState);
    setBagItemInput('');
    setNotice('Bag reminder updated.');
  };

  const removeBagItem = (itemId) => {
    const nextBagItems = (state.bagItems || []).filter((item) => item.id !== itemId);
    updateStateAndPersist(state, { bagItems: nextBagItems }, setState);
    setNotice('Bag reminder updated.');
  };

  const saveReviews = () => {
    updateStateAndPersist(state, {
      weeklyReview: { text: weeklyReviewText.trim(), updatedAt: new Date().toISOString() },
      monthlyReflection: { text: monthlyReflectionText.trim(), updatedAt: new Date().toISOString() }
    }, setState);
    setNotice('Weekly review and monthly reflection saved.');
  };

  const toggleDarkMode = () => {
    updateStateAndPersist(state, { darkMode: !state.darkMode }, setState);
    setNotice(state.darkMode ? 'Light mode is now active.' : 'Dark mode is now active.');
  };

  const toggleNotifications = async () => {
    if (!('Notification' in window)) {
      setNotice('Notifications are not supported in this browser.');
      return;
    }

    if (Notification.permission === 'granted') {
      const nextState = { ...state, notificationsEnabled: !state.notificationsEnabled };
      setState(nextState);
      writeState(nextState);
      setNotice(state.notificationsEnabled ? 'Notifications turned off.' : 'Notifications turned on.');
      return;
    }

    const permission = await Notification.requestPermission();
    updateStateAndPersist(state, { notificationsEnabled: permission === 'granted' }, setState);
    setNotice(permission === 'granted' ? 'Notifications enabled.' : 'Notifications permission denied.');
  };

  const sendTestNotification = () => {
    if (!('Notification' in window)) {
      setNotice('Notifications are not supported in this browser.');
      return;
    }

    if (Notification.permission !== 'granted') {
      setNotice('Allow notifications first, then try again.');
      return;
    }

    new Notification('Study Companion', {
      body: 'This is a test reminder. Your study plan is ready to continue.'
    });
    setNotice('Test notification sent.');
  };

  const downloadBackup = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'study-companion-backup.json';
    link.click();
    URL.revokeObjectURL(url);
    setNotice('Backup downloaded.');
  };

  const restoreBackup = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    try {
      const parsed = JSON.parse(text);
      const nextState = {
        ...state,
        ...parsed,
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks : state.tasks,
        subjects: Array.isArray(parsed.subjects) && parsed.subjects.length ? parsed.subjects : state.subjects,
        bagItems: Array.isArray(parsed.bagItems) && parsed.bagItems.length ? parsed.bagItems : state.bagItems,
        weeklyReview: { text: parsed.weeklyReview?.text || '', updatedAt: parsed.weeklyReview?.updatedAt || null },
        monthlyReflection: { text: parsed.monthlyReflection?.text || '', updatedAt: parsed.monthlyReflection?.updatedAt || null },
        plannerProfile: { ...state.plannerProfile, ...(parsed.plannerProfile || {}) },
        generatedPlan: parsed.generatedPlan || state.generatedPlan
      };
      updateStateAndPersist(state, nextState, setState);
      setNotice('Backup restored successfully.');
    } catch {
      setNotice('That file could not be restored.');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className="page-stack">
      <section className="card">
        <h3>Settings</h3>
        <div className="stack">
          <label>
            <span>Next exam date</span>
            <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
          </label>
          <label>
            <span>Default timer length (minutes)</span>
            <input type="number" min="5" step="5" value={timerMinutes} onChange={(e) => setTimerMinutes(e.target.value)} />
          </label>
          <label>
            <span>Today's note</span>
            <textarea value={todayNote} onChange={(e) => setTodayNote(e.target.value)} />
          </label>
          <button className="primary-btn" onClick={saveSettings}>Save changes</button>
        </div>
      </section>

      <section className="card">
        <div className="card-top">
          <h3>School Bag Reminder</h3>
          <span className="chip">{(state.bagItems || []).filter((item) => item.packed).length}/{(state.bagItems || []).length} packed</span>
        </div>
        <div className="stack">
          <div className="inline-actions">
            <input value={bagItemInput} onChange={(e) => setBagItemInput(e.target.value)} placeholder="Add an item" />
            <button className="primary-btn" onClick={addBagItem}>Add item</button>
          </div>
          {(state.bagItems || []).map((item) => (
            <div className="inline-row" key={item.id}>
              <label>
                <input type="checkbox" checked={item.packed} onChange={() => {
                  const nextBagItems = (state.bagItems || []).map((entry) => (entry.id === item.id ? { ...entry, packed: !entry.packed } : entry));
                  updateStateAndPersist(state, { bagItems: nextBagItems }, setState);
                }} />
                <span>{item.title}</span>
              </label>
              <button className="ghost-btn" onClick={() => removeBagItem(item.id)}>Remove</button>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h3>Weekly Review</h3>
        <div className="stack">
          <textarea value={weeklyReviewText} onChange={(e) => setWeeklyReviewText(e.target.value)} placeholder="What went well this week? What should improve next week?" />
          <button className="primary-btn" onClick={saveReviews}>Save weekly review</button>
        </div>
      </section>

      <section className="card">
        <h3>Monthly Reflection</h3>
        <div className="stack">
          <textarea value={monthlyReflectionText} onChange={(e) => setMonthlyReflectionText(e.target.value)} placeholder="Reflect on habits, progress, and the month ahead." />
          <button className="primary-btn" onClick={saveReviews}>Save monthly reflection</button>
        </div>
      </section>

      <section className="card">
        <div className="card-top">
          <h3>Notifications</h3>
          <span className="chip">{state.notificationsEnabled ? 'Enabled' : 'Off'}</span>
        </div>
        <div className="inline-actions">
          <button className="primary-btn" onClick={toggleNotifications}>{state.notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}</button>
          <button className="secondary-btn" onClick={sendTestNotification}>Send test</button>
        </div>
      </section>

      <section className="card">
        <div className="card-top">
          <h3>Dark Mode</h3>
          <span className="chip">{state.darkMode ? 'On' : 'Off'}</span>
        </div>
        <button className="secondary-btn" onClick={toggleDarkMode}>{state.darkMode ? 'Switch to light mode' : 'Switch to dark mode'}</button>
      </section>

      <section className="card">
        <h3>Backup & Restore</h3>
        <div className="inline-actions">
          <button className="primary-btn" onClick={downloadBackup}>Download backup</button>
          <button className="secondary-btn" onClick={() => fileInputRef.current?.click()}>Restore backup</button>
        </div>
        <input ref={fileInputRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={restoreBackup} />
      </section>

      <Toast message={notice} />
    </div>
  );
}

function App() {
  const [state, setState] = useState(readState);
  const navigate = useNavigate();

  // Sync dark mode to CSS on initial load
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.darkMode ? 'dark' : 'light');
  }, [state.darkMode]);

  // Shared focus timer state
  const planTasks = useMemo(() => (state.generatedPlan?.tasks || []).filter((t) => t.kind !== 'break'), [state.generatedPlan]);
  const [focusIndex, setFocusIndex] = useState(0);
  const currentTask = planTasks[focusIndex] || null;
  const defaultStudySeconds = (currentTask?.duration || state.timerMinutes || 25) * 60;
  const defaultBreakSeconds = 5 * 60;

  const [focusState, setFocusState] = useState({
    mode: 'study',
    remainingSeconds: defaultStudySeconds,
    isRunning: false,
    studySeconds: defaultStudySeconds,
    breakSeconds: defaultBreakSeconds
  });
  const [timerNotice, setTimerNotice] = useState('');

  // Restore saved timer state on initial mount
  useEffect(() => {
    const saved = loadSavedTimerState();
    if (saved) {
      if (saved.expired) {
        setTimerNotice('Your study session ended while you were away. Tap Start to begin a new block.');
      }
      setFocusState((prev) => ({
        ...prev,
        mode: saved.mode,
        remainingSeconds: saved.remainingSeconds,
        isRunning: saved.isRunning,
        studySeconds: saved.studySeconds,
        breakSeconds: saved.breakSeconds
      }));
      if (saved.focusIndex !== undefined) {
        setFocusIndex(saved.focusIndex);
      }
    }
  }, []);

  // Reset timer when plan changes or task index changes
  useEffect(() => {
    setFocusState((prev) => ({
      ...prev,
      studySeconds: defaultStudySeconds,
      remainingSeconds: prev.isRunning ? prev.remainingSeconds : defaultStudySeconds,
      mode: prev.mode === 'break' ? prev.mode : 'study'
    }));
  }, [defaultStudySeconds, focusIndex]);

  // Timer tick + persist
  useEffect(() => {
    if (!focusState.isRunning) return undefined;
    const interval = setInterval(() => {
      setFocusState((prev) => {
        if (prev.remainingSeconds <= 1) {
          clearTimerState();
          if (prev.mode === 'study') {
            setTimerNotice('Study block finished! Time for a break.');
            return { ...prev, mode: 'break', remainingSeconds: prev.breakSeconds, isRunning: false };
          }
          setTimerNotice('Break finished! Next study block ready.');
          return { ...prev, mode: 'study', remainingSeconds: prev.studySeconds, isRunning: false };
        }
        return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [focusState.isRunning, focusState.mode, focusState.breakSeconds, focusState.studySeconds]);

  // Persist timer state whenever it changes
  useEffect(() => {
    if (focusState.isRunning) {
      saveTimerState(focusState);
    } else {
      const timeout = setTimeout(() => saveTimerState(focusState), 100);
      return () => clearTimeout(timeout);
    }
  }, [focusState]);

  const startFocus = () => { setFocusState((prev) => ({ ...prev, isRunning: true })); setTimerNotice(''); };
  const pauseFocus = () => {
    setFocusState((prev) => {
      const next = { ...prev, isRunning: false };
      saveTimerState(next);
      return next;
    });
    setTimerNotice('');
  };
  const resumeFocus = () => setFocusState((prev) => ({ ...prev, isRunning: true }));
  const skipBreak = () => { clearTimerState(); setFocusState((prev) => ({ ...prev, mode: 'study', remainingSeconds: prev.studySeconds, isRunning: false })); setTimerNotice(''); };
  const nextTask = () => {
    if (focusIndex < planTasks.length - 1) {
      clearTimerState();
      setFocusIndex(focusIndex + 1);
      setFocusState((prev) => ({ ...prev, mode: 'study', remainingSeconds: defaultStudySeconds, isRunning: false }));
      setTimerNotice('');
    }
  };
  const restartFocus = () => { clearTimerState(); setFocusState((prev) => ({ ...prev, mode: 'study', remainingSeconds: prev.studySeconds, isRunning: true })); setTimerNotice(''); };

  const handleStartEvening = () => {
    const nextPlan = createGeneratedPlan({ ...state, plannerProfile: state.plannerProfile }, new Date());
    updateStateAndPersist(state, { generatedPlan: nextPlan }, setState);
    setFocusIndex(0);
    navigate('/revision');
  };

  const navItems = useMemo(() => [
    { to: '/', label: 'Home' },
    { to: '/planner', label: 'Planner' },
    { to: '/subjects', label: 'Subjects' },
    { to: '/revision', label: 'Revision' },
    { to: '/settings', label: 'Settings' }
  ], []);

  const focusProps = {
    focusState,
    currentTask,
    planTasks,
    focusIndex,
    startFocus,
    pauseFocus,
    resumeFocus,
    skipBreak,
    nextTask,
    restartFocus
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <h2>Study Companion</h2>
          <p className="muted">Single student • Daily focus</p>
        </div>
        <nav className="nav-list">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">Today</p>
            <h3>{state.todayNote}</h3>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<HomePage state={state} setState={setState} focusProps={focusProps} handleStartEvening={handleStartEvening} />} />
          <Route path="/planner" element={<PlannerPage state={state} setState={setState} />} />
          <Route path="/subjects" element={<SubjectsPage state={state} setState={setState} />} />
          <Route path="/revision" element={<RevisionPage state={state} setState={setState} focusProps={focusProps} />} />
          <Route path="/settings" element={<SettingsPage state={state} setState={setState} />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;

