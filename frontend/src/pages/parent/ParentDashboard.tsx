import { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analytics.service';
import type { ParentAnalytics, ContestAnalyticsResponse } from '../../services/analytics.service';
import { submissionsService } from '../../services/submissions.service';
import type { Submission } from '../../services/submissions.service';

export default function ParentDashboard() {
  const [data, setData] = useState<ParentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  // State for detailed view
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await analyticsService.getParentChildren();
        setData(result);
      } catch (error) {
        console.error('Failed to fetch parent data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleViewDetails = async (childId: string) => {
    if (selectedChildId === childId) {
      // Toggle off if already selected
      setSelectedChildId(null);
      setSubmissions([]);
      setSelectedMonth('');
      return;
    }

    setSelectedChildId(childId);
    setSelectedMonth('');
    setLoadingSubmissions(true);
    try {
      const result = await submissionsService.getStudentSubmissions(childId);
      setSubmissions(result);
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Parent Dashboard</h1>
        <p className="mt-2 text-gray-600">Monitor your children's progress</p>
      </div>

      {data && (
        <>
          {/* Parent Info */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Parent Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500">Name:</span>
                <p className="text-lg font-medium text-gray-900">{data.parent.name}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Parent ID:</span>
                <p className="text-lg font-medium text-gray-900">{data.parent.parentId}</p>
              </div>
            </div>
          </div>

          {/* Children List */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Children's Progress</h2>
            <div className="grid grid-cols-1 gap-6">
              {data.children.map((child) => (
                <div key={child.id} className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{child.name}</h3>
                        <p className="text-sm text-gray-500">{child.email}</p>
                        {child.boardCode && child.standard && (
                          <p className="text-sm text-indigo-600 font-medium mt-1">
                            {child.boardCode} • Class {child.standard}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleViewDetails(child.id)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        {selectedChildId === child.id ? 'Hide Activity' : 'View Activity'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
                      <div className="bg-indigo-50 rounded-lg p-4">
                        <div className="text-sm text-gray-600">Total Quizzes</div>
                        <div className="text-2xl font-bold text-indigo-600">{child.totalQuizzes}</div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="text-sm text-gray-600">Total Appeared</div>
                        <div className="text-2xl font-bold text-blue-600">{child.totalAppeared || 0}</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="text-sm text-gray-600">Average Score</div>
                        <div className="text-2xl font-bold text-green-600">{child.avgScore.toFixed(1)}</div>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <div className="text-sm text-gray-600">Average Accuracy</div>
                        <div className="text-2xl font-bold text-yellow-600">{child.avgAccuracy.toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Activity Log */}
                  {/* Contest Analysis (New Section) */}
                  {selectedChildId === child.id && (
                    <div className="border-t border-gray-200 bg-gray-50 p-6">
                      <div className="border-t border-gray-200 bg-gray-50 p-6">
                        <div className="flex items-center justify-end mb-4 gap-2">
                          <label htmlFor="month-filter" className="text-sm text-gray-600">Month Filter:</label>
                          <input
                            id="month-filter"
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                          />
                          {selectedMonth && (
                            <button
                              onClick={() => setSelectedMonth('')}
                              className="text-xs text-indigo-600 hover:text-indigo-800"
                            >
                              Clear
                            </button>
                          )}
                        </div>

                        <ContestHistory childId={child.id} selectedMonth={selectedMonth} />

                        <div className="mt-8">
                          <h4 className="text-md font-bold text-gray-900 mb-4">Practice Quiz Activity</h4>
                          {/* Existing Submissions List reused as Practice Activity */}
                          {loadingSubmissions ? (
                            <div className="flex justify-center py-4">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                            </div>
                          ) : submissions.filter(s => {
                            if (s.quizMode === 'CONTEST') return false;
                            if (!selectedMonth) return true;
                            const d = new Date(s.completedAt);
                            const [year, month] = selectedMonth.split('-').map(Number);
                            return d.getFullYear() === year && d.getMonth() + 1 === month;
                          }).length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg shadow-sm">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accuracy</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {submissions.filter(s => {
                                    if (s.quizMode === 'CONTEST') return false;
                                    if (!selectedMonth) return true;
                                    const d = new Date(s.completedAt);
                                    const [year, month] = selectedMonth.split('-').map(Number);
                                    return d.getFullYear() === year && d.getMonth() + 1 === month;
                                  }).map((sub) => (
                                    <tr key={sub._id}>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(sub.completedAt).toLocaleDateString()}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {sub.quizTitle || 'Practice Quiz'}
                                        <div className="text-xs text-gray-500">
                                          {sub.quizSubject ? `${sub.quizSubject}` : ''}
                                          {sub.quizChapter ? ` - ${sub.quizChapter}` : ''}
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {sub.quizDifficulty && (
                                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full mr-2 ${sub.quizDifficulty === 'hard' ? 'bg-red-100 text-red-800' :
                                            sub.quizDifficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                              'bg-blue-100 text-blue-800'
                                            }`}>
                                            {sub.quizDifficulty}
                                          </span>
                                        )}
                                        <span className="text-xs text-gray-400">({sub.totalQuestions} Qs)</span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {sub.score} / {sub.totalQuestions}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {sub.accuracy.toFixed(1)}%
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-gray-500 italic">No practice activity recorded yet.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {data.children.length === 0 && (
            <div className="bg-white shadow rounded-lg p-12 text-center">
              <p className="text-gray-500">No children linked to this account</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Sub-component for Contest History
function ContestHistory({ childId, selectedMonth }: { childId: string, selectedMonth: string }) {
  const [contests, setContests] = useState<ContestAnalyticsResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContests = async () => {
      try {
        const data = await analyticsService.getChildContestAnalytics(childId);
        setContests(data);
      } catch (error) {
        console.error('Failed to fetch contest history:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchContests();
  }, [childId]);

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Filter logic: Only COMPLETED + Optional Month Filter
  const filteredContests = contests.filter((c) => {
    if (c.status !== 'COMPLETED') return false;
    if (!selectedMonth) return true;
    const contestDate = new Date(c.startTime);
    const [year, month] = selectedMonth.split('-').map(Number);
    return contestDate.getFullYear() === year && contestDate.getMonth() + 1 === month;
  });

  if (contests.length === 0) {
    return (
      <div>
        <h4 className="text-md font-bold text-gray-900 mb-4">Contest History</h4>
        <p className="text-gray-500 italic">No contests available for this student's class yet.</p>
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-md font-bold text-gray-900 mb-4">Contest History</h4>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg shadow-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contest Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">My Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredContests.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500 italic">
                  No contests found for the selected month.
                </td>
              </tr>
            ) : (
              filteredContests.map((contest) => (
                <tr key={contest.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(contest.startTime).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {contest.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${contest.status === 'LIVE' ? 'bg-green-100 text-green-800' :
                      contest.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                      {contest.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${contest.userStatus === 'Attempted' ? 'bg-purple-100 text-purple-800' : 'bg-red-100 text-red-800'
                      }`}>
                      {contest.userStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {contest.userStatus === 'Attempted' ? (
                      <span>{contest.score} / {contest.totalQuestions} <span className="text-xs text-gray-500">({contest.accuracy?.toFixed(1)}%)</span></span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              )))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
