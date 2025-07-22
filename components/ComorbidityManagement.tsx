// components/ComorbidityManagement.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Check, X, Plus, Edit, Trash2, Save, AlertCircle,
    Sparkles, ChevronDown, ChevronUp, FileText, Loader2
} from 'lucide-react';

interface Comorbidity {
    id: string;
    name: string;
    description: string;
    notes?: string;
    enabled: boolean;
}

interface ComorbidityManagementProps {
    selectedCode: string;
    comorbidities: Comorbidity[];
    onComorbidityToggle: (id: string) => void;
    onComorbidityUpdate: (comorbidities: Comorbidity[]) => void;
    stepNumber?: number;
    isActive?: boolean;
    isCompleted?: boolean;
}

interface NewComorbidity {
    name: string;
    description: string;
    notes: string;
}

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string; }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`
            relative overflow-hidden rounded-3xl border border-gray-200/50 shadow-xl
            bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30
            hover:shadow-2xl hover:border-blue-300/50 transition-all duration-500 ease-out
            ${className}
        `}
    >
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent" />
        <div className="relative z-10">{children}</div>
    </motion.div>
);

const Button = ({
    children,
    onClick,
    variant = 'primary',
    size = 'md',
    disabled = false,
    className = ""
}: {
    children: React.ReactNode;
    onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
    size?: 'sm' | 'md';
    disabled?: boolean;
    className?: string;
}) => {
    const variants = {
        primary: 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40',
        secondary: 'bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg shadow-gray-500/25',
        success: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25',
        danger: 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg shadow-red-500/25',
        ghost: 'bg-white/80 backdrop-blur-sm text-gray-700 border border-gray-200 shadow-md hover:bg-white hover:shadow-lg'
    };

    const sizes = {
        sm: 'px-4 py-2 text-sm rounded-xl',
        md: 'px-6 py-3 text-base rounded-xl'
    };

    return (
        <motion.button
            whileHover={!disabled ? { scale: 1.02 } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
            onClick={onClick}
            disabled={disabled}
            className={`
                ${sizes[size]} font-semibold transition-all duration-300
                ${variants[variant]}
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2
                ${className}
            `}
        >
            {children}
        </motion.button>
    );
};

export default function ComorbidityManagement({
    selectedCode,
    comorbidities,
    onComorbidityToggle,
    onComorbidityUpdate,
    stepNumber = 2,
    isActive = false,
    isCompleted = false
}: ComorbidityManagementProps) {
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newComorbidity, setNewComorbidity] = useState<NewComorbidity>({
        name: '',
        description: '',
        notes: ''
    });
    const [editingComorbidity, setEditingComorbidity] = useState<Partial<Comorbidity>>({});
    const [isExpanded, setIsExpanded] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    if (!selectedCode) return null;

    // Clear messages after timeout
    const clearMessages = () => {
        setTimeout(() => {
            setError(null);
            setSuccess(null);
        }, 5000);
    };

    const handleAddComorbidity = async () => {
        setError(null);
        setSuccess(null);

        if (!newComorbidity.name || !newComorbidity.name.trim()) {
            setError('Please enter a comorbidity name');
            clearMessages();
            return;
        }

        const dataToSend = {
            name: newComorbidity.name.trim(),
            description: newComorbidity.description.trim(),
            notes: newComorbidity.notes.trim()
        };

        setIsLoading(true);
        try {
            const response = await fetch(`/api/comorbidities/${encodeURIComponent(selectedCode)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSend)
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = 'Failed to add comorbidity';
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.error || errorMessage;
                } catch {
                    errorMessage = errorText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();
            const newComorbidityWithEnabled = {
                ...result.comorbidity,
                enabled: true
            };

            const updatedComorbidities = [...comorbidities, newComorbidityWithEnabled];
            onComorbidityUpdate(updatedComorbidities);

            setNewComorbidity({ name: '', description: '', notes: '' });
            setShowAddForm(false);
            setSuccess('Comorbidity added successfully!');
            clearMessages();

        } catch (error) {
            setError(`Failed to add comorbidity: ${error instanceof Error ? error.message : 'Unknown error'}`);
            clearMessages();
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateComorbidity = async (comorbidityId: string) => {
        setError(null);
        setSuccess(null);

        if (!editingComorbidity || Object.keys(editingComorbidity).length === 0) {
            setError('No changes to save');
            clearMessages();
            return;
        }

        const cleanedData = Object.fromEntries(
            Object.entries(editingComorbidity).filter(([key, value]) => {
                return value !== undefined && value !== null && value !== '';
            })
        );

        if (Object.keys(cleanedData).length === 0) {
            setError('No valid changes to save');
            clearMessages();
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`/api/comorbidities/${encodeURIComponent(selectedCode)}/${encodeURIComponent(comorbidityId)}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(cleanedData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to update comorbidity: ${response.status} - ${errorText}`);
            }

            const updatedComorbidities = comorbidities.map(c =>
                c.id === comorbidityId ? { ...c, ...cleanedData } : c
            );

            onComorbidityUpdate(updatedComorbidities);
            setEditingId(null);
            setEditingComorbidity({});
            setSuccess('Comorbidity updated successfully!');
            clearMessages();

        } catch (error) {
            setError(`Failed to update comorbidity: ${error instanceof Error ? error.message : 'Unknown error'}`);
            clearMessages();
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteComorbidity = async (comorbidityId: string) => {
        if (!confirm('Are you sure you want to delete this comorbidity?')) {
            return;
        }

        setError(null);
        setSuccess(null);
        setIsLoading(true);

        try {
            const response = await fetch(`/api/comorbidities/${encodeURIComponent(selectedCode)}/${encodeURIComponent(comorbidityId)}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete comorbidity');
            }

            const updatedComorbidities = comorbidities.filter(c => c.id !== comorbidityId);
            onComorbidityUpdate(updatedComorbidities);
            setSuccess('Comorbidity deleted successfully!');
            clearMessages();

        } catch (error) {
            setError('Failed to delete comorbidity. Please try again.');
            clearMessages();
        } finally {
            setIsLoading(false);
        }
    };

    const startEditing = (comorbidity: Comorbidity) => {
        setEditingId(comorbidity.id);
        setEditingComorbidity({
            name: comorbidity.name || '',
            description: comorbidity.description || '',
            notes: comorbidity.notes || ''
        });
        setError(null);
        setSuccess(null);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditingComorbidity({});
        setError(null);
        setSuccess(null);
    };

    const cancelAddForm = () => {
        setShowAddForm(false);
        setNewComorbidity({ name: '', description: '', notes: '' });
        setError(null);
        setSuccess(null);
    };

    const handleSelectAll = () => {
        const updated = comorbidities.map(c => ({ ...c, enabled: true }));
        onComorbidityUpdate(updated);
    };

    const handleClearAll = () => {
        const updated = comorbidities.map(c => ({ ...c, enabled: false }));
        onComorbidityUpdate(updated);
    };

    return (
        <Card className="p-8 mb-8">
            <div
                className="flex items-center justify-between cursor-pointer mb-8"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-start gap-6">
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
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Configure Comorbidities</h2>
                        <p className="text-lg text-gray-600">Select and manage comorbidities for {selectedCode}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={(e) => {
                            e?.stopPropagation();
                            setShowAddForm(true);
                        }}
                        disabled={isLoading}
                    >
                        <Plus size={16} />
                        Add New
                    </Button>
                    {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        {/* Error/Success Messages */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3"
                                >
                                    <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
                                    <span className="text-red-800 font-medium">{error}</span>
                                </motion.div>
                            )}
                            {success && (
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3"
                                >
                                    <Check className="text-emerald-500 flex-shrink-0" size={20} />
                                    <span className="text-emerald-800 font-medium">{success}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Summary */}
                        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                            <div className="flex items-center gap-3">
                                <Sparkles className="text-blue-600" size={20} />
                                <span className="font-semibold text-blue-800">
                                    {comorbidities.filter(c => c.enabled).length} of {comorbidities.length} comorbidities selected
                                </span>
                                <div className="ml-auto flex gap-2">
                                    <Button variant="ghost" size="sm" onClick={handleSelectAll} disabled={isLoading}>
                                        Select All
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={handleClearAll} disabled={isLoading}>
                                        Clear All
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Add New Comorbidity Form */}
                        <AnimatePresence>
                            {showAddForm && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200"
                                >
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <Plus size={20} />
                                        Add New Comorbidity
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Comorbidity Code/Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={newComorbidity.name}
                                                onChange={(e) => setNewComorbidity(prev => ({ ...prev, name: e.target.value }))}
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="e.g., HTN, T2DM, CVD"
                                                disabled={isLoading}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Notes/Short Description
                                            </label>
                                            <input
                                                type="text"
                                                value={newComorbidity.notes}
                                                onChange={(e) => setNewComorbidity(prev => ({ ...prev, notes: e.target.value }))}
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="e.g., Hypertension, Type 2 Diabetes"
                                                disabled={isLoading}
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Detailed Description
                                        </label>
                                        <textarea
                                            value={newComorbidity.description}
                                            onChange={(e) => setNewComorbidity(prev => ({ ...prev, description: e.target.value }))}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            rows={3}
                                            placeholder="Detailed medical description of the comorbidity..."
                                            disabled={isLoading}
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            variant="success"
                                            onClick={handleAddComorbidity}
                                            disabled={isLoading || !newComorbidity.name.trim()}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 size={16} className="animate-spin" />
                                                    Adding...
                                                </>
                                            ) : (
                                                <>
                                                    <Save size={16} />
                                                    Add Comorbidity
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={cancelAddForm}
                                            disabled={isLoading}
                                        >
                                            <X size={16} />
                                            Cancel
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Comorbidities List */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {comorbidities.map((comorbidity, index) => (
                                <motion.div
                                    key={comorbidity.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`
                                        p-5 rounded-xl border-2 transition-all duration-300 shadow-sm hover:shadow-md
                                        ${comorbidity.enabled
                                            ? 'border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50'
                                            : 'border-gray-200 bg-white/50'
                                        }
                                    `}
                                >
                                    {editingId === comorbidity.id ? (
                                        // Edit Mode
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                    Comorbidity Code/Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editingComorbidity.name || ''}
                                                    onChange={(e) => setEditingComorbidity(prev => ({ ...prev, name: e.target.value }))}
                                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Comorbidity name"
                                                    disabled={isLoading}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                    Notes
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editingComorbidity.notes || ''}
                                                    onChange={(e) => setEditingComorbidity(prev => ({ ...prev, notes: e.target.value }))}
                                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Short description/notes"
                                                    disabled={isLoading}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                    Detailed Description
                                                </label>
                                                <textarea
                                                    value={editingComorbidity.description || ''}
                                                    onChange={(e) => setEditingComorbidity(prev => ({ ...prev, description: e.target.value }))}
                                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    rows={2}
                                                    placeholder="Detailed description"
                                                    disabled={isLoading}
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="success"
                                                    size="sm"
                                                    onClick={() => handleUpdateComorbidity(comorbidity.id)}
                                                    disabled={isLoading}
                                                >
                                                    {isLoading ? (
                                                        <Loader2 size={14} className="animate-spin" />
                                                    ) : (
                                                        <Save size={14} />
                                                    )}
                                                    Save
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={cancelEditing}
                                                    disabled={isLoading}
                                                >
                                                    <X size={14} />
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        // View Mode
                                        <div>
                                            <div className="flex items-start gap-3 mb-3">
                                                <div
                                                    className={`
                                                        w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 cursor-pointer transition-all duration-200
                                                        ${comorbidity.enabled
                                                            ? 'border-emerald-500 bg-emerald-500'
                                                            : 'border-gray-300 bg-white'
                                                        }
                                                        ${isLoading ? 'pointer-events-none opacity-50' : ''}
                                                    `}
                                                    onClick={() => !isLoading && onComorbidityToggle(comorbidity.id)}
                                                >
                                                    {comorbidity.enabled && <Check size={16} className="text-white" />}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-bold text-gray-800 text-lg">{comorbidity.name}</h3>
                                                        {comorbidity.notes && (
                                                            <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                                                {comorbidity.notes}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {comorbidity.description && (
                                                        <p className="text-gray-600 leading-relaxed text-sm mb-2">
                                                            {comorbidity.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => startEditing(comorbidity)}
                                                        className="p-2"
                                                        disabled={isLoading}
                                                    >
                                                        <Edit size={14} />
                                                    </Button>
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        onClick={() => handleDeleteComorbidity(comorbidity.id)}
                                                        className="p-2"
                                                        disabled={isLoading}
                                                    >
                                                        {isLoading ? (
                                                            <Loader2 size={14} className="animate-spin" />
                                                        ) : (
                                                            <Trash2 size={14} />
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>

                        {/* Empty State */}
                        {comorbidities.length === 0 && (
                            <div className="text-center py-12">
                                <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
                                <h3 className="text-xl font-bold text-gray-500 mb-2">No Comorbidities Found</h3>
                                <p className="text-gray-400 mb-6">
                                    No comorbidities are configured for {selectedCode}. Add some to get started.
                                </p>
                                <Button
                                    variant="primary"
                                    onClick={() => setShowAddForm(true)}
                                    disabled={isLoading}
                                >
                                    <Plus size={16} />
                                    Add First Comorbidity
                                </Button>
                            </div>
                        )}

                        {/* Loading Overlay */}
                        {isLoading && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center"
                            >
                                <div className="bg-white rounded-2xl p-6 shadow-2xl flex items-center gap-4">
                                    <Loader2 className="animate-spin text-blue-600" size={24} />
                                    <span className="text-gray-700 font-medium">Processing...</span>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
}