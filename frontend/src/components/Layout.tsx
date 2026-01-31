import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { boardsService, type Board } from '../services/boards.service';
import { usersService } from '../services/users.service';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('theme') === 'dark';
  });

  const [boards, setBoards] = useState<Board[]>([]);
  const [isEditingEducation, setIsEditingEducation] = useState(false);
  const [editBoardCode, setEditBoardCode] = useState('');
  const [editStandard, setEditStandard] = useState<number | ''>('');
  const [savingEducation, setSavingEducation] = useState(false);

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    const loadBoards = async () => {
      try {
        const data = await boardsService.getBoards();
        setBoards(data);
      } catch (err) {
        console.error('Failed to load boards for profile edit', err);
      }
    };
    if (user?.role === 'student') {
      loadBoards();
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavLinks = () => {
    if (!user) return [];

    if (user.role === 'student') {
      return [
        { to: '/student/dashboard', label: 'Dashboard' },
        { to: '/student/learning', label: 'Practice' },
        { to: '/student/contests', label: 'Contests' },
        { to: '/student/analytics', label: 'Analytics' },
        { to: '/student/submissions', label: 'History' },
      ];
    } else if (user.role === 'admin') {
      return [
        { to: '/admin/dashboard', label: 'Dashboard' },
        { to: '/admin/students', label: 'Students' },
        { to: '/admin/contests', label: 'Contests' },
      ];
    } else if (user.role === 'parent') {
      return [
        { to: '/parent/dashboard', label: 'Dashboard' },
      ];
    }
    return [];
  };

  const studentInfo =
    user?.role === 'student'
      ? {
        board: user.boardCode || 'Board',
        standard: user.standard,
      }
      : null;

  const selectedBoard = boards.find((b) => b.code === (editBoardCode || user?.boardCode));
  const availableStandards = selectedBoard ? selectedBoard.standards.map((s) => s.grade) : [];

  const beginEditEducation = () => {
    if (!user || user.role !== 'student') return;
    setIsEditingEducation(true);
    setEditBoardCode(user.boardCode || '');
    setEditStandard(user.standard ?? '');
  };

  const cancelEditEducation = () => {
    setIsEditingEducation(false);
    setEditBoardCode('');
    setEditStandard('');
  };

  const saveEducation = async () => {
    if (!user || user.role !== 'student') return;
    if (!editBoardCode || editStandard === '' || typeof editStandard !== 'number') return;
    try {
      setSavingEducation(true);
      const updated = await usersService.updateEducation({
        boardCode: editBoardCode,
        standard: editStandard,
      });
      setUser(updated as any);
      localStorage.setItem('user', JSON.stringify(updated));
      cancelEditEducation();
    } catch (err) {
      console.error('Failed to update education', err);
    } finally {
      setSavingEducation(false);
    }
  };

  return (
    <div className={isDark ? 'min-h-screen bg-gray-900 text-gray-100' : 'min-h-screen bg-gray-50 text-gray-900'}>
      <nav className={isDark ? 'bg-gray-800 shadow-lg' : 'bg-white shadow-lg'}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="text-2xl font-bold text-indigo-600">
                  Quiz Platform
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {getNavLinks().map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center">
              {user && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsProfileOpen((prev) => !prev)}
                    className="flex items-center space-x-3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-full"
                    aria-haspopup="true"
                    aria-expanded={isProfileOpen}
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-9 w-9 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-semibold">
                      {(user.name && user.name.charAt(0).toUpperCase()) || 'S'}
                    </div>
                    <div className="hidden sm:flex flex-col items-start">
                      <span className="text-sm font-medium">
                        {user.name}
                      </span>
                      {studentInfo && (
                        <span className="text-xs text-gray-500">
                          {studentInfo.board} • Class {studentInfo.standard ?? '-'}
                        </span>
                      )}
                    </div>
                  </button>

                  {isProfileOpen && (
                    <div
                      className={
                        (isDark ? 'bg-gray-800 text-gray-100 ' : 'bg-white text-gray-900 ') +
                        'origin-top-right absolute right-0 mt-2 w-64 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20'
                      }
                      role="menu"
                      aria-orientation="vertical"
                    >
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-semibold">{user.name}</p>
                        {user.email && (
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        )}
                        {studentInfo && (
                          <p className="mt-1 text-xs text-gray-500">
                            {studentInfo.board} • Class {studentInfo.standard ?? '-'}
                          </p>
                        )}
                      </div>
                      <div className="py-1" role="none">
                        {user.role === 'student' && (
                          <>
                            {!isEditingEducation ? (
                              <button
                                type="button"
                                onClick={beginEditEducation}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                                role="menuitem"
                              >
                                Edit Class & Board
                              </button>
                            ) : (
                              <div className="px-4 py-2 space-y-2 text-sm">
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Board</label>
                                  <select
                                    value={editBoardCode}
                                    onChange={(e) => {
                                      setEditBoardCode(e.target.value);
                                      setEditStandard('');
                                    }}
                                    className="w-full px-2 py-1 border border-gray-300 rounded-md bg-transparent focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  >
                                    <option value="">Select Board</option>
                                    {boards.map((b) => (
                                      <option key={b._id} value={b.code}>
                                        {b.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Class</label>
                                  <select
                                    value={editStandard === '' ? '' : editStandard}
                                    onChange={(e) =>
                                      setEditStandard(
                                        e.target.value === '' ? '' : Number(e.target.value)
                                      )
                                    }
                                    className="w-full px-2 py-1 border border-gray-300 rounded-md bg-transparent focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  >
                                    <option value="">Select Class</option>
                                    {availableStandards.map((g) => (
                                      <option key={g} value={g}>
                                        Class {g}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="flex justify-end space-x-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={cancelEditEducation}
                                    className="px-2 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={saveEducation}
                                    disabled={savingEducation || !editBoardCode || editStandard === ''}
                                    className="px-3 py-1 text-xs bg-indigo-600 text-white rounded-md disabled:opacity-50"
                                  >
                                    {savingEducation ? 'Saving...' : 'Save'}
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => setIsDark((prev) => !prev)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                          role="menuitem"
                        >
                          {isDark ? 'Light Mode' : 'Dark Mode'}
                        </button>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                          role="menuitem"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}


