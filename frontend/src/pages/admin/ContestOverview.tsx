import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { contestsService, type Contest, type ContestStats } from '../../services/contests.service';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ContestOverview() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [contest, setContest] = useState<Contest | null>(null);
    const [stats, setStats] = useState<ContestStats | null>(null);
    const [loading, setLoading] = useState(true);

    const [showMissedModal, setShowMissedModal] = useState(false);

    useEffect(() => {
        if (id) {
            loadData(id);
        }
    }, [id]);

    const loadData = async (contestId: string) => {
        try {
            setLoading(true);
            const [contestData, statsData] = await Promise.all([
                contestsService.getContest(contestId),
                contestsService.getContestStats(contestId)
            ]);
            setContest(contestData);
            setStats(statsData);
        } catch (err) {
            console.error('Failed to load contest overview data', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading overview...</div>;
    if (!contest || !stats) return <div className="p-8 text-center">Contest not found.</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <button
                        onClick={() => navigate('/admin/contests')}
                        className="text-sm text-indigo-600 hover:text-indigo-800 mb-2 hover:underline"
                    >
                        &larr; Back to Contests
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white uppercase">{contest.title} - Overview</h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Ended on: {new Date(contest.endTime).toLocaleDateString()}
                    </p>
                </div>
                <div className="flex gap-2">
                    {/* Action buttons could go here */}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">Participation</p>
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-300 space-y-1">
                        <div className="flex justify-between">
                            <span>Total Students:</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{stats.totalStudents}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Participated:</span>
                            <span className="font-semibold text-green-600 dark:text-green-400">{stats.totalParticipants}</span>
                        </div>
                        <div
                            className="flex justify-between border-t pt-1 border-gray-100 dark:border-gray-700 cursor-pointer group"
                            onClick={() => setShowMissedModal(true)}
                        >
                            <span className="group-hover:text-red-600 dark:group-hover:text-red-300 transition-colors">Missed:</span>
                            <div className="flex items-center">
                                <span className="font-semibold text-red-500 dark:text-red-400 mr-1">
                                    {stats.missedStudents.length}
                                </span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">Average Score</p>
                    <p className="mt-2 text-3xl font-semibold text-indigo-600 dark:text-indigo-400">{stats.averageScore.toFixed(1)}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">Highest Score</p>
                    <p className="mt-2 text-3xl font-semibold text-green-600 dark:text-green-400">{stats.highestScore}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">Lowest Score</p>
                    <p className="mt-2 text-3xl font-semibold text-red-600 dark:text-red-400">{stats.lowestScore}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Score Distribution Chart */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Score Distribution</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={Object.entries(stats.scoreDistribution).map(([range, count]) => ({
                                    range,
                                    count,
                                }))}
                                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis
                                    dataKey="range"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6B7280', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6B7280', fontSize: 12 }}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{
                                        backgroundColor: '#1F2937',
                                        border: 'none',
                                        borderRadius: '0.375rem',
                                        color: '#F9FAFB'
                                    }}
                                    itemStyle={{ color: '#F9FAFB' }}
                                />
                                <Bar
                                    dataKey="count"
                                    fill="#6366F1"
                                    radius={[4, 4, 0, 0]}
                                    barSize={40}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Performers Table */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Top 5 Performers</h3>
                    <div className="overflow-hidden">
                        {stats.topPerformers.length === 0 ? (
                            <p className="text-gray-500 italic">No participation data yet.</p>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead>
                                    <tr>
                                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rank</th>
                                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student</th>
                                        <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Score</th>
                                        <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Accuracy</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {stats.topPerformers.map((student, idx) => (
                                        <tr key={idx}>
                                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">#{idx + 1}</td>
                                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                                <div className="font-medium text-gray-900 dark:text-white">{student.name}</div>
                                                <div className="text-xs text-gray-500">{student.email}</div>
                                            </td>
                                            <td className="px-3 py-4 whitespace-nowrap text-sm text-right text-indigo-600 font-bold">{student.score}</td>
                                            <td className="px-3 py-4 whitespace-nowrap text-sm text-right text-gray-500">{student.accuracy}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>


            {/* Missed Students Modal */}
            {
                showMissedModal && (
                    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowMissedModal(false)}></div>
                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">
                                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                                                Missed Students
                                            </h3>
                                            <div className="mt-4 max-h-60 overflow-y-auto">
                                                {stats.missedStudents.length === 0 ? (
                                                    <p className="text-sm text-gray-500">No students missed this contest.</p>
                                                ) : (
                                                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                                        {stats.missedStudents.map((student, idx) => (
                                                            <li key={idx} className="py-3 flex justify-between">
                                                                <div>
                                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{student.name}</p>
                                                                    <p className="text-sm text-gray-500">{student.email}</p>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="button"
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                        onClick={() => setShowMissedModal(false)}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
