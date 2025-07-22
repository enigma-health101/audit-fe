// components/CodeSelection.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, CheckCircle } from 'lucide-react';
import { ICMPCode } from '../types';

interface CodeSelectionProps {
    icmpCodes: ICMPCode[];
    selectedCode: string;
    onCodeSelection: (code: string) => void;
}

export const CodeSelection = ({ icmpCodes, selectedCode, onCodeSelection }: CodeSelectionProps) => {
    const [searchTerm, setSearchTerm] = useState('');

    // Debug logging
    console.log('CodeSelection render - icmpCodes:', icmpCodes);
    console.log('CodeSelection render - icmpCodes length:', icmpCodes?.length);

    const filteredCodes = icmpCodes.filter(code =>
        code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        code.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    console.log('Filtered codes:', filteredCodes);

    return (
        <div className="space-y-6">


            {/* Search Box */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Search ICMP codes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-lg"
                />
            </div>

            {/* Loading state */}
            {!icmpCodes || icmpCodes.length === 0 ? (
                <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading ICMP codes...</p>
                </div>
            ) : (
                /* Code Selection */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-80 overflow-y-auto">
                    {filteredCodes.map((code) => (
                        <motion.div
                            key={code.code}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onCodeSelection(code.code)}
                            className={`
                                p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300
                                ${selectedCode === code.code
                                    ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 shadow-lg'
                                    : 'border-gray-200 bg-white/50 hover:border-blue-300 hover:shadow-md'
                                }
                            `}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`w-3 h-3 rounded-full ${selectedCode === code.code ? 'bg-blue-500' : 'bg-gray-300'}`} />
                                <span className="font-bold text-lg text-blue-600">{code.code}</span>
                            </div>
                            <p className="text-gray-700 leading-relaxed">{code.description}</p>
                        </motion.div>
                    ))}
                </div>
            )}

            {selectedCode && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 shadow-lg"
                >
                    <div className="flex items-center gap-3">
                        <CheckCircle className="text-emerald-600" size={24} />
                        <span className="font-bold text-lg text-emerald-800">
                            Selected: {selectedCode}
                        </span>
                    </div>
                </motion.div>
            )}
        </div>
    );
};