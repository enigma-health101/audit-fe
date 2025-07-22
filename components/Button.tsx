// components/Button.tsx
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface ButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    disabled?: boolean;
    icon?: any;
    className?: string;
    loading?: boolean;
}

export const Button = ({
    children,
    onClick,
    variant = 'primary',
    size = 'md',
    disabled = false,
    icon: Icon,
    className = "",
    loading = false
}: ButtonProps) => {
    const variants = {
        primary: 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700',
        secondary: 'bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg shadow-gray-500/25 hover:from-gray-900 hover:to-black',
        success: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-700',
        danger: 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg shadow-red-500/25 hover:from-red-600 hover:to-pink-700',
        ghost: 'bg-white/80 backdrop-blur-sm text-gray-700 border border-gray-200 shadow-md hover:bg-white hover:shadow-lg hover:border-gray-300'
    };

    const sizes = {
        sm: 'px-4 py-2 text-sm rounded-xl',
        md: 'px-6 py-3 text-base rounded-xl',
        lg: 'px-8 py-4 text-lg rounded-2xl',
        xl: 'px-12 py-5 text-xl rounded-2xl'
    };

    return (
        <motion.button
            whileHover={!disabled ? { scale: 1.02 } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
            onClick={onClick}
            disabled={disabled || loading}
            className={`
                ${sizes[size]} font-semibold transition-all duration-300
                ${variants[variant]}
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2 relative overflow-hidden
                ${className}
            `}
        >
            {loading ? (
                <Loader2 size={20} className="animate-spin" />
            ) : Icon ? (
                <Icon size={20} />
            ) : null}
            {children}
        </motion.button>
    );
};