import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { boardsService } from '../../services/boards.service';
import { contestsService } from '../../services/contests.service';
import type { Board } from '../../services/boards.service';
import type { CreateContestRequest } from '../../services/contests.service';

export default function CreateContest() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [subjects, setSubjects] = useState<{ name: string }[]>([]);
  const [chapters, setChapters] = useState<{ name: string }[]>([]);
  const [formData, setFormData] = useState<CreateContestRequest>({
    title: '',
    description: '',
    boardCode: '',
    standard: 10,
    subject: '',
    chapter: '',
    difficulty: 'medium',
    numQuestions: 10,
    questionTypes: ['MCQ'],
    timerSeconds: 600,
    startTime: '',
    endTime: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

  // Load subjects when board and standard are set
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!formData.boardCode || !formData.standard) {
        setSubjects([]);
        return;
      }
      try {
        const data = await boardsService.getSubjects(formData.boardCode, formData.standard);
        setSubjects(data);
        // reset subject/chapter when board/standard changes
        setFormData((prev) => ({ ...prev, subject: '', chapter: '' }));
        setChapters([]);
      } catch (err) {
        console.error('Failed to load subjects', err);
        setSubjects([]);
      }
    };
    fetchSubjects();
  }, [formData.boardCode, formData.standard]);

  // Load chapters when subject is set
  useEffect(() => {
    const fetchChapters = async () => {
      if (!formData.boardCode || !formData.standard || !formData.subject) {
        setChapters([]);
        return;
      }
      try {
        const data = await boardsService.getChapters(formData.boardCode, formData.standard, formData.subject);
        setChapters(data);
        setFormData((prev) => ({ ...prev, chapter: '' }));
      } catch (err) {
        console.error('Failed to load chapters', err);
        setChapters([]);
      }
    };
    fetchChapters();
  }, [formData.boardCode, formData.standard, formData.subject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const contest = await contestsService.createContest(formData);
      navigate(`/admin/contests/${contest._id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create contest');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create Contest</h1>
        <p className="mt-2 text-gray-600">Set up a new contest for students</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Board *</label>
              <select
                required
                value={formData.boardCode}
                onChange={(e) => setFormData({ ...formData, boardCode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select Board</option>
                {boards.map((board) => (
                  <option key={board._id} value={board.code}>
                    {board.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Standard *</label>
              <input
                type="number"
                min="1"
                max="12"
                required
                value={formData.standard}
                onChange={(e) => setFormData({ ...formData, standard: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Subject selector (based on board & standard) */}
          {subjects.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
              <select
                required
                value={formData.subject || ''}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select Subject</option>
                {subjects.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Chapter selector (based on subject) */}
          {chapters.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Chapter *</label>
              <select
                required
                value={formData.chapter || ''}
                onChange={(e) => setFormData({ ...formData, chapter: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select Chapter</option>
                {chapters.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Number of Questions</label>
              <input
                type="number"
                min="5"
                max="50"
                required
                value={formData.numQuestions}
                onChange={(e) => setFormData({ ...formData, numQuestions: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Timer (seconds)</label>
            <input
              type="number"
              min="60"
              required
              value={formData.timerSeconds}
              onChange={(e) => setFormData({ ...formData, timerSeconds: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Time *</label>
              <input
                type="datetime-local"
                required
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Time *</label>
              <input
                type="datetime-local"
                required
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Contest'}
          </button>
        </form>
      </div>
    </div>
  );
}


