// components/ui/GlassCard.tsx
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    gradient?: string;
    hover?: boolean;
    padding?: 'sm' | 'md' | 'lg' | 'xl';
    onClick?: () => void;
}

export const GlassCard = ({
    children,
    className = "",
    gradient,
    hover = true,
    padding = 'md',
    onClick
}: GlassCardProps) => {
    const paddingClasses = {
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
        xl: 'p-10'
    };

    const gradientBg = gradient ? `bg-gradient-to-br ${gradient}` : '';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={hover ? { y: -4, scale: 1.01 } : {}}
            onClick={onClick}
            className={`
        relative overflow-hidden rounded-3xl border border-gray-200/50 shadow-xl
        bg-white/80 backdrop-blur-xl
        ${gradientBg}
        ${hover ? 'hover:shadow-2xl hover:border-blue-300/50 cursor-pointer' : ''}
        transition-all duration-500 ease-out
        ${paddingClasses[padding]}
        ${className}
      `}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent" />
            <div className="relative z-10">{children}</div>
        </motion.div>
    );
};