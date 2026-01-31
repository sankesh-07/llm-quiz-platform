import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { contestsService } from '../../services/contests.service';
import type { Contest } from '../../services/contests.service';

export default function ContestManagement() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contest, setContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editDurationMinutes, setEditDurationMinutes] = useState<number | ''>('');
  const [isEditingDetails, setIsEditingDetails] = useState(false);

  // Preview & Selection State
  const [showPreview, setShowPreview] = useState(false);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectionMode, setSelectionMode] = useState<'auto' | 'manual'>('auto');
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  const toLocalInput = (iso: string) => {
    const d = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const min = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  useEffect(() => {
    const fetchContest = async () => {
      if (!id) return;
      try {
        const data = await contestsService.getContest(id);
        setContest(data);
        setEditStart(toLocalInput(data.startTime));
        setEditEnd(toLocalInput(data.endTime));
        setEditDurationMinutes(Math.floor(data.timerSeconds / 60));
      } catch (error) {
        console.error('Failed to fetch contest:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchContest();
  }, [id]);

  const handleGenerateTemplate = async () => {
    if (!id) return;
    setActionLoading('generate');
    try {
      // Step 1: Generate candidates
      const { questions } = await contestsService.generateCandidateQuestions(id);
      setCandidates(questions);

      // Default: Auto-select random N questions
      selectRandomQuestions(questions, contest?.numQuestions || 0);
      setSelectionMode('auto');
      setShowPreview(true);
    } catch (error) {
      console.error('Failed to generate template:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const selectRandomQuestions = (pool: any[], count: number) => {
    const indices = new Set<number>();
    if (count >= pool.length) {
      pool.forEach((_, i) => indices.add(i));
    } else {
      while (indices.size < count) {
        indices.add(Math.floor(Math.random() * pool.length));
      }
    }
    setSelectedIndices(indices);
  };

  const toggleSelection = (index: number) => {
    if (selectionMode === 'auto') return; // Cannot toggle manually in auto mode
    const newSet = new Set(selectedIndices);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setSelectedIndices(newSet);
  };

  const handleConfirmQuiz = async () => {
    if (!id) return;
    setActionLoading('confirm');
    try {
      const selectedQuestions = candidates.filter((_, i) => selectedIndices.has(i));
      await contestsService.saveQuizTemplate(id, selectedQuestions);
      const updated = await contestsService.getContest(id);
      setContest(updated);
      setShowPreview(false);
    } catch (error) {
      console.error('Failed to save quiz:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusChange = async (status: Contest['status']) => {
    if (!id) return;
    setActionLoading('status');
    try {
      await contestsService.updateContestStatus(id, status);
      const updated = await contestsService.getContest(id);
      setContest(updated);
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteContest = async () => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this contest? This cannot be undone.')) {
      return;
    }

    setActionLoading('delete');
    try {
      await contestsService.deleteContest(id);
      navigate('/admin/contests');
    } catch (error) {
      console.error('Failed to delete contest:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateTiming = async () => {
    if (!id) return;

    const duration =
      editDurationMinutes === '' ? NaN : Number(editDurationMinutes);

    if (!editStart || !editEnd || !duration || duration <= 0 || Number.isNaN(duration)) {
      console.warn('[ContestManagement] invalid timing values', {
        editStart,
        editEnd,
        editDurationMinutes,
      });
      return;
    }

    setActionLoading('timing');
    try {
      const updated = await contestsService.updateContestTiming(id, {
        startTime: editStart,
        endTime: editEnd,
        timerSeconds: duration * 60,
      });
      setContest(updated);
      // Re-sync edit fields from server response and exit edit mode
      setEditStart(toLocalInput(updated.startTime));
      setEditEnd(toLocalInput(updated.endTime));
      setEditDurationMinutes(Math.floor(updated.timerSeconds / 60));
      setIsEditingDetails(false);
    } catch (error) {
      console.error('Failed to update timing:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Leaderboard State
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const handleViewLeaderboard = async () => {
    if (!contest) return;
    try {
      const data = await contestsService.getLeaderboard(contest._id);
      setLeaderboard(data.leaderboard);
      setShowLeaderboard(true);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!contest) {
    return <div className="px-4 py-6">Contest not found</div>;
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full m-4 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Contest Leaderboard</h3>
              <button onClick={() => setShowLeaderboard(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accuracy</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed At</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leaderboard.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                          No participants yet.
                        </td>
                      </tr>
                    ) : (
                      leaderboard.map((entry) => (
                        <tr key={entry.studentId}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-white ${entry.rank === 1 ? 'bg-yellow-400' :
                              entry.rank === 2 ? 'bg-gray-400' :
                                entry.rank === 3 ? 'bg-orange-400' : 'bg-gray-200 text-gray-700'
                              }`}>
                              {entry.rank}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{entry.studentName}</div>
                            <div className="text-sm text-gray-500">{entry.studentEmail}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {entry.score}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {entry.accuracy.toFixed(1)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(entry.completedAt).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowLeaderboard(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full m-4 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Review Quiz Questions</h3>
              <button onClick={() => setShowPreview(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <span className="font-medium text-gray-700">Selection Mode:</span>
                <div className="flex bg-white rounded-lg border border-gray-300 overflow-hidden">
                  <button
                    onClick={() => {
                      setSelectionMode('auto');
                      selectRandomQuestions(candidates, contest?.numQuestions || 0);
                    }}
                    className={`px-4 py-2 text-sm font-medium ${selectionMode === 'auto' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    Auto Selection
                  </button>
                  <button
                    onClick={() => setSelectionMode('manual')}
                    className={`px-4 py-2 text-sm font-medium ${selectionMode === 'manual' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    Manual Selection
                  </button>
                </div>
              </div>
              <div className="text-sm">
                <span className="font-medium">Selected: </span>
                <span className={`${selectedIndices.size === (contest?.numQuestions || 0) ? 'text-green-600' : 'text-orange-600'} font-bold`}>
                  {selectedIndices.size}
                </span>
                <span className="text-gray-500"> / {contest?.numQuestions} required</span>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                {candidates.map((q, idx) => (
                  <div
                    key={idx}
                    onClick={() => selectionMode === 'manual' && toggleSelection(idx)}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${selectedIndices.has(idx)
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                      } ${selectionMode === 'auto' ? 'opacity-75 cursor-default' : ''}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`mt-1 flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center ${selectedIndices.has(idx)
                        ? 'bg-indigo-600 border-indigo-600'
                        : 'border-gray-400 bg-white'
                        }`}>
                        {selectedIndices.has(idx) && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{idx + 1}. {q.prompt}</p>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-600">
                          {q.options?.map((opt: string, i: number) => (
                            <div key={i} className={i === q.correctOptionIndex ? 'text-green-700 font-medium' : ''}>
                              {String.fromCharCode(65 + i)}. {opt}
                            </div>
                          ))}
                          {q.correctAnswerText && <div className="text-green-700 font-medium">Answer: {q.correctAnswerText}</div>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button onClick={() => setShowPreview(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
              <button
                onClick={handleConfirmQuiz}
                disabled={selectedIndices.size !== (contest?.numQuestions || 0) || actionLoading === 'confirm'}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading === 'confirm' ? 'Saving...' : 'Confirm & Publish Quiz'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <button
          onClick={() => navigate('/admin/contests')}
          className="text-indigo-600 hover:text-indigo-800 mb-4"
        >
          ← Back to Contests
        </button>
        <h1 className="text-3xl font-bold text-gray-900">{contest.title}</h1>
        <p className="mt-2 text-gray-600">{contest.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Contest Info */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Contest Details</h2>
              <button
                type="button"
                onClick={() => setIsEditingDetails((prev) => !prev)}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
              >
                {isEditingDetails ? 'Cancel' : 'Edit'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500">Status</span>
                <p className="text-lg font-medium capitalize">{contest.status}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Difficulty</span>
                <p className="text-lg font-medium capitalize">{contest.difficulty}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Questions</span>
                <p className="text-lg font-medium">{contest.numQuestions}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Duration</span>
                {isEditingDetails ? (
                  <input
                    type="number"
                    min={1}
                    value={editDurationMinutes}
                    onChange={(e) =>
                      setEditDurationMinutes(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                ) : (
                  <p className="text-lg font-medium">
                    {Math.floor(contest.timerSeconds / 60)} minutes
                  </p>
                )}
              </div>
              <div>
                <span className="text-sm text-gray-500">Start Time</span>
                {isEditingDetails ? (
                  <input
                    type="datetime-local"
                    value={editStart}
                    onChange={(e) => setEditStart(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                ) : (
                  <p className="text-lg font-medium">
                    {new Date(contest.startTime).toLocaleString()}
                  </p>
                )}
              </div>
              <div>
                <span className="text-sm text-gray-500">End Time</span>
                {isEditingDetails ? (
                  <input
                    type="datetime-local"
                    value={editEnd}
                    onChange={(e) => setEditEnd(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                ) : (
                  <p className="text-lg font-medium">
                    {new Date(contest.endTime).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
            {isEditingDetails && (
              <div className="mt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditingDetails(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateTiming}
                  disabled={actionLoading === 'timing'}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {actionLoading === 'timing' ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Actions</h2>
            <div className="space-y-4">
              {!contest.quizTemplateId && (
                <button
                  onClick={handleGenerateTemplate}
                  disabled={actionLoading !== null}
                  className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {actionLoading === 'generate' ? 'Generating...' : 'Generate Quiz Template'}
                </button>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Change Status</label>
                <select
                  value={contest.status}
                  onChange={(e) => handleStatusChange(e.target.value as Contest['status'])}
                  disabled={actionLoading !== null}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="LIVE">Live</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>

              {contest.status === 'COMPLETED' && (
                <button
                  onClick={() => navigate(`/admin/contests/${contest._id}/overview`)}
                  className="w-full bg-teal-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-700"
                >
                  View Overview
                </button>
              )}

              <button
                onClick={handleDeleteContest}
                disabled={actionLoading !== null}
                className="w-full bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading === 'delete' ? 'Deleting...' : 'Delete Contest'}
              </button>

              <button
                onClick={handleViewLeaderboard}
                className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700"
              >
                View Leaderboard
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Status Indicators */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Quiz Template</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${contest.quizTemplateId ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                  {contest.quizTemplateId ? 'Generated' : 'Not Generated'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Results Published</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${contest.resultsPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                  {contest.resultsPublished ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Solutions Published</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${contest.solutionsPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                  {contest.solutionsPublished ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


