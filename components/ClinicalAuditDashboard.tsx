import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

// Enhanced Type Definitions
interface JobStats {
    rows_processed: number;
    matches_found: number;
    processing_time: number;
    successful_surgeries?: number;
    failed_surgeries?: number;
    deceased_patients?: number;
    mortality_rate?: number;
    output_file_path?: string;
}

interface PatientSummary {
    patient_id: number;
    total_comorbidities: number;
    highest_confidence: number;
    comorbidity_summary?: string;
    surgery_outcome?: string;
    failure_causes?: string[];
    primary_concerns: string[];
    comprehensive_summary: string;
    columns_analyzed: number;
    mortality_status?: string;
    mortality_confidence?: number;
    mortality_causes?: string[];
    time_of_death?: string;
}

interface SurgeryAnalytics {
    successful: number;
    failed: number;
    unknown: number;
    success_rate: number;
}

interface MortalityAnalytics {
    deceased_patients: number;
    alive_patients: number;
    mortality_rate: number;
    mortality_causes: Record<string, number>;
    comorbidity_mortality_risk?: Record<string, {
        total_count: number;
        deceased_count: number;
        mortality_rate: number;
        risk_level?: string;
    }>;
    failed_surgery_deaths: number;
    success_surgery_deaths: number;
    death_rate_in_failed: number;
    death_rate_in_successful: number;
    high_risk_comorbidities: Record<string, number>;
    risk_distribution: Record<string, number>;
}

interface PatientAnalytics {
    total_patients: number;
    avg_comorbidities_per_patient: number;
    most_common_comorbidities: Record<string, number>;
    most_effective_columns: Record<string, number>;
    surgery_outcomes?: SurgeryAnalytics;
    mortality_analytics?: MortalityAnalytics;
    failure_causes?: Record<string, number>;
}

interface JobData {
    stats: JobStats;
    summary: {
        matches_by_comorbidity: Record<string, number>;
    };
    patient_summaries?: PatientSummary[];
    patient_analytics?: PatientAnalytics;
}

const ClinicalAuditDashboard: React.FC<{ jobId?: string }> = ({ jobId }) => {
    const [jobData, setJobData] = useState<JobData | null>(null);
    const [selectedPatient, setSelectedPatient] = useState<PatientSummary | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'overview' | 'patients' | 'surgery' | 'mortality'>('overview');

    useEffect(() => {
        if (jobId) {
            setLoading(true);
            setError(null);
            fetch(`/api/job-results/${jobId}?format=enhanced`)
                .then(res => {
                    if (!res.ok) {
                        throw new Error('Failed to fetch job results.');
                    }
                    return res.json();
                })
                .then(data => {
                    setJobData(data);
                })
                .catch(err => {
                    console.error("Error fetching job data:", err);
                    setError(err.message);
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [jobId]);

    if (!jobId) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">No Job Selected</h2>
                    <p className="text-gray-600">Please select a job from the Job Analytics page to view results.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <h2 className="text-xl font-semibold text-gray-800">Loading Results...</h2>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Data</h2>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    if (!jobData) {
        return null;
    }

    const { stats, summary, patient_summaries, patient_analytics } = jobData;

    // Enhanced data processing with proper surgery breakdown
    const surgeryData = patient_analytics?.surgery_outcomes ? [
        { name: 'Successful', value: patient_analytics.surgery_outcomes.successful, color: '#10B981' },
        { name: 'Failed', value: patient_analytics.surgery_outcomes.failed, color: '#EF4444' },
        { name: 'Unknown', value: patient_analytics.surgery_outcomes.unknown || 0, color: '#6B7280' }
    ].filter(item => item.value > 0) : [];

    // Mortality data from analytics
    const mortalityData = patient_analytics?.mortality_analytics ? [
        { name: 'Alive', value: patient_analytics.mortality_analytics.alive_patients, color: '#10B981' },
        { name: 'Deceased', value: patient_analytics.mortality_analytics.deceased_patients, color: '#EF4444' }
    ].filter(item => item.value > 0) : [];

    const failureCausesData = patient_analytics?.failure_causes ?
        Object.entries(patient_analytics.failure_causes)
            .filter(([name, value]) => name && name.trim() && value > 0)
            .map(([name, value]) => ({
                name: name.length > 30 ? name.substring(0, 30) + '...' : name,
                value,
                fullName: name
            }))
            .slice(0, 8) : [];

    const mortalityCausesData = patient_analytics?.mortality_analytics?.mortality_causes ?
        Object.entries(patient_analytics.mortality_analytics.mortality_causes)
            .filter(([name, value]) => name && name.trim() && value > 0)
            .map(([name, value]) => ({
                name: name.length > 25 ? name.substring(0, 25) + '...' : name,
                value,
                fullName: name
            }))
            .slice(0, 8) : [];

    // High-risk comorbidities data
    const highRiskComorbiditiesData = patient_analytics?.mortality_analytics?.high_risk_comorbidities ?
        Object.entries(patient_analytics.mortality_analytics.high_risk_comorbidities)
            .filter(([name, rate]) => name && name.trim() && rate > 0)
            .map(([name, rate]) => ({
                name: name.length > 20 ? name.substring(0, 20) + '...' : name,
                mortality_rate: rate,
                fullName: name
            }))
            .sort((a, b) => b.mortality_rate - a.mortality_rate)
            .slice(0, 10) : [];

    const patientDistributionData = patient_summaries ? [
        { name: 'No Findings', value: patient_summaries.filter(p => p.total_comorbidities === 0).length },
        { name: '1 Comorbidity', value: patient_summaries.filter(p => p.total_comorbidities === 1).length },
        { name: '2-3 Comorbidities', value: patient_summaries.filter(p => p.total_comorbidities >= 2 && p.total_comorbidities <= 3).length },
        { name: '4+ Comorbidities', value: patient_summaries.filter(p => p.total_comorbidities >= 4).length },
    ].filter(item => item.value > 0) : [];

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF6B6B', '#4ECDC4', '#45B7D1'];

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-200 rounded shadow">
                    <p className="font-medium">{payload[0].payload.fullName || label}</p>
                    <p className="text-sm text-gray-600">
                        Count: <span className="font-medium">{payload[0].value}</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    const getConfidenceTag = (score: number) => {
        if (score >= 0.8) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">✅ High</span>;
        if (score >= 0.5) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">🟠 Medium</span>;
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">🔴 Low</span>;
    };

    const getSurgeryOutcomeTag = (outcome: string) => {
        if (outcome === 'success') {
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">✅ Success</span>;
        }
        if (outcome === 'failure') {
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">❌ Failed</span>;
        }
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">❓ Unknown</span>;
    };

    const getMortalityStatusTag = (status: string) => {
        if (status === 'deceased') {
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">⚠️ Deceased</span>;
        }
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">✅ Alive</span>;
    };

    const renderNavigationTabs = () => (
        <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
                {[
                    { id: 'overview', label: 'Overview', icon: '📊' },
                    { id: 'patients', label: 'Patient Analysis', icon: '👥' },
                    { id: 'surgery', label: 'Surgery Outcomes', icon: '🏥' },
                    { id: 'mortality', label: 'Mortality Analysis', icon: '⚠️' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setViewMode(tab.id as any)}
                        className={`${viewMode === tab.id
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors duration-200`}
                    >
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                    </button>
                ))}
            </nav>
        </div>
    );

    const renderOverviewCards = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="text-3xl">📄</div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">Rows Processed</dt>
                                <dd className="text-lg font-medium text-gray-900">{stats.rows_processed}</dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="text-3xl">🎯</div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">Matches Found</dt>
                                <dd className="text-lg font-medium text-gray-900">{stats.matches_found}</dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="text-3xl">⏱️</div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">Processing Time</dt>
                                <dd className="text-lg font-medium text-gray-900">{stats.processing_time.toFixed(2)}s</dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            {patient_analytics && (
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="text-3xl">👥</div>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Patients Analyzed</dt>
                                    <dd className="text-lg font-medium text-gray-900">{patient_analytics.total_patients}</dd>
                                    <dd className="text-sm text-gray-500">Avg: {patient_analytics.avg_comorbidities_per_patient.toFixed(1)} comorbidities/patient</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {patient_analytics?.surgery_outcomes && (
                <>
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="text-3xl">✅</div>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Surgery Success</dt>
                                        <dd className="text-lg font-medium text-green-600">{patient_analytics.surgery_outcomes.successful}</dd>
                                        <dd className="text-sm text-gray-500">{patient_analytics.surgery_outcomes.success_rate.toFixed(1)}% success rate</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="text-3xl">❌</div>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Surgery Failed</dt>
                                        <dd className="text-lg font-medium text-red-600">{patient_analytics.surgery_outcomes.failed}</dd>
                                        <dd className="text-sm text-gray-500">
                                            {((patient_analytics.surgery_outcomes.failed / patient_analytics.total_patients) * 100).toFixed(1)}% failure rate
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    {patient_analytics.surgery_outcomes.unknown > 0 && (
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="text-3xl">❓</div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">Unknown Outcome</dt>
                                            <dd className="text-lg font-medium text-gray-600">{patient_analytics.surgery_outcomes.unknown}</dd>
                                            <dd className="text-sm text-gray-500">
                                                {((patient_analytics.surgery_outcomes.unknown / patient_analytics.total_patients) * 100).toFixed(1)}% unknown
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {patient_analytics?.mortality_analytics && (
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="text-3xl">⚠️</div>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Mortality Rate</dt>
                                    <dd className="text-lg font-medium text-red-600">{patient_analytics.mortality_analytics.mortality_rate.toFixed(1)}%</dd>
                                    <dd className="text-sm text-gray-500">{patient_analytics.mortality_analytics.deceased_patients} deceased</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderOverviewCharts = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {patient_analytics && Object.keys(patient_analytics.most_common_comorbidities || {}).length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Most Common Comorbidities</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={Object.entries(patient_analytics.most_common_comorbidities).map(([name, value]) => ({
                                    name: name.length > 20 ? name.substring(0, 20) + '...' : name,
                                    value,
                                    fullName: name
                                }))}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                label
                            >
                                {Object.entries(patient_analytics.most_common_comorbidities).map((entry, index) =>
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                )}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            )}

            {surgeryData.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Surgery Outcomes</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={surgeryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                {surgeryData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            )}

            {mortalityData.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Mortality Status</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={mortalityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                {mortalityData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            )}

            {patientDistributionData.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Patient Risk Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={patientDistributionData}>
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {failureCausesData.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Top Failure Causes</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={failureCausesData}>
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                            <YAxis />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" fill="#EF4444" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {mortalityCausesData.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Primary Mortality Causes</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={mortalityCausesData}>
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                            <YAxis />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" fill="#DC2626" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );

    const renderPatientAnalysis = () => (
        patient_summaries && (
            <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Patient Analysis</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comorbidities</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Primary Concerns</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Surgery Outcome</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mortality Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Summary</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {patient_summaries.map(patient => (
                                    <tr key={patient.patient_id} onClick={() => setSelectedPatient(patient)} className="cursor-pointer hover:bg-gray-50 transition-colors duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{patient.patient_id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${patient.total_comorbidities >= 3 ? 'bg-red-100 text-red-800' :
                                                patient.total_comorbidities >= 1 ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-green-100 text-green-800'
                                                }`}>
                                                {patient.total_comorbidities}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{patient.primary_concerns.slice(0, 3).join(', ')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getConfidenceTag(patient.highest_confidence)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getSurgeryOutcomeTag(patient.surgery_outcome || 'unknown')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getMortalityStatusTag(patient.mortality_status || 'alive')}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">{patient.comprehensive_summary}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )
    );

    const renderSurgeryOutcomes = () => (
        patient_analytics?.surgery_outcomes && (
            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Surgery Success Rate</h3>
                        <div className="flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-4xl font-bold text-blue-600 mb-2">
                                    {patient_analytics.surgery_outcomes.success_rate.toFixed(1)}%
                                </div>
                                <div className="text-sm text-gray-500">Overall Success Rate</div>
                                <div className="mt-4 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>Successful:</span>
                                        <span className="font-medium text-green-600">{patient_analytics.surgery_outcomes.successful}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Failed:</span>
                                        <span className="font-medium text-red-600">{patient_analytics.surgery_outcomes.failed}</span>
                                    </div>
                                    {patient_analytics.surgery_outcomes.unknown > 0 && (
                                        <div className="flex justify-between">
                                            <span>Unknown:</span>
                                            <span className="font-medium text-gray-600">{patient_analytics.surgery_outcomes.unknown}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {failureCausesData.length > 0 && (
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Failure Causes</h3>
                            <div className="space-y-3">
                                {failureCausesData.slice(0, 5).map((cause, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-gray-900 truncate" title={cause.fullName}>
                                                {cause.name}
                                            </div>
                                        </div>
                                        <div className="ml-3">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                {cause.value} cases
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {patient_summaries && (
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Surgery Outcomes by Patient</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Surgery Outcome</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comorbidities</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Failure Causes</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mortality Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comorbidity Summary</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {patient_summaries.map(patient => (
                                            <tr key={patient.patient_id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {patient.patient_id}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {getSurgeryOutcomeTag(patient.surgery_outcome || 'unknown')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${patient.total_comorbidities >= 3 ? 'bg-red-100 text-red-800' :
                                                        patient.total_comorbidities >= 1 ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-green-100 text-green-800'
                                                        }`}>
                                                        {patient.total_comorbidities} comorbidities
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                                                    {patient.failure_causes && patient.failure_causes.length > 0 ? (
                                                        <div className="space-y-1">
                                                            {patient.failure_causes.slice(0, 2).map((cause, idx) => (
                                                                <div key={idx} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded truncate" title={cause}>
                                                                    {cause.length > 40 ? cause.substring(0, 40) + '...' : cause}
                                                                </div>
                                                            ))}
                                                            {patient.failure_causes.length > 2 && (
                                                                <div className="text-xs text-gray-500">
                                                                    +{patient.failure_causes.length - 2} more
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {getMortalityStatusTag(patient.mortality_status || 'alive')}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">
                                                    {patient.comorbidity_summary || 'No summary available'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )
    );

    const renderMortalityAnalysis = () => (
        patient_analytics?.mortality_analytics && (
            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Mortality Rate</h3>
                        <div className="flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-4xl font-bold text-red-600 mb-2">
                                    {patient_analytics.mortality_analytics.mortality_rate.toFixed(1)}%
                                </div>
                                <div className="text-sm text-gray-500">Overall Mortality</div>
                                <div className="mt-4 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>Deceased:</span>
                                        <span className="font-medium text-red-600">
                                            {patient_analytics.mortality_analytics.deceased_patients}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Alive:</span>
                                        <span className="font-medium text-green-600">
                                            {patient_analytics.mortality_analytics.alive_patients}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Surgery vs Mortality</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span>Failed Surgery + Death:</span>
                                <span className="font-medium text-red-700">
                                    {patient_analytics.mortality_analytics.failed_surgery_deaths || 0}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Success Surgery + Death:</span>
                                <span className="font-medium text-orange-600">
                                    {patient_analytics.mortality_analytics.success_surgery_deaths || 0}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Death Rate in Failed:</span>
                                <span className="font-medium">
                                    {patient_analytics.mortality_analytics.death_rate_in_failed?.toFixed(1) || 0}%
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Death Rate in Success:</span>
                                <span className="font-medium">
                                    {patient_analytics.mortality_analytics.death_rate_in_successful?.toFixed(1) || 0}%
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">High-Risk Comorbidities</h3>
                        <div className="space-y-2">
                            {Object.entries(patient_analytics.mortality_analytics.high_risk_comorbidities || {}).slice(0, 3).map(([comorbidity, rate], index) => (
                                <div key={comorbidity} className="text-sm">
                                    <div className="flex justify-between">
                                        <span className="truncate" title={comorbidity}>{comorbidity.length > 20 ? comorbidity.substring(0, 20) + '...' : comorbidity}</span>
                                        <span className="font-medium text-red-600">{Number(rate).toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                                        <div className="bg-red-500 h-1 rounded-full" style={{ width: `${Math.min(Number(rate), 100)}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Distribution</h3>
                        <div className="space-y-3">
                            {Object.entries(patient_analytics.mortality_analytics.risk_distribution || {}).map(([level, count], index) => (
                                <div key={level} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <div className="flex items-center">
                                        <div className={`w-3 h-3 rounded-full mr-2 ${level === 'Critical' ? 'bg-red-800' :
                                            level === 'High' ? 'bg-red-500' :
                                                level === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                                            }`}></div>
                                        <span className="text-sm font-medium">{level} Risk</span>
                                    </div>
                                    <span className="text-sm font-bold">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {mortalityCausesData.length > 0 && (
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Primary Mortality Causes</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={mortalityCausesData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                                    <YAxis />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="value" fill="#DC2626" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {highRiskComorbiditiesData.length > 0 && (
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Comorbidity-Mortality Risk</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={highRiskComorbiditiesData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                                    <YAxis domain={[0, 100]} />
                                    <Tooltip
                                        formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Mortality Rate']}
                                        labelFormatter={(label) => `Comorbidity: ${label}`}
                                    />
                                    <Bar dataKey="mortality_rate" fill="#EF4444" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {patient_summaries && patient_summaries.filter(p => p.mortality_status === 'deceased').length > 0 && (
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Deceased Patients Analysis</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Surgery Outcome</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Primary Comorbidities</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mortality Causes</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time of Death</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Assessment</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {patient_summaries.filter(p => p.mortality_status === 'deceased').map(patient => (
                                            <tr key={patient.patient_id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {patient.patient_id}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {getSurgeryOutcomeTag(patient.surgery_outcome || 'unknown')}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                                    {patient.primary_concerns?.slice(0, 2).join(', ') || 'None identified'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                                                    {patient.mortality_causes && patient.mortality_causes.length > 0 ? (
                                                        <div className="space-y-1">
                                                            {patient.mortality_causes.slice(0, 2).map((cause, idx) => (
                                                                <div key={idx} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded truncate" title={cause}>
                                                                    {cause.length > 30 ? cause.substring(0, 30) + '...' : cause}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {patient.time_of_death || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${patient.total_comorbidities >= 4 ? 'bg-red-100 text-red-800' :
                                                        patient.total_comorbidities >= 2 ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-green-100 text-green-800'
                                                        }`}>
                                                        {patient.total_comorbidities >= 4 ? 'High Risk' :
                                                            patient.total_comorbidities >= 2 ? 'Medium Risk' : 'Low Risk'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="py-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    Clinical Audit Results
                                </h1>
                                <p className="mt-1 text-sm text-gray-500">
                                    Job ID: <span className="font-mono font-medium text-blue-600">{jobId}</span>
                                </p>
                            </div>
                            <div className="flex items-center space-x-4">
                                {jobData.stats.output_file_path && (
                                    <a
                                        href={`/api/download-results/${jobId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                                    >
                                        <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Download Results
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {renderNavigationTabs()}

                {viewMode === 'overview' && (
                    <div>
                        {renderOverviewCards()}
                        {renderOverviewCharts()}
                    </div>
                )}

                {viewMode === 'patients' && renderPatientAnalysis()}
                {viewMode === 'surgery' && renderSurgeryOutcomes()}
                {viewMode === 'mortality' && renderMortalityAnalysis()}
            </div>

            <Modal
                isOpen={!!selectedPatient}
                onRequestClose={() => setSelectedPatient(null)}
                className="max-w-5xl mx-auto mt-10 bg-white rounded-lg shadow-xl outline-none max-h-[90vh] overflow-y-auto"
                overlayClassName="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-start justify-center p-4"
            >
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-semibold text-gray-900">
                            Patient {selectedPatient?.patient_id} Details
                        </h2>
                        <button
                            onClick={() => setSelectedPatient(null)}
                            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    {selectedPatient && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <div className="text-sm font-medium text-blue-600">Total Comorbidities</div>
                                    <div className="text-2xl font-bold text-blue-900">{selectedPatient.total_comorbidities}</div>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <div className="text-sm font-medium text-green-600">Confidence</div>
                                    <div className="text-2xl font-bold text-green-900">{(selectedPatient.highest_confidence * 100).toFixed(0)}%</div>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="text-sm font-medium text-gray-600">Surgery Outcome</div>
                                    <div className="mt-1">{getSurgeryOutcomeTag(selectedPatient.surgery_outcome || 'unknown')}</div>
                                </div>
                                <div className={`p-4 rounded-lg ${selectedPatient.mortality_status === 'deceased' ? 'bg-red-50' : 'bg-green-50'}`}>
                                    <div className={`text-sm font-medium ${selectedPatient.mortality_status === 'deceased' ? 'text-red-600' : 'text-green-600'}`}>
                                        Mortality Status
                                    </div>
                                    <div className={`text-xl font-bold ${selectedPatient.mortality_status === 'deceased' ? 'text-red-900' : 'text-green-900'}`}>
                                        {selectedPatient.mortality_status === 'deceased' ? '⚠️ Deceased' : '✅ Alive'}
                                    </div>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-lg">
                                    <div className="text-sm font-medium text-purple-600">Columns Analyzed</div>
                                    <div className="text-2xl font-bold text-purple-900">{selectedPatient.columns_analyzed}</div>
                                </div>
                            </div>

                            {selectedPatient.primary_concerns.length > 0 && (
                                <div>
                                    <h4 className="text-lg font-medium text-gray-900 mb-3">Primary Concerns</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedPatient.primary_concerns.map((concern, index) => (
                                            <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                                                {concern}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedPatient.mortality_status === 'deceased' && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <h4 className="text-lg font-medium text-red-900 mb-3">Mortality Information</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {selectedPatient.time_of_death && (
                                            <div>
                                                <span className="text-sm font-medium text-red-700">Time of Death:</span>
                                                <p className="text-sm text-red-800">{selectedPatient.time_of_death}</p>
                                            </div>
                                        )}
                                        {selectedPatient.mortality_causes && selectedPatient.mortality_causes.length > 0 && (
                                            <div>
                                                <span className="text-sm font-medium text-red-700">Mortality Causes:</span>
                                                <ul className="text-sm text-red-800 list-disc list-inside">
                                                    {selectedPatient.mortality_causes.map((cause, idx) => (
                                                        <li key={idx}>{cause}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {selectedPatient.failure_causes && selectedPatient.failure_causes.length > 0 && (
                                <div>
                                    <h4 className="text-lg font-medium text-gray-900 mb-3">Failure Causes</h4>
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <ul className="space-y-2">
                                            {selectedPatient.failure_causes.map((cause, index) => (
                                                <li key={index} className="flex items-start">
                                                    <span className="text-red-500 mr-2">•</span>
                                                    <span className="text-sm text-red-800">{cause}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            <div>
                                <h4 className="text-lg font-medium text-gray-900 mb-3">Clinical Summary</h4>
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                    <p className="text-sm text-gray-700 leading-relaxed">{selectedPatient.comprehensive_summary}</p>
                                </div>
                            </div>

                            {selectedPatient.comorbidity_summary && (
                                <div>
                                    <h4 className="text-lg font-medium text-gray-900 mb-3">Comorbidity Summary</h4>
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <p className="text-sm text-blue-800 leading-relaxed">{selectedPatient.comorbidity_summary}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default ClinicalAuditDashboard;