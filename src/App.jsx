import { NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';

const selectOptions = ['Not started', 'Pending', 'Done'];

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
    tuitionMaths: '',
    tuitionPhysics: '',
    recoveryMode: false,
    tiredMode: false,
    moreStudyMode: false
  },
  generatedPlan: { generatedAt: null, summary: '', tasks: [] },
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
    if (!parsed || isLegacySeededState(parsed)) return defaultState;
    return {
      ...defaultState,
      ...parsed,
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : defaultState.tasks,
      subjects: Array.isArray(parsed.subjects) ? parsed.subjects : createDefaultSubjects(),
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

function parseVoiceUpdate(text, subjects) {
  const normalized = (text || '').toLowerCase();
  let subject = null;
  const subjectCandidates = subjects.filter((item) => normalized.includes(item.name.toLowerCase())) || [];
  if (subjectCandidates.length === 1) {
    subject = subjectCandidates[0];
  } else if (subjectCandidates.length > 1) {
    subject = null;
  } else {
    const synonyms = [
      ['maths', 'mathematics'],
      ['physics', 'phy'],
      ['chemistry', 'chem'],
      ['computer science', 'cs'],
      ['english', 'eng']
    ];
    const match = synonyms.find(([primary, alt]) => normalized.includes(primary) || normalized.includes(alt));
    if (match) {
      const label = match[0];
      subject = subjects.find((item) => item.name.toLowerCase() === label) || subjects.find((item) => item.name.toLowerCase().includes(label));
    }
  }

  let type = '';
  if (normalized.includes('tuition')) type = 'Tuition';
  else if (normalized.includes('school')) type = 'School';

  let homework = '';
  const homeworkMatch = text.match(/homework(?:\s+is|\s*[:\-]\s*|\s+for)?\s*([^.;\n]+)/i);
  if (homeworkMatch) {
    homework = homeworkMatch[1].trim();
  }

  let chapterId = '';
  let topicId = '';
  if (subject) {
    const chapterCandidates = subject.chapters.filter((chapter) => normalized.includes(chapter.name.toLowerCase()));
    if (chapterCandidates.length === 1) {
      chapterId = chapterCandidates[0].id;
      const chapter = chapterCandidates[0];
      const topicCandidates = chapter.topics.filter((topic) => normalized.includes(topic.name.toLowerCase()));
      if (topicCandidates.length === 1) {
        topicId = topicCandidates[0].id;
      }
    }
  }

  return {
    subjectId: subject?.id || '',
    chapterId,
    topicId,
    homework,
    type
  };
}

function createGeneratedPlan(state, now) {
  const profile = state.plannerProfile || defaultState.plannerProfile;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const isSaturday = dayOfWeek === 6;

  // Parse tuition times (e.g., 19:50 for 7:50 PM)
  const parseTime = (timeStr) => {
    if (!timeStr) return null;
    const parts = timeStr.split(':');
    return Number(parts[0]) * 60 + Number(parts[1]);
  };

  // Saturday: no tuition at all
  const tuitionMathsMin = isSaturday ? null : parseTime(profile.tuitionMaths);
  const tuitionPhysicsMin = isSaturday ? null : parseTime(profile.tuitionPhysics);
  const tuitionDuration = 100; // 1h 40min

  // Determine tuition phase
  const isInTuition = (tMin) => tMin !== null && currentMinutes >= tMin && currentMinutes < tMin + tuitionDuration;
  const isTuitionSoon = (tMin) => tMin !== null && currentMinutes < tMin && tMin - currentMinutes <= 120;
  const isAfterTuition = (tMin) => tMin !== null && currentMinutes >= tMin + tuitionDuration && currentMinutes - (tMin + tuitionDuration) <= 120;

  const mathsTuitionActive = isInTuition(tuitionMathsMin);
  const physicsTuitionActive = isInTuition(tuitionPhysicsMin);
  const mathsSoon = isTuitionSoon(tuitionMathsMin);
  const physicsSoon = isTuitionSoon(tuitionPhysicsMin);
  const mathsAfter = isAfterTuition(tuitionMathsMin);
  const physicsAfter = isAfterTuition(tuitionPhysicsMin);

  const tuitionSoon = mathsSoon || physicsSoon;
  const afterTuition = mathsAfter || physicsAfter;
  const tuitionActive = mathsTuitionActive || physicsTuitionActive;

  // Available study time
  let availableMinutes = getStudyWindowMinutes(now);
  if (profile.moreStudyMode) availableMinutes = Math.min(availableMinutes, 240);
  else availableMinutes = Math.min(availableMinutes, 180);

  // Saturday: more time available
  if (isSaturday) {
    availableMinutes = Math.min(availableMinutes, 240);
  }

  // Reduce available time if tuition is upcoming
  if (tuitionSoon) {
    const earliestTuition = [tuitionMathsMin, tuitionPhysicsMin]
      .filter((t) => t !== null && t > currentMinutes)
      .sort((a, b) => a - b)[0];
    if (earliestTuition) {
      availableMinutes = Math.min(availableMinutes, earliestTuition - currentMinutes);
    }
  }

  // If in tuition, plan light review after
  if (tuitionActive) {
    availableMinutes = Math.min(availableMinutes, 30);
  }

  // Mode-based adjustments
  const baseBlock = tuitionSoon ? 20 : afterTuition ? 20 : profile.tiredMode ? 20 : profile.moreStudyMode ? 35 : 25;
  const breakLength = afterTuition ? 10 : profile.tiredMode ? 5 : 8;
  const maxStudyTasks = tuitionActive ? 1 : afterTuition ? 2 : profile.recoveryMode ? 2 : profile.tiredMode ? 2 : 3;

  const { homeworkItems, backlogItems, revisionItems } = collectSubjectPlannerItems(state.subjects || []);

  // Collect candidate tasks with priority score
  const candidates = [];
  const addCandidate = (task, priority) => {
    if (!task.title?.trim()) return;
    const normalizedTitle = task.title.trim().toLowerCase();
    if (!candidates.some((item) => item.title.trim().toLowerCase() === normalizedTitle)) {
      candidates.push({ ...task, priority });
    }
  };

  // After tuition: sleepy mode — light, short tasks only
  if (afterTuition) {
    // Light revision or easy homework — short, low effort
    if (revisionItems[0]) {
      addCandidate({
        kind: 'revision',
        title: `Light review - ${revisionItems[0].title}`,
        label: 'Quick revision',
        duration: 15
      }, 5);
    }
    // Quick JEE practice (1-2 PYQs) — low effort
    addCandidate({
      kind: 'jee-practice',
      title: 'Solve 2 JEE PYQs',
      label: 'JEE practice',
      duration: 15
    }, 4);
    // Planner homework if short
    if (profile.homework?.trim()) {
      addCandidate({
        kind: 'planner-homework',
        title: `${profile.homework.trim()} (quick)`,
        label: 'Homework',
        duration: 15
      }, 3);
    }
    // If nothing else, just read school notes
    if (profile.schoolProgress?.trim()) {
      addCandidate({
        kind: 'school',
        title: 'Review today school notes',
        label: 'School review',
        duration: 15
      }, 2);
    }

    candidates.sort((a, b) => b.priority - a.priority);
    const studyTasks = candidates.slice(0, maxStudyTasks);
    const planItems = [];
    let startMinutes = currentMinutes;

    studyTasks.forEach((task, index) => {
      const taskDuration = Math.min(task.duration, Math.max(10, Math.floor(availableMinutes / Math.max(1, studyTasks.length - index))));
      planItems.push({
        id: `${task.kind}-${Date.now()}-${index}`,
        title: task.title,
        type: task.label,
        duration: taskDuration,
        time: formatMinutes(startMinutes),
        kind: task.kind
      });
      startMinutes += taskDuration;
      availableMinutes -= taskDuration;
      if (index < studyTasks.length - 1) {
        const actualBreak = Math.min(breakLength, Math.max(5, Math.floor(availableMinutes / (studyTasks.length - index - 1) * 0.25)));
        planItems.push({
          id: `break-${Date.now()}-${index}`,
          title: `Break · ${actualBreak} min`,
          type: 'Break',
          duration: actualBreak,
          time: formatMinutes(startMinutes),
          kind: 'break'
        });
        startMinutes += actualBreak;
        availableMinutes -= actualBreak;
      }
    });

    const summaryParts = [];
    const nowLabel = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    summaryParts.push(`Now ${nowLabel}`);
    summaryParts.push(`Light session after tuition`);
    if (profile.tiredMode) summaryParts.push('Tired Mode');

    return {
      generatedAt: now.toISOString(),
      summary: summaryParts.join(' • '),
      tasks: planItems
    };
  }

  // Normal mode (not after tuition)
  // School progress (what happened today) - priority: review school notes first
  if (profile.schoolProgress?.trim()) {
    addCandidate({
      kind: 'school',
      title: `Review: ${profile.schoolProgress.trim()}`,
      label: 'School notes',
      duration: afterTuition ? 15 : profile.tiredMode ? 15 : 20
    }, 8);
  }

  // Homework from planner profile - highest priority
  if (profile.homework?.trim()) {
    addCandidate({
      kind: 'planner-homework',
      title: profile.homework.trim(),
      label: 'Homework',
      duration: baseBlock
    }, 10);
  }

  // Homework items from subjects - high priority
  homeworkItems.forEach((task, i) => {
    addCandidate({
      kind: 'homework',
      title: task.title,
      label: 'Homework',
      duration: baseBlock
    }, 9 - i);
  });

  // JEE practice (Physics, Chemistry, Mathematics)
  const jeeSubjects = ['physics', 'chemistry', 'mathematics', 'maths'];
  state.subjects.forEach((subject) => {
    const subjectLower = subject.name.toLowerCase();
    if (jeeSubjects.some((js) => subjectLower.includes(js))) {
      // Find topics with JEE marked as 'Pending' or 'Not started'
      subject.chapters.forEach((chapter) => {
        chapter.topics.forEach((topic) => {
          if (topic.jee === 'Not started' || topic.jee === 'Pending') {
            addCandidate({
              kind: 'jee',
              title: `${subject.name} JEE - ${topic.name}`,
              label: 'JEE practice',
              duration: profile.tiredMode ? 15 : 20
            }, 6);
          }
        });
      });
    }
  });

  // If no specific JEE topics found, add generic JEE practice
  const hasJeeTask = candidates.some((c) => c.kind === 'jee');
  if (!hasJeeTask) {
    addCandidate({
      kind: 'jee',
      title: 'JEE practice (PYQs)',
      label: 'JEE practice',
      duration: profile.tiredMode ? 15 : 20
    }, 5);
  }

  // Backlog from planner profile
  if (!profile.tiredMode && profile.backlog?.trim()) {
    addCandidate({
      kind: 'planner-backlog',
      title: profile.backlog.trim(),
      label: 'Backlog',
      duration: baseBlock
    }, 4);
  }

  // Backlog items from subjects
  if (!profile.tiredMode && backlogItems[0]) {
    addCandidate({
      kind: 'backlog',
      title: backlogItems[0].title,
      label: 'Backlog',
      duration: baseBlock
    }, 3);
  }

  // Revision due from planner profile
  if (profile.revisionDue?.trim()) {
    addCandidate({
      kind: 'planner-revision',
      title: profile.revisionDue.trim(),
      label: 'Revision',
      duration: tuitionSoon ? 15 : profile.tiredMode ? 15 : 20
    }, 7);
  }

  // Revision items from subjects (due topics)
  revisionItems.slice(0, 1).forEach((task, i) => {
    addCandidate({
      kind: 'revision',
      title: task.title,
      label: 'Revision due',
      duration: tuitionSoon ? 15 : profile.tiredMode ? 15 : 20
    }, 2 - i);
  });

  // Upcoming exams
  if (profile.upcomingExams?.trim()) {
    addCandidate({
      kind: 'exam',
      title: profile.upcomingExams.trim(),
      label: 'Exam prep',
      duration: profile.tiredMode ? 15 : 20
    }, 1);
  }

  // Sort by priority (highest first) and take the top N
  candidates.sort((a, b) => b.priority - a.priority);
  const studyTasks = candidates.slice(0, maxStudyTasks);

  // Build the plan with auto-inserted breaks
  const planItems = [];
  let startMinutes = currentMinutes;

  studyTasks.forEach((task, index) => {
    const taskDuration = Math.min(task.duration, Math.max(15, Math.floor(availableMinutes / Math.max(1, studyTasks.length - index))));
    planItems.push({
      id: `${task.kind}-${Date.now()}-${index}`,
      title: task.title,
      type: task.label,
      duration: taskDuration,
      time: formatMinutes(startMinutes),
      kind: task.kind
    });
    startMinutes += taskDuration;
    availableMinutes -= taskDuration;

    // Insert break between tasks
    if (index < studyTasks.length - 1) {
      const actualBreak = Math.min(breakLength, Math.max(3, Math.floor(availableMinutes / (studyTasks.length - index - 1) * 0.2)));
      const breakTitle = profile.tiredMode ? `Gentle break · ${actualBreak} min` : `Break · ${actualBreak} min`;
      planItems.push({
        id: `break-${Date.now()}-${index}`,
        title: breakTitle,
        type: 'Break',
        duration: actualBreak,
        time: formatMinutes(startMinutes),
        kind: 'break'
      });
      startMinutes += actualBreak;
      availableMinutes -= actualBreak;
    }
  });

  // Summary
  const summaryParts = [];
  const nowLabel = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  summaryParts.push(`Now ${nowLabel}`);
  summaryParts.push(`${Math.max(1, Math.ceil((startMinutes - currentMinutes) / 60))}h plan`);
  if (isSaturday) summaryParts.push('Saturday • No tuition');
  if (profile.recoveryMode) summaryParts.push('Recovery Mode');
  if (profile.tiredMode) summaryParts.push('Tired Mode');
  if (tuitionSoon) summaryParts.push('Tuition soon');
  if (tuitionActive) summaryParts.push('In tuition');

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
  const recognitionRef = useRef(null);
  const interimRef = useRef('');

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
    };
  }, []);

  const updateDraft = (patch) => setDraft((prev) => ({ ...prev, ...patch }));

  const switchToManual = () => {
    updateDraft({ mode: 'manual', note: '', isListening: false, extractedData: null, showConfirmation: false });
    recognitionRef.current?.stop();
  };

  // Real voice capture using Web Speech API
  const startVoiceCapture = () => {
    if (!isSpeechAvailable) {
      updateDraft({
        mode: 'manual',
        isListening: false,
        note: 'Speech recognition is not available in this browser. Using manual entry instead.'
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalTranscript = '';

    recognition.onresult = (event) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + ' ';
        } else {
          interimTranscript += result[0].transcript;
        }
      }
      interimRef.current = interimTranscript;
      updateDraft({ transcript: finalTranscript, note: '' });
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        updateDraft({
          isListening: false,
          mode: 'manual',
          note: 'Microphone access denied. Please allow microphone access or use manual entry.'
        });
      } else if (event.error === 'no-speech') {
        // Ignore — continue listening
      } else {
        updateDraft({
          isListening: false,
          mode: 'manual',
          note: `Voice error: ${event.error}. Switching to manual entry.`
        });
      }
    };

    recognition.onend = () => {
      // If we're still supposed to be listening, restart
      if (draft.isListening) {
        try {
          recognition.start();
        } catch {
          // Ignore if already started
        }
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      updateDraft({
        isListening: true,
        mode: 'voice',
        note: '',
        transcript: '',
        showConfirmation: false,
        extractedData: null
      });
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
    recognitionRef.current?.stop();
    const transcript = draft.transcript.trim();
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
      // Try harder: look for known subject names in the text
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
        // Find chapter by name in transcript
        const chapterMatch = subject.chapters.find((ch) =>
          confidenceCheck.includes(ch.name.toLowerCase())
        );
        extracted.chapterId = chapterMatch?.id || subject.lastChapterId || subject.chapters[0].id;

        // Find topic within that chapter
        const targetChapter = subject.chapters.find((ch) => ch.id === extracted.chapterId);
        if (targetChapter) {
          const topicMatch = targetChapter.topics.find((t) =>
            confidenceCheck.includes(t.name.toLowerCase())
          );
          extracted.topicId = topicMatch?.id || targetChapter.topics[0].id;
        }
      }
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
      note: extracted.subjectId ? 'Review the extracted info below.' : 'Could not identify the subject. Please edit below.'
    });
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
          {draft.isListening ? '■ Done Listening' : '🎤 Start Voice'}
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
                Speak naturally. Tap <strong>"■ Done Listening"</strong> when finished.
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
            <h3>Continue Yesterday</h3>
            <span className="chip">{remaining} left</span>
          </div>
          <p className="muted">Pick up from your previous session and finish the open tasks.</p>
          <button className="secondary-btn" onClick={() => navigate('/planner')}>
            Open planner
          </button>
        </div>

        <div className="card">
          <div className="card-top">
            <h3>Today's 3 Tasks</h3>
            <span className="chip">Live</span>
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
  const updateProfile = (patch) => {
    updateStateAndPersist(state, {
      plannerProfile: { ...plannerProfile, ...patch }
    }, setState);
  };

  const generatePlan = () => {
    const nextPlan = createGeneratedPlan({ ...state, plannerProfile }, new Date());
    updateStateAndPersist(state, { generatedPlan: nextPlan }, setState);
  };

  return (
    <div className="page-stack">
      <section className="card">
        <div className="card-top">
          <h3>Today's plan</h3>
          <span className="chip">Fast start</span>
        </div>
        <div className="stack">
          <label className="inline-stack">
            <span>What happened today?</span>
            <textarea value={plannerProfile.schoolProgress} onChange={(e) => updateProfile({ schoolProgress: e.target.value })} placeholder="Physics completed Current Electricity. Maths tuition completed Maxima and Minima." />
          </label>
          <div className="input-row">
            <label className="inline-stack compact">
              <span>Maths tuition</span>
              <input type="time" value={plannerProfile.tuitionMaths} onChange={(e) => updateProfile({ tuitionMaths: e.target.value })} />
            </label>
            <label className="inline-stack compact">
              <span>Physics tuition</span>
              <input type="time" value={plannerProfile.tuitionPhysics} onChange={(e) => updateProfile({ tuitionPhysics: e.target.value })} />
            </label>
          </div>
          <div className="toggle-row">
            <label>
              <input type="checkbox" checked={plannerProfile.recoveryMode} onChange={(e) => updateProfile({ recoveryMode: e.target.checked })} />
              <span>Recovery Mode</span>
            </label>
            <label>
              <input type="checkbox" checked={plannerProfile.tiredMode} onChange={(e) => updateProfile({ tiredMode: e.target.checked })} />
              <span>Tired Mode</span>
            </label>
            <label>
              <input type="checkbox" checked={plannerProfile.moreStudyMode} onChange={(e) => updateProfile({ moreStudyMode: e.target.checked })} />
              <span>More study</span>
            </label>
          </div>
          <div className="inline-actions">
            <button className="primary-btn" onClick={generatePlan}>Generate plan</button>
            <button className="secondary-btn" onClick={() => updateProfile({ schoolProgress: '', homework: '', backlog: '', revisionDue: '', upcomingExams: '', tuitionMaths: '', tuitionPhysics: '', recoveryMode: false, tiredMode: false, moreStudyMode: false })}>Reset</button>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-top">
          <h3>Today's plan</h3>
          {state.generatedPlan?.summary ? <span className="chip">{state.generatedPlan.summary}</span> : null}
        </div>
        {state.generatedPlan?.tasks?.length ? (
          <>
            <p className="muted">Your plan is ready. Start the focus timer when you are set.</p>
            <div className="inline-actions compact-actions">
              <button className="primary-btn" onClick={() => navigate('/revision')}>Start focus</button>
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
          <h3>Due for review</h3>
          <span className="chip">{dueItems.length} ready</span>
        </div>
        {dueItems.length ? (
          <div className="revision-list">
            {dueItems.map((item) => (
              <article className="revision-card" key={`${item.subjectId}-${item.chapterId}-${item.topicId}`}>
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
          <p className="muted">No topics are due right now. Great work.</p>
        )}
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

function SettingsPage({ state, setState }) {
  const [examDate, setExamDate] = useState(state.examDate);
  const [timerMinutes, setTimerMinutes] = useState(state.timerMinutes);
  const [todayNote, setTodayNote] = useState(state.todayNote);
  const [bagItemInput, setBagItemInput] = useState('');
  const [weeklyReviewText, setWeeklyReviewText] = useState(state.weeklyReview?.text || '');
  const [monthlyReflectionText, setMonthlyReflectionText] = useState(state.monthlyReflection?.text || '');
  const [notice, setNotice] = useState('');
  const fileInputRef = useRef(null);

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

      {notice ? <p className="muted">{notice}</p> : null}
    </div>
  );
}

function App() {
  const [state, setState] = useState(readState);
  const navigate = useNavigate();

  // Shared focus timer state
  const planTasks = useMemo(() => (state.generatedPlan?.tasks || []).filter((t) => t.kind !== 'break'), [state.generatedPlan]);
  const [focusIndex, setFocusIndex] = useState(0);
  const currentTask = planTasks[focusIndex] || null;
  const defaultStudySeconds = (currentTask?.duration || 25) * 60;
  const defaultBreakSeconds = 5 * 60;

  const [focusState, setFocusState] = useState({
    mode: 'study',
    remainingSeconds: defaultStudySeconds,
    isRunning: false,
    studySeconds: defaultStudySeconds,
    breakSeconds: defaultBreakSeconds
  });

  // Reset timer when plan changes or task index changes
  useEffect(() => {
    setFocusState((prev) => ({
      ...prev,
      studySeconds: defaultStudySeconds,
      remainingSeconds: prev.isRunning ? prev.remainingSeconds : defaultStudySeconds,
      mode: prev.mode === 'break' ? prev.mode : 'study'
    }));
  }, [defaultStudySeconds, focusIndex]);

  // Timer tick
  useEffect(() => {
    if (!focusState.isRunning) return undefined;
    const interval = setInterval(() => {
      setFocusState((prev) => {
        if (prev.remainingSeconds <= 1) {
          if (prev.mode === 'study') {
            // Study block finished → auto-switch to break
            return { ...prev, mode: 'break', remainingSeconds: prev.breakSeconds, isRunning: false };
          }
          // Break finished → auto-switch to next study block
          return { ...prev, mode: 'study', remainingSeconds: prev.studySeconds, isRunning: false };
        }
        return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [focusState.isRunning, focusState.mode, focusState.breakSeconds, focusState.studySeconds]);

  const startFocus = () => setFocusState((prev) => ({ ...prev, isRunning: true }));
  const pauseFocus = () => setFocusState((prev) => ({ ...prev, isRunning: false }));
  const resumeFocus = () => setFocusState((prev) => ({ ...prev, isRunning: true }));
  const skipBreak = () => setFocusState((prev) => ({ ...prev, mode: 'study', remainingSeconds: prev.studySeconds, isRunning: false }));
  const nextTask = () => {
    if (focusIndex < planTasks.length - 1) {
      setFocusIndex(focusIndex + 1);
      setFocusState((prev) => ({
        ...prev,
        mode: 'study',
        remainingSeconds: defaultStudySeconds,
        isRunning: false
      }));
    }
  };
  const restartFocus = () => setFocusState((prev) => ({ ...prev, mode: 'study', remainingSeconds: prev.studySeconds, isRunning: true }));

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
