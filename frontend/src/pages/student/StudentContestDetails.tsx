import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { contestsService, type Contest, type Leaderboard } from '../../services/contests.service';
import type { Quiz } from '../../services/learning.service';

export default function StudentContestDetails() {
  const { id } = useParams<{ id: string }>();
  const [contest, setContest] = useState<Contest | null>(null);
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [solutionsQuiz, setSolutionsQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      setLoading(true);
      setError('');

      try {
        const contestData = await contestsService.getContest(id);
        setContest(contestData);

        if (contestData.status === 'COMPLETED') {
          try {
            const lb = await contestsService.getLeaderboard(contestData._id);
            setLeaderboard(lb);
          } catch (err) {
            console.error('Failed to load leaderboard', err);
          }

          if (contestData.solutionsPublished) {
            try {
              const quiz = await contestsService.getSolutions(contestData._id);
              setSolutionsQuiz(quiz);
            } catch (err) {
              console.error('Failed to load solutions', err);
            }
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load contest');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !contest) {
    return (
      <div className="px-4 py-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error || 'Contest not found'}</p>
        </div>
      </div>
    );
  }

  const isCompleted = contest.status === 'COMPLETED';

  return (
    <div className="px-4 py-6 sm:px-0 space-y-6">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-gray-900">{contest.title}</h1>
        <p className="mt-2 text-gray-600">{contest.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Contest summary */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Contest Summary</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Status</span>
                <p className="font-medium capitalize">{contest.status}</p>
              </div>
              <div>
                <span className="text-gray-500">Questions</span>
                <p className="font-medium">{contest.numQuestions}</p>
              </div>
              <div>
                <span className="text-gray-500">Duration</span>
                <p className="font-medium">{Math.floor(contest.timerSeconds / 60)} min</p>
              </div>
              <div>
                <span className="text-gray-500">Start</span>
                <p className="font-medium">{new Date(contest.startTime).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-gray-500">End</span>
                <p className="font-medium">{new Date(contest.endTime).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Results</h2>
            {!isCompleted && (
              <p className="text-gray-600">Contest is not completed yet. Results will be available after it ends.</p>
            )}

            {isCompleted && !leaderboard && (
              <p className="text-gray-600">Results are being prepared. Please check back soon.</p>
            )}

            {isCompleted && leaderboard && (
              <div className="space-y-2">
                {leaderboard.leaderboard.map((entry) => (
                  <div
                    key={entry.studentId}
                    className="flex justify-between items-center border-b border-gray-100 py-2 text-sm"
                  >
                    <div>
                      <span className="font-semibold mr-2">#{entry.rank}</span>
                      <span className="font-medium">{entry.studentName}</span>
                      <span className="ml-2 text-gray-500 text-xs">{entry.studentEmail}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">Score: {entry.score}</div>
                      <div className="text-xs text-gray-500">Accuracy: {entry.accuracy.toFixed(1)}%</div>
                    </div>
                  </div>
                ))}

                {leaderboard.leaderboard.length === 0 && (
                  <p className="text-gray-500">No submissions yet.</p>
                )}
              </div>
            )}
          </div>

          {/* Solutions (shown under Results) */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Solutions</h2>
            {!isCompleted && (
              <p className="text-gray-600">Solutions will be available after the contest is completed.</p>
            )}

            {isCompleted && !contest.solutionsPublished && (
              <p className="text-gray-600">Solutions are not available yet.</p>
            )}

            {isCompleted && contest.solutionsPublished && !solutionsQuiz && (
              <p className="text-gray-600">Loading solutions...</p>
            )}

            {isCompleted && contest.solutionsPublished && solutionsQuiz && (
              <div className="space-y-4">
                {solutionsQuiz.questions.map((q, index) => (
                  <div key={index} className="border border-gray-100 rounded-lg p-3">
                    <p className="font-medium text-gray-900 mb-1">
                      Q{index + 1}. {q.prompt}
                    </p>
                    {q.type === 'MCQ' && q.options && typeof q.correctOptionIndex === 'number' && (
                      <p className="text-sm text-green-700">
                        Correct option: <span className="font-semibold">{q.options[q.correctOptionIndex]}</span>
                      </p>
                    )}
                    {q.type === 'NUMERIC' && q.correctAnswerText && (
                      <p className="text-sm text-green-700">
                        Correct answer: <span className="font-semibold">{q.correctAnswerText}</span>
                      </p>
                    )}
                    {q.explanation && (
                      <p className="text-xs text-gray-600 mt-1">Explanation: {q.explanation}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status sidebar */}
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Status</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Contest Status</span>
                <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                  {contest.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Results</span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    contest.resultsPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {contest.resultsPublished ? 'Available' : 'Not Available'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Solutions</span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    contest.solutionsPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {contest.solutionsPublished ? 'Available' : 'Not Available'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
