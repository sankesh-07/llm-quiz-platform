import { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analytics.service';
import type {
  StudentSummary,
  SubjectAnalytics,
  ChapterAnalytics,
  AnalyticsMode,
  ContestAnalyticsSummary,
} from '../../services/analytics.service';

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<StudentSummary | null>(null);
  const [subjectAnalytics, setSubjectAnalytics] = useState<SubjectAnalytics[]>([]);
  const [chapterAnalytics, setChapterAnalytics] = useState<ChapterAnalytics[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<AnalyticsMode>('PRACTICE');
  const [contestAnalytics, setContestAnalytics] = useState<ContestAnalyticsSummary | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const basePromises: Promise<unknown>[] = [
          analyticsService.getStudentSummary(mode),
          analyticsService.getStudentBySubject(mode),
        ];

        if (mode === 'CONTEST') {
          basePromises.push(analyticsService.getStudentContestAnalytics());
        }

        const results = await Promise.all(basePromises);
        const summaryData = results[0] as StudentSummary;
        const subjectData = results[1] as SubjectAnalytics[];
        const contestData = mode === 'CONTEST' ? (results[2] as ContestAnalyticsSummary) : null;

        setSummary(summaryData);
        setSubjectAnalytics(subjectData);
        setContestAnalytics(contestData);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [mode]);

  useEffect(() => {
    const fetchChapters = async () => {
      try {
        const data = await analyticsService.getStudentByChapter(selectedSubject || undefined, mode);
        setChapterAnalytics(data);
      } catch (error) {
        console.error('Failed to fetch chapter analytics:', error);
      }
    };
    fetchChapters();
  }, [selectedSubject, mode]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const totalQuizzes = summary?.totalQuizzes ?? 0;
  const avgScore = summary?.avgScore ?? 0;
  const avgAccuracy = summary?.avgAccuracy ?? 0;

  const modeLabel = mode === 'PRACTICE' ? 'Practice' : 'Contest';

  const getGradeInfo = (accuracy: number) => {
    if (Number.isNaN(accuracy)) {
      return { label: '-', className: 'bg-gray-300 text-gray-800' };
    }
    if (accuracy >= 90) return { label: 'A+', className: 'bg-green-800 text-white' };
    if (accuracy >= 80) return { label: 'A', className: 'bg-green-600 text-white' };
    if (accuracy >= 70) return { label: 'B+', className: 'bg-blue-600 text-white' };
    if (accuracy >= 60) return { label: 'B', className: 'bg-yellow-400 text-gray-900' };
    if (accuracy >= 50) return { label: 'C', className: 'bg-orange-500 text-white' };
    if (accuracy >= 40) return { label: 'D', className: 'bg-red-500 text-white' };
    return { label: 'F', className: 'bg-gray-400 text-white' };
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Progress</h1>
          <p className="mt-2 text-gray-600">Track your {modeLabel.toLowerCase()} performance</p>
        </div>
        <div className="mt-4 sm:mt-0 inline-flex rounded-lg border border-gray-300 bg-white shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setMode('PRACTICE')}
            className={`px-4 py-2 text-sm font-medium ${mode === 'PRACTICE'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
          >
            Practice
          </button>
          <button
            type="button"
            onClick={() => setMode('CONTEST')}
            className={`px-4 py-2 text-sm font-medium border-l border-gray-300 ${mode === 'CONTEST'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
          >
            Contest
          </button>
        </div>
      </div>

      {/* Summary Cards (only in Practice mode) */}
      {mode === 'PRACTICE' && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Quizzes</dt>
                    <dd className="text-2xl font-semibold text-gray-900">{summary?.totalQuizzes || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Average Score</dt>
                    <dd className="text-2xl font-semibold text-gray-900">{summary?.avgScore.toFixed(1) || '0.0'}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Average Accuracy</dt>
                    <dd className="text-2xl font-semibold text-gray-900">{summary?.avgAccuracy.toFixed(1) || '0.0'}%</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contest summary (only in Contest mode) */}
      {mode === 'CONTEST' && contestAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                  <span className="text-white text-lg font-bold">C</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Contests</dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {contestAnalytics.totalContests}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <span className="text-white text-lg font-bold">✓</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Attempted</dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {contestAnalytics.attemptedContests}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
                  <span className="text-white text-lg font-bold">✕</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Missed</dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {contestAnalytics.missedContests}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Avg Score</dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {contestAnalytics.avgScore?.toFixed(1) || '0.0'}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Avg Accuracy</dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {contestAnalytics.avgAccuracy?.toFixed(1) || '0.0'}%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Summary (only in Practice mode) */}
      {/* Performance Summary (only in Practice mode) */}
      {mode === 'PRACTICE' && (
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Performance Summary</h2>
          </div>
          <div className="p-6 text-sm text-gray-700 space-y-2">
            <p>
              The student is showing steady and improving performance in {modeLabel.toLowerCase()} quizzes.
              With <span className="font-semibold">{totalQuizzes}</span> total quizzes taken, the current average score is
              <span className="font-semibold"> {avgScore.toFixed(1)}</span> and the average accuracy is
              <span className="font-semibold"> {avgAccuracy.toFixed(1)}%</span>.
            </p>
            <p>
              Accuracy levels indicate a solid grasp of most concepts, while a few topics may still need targeted
              revision for stronger retention. Performance under timed, exam-like conditions is stable, and time
              management is appropriate for the current difficulty level.
            </p>
            <p>
              With regular practice and continued participation in contests, the student is well-positioned to further
              increase confidence, accuracy, and overall exam readiness.
            </p>
          </div>
        </div>
      )}

      {/* Subject Analytics (only in Practice mode) */}
      {mode === 'PRACTICE' && (
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Performance by Subject</h2>
          </div>
          <div className="p-6">
            {subjectAnalytics.length > 0 ? (
              <div className="space-y-4">
                {subjectAnalytics.map((item) => (
                  <div key={item.subject}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900">{item.subject}</span>
                      <span className="text-sm text-gray-600">
                        {item.correct}/{item.totalQuestions} ({item.accuracy.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{ width: `${item.accuracy}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No subject data available</p>
            )}
          </div>
        </div>
      )}

      {/* Chapter Analytics (only in Practice mode) */}
      {mode === 'PRACTICE' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Performance by Chapter</h2>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Subjects</option>
                {subjectAnalytics.map((subj) => (
                  <option key={subj.subject} value={subj.subject}>
                    {subj.subject}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="p-6">
            {chapterAnalytics.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {chapterAnalytics.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <span className="font-medium text-gray-900">{item.chapter}</span>
                        <span className="text-sm text-gray-500 ml-2">({item.subject})</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{item.accuracy.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${item.accuracy}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {item.correct}/{item.totalQuestions} correct
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No chapter data available</p>
            )}
          </div>
        </div>
      )}

      {/* Contest-wise performance list with grades (Contest mode) */}
      {mode === 'CONTEST' && contestAnalytics && (
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Contest-wise Performance</h2>
          </div>
          <div className="p-6 space-y-4">
            {contestAnalytics.contests.filter((c) => c.attempted).length === 0 ? (
              <p className="text-gray-500 text-center py-4">No attempted contests yet.</p>
            ) : (
              contestAnalytics.contests
                .filter((c) => c.attempted)
                .map((contest) => {
                  const accuracyRaw = contest.accuracy ?? 0;
                  const accuracy = Number.isFinite(accuracyRaw) ? accuracyRaw : 0;
                  const gradeInfo = getGradeInfo(accuracy);
                  const percentageLabel = `${accuracy.toFixed(1)}%`;

                  return (
                    <div key={contest.id} className="border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">{contest.title}</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {contest.attempted ? 'Attempted contest' : 'Missed contest'}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            Score: <span className="font-semibold">{percentageLabel}</span>
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold ${gradeInfo.className}`}
                        >
                          {gradeInfo.label}
                        </span>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}
    </div>
  );
}


