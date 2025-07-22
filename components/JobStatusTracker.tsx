// components/JobStatusTracker.tsx
import { motion } from 'framer-motion';
import { Cpu, CheckCircle, AlertTriangle, Loader, BarChart, Download } from 'lucide-react';

interface JobStatus {
    status: 'pending' | 'processing' | 'completed' | 'error';
    progress: number;
    file_name: string;
    total_columns_to_process?: number;
    processed_columns?: number;
    error?: string;
    results?: any;
    latest_finding?: string;
}

interface JobStatusTrackerProps {
    jobId: string; // It must expect 'jobId' here
    jobStatus: JobStatus;
    onViewAnalytics: (jobId: string) => void;
}

export const JobStatusTracker = ({ jobId, jobStatus, onViewAnalytics }: JobStatusTrackerProps) => {
    const getStatusInfo = () => {
        switch (jobStatus.status) {
            case 'processing':
                return {
                    icon: <Loader className="animate-spin text-blue-500" size={24} />,
                    text: 'Processing...',
                    color: 'text-blue-700',
                    bgColor: 'bg-blue-50',
                    borderColor: 'border-blue-200'
                };
            case 'completed':
                return {
                    icon: <CheckCircle className="text-emerald-500" size={24} />,
                    text: 'Analysis Complete',
                    color: 'text-emerald-700',
                    bgColor: 'bg-emerald-50',
                    borderColor: 'border-emerald-200'
                };
            case 'error':
                return {
                    icon: <AlertTriangle className="text-red-500" size={24} />,
                    text: 'An Error Occurred',
                    color: 'text-red-700',
                    bgColor: 'bg-red-50',
                    borderColor: 'border-red-200'
                };
            default:
                return {
                    icon: <Cpu className="text-gray-500" size={24} />,
                    text: 'Job Pending...',
                    color: 'text-gray-700',
                    bgColor: 'bg-gray-50',
                    borderColor: 'border-gray-200'
                };
        }
    };

    const { icon, text, color, bgColor, borderColor } = getStatusInfo();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-2xl border ${borderColor} ${bgColor} shadow-md space-y-4`}
        >
            <div className="flex items-center gap-4">
                {icon}
                <div>
                    <h3 className={`text-xl font-bold ${color}`}>{text}</h3>
                    <p className="text-sm text-gray-600">File: {jobStatus.file_name}</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="w-full bg-gray-200 rounded-full h-4">
                    <motion.div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${jobStatus.progress}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
                <span className="font-semibold text-gray-800 w-12 text-right">{jobStatus.progress}%</span>
            </div>

            {jobStatus.status === 'processing' && jobStatus.total_columns_to_process && (
                <p className="text-sm text-center text-gray-600">
                    Analyzing column {jobStatus.processed_columns || 0} of {jobStatus.total_columns_to_process}
                </p>
            )}

            {jobStatus.status === 'processing' && jobStatus.latest_finding && (
                <motion.div
                    key={jobStatus.latest_finding}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-center text-purple-700 bg-purple-100 p-2 rounded-lg"
                >
                    <strong>Latest Finding:</strong> {jobStatus.latest_finding}
                </motion.div>
            )}

            {jobStatus.status === 'completed' && (
                <div className="flex justify-center gap-4 mt-4">
                    <button
                        onClick={() => onViewAnalytics(jobId)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <BarChart size={18} />
                        View Analytics
                    </button>
                    <a
                        href={`/api/download-results/${jobId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                        <Download size={18} />
                        Download Results
                    </a>
                </div>
            )}

            {jobStatus.status === 'error' && (
                <p className="text-sm text-red-600 bg-red-100 p-3 rounded-lg">
                    <strong>Details:</strong> {jobStatus.error}
                </p>
            )}
        </motion.div>
    );
};