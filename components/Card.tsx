// components/Card.tsx
import { motion } from 'framer-motion';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    gradient?: boolean;
    hover?: boolean;
}

export const Card = ({ children, className = "", gradient = false, hover = true }: CardProps) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={hover ? { y: -4, scale: 1.01 } : {}}
        className={`
            relative overflow-hidden rounded-3xl border border-gray-200/50 shadow-xl
            ${gradient
                ? 'bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30'
                : 'bg-white/80 backdrop-blur-xl'
            }
            ${hover ? 'hover:shadow-2xl hover:border-blue-300/50' : ''}
            transition-all duration-500 ease-out
            ${className}
        `}
    >
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent" />
        <div className="relative z-10">{children}</div>
    </motion.div>
);