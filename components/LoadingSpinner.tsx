// components/LoadingSpinner.tsx
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
    size?: number;
    text?: string;
}

export default function LoadingSpinner({ size = 32, text = "Loading..." }: LoadingSpinnerProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center p-8"
        >
            <Loader2 size={size} className="animate-spin text-blue-500 mb-4" />
            <p className="text-gray-600 font-medium">{text}</p>
        </motion.div>
    );
}
