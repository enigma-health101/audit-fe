import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaFileAlt, FaSyncAlt, FaCheckCircle, FaExclamationTriangle, FaTrash, FaUsers, FaHeart, FaTimes, FaChartBar, FaEye } from 'react-icons/fa';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, LineChart, Line, CartesianGrid } from 'recharts';

// Enhanced Type Definitions
interface OverallStats {
    total_jobs: number;
    total_rows: number;
    total_matches: number;
    avg_processing_time: number;
}

interface RecentJob {
    job_id: string;
    procedure_code: string;
    processing_time: number;
    rows_processed: number;
    comorbidities_checked: number;
    matches_found: number;
    successful_surgeries?: number;
    failed_surgeries?: number;
    processed_at: string;
}

interface EnhancedStats {
    patient_analytics?: {
        total_patients_analyzed: number;
        avg_comorbidities_per_patient: number;
        avg_confidence: number;
        patients_with_multiple_comorbidities: number;
    };
    surgery_analytics?: {
        total_successful_surgeries: number;
        total_failed_surgeries: number;
        overall_success_rate: number;
        avg_success_rate: number;
    };
    top_comorbidities?: Record<string, number>;
    top_failure_causes?: Record<string, number>;
    column_effectiveness?: Array<{
        column_name: string;
        matches_found: number;
        patients_affected: number;
    }>;
}

interface DashboardData {
    overall: OverallStats;
    recent_jobs: RecentJob[];
    enhanced?: EnhancedStats;
}

const API_URL = '/api';

const JobAnalytics = () => {
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedView, setSelectedView] = useState<'overview' | 'jobs' | 'analytics'>('overview');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await fetch(`${API_URL}/dashboard-stats`);
            if (!response.ok) {
                throw new Error('Failed to fetch dashboard data');
            }
            const data: DashboardData = await response.json();
            setDashboardData(data);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unknown error occurred');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteJob = async (jobId: string) => {
        if (!window.confirm(`Are you sure you want to delete job ${jobId}? This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/jobs/${jobId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete job.');
            }

            setDashboardData(prevData => {
                if (!prevData) return null;
                return {
                    ...prevData,
                    recent_jobs: prevData.recent_jobs.filter(job => job.job_id !== jobId)
                };
            });

        } catch (err) {
            alert(err instanceof Error ? err.message : 'An unknown error occurred while deleting the job.');
        }
    };

    const calculateSurgerySuccessRate = (job: RecentJob) => {
        if (!job.successful_surgeries && !job.failed_surgeries) return null;

        const successful = job.successful_surgeries || 0;
        const failed = job.failed_surgeries || 0;
        const total = successful + failed;

        if (total === 0) return null;

        // Treat any unknown/unspecified as successful
        return (successful / total) * 100;
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF6B6B', '#4ECDC4', '#45B7D1'];

    // Prepare chart data
    const surgeryOutcomesData = dashboardData?.enhanced?.surgery_analytics ? [
        {
            name: 'Successful',
            value: dashboardData.enhanced.surgery_analytics.total_successful_surgeries,
            color: '#10B981'
        },
        {
            name: 'Failed',
            value: dashboardData.enhanced.surgery_analytics.total_failed_surgeries,
            color: '#EF4444'
        }
    ].filter(item => item.value > 0) : [];

    const topComorbiditiesData = dashboardData?.enhanced?.top_comorbidities ?
        Object.entries(dashboardData.enhanced.top_comorbidities)
            .filter(([name, value]) => name && name.trim() && value > 0)
            .map(([name, value]) => ({
                name: name.length > 20 ? name.substring(0, 20) + '...' : name,
                value,
                fullName: name
            }))
            .slice(0, 8) : [];
    const topFailureCausesData = dashboardData?.enhanced?.top_failure_causes ?
        Object.entries(dashboardData.enhanced.top_failure_causes)
            .filter(([name, value]) => name && name.trim() && value > 0)
            .map(([name, value]) => ({
                name: name.length > 25 ? name.substring(0, 25) + '...' : name,
                value,
                fullName: name
            }))
            .slice(0, 6) : [];

    const recentJobsChartData = dashboardData?.recent_jobs.slice(0, 10).reverse().map((job, index) => ({
        name: `Job ${index + 1}`,
        matches: job.matches_found,
        rows: job.rows_processed,
        success_rate: calculateSurgerySuccessRate(job) || 0
    })) || [];

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <div className="text-lg font-medium text-gray-900">Loading analytics...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <div className="text-lg font-medium text-red-600 mb-2">Error Loading Analytics</div>
                    <div className="text-gray-600">{error}</div>
                </div>
            </div>
        );
    }

    const renderNavigationTabs = () => (
        <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8">
                {[
                    { id: 'overview', label: 'Overview', icon: <FaChartBar /> },
                    { id: 'jobs', label: 'Recent Jobs', icon: <FaFileAlt /> },
                    { id: 'analytics', label: 'Advanced Analytics', icon: <FaUsers /> }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setSelectedView(tab.id as any)}
                        className={`${selectedView === tab.id
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors duration-200`}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </nav>
        </div>
    );

    const renderOverviewStats = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md flex items-center transform hover:scale-105 transition-transform duration-200">
                <FaFileAlt className="text-4xl text-blue-500 mr-4" />
                <div>
                    <p className="text-sm text-gray-500">Total Jobs</p>
                    <p className="text-2xl font-bold text-gray-800">{dashboardData?.overall.total_jobs || 0}</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md flex items-center transform hover:scale-105 transition-transform duration-200">
                <FaSyncAlt className="text-4xl text-green-500 mr-4" />
                <div>
                    <p className="text-sm text-gray-500">Total Rows Processed</p>
                    <p className="text-2xl font-bold text-gray-800">{dashboardData?.overall.total_rows || 0}</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md flex items-center transform hover:scale-105 transition-transform duration-200">
                <FaCheckCircle className="text-4xl text-purple-500 mr-4" />
                <div>
                    <p className="text-sm text-gray-500">Total Matches Found</p>
                    <p className="text-2xl font-bold text-gray-800">{dashboardData?.overall.total_matches || 0}</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md flex items-center transform hover:scale-105 transition-transform duration-200">
                <FaExclamationTriangle className="text-4xl text-yellow-500 mr-4" />
                <div>
                    <p className="text-sm text-gray-500">Avg. Processing Time</p>
                    <p className="text-2xl font-bold text-gray-800">
                        {dashboardData?.overall.avg_processing_time?.toFixed(2) || 0}s
                    </p>
                </div>
            </div>
        </div>
    );

    const renderEnhancedStats = () => (
        dashboardData?.enhanced && (
            <div className="space-y-8">
                {/* Patient Analytics */}
                {dashboardData.enhanced.patient_analytics && (
                    <div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-6">Patient Analytics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white p-6 rounded-lg shadow-md flex items-center transform hover:scale-105 transition-transform duration-200">
                                <FaUsers className="text-4xl text-indigo-500 mr-4" />
                                <div>
                                    <p className="text-sm text-gray-500">Patients Analyzed</p>
                                    <p className="text-2xl font-bold text-gray-800">
                                        {dashboardData.enhanced.patient_analytics.patients_with_multiple_comorbidities}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Surgery Analytics */}
                {dashboardData.enhanced.surgery_analytics && (
                    <div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-6">Surgery Outcomes</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white p-6 rounded-lg shadow-md flex items-center transform hover:scale-105 transition-transform duration-200">
                                <FaHeart className="text-4xl text-green-500 mr-4" />
                                <div>
                                    <p className="text-sm text-gray-500">Successful Surgeries</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {dashboardData.enhanced.surgery_analytics.total_successful_surgeries}
                                    </p>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-md flex items-center transform hover:scale-105 transition-transform duration-200">
                                <FaTimes className="text-4xl text-red-500 mr-4" />
                                <div>
                                    <p className="text-sm text-gray-500">Failed Surgeries</p>
                                    <p className="text-2xl font-bold text-red-600">
                                        {dashboardData.enhanced.surgery_analytics.total_failed_surgeries}
                                    </p>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-md flex items-center transform hover:scale-105 transition-transform duration-200">
                                <FaCheckCircle className="text-4xl text-blue-500 mr-4" />
                                <div>
                                    <p className="text-sm text-gray-500">Overall Success Rate</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {dashboardData.enhanced.surgery_analytics.overall_success_rate.toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-md flex items-center transform hover:scale-105 transition-transform duration-200">
                                <FaChartBar className="text-4xl text-purple-500 mr-4" />
                                <div>
                                    <p className="text-sm text-gray-500">Avg. Success Rate</p>
                                    <p className="text-2xl font-bold text-purple-600">
                                        {dashboardData.enhanced.surgery_analytics.avg_success_rate.toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )
    );

    const renderOverviewCharts = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Surgery Outcomes Chart */}
            {surgeryOutcomesData.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Surgery Outcomes Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={surgeryOutcomesData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                {surgeryOutcomesData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Top Comorbidities Chart */}
            {topComorbiditiesData.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Most Common Comorbidities</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={topComorbiditiesData}>
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Recent Jobs Performance */}
            {recentJobsChartData.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Jobs Performance</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={recentJobsChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis yAxisId="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip />
                            <Legend />
                            <Bar yAxisId="left" dataKey="matches" fill="#8884d8" name="Matches Found" />
                            <Line yAxisId="right" type="monotone" dataKey="success_rate" stroke="#82ca9d" name="Success Rate %" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Top Failure Causes */}
            {topFailureCausesData.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Surgery Failure Causes</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={topFailureCausesData} layout="horizontal">
                            <XAxis type="number" />
                            <YAxis type="category" dataKey="name" width={120} />
                            <Tooltip />
                            <Bar dataKey="value" fill="#EF4444" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );

    const renderRecentJobsTable = () => (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Recent Jobs</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Procedure</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Processed At</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patients</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matches</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Surgery Success</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {dashboardData?.recent_jobs.map((job) => {
                            const successRate = calculateSurgerySuccessRate(job);
                            return (
                                <tr key={job.job_id} className="hover:bg-gray-50 transition-colors duration-150">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        <Link href={`/audit-dashboard?job_id=${job.job_id}`} passHref>
                                            <a className="text-blue-600 hover:text-blue-800 font-mono">{job.job_id.substring(0, 8)}...</a>
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{job.procedure_code}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(job.processed_at).toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{job.rows_processed}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                            {job.matches_found}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {successRate !== null ? (
                                            <div className="flex items-center space-x-2">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${successRate >= 80 ? 'bg-green-100 text-green-800' :
                                                    successRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                    {successRate.toFixed(1)}%
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    ({job.successful_surgeries || 0}S/{job.failed_surgeries || 0}F)
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-xs">No data</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            <FaCheckCircle className="mr-1" /> Completed
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        <div className="flex items-center space-x-2">
                                            <Link href={`/audit-dashboard?job_id=${job.job_id}`} passHref>
                                                <a className="text-blue-600 hover:text-blue-800 transition-colors" title="View Details">
                                                    <FaEye />
                                                </a>
                                            </Link>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteJob(job.job_id);
                                                }}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                                title="Delete Job"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderAdvancedAnalytics = () => (
        <div className="space-y-8">
            {/* Column Effectiveness */}
            {dashboardData?.enhanced?.column_effectiveness && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-gray-800 mb-6">Column Effectiveness Analysis</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Column Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matches Found</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patients Affected</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effectiveness</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {dashboardData.enhanced.column_effectiveness.map((column, index) => {
                                    const effectiveness = (column.matches_found / column.patients_affected) * 100;
                                    return (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{column.column_name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{column.matches_found}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{column.patients_affected}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                <div className="flex items-center">
                                                    <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                                                        <div className={`h-2 rounded-full ${effectiveness >= 80 ? 'bg-green-600' :
                                                            effectiveness >= 60 ? 'bg-yellow-600' :
                                                                'bg-red-600'
                                                            }`} style={{ width: `${Math.min(effectiveness, 100)}%` }}></div>
                                                    </div>
                                                    <span className="text-xs font-medium">{effectiveness.toFixed(1)}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Combined Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Comorbidities Detailed */}
                {topComorbiditiesData.length > 0 && (
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Comorbidity Frequency Analysis</h3>
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={topComorbiditiesData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#3B82F6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Surgery Trends Over Time */}
                {recentJobsChartData.length > 0 && (
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Surgery Success Trends</h3>
                        <ResponsiveContainer width="100%" height={400}>
                            <LineChart data={recentJobsChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="success_rate" stroke="#10B981" strokeWidth={3} name="Success Rate %" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Failure Causes Detailed Analysis */}
            {topFailureCausesData.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-gray-800 mb-6">Surgery Failure Analysis</h3>
                    <div className="space-y-4">
                        {topFailureCausesData.map((cause, index) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-red-900" title={cause.name}>
                                        {cause.name}
                                    </div>
                                    <div className="text-xs text-red-600 mt-1">
                                        Occurred in {cause.value} cases
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                                        {cause.value}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Enhanced Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="py-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Job Analytics Dashboard</h1>
                                <p className="mt-1 text-sm text-gray-500">Comprehensive analysis of clinical audit jobs</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {renderNavigationTabs()}

                {selectedView === 'overview' && (
                    <div>
                        {renderOverviewStats()}
                        {renderEnhancedStats()}
                        {renderOverviewCharts()}
                    </div>
                )}

                {selectedView === 'jobs' && renderRecentJobsTable()}
                {selectedView === 'analytics' && renderAdvancedAnalytics()}
            </div>
        </div>
    );
};

export default JobAnalytics;