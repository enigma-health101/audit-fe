import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Head from 'next/head';
import Image from 'next/image';
import {
    FileText, BarChart3, Settings, Brain, Shield, Cpu, Target, Globe
} from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { StepCard } from '../components/StepCard';
import { ProgressOverview } from '../components/ProgressOverview';
import { CodeSelection } from '../components/CodeSelection';
import { FileUpload } from '../components/FileUpload';
import { ColumnConfiguration } from '../components/ColumnConfiguration';
import ComorbidityManagement from '../components/ComorbidityManagement';
import type { ICMPCode, Comorbidity, FileMetadata } from '../types';
import { JobStatusTracker } from '../components/JobStatusTracker';
import ClinicalAuditDashboard from '../components/ClinicalAuditDashboard';

export default function Home() {
    const [icmpCodes, setIcmpCodes] = useState<ICMPCode[]>([]);
    const [selectedCode, setSelectedCode] = useState<string>('');
    const [comorbidities, setComorbidities] = useState<Comorbidity[]>([]);
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [columnMetadata, setColumnMetadata] = useState<FileMetadata[]>([]);
    const [activeTab, setActiveTab] = useState<'process' | 'dashboard' | 'configurations'>('process');
    const [isDragOver, setIsDragOver] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [jobId, setJobId] = useState<string | null>(null);
    const [jobStatus, setJobStatus] = useState<any | null>(null);
    const [viewingAnalyticsFor, setViewingAnalyticsFor] = useState<string | null>(null);
    const [dashboardStats, setDashboardStats] = useState<any | null>(null);
    const [proceduresFile, setProceduresFile] = useState<File | null>(null);
    const [comorbiditiesFile, setComorbiditiesFile] = useState<File | null>(null);
    const [uploadStatus, setUploadStatus] = useState<{ [key: string]: { message: string, type: 'success' | 'error' } | null }>({});
    const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

    // Update current step logic
    useEffect(() => {
        if (selectedCode && comorbidities.length > 0) {
            if (uploadedFiles.length > 0) {
                if (columnMetadata.length > 0) {
                    const hasValidConfig = columnMetadata.some(file =>
                        file.columnMappings.some(col =>
                            col.isEnabled && col.selectedComorbidities.length > 0
                        )
                    );
                    setCurrentStep(hasValidConfig ? 5 : 4);
                } else {
                    setCurrentStep(4);
                }
            } else {
                setCurrentStep(3);
            }
        } else if (selectedCode) {
            setCurrentStep(2);
        } else {
            setCurrentStep(1);
        }
    }, [selectedCode, comorbidities, uploadedFiles, columnMetadata]);

    useEffect(() => {
        fetchICMPCodes();
    }, []);

    const fetchICMPCodes = async () => {
        try {
            const response = await fetch('/api/icmp-codes');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            setIcmpCodes(data);
        } catch (error) {
            console.error('❌ Error fetching ICMP codes:', error);
            setIcmpCodes([{ code: "LOADING_ERROR", description: "Error loading codes from backend. Using fallback." }]);
        }
    };

    useEffect(() => {
        if (!jobId) return;
        const fetchStatus = async () => {
            try {
                const response = await fetch(`/api/job-status/${jobId}`);
                if (!response.ok) throw new Error('Could not fetch job status');
                const data = await response.json();
                setJobStatus(data);
                if (data.status === 'completed' || data.status === 'error') {
                    clearInterval(intervalId);
                }
            } catch (error) {
                console.error(error);
                clearInterval(intervalId);
            }
        };
        const intervalId = setInterval(fetchStatus, 10000);
        return () => clearInterval(intervalId);
    }, [jobId]);

    const fetchDashboardStats = async () => {
        setIsLoadingDashboard(true);
        try {
            const response = await fetch('/api/dashboard-stats');
            if (!response.ok) throw new Error('Failed to fetch dashboard stats');
            const data = await response.json();
            setDashboardStats(data);
        } catch (error) {
            console.error(error);
            setDashboardStats(null);
        } finally {
            setIsLoadingDashboard(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'dashboard') {
            fetchDashboardStats();
        }
    }, [activeTab]);

    const handleStartProcessing = async () => {
        if (uploadedFiles.length === 0 || columnMetadata.length === 0 || !selectedCode) {
            alert("Please ensure a file is uploaded and columns are configured.");
            return;
        }
        try {
            const formData = new FormData();
            formData.append('file', uploadedFiles[0]);
            formData.append('icmp_code', selectedCode);
            const fileMeta = columnMetadata.find(meta => meta.fileName === uploadedFiles[0].name);
            if (!fileMeta) {
                alert("Could not find metadata for the uploaded file.");
                return;
            }
            formData.append('file_metadata', JSON.stringify(fileMeta));
            const globalSettings = { comorbidities: comorbidities };
            formData.append('global_settings', JSON.stringify(globalSettings));
            const response = await fetch('/api/process-file-enhanced', {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.error || `HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            setJobId(result.job_id);
            setJobStatus({ status: 'pending', progress: 0, file_name: uploadedFiles[0].name });
        } catch (error) {
            console.error("Failed to start processing:", error);
            alert(`Error: ${error instanceof Error ? error.message : 'An unknown error occurred.'}`);
        }
    };

    const handleCodeSelection = async (code: string) => {
        setSelectedCode(code);
        if (code) {
            try {
                const response = await fetch(`/api/comorbidities/${encodeURIComponent(code)}`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                if (Array.isArray(data)) {
                    setComorbidities(data.map((c: any) => ({ ...c, enabled: true })));
                } else {
                    setComorbidities([]);
                }
            } catch (error) {
                console.error('Error fetching comorbidities:', error);
                setComorbidities([]);
            }
        } else {
            setComorbidities([]);
        }
    };

    const handleSettingsFileUploadChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'procedures' | 'comorbidities') => {
        const file = e.target.files ? e.target.files[0] : null;
        if (fileType === 'procedures') {
            setProceduresFile(file);
        } else {
            setComorbiditiesFile(file);
        }
        setUploadStatus(prev => ({ ...prev, [fileType]: null }));
    };

    const handleSettingsUpload = async (fileType: 'procedures' | 'comorbidities') => {
        const file = fileType === 'procedures' ? proceduresFile : comorbiditiesFile;
        if (!file) {
            alert('Please select a file to upload.');
            return;
        }

        setUploadStatus(prev => ({ ...prev, [fileType]: { message: 'Uploading...', type: 'success' } }));
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`/api/upload/${fileType}`, {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Upload failed');

            setUploadStatus(prev => ({ ...prev, [fileType]: { message: `✅ ${result.message}`, type: 'success' } }));

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            setUploadStatus(prev => ({ ...prev, [fileType]: { message: `❌ Error: ${errorMessage}`, type: 'error' } }));
        }
    };

    const handleComorbidityUpdate = (updatedComorbidities: Comorbidity[]) => {
        setComorbidities(updatedComorbidities);
    };

    const handleFileUpload = (files: File[]) => {
        setUploadedFiles(files);
        setColumnMetadata([]);
    };

    return (
        <>
            <Head>
                <title>MediAudit AI - Surgical Audit & Comorbidity Insights</title>
                <meta name="description" content="A Next-Gen Tool for Surgical Audit & Comorbidity Insights powered by AI" />
                <link rel="icon" href="/favicon.ico" />
                <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
                <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
                <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
                <meta name="theme-color" content="#1e40af" />
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
                {/* Animated Background Elements */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
                </div>

                <div className="relative z-10">
                    {/* Hero Section */}
                    <div className="bg-gradient-to-r from-blue-900 via-purple-900 to-pink-900 text-white">
                        <div className="max-w-7xl mx-auto px-6 py-20">
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center"
                            >
                                {/* Logo and Branding */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                    className="flex flex-col items-center mb-8"
                                >
                                    <div className="relative">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                            className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-3xl blur-xl"
                                        />
                                        <div className="relative p-6 bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20">
                                            <Image
                                                src="/mediaudit-logo.png"
                                                alt="MediAudit AI Logo"
                                                width={240}
                                                height={240}
                                                className="drop-shadow-2xl"
                                                priority
                                            />
                                        </div>
                                    </div>
                                </motion.div>

                                <h1 className="text-6xl md:text-7xl font-black mb-6 bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
                                    MediAudit AI
                                </h1>

                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-xl md:text-2xl text-blue-100 max-w-4xl mx-auto leading-relaxed mb-4"
                                >

                                </motion.p>

                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="text-lg md:text-xl text-blue-200 max-w-3xl mx-auto leading-relaxed mb-12"
                                >
                                    AI-powered platform for intelligent medical data analysis and comorbidity identification with unmatched precision
                                </motion.p>

                                <div className="flex flex-wrap justify-center gap-8 mb-12">
                                    {[
                                        { icon: Shield, text: "HIPAA Compliant", color: "text-emerald-300" },
                                        { icon: Cpu, text: "AI-Powered", color: "text-yellow-300" },
                                        { icon: Target, text: "99% Accuracy", color: "text-blue-300" },
                                        { icon: Globe, text: "Cloud Ready", color: "text-purple-300" }
                                    ].map(({ icon: Icon, text, color }, index) => (
                                        <motion.div
                                            key={text}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.7 + index * 0.1 }}
                                            className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-2xl"
                                        >
                                            <Icon className={`${color} flex-shrink-0`} size={24} />
                                            <span className="font-semibold text-lg">{text}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
                        <div className="max-w-7xl mx-auto px-6 py-4">
                            <div className="flex justify-between items-center">
                                {/* Logo in Navigation */}
                                <motion.div
                                    className="flex items-center gap-3"
                                    whileHover={{ scale: 1.05 }}
                                >
                                    <Image
                                        src="/mediaudit-logo.png"
                                        alt="MediAudit AI"
                                        width={120}
                                        height={120}
                                        className="drop-shadow-lg"
                                    />
                                    <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">

                                    </span>
                                </motion.div>

                                {/* Navigation Tabs */}
                                <div className="flex gap-2">
                                    {[
                                        { id: 'process', label: 'Process Files', icon: FileText },
                                        { id: 'dashboard', label: 'Analytics', icon: BarChart3 },
                                        { id: 'configurations', label: 'Settings', icon: Settings }
                                    ].map(({ id, label, icon: Icon }) => (
                                        <motion.button
                                            key={id}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setActiveTab(id as any)}
                                            className={`
                                                px-8 py-4 rounded-2xl font-semibold flex items-center gap-3 transition-all duration-300
                                                ${activeTab === id
                                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                                }
                                            `}
                                        >
                                            <Icon size={20} />
                                            {label}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="max-w-7xl mx-auto px-6 py-12">
                        <AnimatePresence mode="wait">
                            {activeTab === 'process' && (
                                <motion.div
                                    key="process"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="space-y-12"
                                >
                                    {/* Progress Overview */}
                                    <ProgressOverview currentStep={currentStep} />

                                    {/* Step 1: Select ICD-10-PCS Code */}
                                    <StepCard
                                        stepNumber={1}
                                        title="Select ICD-10-PCS Code"
                                        description="Choose the primary procedure code for comprehensive analysis"
                                        isActive={currentStep === 1}
                                        isCompleted={currentStep > 1}
                                    >
                                        <CodeSelection
                                            icmpCodes={icmpCodes}
                                            selectedCode={selectedCode}
                                            onCodeSelection={handleCodeSelection}
                                        />
                                    </StepCard>

                                    {/* Step 2: Configure Comorbidities */}
                                    {selectedCode && (
                                        <ComorbidityManagement
                                            selectedCode={selectedCode}
                                            comorbidities={comorbidities}
                                            onComorbidityToggle={(id: string) => {
                                                setComorbidities(prev =>
                                                    prev.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c)
                                                );
                                            }}
                                            onComorbidityUpdate={handleComorbidityUpdate}
                                            stepNumber={2}
                                            isActive={currentStep === 2}
                                            isCompleted={currentStep > 2}
                                        />
                                    )}

                                    {/* Step 3: Upload Files */}
                                    {selectedCode && comorbidities.length > 0 && (
                                        <StepCard
                                            stepNumber={3}
                                            title="Upload Patient Data"
                                            description="Securely upload your Excel files with patient data for analysis"
                                            isActive={currentStep === 3}
                                            isCompleted={currentStep > 3}
                                        >
                                            <FileUpload
                                                onFilesUpload={handleFileUpload}
                                                uploadedFiles={uploadedFiles}
                                                isDragOver={isDragOver}
                                                setIsDragOver={setIsDragOver}
                                            />
                                        </StepCard>
                                    )}

                                    {/* Step 4: Column Configuration */}
                                    {uploadedFiles.length > 0 && (
                                        <StepCard
                                            stepNumber={4}
                                            title="Configure Column Analysis"
                                            description="Map comorbidities to specific columns and set AI analysis prompts"
                                            isActive={currentStep === 4}
                                            isCompleted={currentStep > 4}
                                        >
                                            <ColumnConfiguration
                                                files={uploadedFiles}
                                                comorbidities={comorbidities}
                                                onConfigurationChange={setColumnMetadata}
                                            />
                                        </StepCard>
                                    )}

                                    {/* Step 5: Process */}
                                    {columnMetadata.length > 0 && (
                                        <StepCard
                                            stepNumber={5}
                                            title="Start AI Analysis"
                                            description="Begin comprehensive AI-powered comorbidity detection"
                                            isActive={currentStep === 5}
                                            isCompleted={false}
                                        >
                                            <div className="text-center py-12">
                                                <p className="text-xl text-gray-600 mb-8">
                                                    Ready to process {uploadedFiles.length} files with advanced AI analysis
                                                </p>
                                                <Button variant="primary" size="xl" onClick={handleStartProcessing}>
                                                    <Brain size={24} />
                                                    Start Processing
                                                </Button>
                                            </div>
                                        </StepCard>
                                    )}

                                    {/* Job Status Tracker */}
                                    {jobId && jobStatus && (
                                        <div className="mt-12">
                                            <JobStatusTracker
                                                jobId={jobId}
                                                jobStatus={jobStatus}
                                                onViewAnalytics={setViewingAnalyticsFor}
                                            />
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === 'dashboard' && (
                                <motion.div
                                    key="dashboard"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="space-y-8"
                                >
                                    <h2 className="text-4xl font-bold text-gray-900 text-center">Analytics Dashboard</h2>

                                    {isLoadingDashboard ? (
                                        <div className="text-center py-20">Loading dashboard...</div>
                                    ) : !dashboardStats || !dashboardStats.overall ? (
                                        <div className="text-center py-20 text-red-500">Failed to load dashboard data or no data available.</div>
                                    ) : (
                                        <>
                                            {/* Overall Stats */}
                                            <Card>
                                                <h3 className="text-2xl font-semibold mb-4">Overall Statistics</h3>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                                                        <p className="text-sm text-blue-700">Total Jobs</p>
                                                        <p className="text-3xl font-bold">{dashboardStats.overall.total_jobs || 0}</p>
                                                    </div>
                                                    <div className="bg-green-50 p-4 rounded-lg text-center">
                                                        <p className="text-sm text-green-700">Total Rows Processed</p>
                                                        <p className="text-3xl font-bold">{dashboardStats.overall.total_rows || 0}</p>
                                                    </div>
                                                    <div className="bg-yellow-50 p-4 rounded-lg text-center">
                                                        <p className="text-sm text-yellow-700">Total Matches Found</p>
                                                        <p className="text-3xl font-bold">{dashboardStats.overall.total_matches || 0}</p>
                                                    </div>
                                                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                                                        <p className="text-sm text-purple-700">Avg. Processing Time</p>
                                                        <p className="text-3xl font-bold">
                                                            {dashboardStats.overall.avg_processing_time?.toFixed(2) || 0}s
                                                        </p>
                                                    </div>
                                                </div>
                                            </Card>

                                            {/* Recent Jobs Table */}
                                            <Card>
                                                <h3 className="text-2xl font-semibold mb-4">Recent Jobs</h3>
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full text-sm text-left">
                                                        <thead className="bg-gray-100">
                                                            <tr>
                                                                {['Job ID', 'Procedure', 'Matches', 'Rows', 'Time', 'Date'].map(h =>
                                                                    <th key={h} className="p-3 font-semibold">{h}</th>
                                                                )}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {dashboardStats.recent_jobs && dashboardStats.recent_jobs.length > 0 ? (
                                                                dashboardStats.recent_jobs.map((job: any) => (
                                                                    <tr key={job.job_id} className="border-b hover:bg-gray-50">
                                                                        <td className="p-3 font-mono text-xs">
                                                                            <a
                                                                                href="#"
                                                                                onClick={(e) => {
                                                                                    e.preventDefault();
                                                                                    setViewingAnalyticsFor(job.job_id);
                                                                                }}
                                                                                className="text-blue-600 hover:underline"
                                                                            >
                                                                                {job.job_id.substring(0, 8)}...
                                                                            </a>
                                                                        </td>
                                                                        <td className="p-3">{job.procedure_code}</td>
                                                                        <td className="p-3">{job.matches_found}</td>
                                                                        <td className="p-3">{job.rows_processed}</td>
                                                                        <td className="p-3">{job.processing_time.toFixed(2)}s</td>
                                                                        <td className="p-3">{new Date(job.processed_at).toLocaleString()}</td>
                                                                    </tr>
                                                                ))
                                                            ) : (
                                                                <tr>
                                                                    <td colSpan={6} className="text-center p-4 text-gray-500">No recent jobs found.</td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </Card>
                                        </>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === 'configurations' && (
                                <motion.div
                                    key="configurations"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="text-center py-20"
                                >
                                    <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">Settings</h2>
                                    <Card>
                                        <h3 className="text-2xl font-semibold mb-2">Upload Data Files</h3>
                                        <p className="text-gray-600 mb-6">
                                            Upload new versions of the core data files. The system will use these for future processing jobs. Uploading a new file will overwrite the existing one.
                                        </p>

                                        <div className="space-y-6">
                                            {/* Procedures Upload */}
                                            <div className="border p-4 rounded-lg bg-slate-50">
                                                <h4 className="font-bold text-lg">Procedures File (ICMP Codes)</h4>
                                                <p className="text-sm text-gray-500 mb-4">Upload a .csv or .xlsx file containing procedure codes and descriptions.</p>
                                                <div className="flex items-center gap-4">
                                                    <input type="file" accept=".csv,.xlsx" onChange={(e) => handleSettingsFileUploadChange(e, 'procedures')} className="flex-grow file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                                                    <Button onClick={() => handleSettingsUpload('procedures')} disabled={!proceduresFile}>Upload Procedures</Button>
                                                </div>
                                                {uploadStatus.procedures && (
                                                    <p className={`mt-2 text-sm ${uploadStatus.procedures.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{uploadStatus.procedures.message}</p>
                                                )}
                                            </div>

                                            {/* Comorbidities Upload */}
                                            <div className="border p-4 rounded-lg bg-slate-50">
                                                <h4 className="font-bold text-lg">Comorbidities File</h4>
                                                <p className="text-sm text-gray-500 mb-4">Upload a .csv or .xlsx file containing comorbidities linked to procedure codes.</p>
                                                <div className="flex items-center gap-4">
                                                    <input type="file" accept=".csv,.xlsx" onChange={(e) => handleSettingsFileUploadChange(e, 'comorbidities')} className="flex-grow file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" />
                                                    <Button onClick={() => handleSettingsUpload('comorbidities')} disabled={!comorbiditiesFile}>Upload Comorbidities</Button>
                                                </div>
                                                {uploadStatus.comorbidities && (
                                                    <p className={`mt-2 text-sm ${uploadStatus.comorbidities.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{uploadStatus.comorbidities.message}</p>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Analytics Modal - Rendered outside AnimatePresence */}
                {viewingAnalyticsFor && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-full max-h-[90vh] overflow-y-auto relative">
                            <button onClick={() => setViewingAnalyticsFor(null)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 z-10" style={{ fontSize: '24px' }}>&times;</button>
                            <ClinicalAuditDashboard jobId={viewingAnalyticsFor} />
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}