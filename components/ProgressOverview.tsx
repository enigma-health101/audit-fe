// components/ProgressOverview.tsx
import { motion } from 'framer-motion';
import { Activity, Check } from 'lucide-react';
import { Card } from './Card';

interface ProgressOverviewProps {
    currentStep: number;
}

export const ProgressOverview = ({ currentStep }: ProgressOverviewProps) => {
    return (
        <Card className="p-8" gradient>
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-4">
                    <Activity className="text-blue-600" size={36} />
                    Processing Pipeline
                </h2>
                <div className="text-sm font-medium text-gray-500 bg-white/50 px-4 py-2 rounded-full">
                    Step {currentStep} of 5
                </div>
            </div>

            <div className="flex items-center justify-between">
                {[1, 2, 3, 4, 5].map((step, index) => (
                    <div key={step} className="flex items-center">
                        <motion.div
                            whileHover={{ scale: 1.1 }}
                            className={`
                                w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg
                                ${step < currentStep
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                                    : step === currentStep
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg animate-pulse'
                                        : 'bg-gray-200 text-gray-400'
                                }
                            `}
                        >
                            {step < currentStep ? <Check size={20} /> : step}
                        </motion.div>
                        {index < 4 && (
                            <div className={`w-20 h-1 mx-4 rounded-full ${step < currentStep ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-gray-200'
                                }`} />
                        )}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-5 gap-4 mt-6 text-center">
                {['Select Code', 'Configure', 'Upload Data', 'Map Columns', 'Process'].map((label, index) => (
                    <div key={label} className={`text-sm font-medium ${index + 1 <= currentStep ? 'text-gray-900' : 'text-gray-400'
                        }`}>
                        {label}
                    </div>
                ))}
            </div>
        </Card>
    );
};