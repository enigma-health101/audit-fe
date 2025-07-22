// components/steps/Step1SelectCode.tsx
import { motion } from 'framer-motion';
import { ChevronDown, CheckCircle } from 'lucide-react';

interface ICMPCode {
    code: string;
    description: string;
}

interface Step1Props {
    icmpCodes: ICMPCode[];
    selectedCode: string;
    onCodeSelection: (code: string) => void;
}

export default function Step1SelectCode({ icmpCodes, selectedCode, onCodeSelection }: Step1Props) {
    return (
        <div className="glass-card p-8 bg-gradient-to-br from-indigo-500/5 to-purple-500/5">
            <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                    <span className="text-white font-bold text-xl">1</span>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Select ICD-10-PCS Code</h2>
                    <p className="text-gray-600">Choose the primary procedure code for analysis</p>
                </div>
            </div>

            <div className="relative">
                <select
                    value={selectedCode}
                    onChange={(e) => onCodeSelection(e.target.value)}
                    className="input-modern appearance-none cursor-pointer text-lg font-medium"
                >
                    <option value="">Select an ICMP code...</option>
                    {icmpCodes.map(code => (
                        <option key={code.code} value={code.code}>
                            {code.code} - {code.description}
                        </option>
                    ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={24} />
            </div>

            {selectedCode && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 shadow-sm"
                >
                    <div className="flex items-center gap-2 text-emerald-700">
                        <CheckCircle size={20} />
                        <span className="font-semibold">Selected: {selectedCode}</span>
                    </div>
                </motion.div>
            )}
        </div>
    );
}