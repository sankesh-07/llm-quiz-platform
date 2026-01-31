import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { submissionsService } from '../../services/submissions.service';
import type { Quiz } from '../../services/learning.service';

type QuestionStatus =
  | 'NOT_VISITED'
  | 'NOT_ANSWERED'
  | 'ANSWERED'
  | 'MARKED_FOR_REVIEW'
  | 'ANSWERED_MARKED_FOR_REVIEW';

interface QuestionMeta {
  visited: boolean;
  markedForReview: boolean;
}

export default function QuizPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [questionMeta, setQuestionMeta] = useState<Record<number, QuestionMeta>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Initialize question metadata when quiz loads
  useEffect(() => {
    if (!quiz) return;
    setQuestionMeta((prev) => {
      if (Object.keys(prev).length > 0) return prev; // keep existing state on re-renders
      const initial: Record<number, QuestionMeta> = {};
      quiz.questions.forEach((_, idx) => {
        initial[idx] = {
          visited: idx === 0, // first question is visited when quiz starts
          markedForReview: false,
        };
      });
      return initial;
    });
  }, [quiz]);

  useEffect(() => {
    const loadQuiz = () => {
      try {
        // Try to get quiz from localStorage (for learning mode)
        const storedQuiz = localStorage.getItem('currentQuiz');
        if (storedQuiz) {
          const quizData = JSON.parse(storedQuiz);
          if (quizData._id === quizId) {
            setQuiz(quizData);
            setLoading(false);
            return;
          }
        }
        
        // For contest quizzes, we'll need to fetch from contest endpoint
        // This is a limitation - backend doesn't have direct quiz GET endpoint
        setError('Quiz not found. Please start a new quiz.');
        setLoading(false);
      } catch (err: any) {
        setError('Failed to load quiz');
        setLoading(false);
      }
    };
    
    if (quizId) {
      loadQuiz();
    }
  }, [quizId]);

  useEffect(() => {
    if (quiz && quiz.timerSeconds) {
      setTimeRemaining(quiz.timerSeconds);
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [quiz]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (questionIndex: number, value: any) => {
    setAnswers({ ...answers, [questionIndex]: value });
    // Mark question as visited when answering
    setQuestionMeta((prev) => ({
      ...prev,
      [questionIndex]: {
        ...(prev[questionIndex] || { visited: true, markedForReview: false }),
        visited: true,
      },
    }));
  };

  const getQuestionStatus = (questionIndex: number): QuestionStatus => {
    const meta = questionMeta[questionIndex];
    const visited = meta?.visited ?? false;
    const markedForReview = meta?.markedForReview ?? false;
    const value = answers[questionIndex];
    const hasAnswer = value !== undefined && value !== '';

    if (!visited) return 'NOT_VISITED';
    if (markedForReview && hasAnswer) return 'ANSWERED_MARKED_FOR_REVIEW';
    if (markedForReview) return 'MARKED_FOR_REVIEW';
    if (hasAnswer) return 'ANSWERED';
    return 'NOT_ANSWERED';
  };

  const goToQuestion = (index: number) => {
    if (!quiz) return;
    if (index < 0 || index >= quiz.questions.length) return;
    setCurrentQuestionIndex(index);
    setQuestionMeta((prev) => ({
      ...prev,
      [index]: {
        ...(prev[index] || { visited: false, markedForReview: false }),
        visited: true,
      },
    }));
  };

  const handleSaveAndNext = () => {
    if (!quiz) return;
    const idx = currentQuestionIndex;
    setQuestionMeta((prev) => ({
      ...prev,
      [idx]: {
        ...(prev[idx] || { visited: true, markedForReview: false }),
        visited: true,
        markedForReview: false,
      },
    }));
    if (idx < quiz.questions.length - 1) {
      goToQuestion(idx + 1);
    }
  };

  const handleSaveAndMarkForReview = () => {
    if (!quiz) return;
    const idx = currentQuestionIndex;
    setQuestionMeta((prev) => ({
      ...prev,
      [idx]: {
        ...(prev[idx] || { visited: true, markedForReview: false }),
        visited: true,
        markedForReview: true,
      },
    }));
    if (idx < quiz.questions.length - 1) {
      goToQuestion(idx + 1);
    }
  };

  const handleMarkForReviewAndNext = () => {
    if (!quiz) return;
    const idx = currentQuestionIndex;
    setQuestionMeta((prev) => ({
      ...prev,
      [idx]: {
        ...(prev[idx] || { visited: true, markedForReview: false }),
        visited: true,
        markedForReview: true,
      },
    }));
    if (idx < quiz.questions.length - 1) {
      goToQuestion(idx + 1);
    }
  };

  const handleClearResponse = () => {
    const idx = currentQuestionIndex;
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
  };

  const handleSubmit = async () => {
    if (submitting || !quiz) return;
    setSubmitting(true);

    try {
      const answerArray = Object.entries(answers).map(([index, value]) => {
        const question = quiz.questions[parseInt(index)];
        if (question.type === 'MCQ') {
          return { questionIndex: parseInt(index), selectedOptionIndex: value };
        } else {
          return { questionIndex: parseInt(index), answerText: value };
        }
      });

      const submission = await submissionsService.submitQuiz(quiz._id, { answers: answerArray });
      localStorage.removeItem('currentQuiz');
      // After submitting a practice quiz, return to the practice list and show "View Result" for this quiz
      navigate('/student/learning', {
        replace: true,
        state: {
          activeOption: 'existing',
          lastSubmissionId: submission._id,
          lastQuizId: quiz._id,
        },
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error || 'Quiz not found'}</p>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];

  const statusCounts = quiz.questions.reduce(
    (acc, _q, idx) => {
      const status = getQuestionStatus(idx);
      acc[status] += 1;
      return acc;
    },
    {
      NOT_VISITED: 0,
      NOT_ANSWERED: 0,
      ANSWERED: 0,
      MARKED_FOR_REVIEW: 0,
      ANSWERED_MARKED_FOR_REVIEW: 0,
    } as Record<QuestionStatus, number>
  );

  const getStatusClasses = (status: QuestionStatus) => {
    switch (status) {
      case 'NOT_VISITED':
        return 'bg-gray-100 text-gray-800';
      case 'NOT_ANSWERED':
        return 'bg-red-100 text-red-800';
      case 'ANSWERED':
        return 'bg-green-100 text-green-800';
      case 'MARKED_FOR_REVIEW':
        return 'bg-purple-100 text-purple-800';
      case 'ANSWERED_MARKED_FOR_REVIEW':
        return 'bg-indigo-100 text-indigo-800 border-2 border-purple-500';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Practice Quiz</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left: Question area */}
        <div className="lg:col-span-3 bg-white shadow rounded-lg p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Question {currentQuestionIndex + 1} of {quiz.questions.length}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Read the question carefully and select the most appropriate option.
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Time Remaining</div>
              <div
                className={`text-xl font-bold ${
                  timeRemaining < 60 ? 'text-red-600' : 'text-gray-900'
                }`}
              >
                {formatTime(timeRemaining)}
              </div>
            </div>
          </div>

          <hr className="my-4" />

          {/* Question text */}
          <div className="mb-4">
            <p className="text-sm font-semibold text-gray-900 mb-3">Question {currentQuestionIndex + 1}:</p>
            <p className="text-sm text-gray-900 whitespace-pre-line">{currentQuestion.prompt}</p>
          </div>

          {/* Options / answer input */}
          <div className="mb-6">
            {currentQuestion.type === 'MCQ' && currentQuestion.options && (
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <label
                    key={index}
                    className={`flex items-center p-3 border rounded cursor-pointer text-sm transition-colors ${
                      answers[currentQuestionIndex] === index
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestionIndex}`}
                      value={index}
                      checked={answers[currentQuestionIndex] === index}
                      onChange={() => handleAnswer(currentQuestionIndex, index)}
                      className="mr-3"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            )}

            {currentQuestion.type === 'NUMERIC' && (
              <input
                type="text"
                inputMode="decimal"
                value={answers[currentQuestionIndex] || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty while editing
                  if (value === '') {
                    handleAnswer(currentQuestionIndex, '');
                    return;
                  }
                  // Only digits and at most one decimal point
                  if (!/^\d*(?:\.\d*)?$/.test(value)) return;
                  const digitsOnly = value.replace(/\./g, '');
                  // Max 5 digits total
                  if (digitsOnly.length > 5) return;
                  handleAnswer(currentQuestionIndex, value);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="Enter a numeric answer (up to 5 digits)"
              />
            )}
          </div>

          {/* Primary action buttons (Save / Mark for review) */}
          <div className="flex flex-wrap gap-3 mb-4 text-xs">
            <button
              type="button"
              onClick={handleSaveAndNext}
              className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              SAVE &amp; NEXT
            </button>
            <button
              type="button"
              onClick={handleSaveAndMarkForReview}
              className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              SAVE &amp; MARK FOR REVIEW
            </button>
            <button
              type="button"
              onClick={handleClearResponse}
              className="px-3 py-2 bg-gray-100 text-gray-800 rounded border border-gray-300 hover:bg-gray-200"
            >
              CLEAR RESPONSE
            </button>
            <button
              type="button"
              onClick={handleMarkForReviewAndNext}
              className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              MARK FOR REVIEW &amp; NEXT
            </button>
          </div>

          {/* Bottom navigation */}
          <div className="mt-4 flex items-center justify-between border-t pt-4 text-xs">
            <div className="space-x-2">
              <button
                type="button"
                onClick={() => goToQuestion(currentQuestionIndex - 1)}
                disabled={currentQuestionIndex === 0}
                className="px-3 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                &lt;&lt; BACK
              </button>
              <button
                type="button"
                onClick={() => goToQuestion(currentQuestionIndex + 1)}
                disabled={currentQuestionIndex === quiz.questions.length - 1}
                className="px-3 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                NEXT &gt;&gt;
              </button>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-2 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'SUBMIT'}
            </button>
          </div>
        </div>

        {/* Right: Question palette & legend */}
        <div className="space-y-4">
          {/* Legend */}
          <div className="bg-white shadow rounded-lg p-4 text-xs">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Question Status</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="inline-block w-4 h-4 rounded-sm bg-gray-100 border border-gray-300"></span>
                  <span>Not Visited</span>
                </div>
                <span>{statusCounts.NOT_VISITED}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="inline-block w-4 h-4 rounded-sm bg-red-100 border border-red-400"></span>
                  <span>Not Answered</span>
                </div>
                <span>{statusCounts.NOT_ANSWERED}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="inline-block w-4 h-4 rounded-sm bg-green-100 border border-green-500"></span>
                  <span>Answered</span>
                </div>
                <span>{statusCounts.ANSWERED}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="inline-block w-4 h-4 rounded-sm bg-purple-100 border border-purple-500"></span>
                  <span>Marked for Review</span>
                </div>
                <span>{statusCounts.MARKED_FOR_REVIEW}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="inline-block w-4 h-4 rounded-sm bg-indigo-100 border border-purple-600"></span>
                  <span>Answered &amp; Marked</span>
                </div>
                <span>{statusCounts.ANSWERED_MARKED_FOR_REVIEW}</span>
              </div>
            </div>
          </div>

          {/* Question palette */}
          <div className="bg-white shadow rounded-lg p-4 text-xs">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Questions</h3>
            <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
              {quiz.questions.map((_, idx) => {
                const status = getQuestionStatus(idx);
                const isCurrent = idx === currentQuestionIndex;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => goToQuestion(idx)}
                    className={`w-8 h-8 rounded text-xs font-semibold flex items-center justify-center border ${
                      isCurrent ? 'ring-2 ring-offset-1 ring-indigo-500' : ''
                    } ${getStatusClasses(status)}`}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

