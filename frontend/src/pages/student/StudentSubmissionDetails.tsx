import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { submissionsService } from '../../services/submissions.service';
import type { Submission } from '../../services/submissions.service';
import type { Quiz } from '../../services/learning.service';

interface SubmissionDetailsResponse {
  submission: Submission;
  quiz: Quiz;
}

export default function StudentSubmissionDetails() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<SubmissionDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      setError('');
      try {
        const details = await submissionsService.getSubmissionDetails(id);
        setData(details as any);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load submission details');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="px-4 py-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error || 'Submission not found'}</p>
        </div>
      </div>
    );
  }

  const { submission, quiz } = data;
  const isContestQuiz = !!submission.contestId;

  return (
    <div className="px-4 py-6 sm:px-0 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isContestQuiz ? 'Contest Quiz Result' : 'Quiz Result'}
          </h1>
          <p className="mt-2 text-gray-600">
            {quiz.title || (isContestQuiz ? 'Contest Quiz' : 'Practice Quiz')} • {quiz.boardCode} • Class {quiz.standard} • {quiz.difficulty}
          </p>
        </div>
        <div className="text-right text-sm text-gray-600">
          <p>
            Completed:{' '}
            <span className="font-medium">{new Date(submission.completedAt).toLocaleString()}</span>
          </p>
          <p>
            Score:{' '}
            <span className="font-medium">
              {submission.score}/{submission.totalQuestions}
            </span>
          </p>
          <p>
            Accuracy:{' '}
            <span className="font-medium">{submission.accuracy.toFixed(1)}%</span>
          </p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-4 flex items-center justify-between text-sm">
        <div>
          {isContestQuiz ? (
            <p className="text-gray-700">
              This quiz was part of a contest. Detailed solutions are available only on the
              contest page after the contest has ended.
            </p>
          ) : (
            <p className="text-gray-700">
              Review your answers along with correct options and explanations. Use this to understand
              mistakes and strengthen weak areas.
            </p>
          )}
        </div>
        <Link
          to={isContestQuiz ? '/student/contests' : '/student/learning'}
          state={isContestQuiz ? undefined : { activeOption: 'existing' }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          {isContestQuiz ? 'Back to Contests' : 'Back to Practice Quizzes'}
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Question-wise Solutions</h2>
        <div className="space-y-4">
          {isContestQuiz ? (
            <p className="text-gray-600 text-sm">
              Solutions for contest quizzes are not shown here. Please open the corresponding contest
              page to view official solutions once the contest is completed.
            </p>
          ) : (
            quiz.questions.map((q, index) => {
              const answer = submission.answers.find((a) => a.questionIndex === index);
              const isCorrect = answer?.isCorrect ?? false;

              return (
                <div key={index} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium text-gray-900">
                      Q{index + 1}. {q.prompt}
                    </p>
                    <span
                      className={`ml-4 px-2 py-1 rounded text-xs font-semibold ${
                        isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>

                  {q.type === 'MCQ' && q.options && (
                    <div className="mt-2 space-y-1 text-sm">
                      {q.options.map((option, optIndex) => {
                        const isStudentChoice = answer?.selectedOptionIndex === optIndex;
                        const isRight = q.correctOptionIndex === optIndex;

                        return (
                          <div
                            key={optIndex}
                            className={`flex items-center px-2 py-1 rounded border text-sm ${
                              isRight
                                ? 'border-green-500 bg-green-50'
                                : isStudentChoice
                                ? 'border-red-400 bg-red-50'
                                : 'border-gray-200'
                            }`}
                          >
                            <span className="mr-2 text-xs font-mono">({String.fromCharCode(65 + optIndex)})</span>
                            <span>{option}</span>
                            {isRight && (
                              <span className="ml-auto text-xs font-semibold text-green-700">Correct Answer</span>
                            )}
                            {!isRight && isStudentChoice && (
                              <span className="ml-auto text-xs font-semibold text-red-700">Your Answer</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {q.type === 'NUMERIC' && (
                    <div className="mt-2 text-sm space-y-1">
                      <p>
                        Correct answer:{' '}
                        <span className="font-semibold text-green-700">{q.correctAnswerText}</span>
                      </p>
                      <p>
                        Your answer:{' '}
                        <span className="font-semibold text-gray-800">
                          {answer?.answerText ?? 'Not answered'}
                        </span>
                      </p>
                    </div>
                  )}

                  {q.explanation && (
                    <p className="mt-2 text-xs text-gray-600">Explanation: {q.explanation}</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
