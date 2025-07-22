// components/StepCard.tsx
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Card } from './Card';

interface StepCardProps {
    stepNumber: number;
    title: string;
    description: string;
    isActive: boolean;
    isCompleted: boolean;
    children: React.ReactNode;
}

export const StepCard = ({
    stepNumber,
    title,
    description,
    isActive,
    isCompleted,
    children
}: StepCardProps) => (
    <Card className="p-8 mb-8" gradient={isActive}>
        <div className="flex items-start gap-6 mb-8">
            <motion.div
                className={`
                    w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg
                    ${isCompleted
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                        : isActive
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white animate-pulse'
                            : 'bg-gray-100 text-gray-400'
                    }
                `}
                whileHover={{ scale: 1.05 }}
            >
                {isCompleted ? <Check size={28} /> : stepNumber}
            </motion.div>
            <div className="flex-1">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
                <p className="text-lg text-gray-600">{description}</p>
            </div>
        </div>
        {children}
    </Card>
);