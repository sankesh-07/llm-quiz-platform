import { useState, useEffect } from 'react';
import { usersService, type UserProfile } from '../../services/users.service';
import { boardsService, type Board } from '../../services/boards.service';

export default function StudentInformation() {
    const [students, setStudents] = useState<UserProfile[]>([]);
    const [boards, setBoards] = useState<Board[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [selectedBoard, setSelectedBoard] = useState<string>('');
    const [selectedStandard, setSelectedStandard] = useState<number | ''>('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<UserProfile | null>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    useEffect(() => {
        loadBoards();
    }, []);

    useEffect(() => {
        loadStudents();
    }, [selectedBoard, selectedStandard]);

    const loadBoards = async () => {
        try {
            const data = await boardsService.getBoards();
            setBoards(data);
        } catch (err) {
            console.error('Failed to load boards', err);
        }
    };

    const loadStudents = async () => {
        try {
            setLoading(true);
            const filters: any = {};
            if (selectedBoard) filters.boardCode = selectedBoard;
            if (selectedStandard) filters.standard = selectedStandard;

            const data = await usersService.getStudents(filters);
            setStudents(data);
        } catch (err) {
            console.error('Failed to load students', err);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (student: UserProfile) => {
        setIsModalOpen(true);
        setDetailsLoading(true);
        try {
            const details = await usersService.getStudentDetails(student.id);
            setSelectedStudent(details);
        } catch (err) {
            console.error('Failed to load student details', err);
        } finally {
            setDetailsLoading(false);
        }
    };

    const currentBoard = boards.find(b => b.code === selectedBoard);
    const availableStandards = currentBoard ? currentBoard.standards.map(s => s.grade) : [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Student Information</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        View and manage specific details of all registered students.
                    </p>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    {students.length} students found
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                    </svg>
                    Filters
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label htmlFor="board-filter" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Select Board
                        </label>
                        <select
                            id="board-filter"
                            value={selectedBoard}
                            onChange={(e) => {
                                setSelectedBoard(e.target.value);
                                setSelectedStandard(''); // Reset standard when board changes
                            }}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white py-2 px-3"
                        >
                            <option value="">All Boards</option>
                            {boards.map((board) => (
                                <option key={board._id} value={board.code}>
                                    {board.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="standard-filter" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Select Class
                        </label>
                        <select
                            id="standard-filter"
                            value={selectedStandard}
                            onChange={(e) => setSelectedStandard(e.target.value ? Number(e.target.value) : '')}
                            disabled={!selectedBoard}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white py-2 px-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <option value="">All Classes</option>
                            {availableStandards.map((std) => (
                                <option key={std} value={std}>
                                    Class {std}
                                </option>
                            ))}
                        </select>
                        {!selectedBoard && (
                            <p className="mt-1 text-xs text-gray-400">Select a board first to filter by class</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Students List */}
            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
                {loading ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading students...</div>
                ) : students.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">No students found matching the selected filters.</div>
                ) : (
                    <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
                        {students.map((student) => {
                            // Try to find board name for display
                            const boardName = boards.find(b => b.code === student.boardCode)?.name || student.boardCode || 'No Board';

                            return (
                                <li key={student.id}>
                                    <div className="px-4 py-4 flex items-center sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150 ease-in-out">
                                        <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    {/* Avatar Placeholder */}
                                                    <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                                                        {(student.name && student.name.charAt(0).toUpperCase()) || 'S'}
                                                    </div>
                                                </div>
                                                <div className="ml-4 truncate">
                                                    <div className="flex text-sm">
                                                        <p className="font-medium text-indigo-600 truncate dark:text-indigo-400">{student.name}</p>
                                                        <p className="ml-1 flex-shrink-0 font-normal text-gray-500 dark:text-gray-400 uppercase">
                                                            {/* Displaying ID/Role or extra info if needed, for now just name is prominent */}
                                                        </p>
                                                    </div>
                                                    <div className="mt-2 flex">
                                                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                                            </svg>
                                                            <p>
                                                                {boardName}
                                                                {student.standard ? ` • Class ${student.standard}` : ''}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="ml-5 flex-shrink-0">
                                            <button
                                                onClick={() => handleViewDetails(student)}
                                                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                                                title="View Details"
                                            >
                                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {/* Student Details Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        {/* Background overlay */}
                        <div
                            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                            aria-hidden="true"
                            onClick={() => setIsModalOpen(false)}
                        ></div>

                        {/* Modal panel */}
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                                            Student Details
                                        </h3>

                                        {detailsLoading ? (
                                            <div className="mt-4 flex justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                            </div>
                                        ) : selectedStudent ? (
                                            <div className="mt-4 space-y-4">
                                                <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                                                    <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Student Information</h4>
                                                    <div className="grid grid-cols-1 gap-2">
                                                        <div>
                                                            <label className="block text-xs text-gray-400">Name</label>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedStudent.name}</p>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs text-gray-400">Email</label>
                                                            <p className="text-sm text-gray-900 dark:text-gray-100">{selectedStudent.email}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div>
                                                    <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Parent Information</h4>
                                                    {selectedStudent.parent ? (
                                                        <div className="grid grid-cols-1 gap-2">
                                                            <div>
                                                                <label className="block text-xs text-gray-400">Parent Name</label>
                                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedStudent.parent.name}</p>
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs text-gray-400">Parent Email</label>
                                                                <p className="text-sm text-gray-900 dark:text-gray-100">{selectedStudent.parent.email || 'N/A'}</p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm italic text-gray-500 dark:text-gray-400">No parent information available</p>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="mt-4 text-center text-red-500">Failed to load details</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 dark:border-gray-500"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
