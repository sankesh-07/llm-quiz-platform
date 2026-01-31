import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { boardsService } from '../../services/boards.service';
import { learningService } from '../../services/learning.service';
import { submissionsService } from '../../services/submissions.service';
import type { Board } from '../../services/boards.service';
import type { CreateLearningQuizRequest, Quiz } from '../../services/learning.service';
import type { Submission } from '../../services/submissions.service';

interface LearningLocationState {
  activeOption?: 'create' | 'existing';
  lastSubmissionId?: string;
  lastQuizId?: string;
}

export default function LearningMode() {
  const { user } = useAuth();
  const location = useLocation();
  const locationState = (location.state || {}) as LearningLocationState;
  const [boards, setBoards] = useState<Board[]>([]);
  // Initialize with user's profile data if available
  const [selectedBoard, setSelectedBoard] = useState(user?.boardCode || '');
  const [selectedStandard, setSelectedStandard] = useState(user?.standard?.toString() || '');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [standards, setStandards] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [numQuestions, setNumQuestions] = useState(10);
  const [timerSeconds, setTimerSeconds] = useState(600);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [activeOption, setActiveOption] = useState<'create' | 'existing'>(
    locationState.activeOption ?? 'create'
  );
  const [myQuizzes, setMyQuizzes] = useState<Quiz[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [submissionsByQuiz, setSubmissionsByQuiz] = useState<Record<string, Submission>>({});
  const [highlightQuizId] = useState<string | undefined>(locationState.lastQuizId);

  // Filters for existing practice quizzes
  const [filterSubject, setFilterSubject] = useState<string>('');
  const [filterMonth, setFilterMonth] = useState<string>('');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const data = await boardsService.getBoards();
        setBoards(data);
      } catch (err) {
        setError('Failed to load boards');
      }
    };
    fetchBoards();
  }, []);

  useEffect(() => {
    const fetchMyQuizzesAndSubmissions = async () => {
      try {
        setLoadingQuizzes(true);
        const [quizzes, submissions] = await Promise.all([
          learningService.getMyQuizzes(),
          submissionsService.getMySubmissions(),
        ]);
        setMyQuizzes(quizzes);

        const map: Record<string, Submission> = {};
        submissions.forEach((sub) => {
          const quizId = sub.quizId;
          const prev = map[quizId];
          if (!prev || new Date(sub.completedAt) > new Date(prev.completedAt)) {
            map[quizId] = sub;
          }
        });
        setSubmissionsByQuiz(map);
      } catch (err) {
        console.error('Failed to load practice quizzes or submissions', err);
      } finally {
        setLoadingQuizzes(false);
      }
    };
    if (activeOption === 'existing') {
      fetchMyQuizzesAndSubmissions();
    }
  }, [activeOption]);

  useEffect(() => {
    if (selectedBoard) {
      const fetchStandards = async () => {
        try {
          const data = await boardsService.getStandards(selectedBoard);
          setStandards(data);
        } catch (err) {
          setError('Failed to load standards');
        }
      };
      fetchStandards();
    }
  }, [selectedBoard]);

  useEffect(() => {
    if (selectedBoard && selectedStandard) {
      const fetchSubjects = async () => {
        try {
          const data = await boardsService.getSubjects(selectedBoard, parseInt(selectedStandard));
          setSubjects(data);
        } catch (err) {
          setError('Failed to load subjects');
        }
      };
      fetchSubjects();
    }
  }, [selectedBoard, selectedStandard]);

  useEffect(() => {
    if (selectedBoard && selectedStandard && selectedSubject) {
      const fetchChapters = async () => {
        try {
          const data = await boardsService.getChapters(selectedBoard, parseInt(selectedStandard), selectedSubject);
          setChapters(data);
        } catch (err) {
          setError('Failed to load chapters');
        }
      };
      fetchChapters();
    }
  }, [selectedBoard, selectedStandard, selectedSubject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const quizData: CreateLearningQuizRequest = {
        title,
        description,
        boardCode: selectedBoard,
        standard: parseInt(selectedStandard),
        subject: selectedSubject || undefined,
        chapter: selectedChapter || undefined,
        difficulty,
        numQuestions,
        timerSeconds,
        questionTypes: ['MCQ'],
      };

      const quiz = await learningService.createQuiz(quizData);

      // Reset create form back to defaults
      setSelectedBoard('');
      setSelectedStandard('');
      setSelectedSubject('');
      setSelectedChapter('');
      setTitle('');
      setDescription('');
      setDifficulty('medium');
      setNumQuestions(10);
      setTimerSeconds(600);

      // After creating, switch to Option B and show it in the list instead of entering directly
      setActiveOption('existing');
      setMyQuizzes((prev) => [quiz, ...prev]);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create quiz');
    } finally {
      setLoading(false);
    }
  };

  // Build filter option lists based on loaded quizzes
  const subjectOptions = Array.from(
    new Set(
      myQuizzes
        .map((q) => q.subject)
        .filter((s): s is string => !!s)
    )
  );

  const monthOptions = Array.from(
    new Set(
      myQuizzes
        .map((q) => {
          if (!q.createdAt) return '';
          // Expecting ISO-like string; first 7 chars are YYYY-MM
          const key = q.createdAt.slice(0, 7);
          return key;
        })
        .filter((v) => v)
    )
  ).sort((a, b) => b.localeCompare(a));

  const formatMonthLabel = (value: string) => {
    const [year, month] = value.split('-');
    const d = new Date(Number(year), Number(month) - 1, 1);
    return d.toLocaleString(undefined, { month: 'long', year: 'numeric' });
  };

  const filteredQuizzes = myQuizzes.filter((q) => {
    const subjectMatch = !filterSubject || (q.subject || '').trim().toLowerCase() === filterSubject.trim().toLowerCase();

    const rawCreated = typeof q.createdAt === 'string' ? q.createdAt : new Date(q.createdAt).toISOString();
    const quizMonth = rawCreated ? rawCreated.slice(0, 7) : '';
    const monthMatch = !filterMonth || quizMonth === filterMonth;

    return subjectMatch && monthMatch;
  });

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Practice Mode</h1>
        <p className="mt-2 text-gray-600">Create or take practice quizzes</p>
      </div>

      {/* Option selector */}
      <div className="mb-6 flex space-x-4">
        <button
          type="button"
          onClick={() => setActiveOption('create')}
          className={`px-4 py-2 rounded-lg text-sm font-medium border ${activeOption === 'create'
            ? 'bg-indigo-600 text-white border-indigo-600'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
        >
          Option A: Create Practice Quiz
        </button>
        <button
          type="button"
          onClick={() => setActiveOption('existing')}
          className={`px-4 py-2 rounded-lg text-sm font-medium border ${activeOption === 'existing'
            ? 'bg-indigo-600 text-white border-indigo-600'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
        >
          Option B: Take Existing Quiz
        </button>
      </div>

      {activeOption === 'create' && (
        <div className="bg-white shadow rounded-lg p-6 max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Board *</label>
              <select
                required
                value={selectedBoard}
                disabled={!!user?.boardCode}
                onChange={(e) => {
                  setSelectedBoard(e.target.value);
                  setSelectedStandard('');
                  setSelectedSubject('');
                  setSelectedChapter('');
                }}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${user?.boardCode ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
              >
                <option value="">Select Board</option>
                {boards.map((board) => (
                  <option key={board._id} value={board.code}>
                    {board.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedBoard && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Standard *</label>
                <select
                  required
                  value={selectedStandard}
                  disabled={!!user?.standard}
                  onChange={(e) => {
                    setSelectedStandard(e.target.value);
                    setSelectedSubject('');
                    setSelectedChapter('');
                  }}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${user?.standard ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                >
                  <option value="">Select Standard</option>
                  {standards.map((std) => (
                    <option key={std.grade} value={std.grade}>
                      Class {std.grade}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedBoard && selectedStandard && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject (Optional)</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => {
                    setSelectedSubject(e.target.value);
                    setSelectedChapter('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Subjects</option>
                  {subjects.map((subj) => (
                    <option key={subj.name} value={subj.name}>
                      {subj.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedBoard && selectedStandard && selectedSubject && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chapter (Optional)</label>
                <select
                  value={selectedChapter}
                  onChange={(e) => setSelectedChapter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Chapters</option>
                  {chapters.map((chap) => (
                    <option key={chap.name} value={chap.name}>
                      {chap.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Number of Questions</label>
                <input
                  type="number"
                  min={5}
                  max={50}
                  required
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Timer (seconds)</label>
                <input
                  type="number"
                  min={60}
                  required
                  value={timerSeconds}
                  onChange={(e) => setTimerSeconds(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !selectedBoard || !selectedStandard}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Quiz...' : 'Create Practice Quiz'}
            </button>
          </form>
        </div>
      )}

      {activeOption === 'existing' && (
        <div className="bg-white shadow rounded-lg p-6 max-w-3xl">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Practice Quizzes</h2>

          {/* Filters: subject and month */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-4 mb-4 space-y-2 sm:space-y-0">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Subject</label>
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Subjects</option>
                {subjectOptions.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Month</label>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Months</option>
                {monthOptions.map((value) => (
                  <option key={value} value={value}>
                    {formatMonthLabel(value)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loadingQuizzes ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : myQuizzes.length === 0 ? (
            <p className="text-gray-600">You have not created any practice quizzes yet.</p>
          ) : filteredQuizzes.length === 0 ? (
            <p className="text-gray-600">No practice quizzes match your filters.</p>
          ) : (
            <div className="space-y-4">
              {filteredQuizzes.map((q) => {
                const submission = submissionsByQuiz[q._id];
                const isHighlighted = highlightQuizId === q._id;
                return (
                  <div
                    key={q._id}
                    className={`border rounded-lg p-4 flex justify-between items-center ${isHighlighted ? 'border-green-500 ring-1 ring-green-300' : 'border-gray-200'
                      }`}
                  >
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{q.title || 'Practice Quiz'}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {q.boardCode} • Class {q.standard} • {q.difficulty} • {q.numQuestions} questions
                      </p>
                      {q.subject && (
                        <p className="text-xs text-gray-500 mt-1">
                          {q.subject}{q.chapter ? ` — ${q.chapter}` : ''}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Created at: {new Date(q.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {submission ? (
                      <button
                        type="button"
                        onClick={() => {
                          navigate(`/student/submissions/${submission._id}`);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                      >
                        View Result
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          localStorage.setItem('currentQuiz', JSON.stringify(q));
                          navigate(`/student/quiz/${q._id}`);
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                      >
                        Take Quiz
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

