// components/ui/ModernButton.tsx
import { motion } from 'framer-motion';
import { Loader2, LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface ModernButtonProps {
    children: ReactNode;
    onClick?: () => void;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning' | 'outline' | 'minimal';
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    disabled?: boolean;
    loading?: boolean;
    icon?: LucideIcon;
    iconPosition?: 'left' | 'right';
    className?: string;
    type?: 'button' | 'submit' | 'reset';
    fullWidth?: boolean;
}

export const ModernButton = ({
    children,
    onClick,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    icon: Icon,
    iconPosition = 'left',
    className = '',
    type = 'button',
    fullWidth = false
}: ModernButtonProps) => {
    const variants = {
        primary: 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700',
        secondary: 'bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg shadow-gray-500/25 hover:from-gray-900 hover:to-black',
        success: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-700',
        warning: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25 hover:from-amber-600 hover:to-orange-700',
        danger: 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg shadow-red-500/25 hover:from-red-600 hover:to-pink-700',
        ghost: 'bg-white/80 backdrop-blur-sm text-gray-700 border border-gray-200 shadow-md hover:bg-white hover:shadow-lg hover:border-gray-300',
        outline: 'bg-transparent border-2 border-indigo-500 text-indigo-600 hover:bg-indigo-500 hover:text-white',
        minimal: 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
    };

    const sizes = {
        xs: 'px-3 py-1.5 text-xs rounded-lg',
        sm: 'px-4 py-2 text-sm rounded-xl',
        md: 'px-6 py-3 text-base rounded-xl',
        lg: 'px-8 py-4 text-lg rounded-2xl',
        xl: 'px-12 py-5 text-xl rounded-2xl'
    };

    const iconSize = {
        xs: 14,
        sm: 16,
        md: 20,
        lg: 24,
        xl: 28
    };

    return (
        <motion.button
            whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
            whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
            onClick={onClick}
            disabled={disabled || loading}
            type={type}
            className={`
        ${sizes[size]} 
        ${variants[variant]}
        ${fullWidth ? 'w-full' : ''}
        font-semibold transition-all duration-300
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center gap-2 relative overflow-hidden
        focus:outline-none focus:ring-4 focus:ring-indigo-500/20
        ${className}
      `}
        >
            {loading ? (
                <Loader2 size={iconSize[size]} className="animate-spin" />
            ) : (
                <>
                    {Icon && iconPosition === 'left' && (
                        <Icon size={iconSize[size]} />
                    )}
                    {children}
                    {Icon && iconPosition === 'right' && (
                        <Icon size={iconSize[size]} />
                    )}
                </>
            )}
        </motion.button>
    );
};